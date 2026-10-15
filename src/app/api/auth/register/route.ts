import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().max(80).optional(),
  locale: z.enum(["ru", "en", "ar"]).optional()
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":reg", 10, 60_000)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      name: parsed.data.name || email.split("@")[0],
      locale: parsed.data.locale ?? "ru"
    }
  });
  const jar = await cookies();
  const guest = jar.get("ss_guest")?.value;
  if (guest) {
    await prisma.birthProfile.updateMany({
      where: { guestKey: guest, userId: null },
      data: { userId: user.id, guestKey: null }
    });
    const profiles = await prisma.birthProfile.findMany({ where: { userId: user.id } });
    const { ensureFreeEntitlements } = await import("@/lib/domain/access");
    for (const p of profiles) {
      await ensureFreeEntitlements({ userId: user.id, profileId: p.id });
    }
  }
  return NextResponse.json({ ok: true });
}
