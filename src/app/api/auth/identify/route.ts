import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuthTicket, userHasPassword } from "@/lib/auth-ticket";
import { isBlocked } from "@/lib/auth-password";
import { ensureFreeEntitlements } from "@/lib/domain/access";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { analyticsFromCookies, trackEvent } from "@/lib/analytics";

const schema = z.object({
  email: z.string().email(),
  profileId: z.string().min(1),
  locale: z.enum(["ru", "en", "ar"]).optional()
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":identify", 12, 60_000)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  const session = await auth();
  if (session?.user?.id) {
    return NextResponse.json({ status: "ready" as const });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const profile = await prisma.birthProfile.findUnique({ where: { id: parsed.data.profileId } });
  if (!profile) return NextResponse.json({ error: "profile" }, { status: 404 });

  const jar = await cookies();
  const guest = jar.get("ss_guest")?.value ?? null;
  const guestOwns = !profile.userId && !!guest && profile.guestKey === guest;

  let user = await prisma.user.findUnique({ where: { email } });
  if (user && isBlocked(user)) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }
  if (user && userHasPassword(user.passwordHash)) {
    return NextResponse.json({ status: "needs_password" as const, email });
  }

  if (!user) {
    if (profile.userId && !guestOwns) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "",
        name: email.split("@")[0],
        locale: parsed.data.locale ?? profile.locale ?? "ru"
      }
    });
  } else {
    const canSoft =
      profile.userId === user.id || guestOwns || (!profile.userId && !profile.guestKey);
    if (!canSoft) {
      return NextResponse.json({ status: "needs_password" as const, email });
    }
  }

  if (!profile.userId) {
    await prisma.birthProfile.update({
      where: { id: profile.id },
      data: { userId: user.id, guestKey: null }
    });
  } else if (profile.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (guest) {
    await prisma.birthProfile.updateMany({
      where: { guestKey: guest, userId: null },
      data: { userId: user.id, guestKey: null }
    });
  }
  await ensureFreeEntitlements({ userId: user.id, profileId: profile.id });

  const analytics = await analyticsFromCookies();
  await trackEvent({
    name: "email_captured",
    userId: user.id,
    profileId: profile.id,
    ...analytics,
    payload: { newUser: !userHasPassword(user.passwordHash) }
  }).catch((err) => console.error("identify analytics failed", err));

  return NextResponse.json({
    status: "ticket" as const,
    email: user.email,
    ticket: createAuthTicket(user.id)
  });
}
