import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateStar } from "@/lib/engine";
import { isValidCalendarDate } from "@/lib/engine/reduce";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ensureFreeEntitlements } from "@/lib/domain/access";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";
import { readUtmCookie } from "@/lib/utm";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  displayName: z.string().max(80).optional(),
  relation: z.string().max(32).optional()
});

export async function POST(req: Request) {
  try {
    if (!rateLimit(clientIp(req.headers) + ":calc", 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success || !isValidCalendarDate(parsed.data.year, parsed.data.month, parsed.data.day)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const session = await auth();
    const { loadStarFormula } = await import("@/lib/domain/formula");
    const result = calculateStar(parsed.data, { formula: await loadStarFormula() });
    const jar = await cookies();
    const utm = readUtmCookie(jar.get("ss_utm")?.value);
    const existingUser = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, locale: true } })
      : null;
    const userId = existingUser?.id ?? null;
    let guestKey = jar.get("ss_guest")?.value;
    if (!guestKey && !userId) {
      guestKey = randomBytes(16).toString("hex");
    }

    const relation = parsed.data.relation && ["self", "partner", "child", "parent", "friend", "other"].includes(parsed.data.relation)
      ? parsed.data.relation
      : "self";
    const displayName = (parsed.data.displayName ?? "").trim().slice(0, 80);
    const profile = await prisma.birthProfile.create({
      data: {
        userId,
        guestKey: userId ? null : guestKey,
        dateOfBirth: result.isoDate,
        displayName,
        relation,
        calculationJson: JSON.stringify(result),
        locale: existingUser?.locale ?? session?.user?.locale ?? "ru",
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        referrer: utm.referrer,
        landingPage: utm.landingPage
      }
    });

    if (userId) {
      await ensureFreeEntitlements({ userId, profileId: profile.id });
    }

    await trackEvent({
      name: "calculation_completed",
      userId,
      profileId: profile.id,
      payload: { date: result.isoDate }
    }).catch((err) => console.error("calculation analytics failed", err));

    const res = NextResponse.json({ id: profile.id, isoDate: result.isoDate });
    if (guestKey && !userId) {
      res.cookies.set("ss_guest", guestKey, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
    }
    return res;
  } catch (err) {
    console.error("calculate failed", err);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
