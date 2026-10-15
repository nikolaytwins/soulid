import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({ token: z.string().min(10), password: z.string().min(6).max(100) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const row = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!row || row.expiresAt < new Date()) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.user.update({
    where: { id: row.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
  return NextResponse.json({ ok: true });
}
