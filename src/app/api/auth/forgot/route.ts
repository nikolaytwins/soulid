import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBlocked, issuePasswordLink } from "@/lib/auth-password";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":forgot", 8, 60_000)) {
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || isBlocked(user)) return NextResponse.json({ ok: true });
  await issuePasswordLink(user);
  return NextResponse.json({ ok: true });
}
