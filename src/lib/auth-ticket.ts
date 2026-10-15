import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.AUTH_SECRET ?? "dev-secret";
}

export function createAuthTicket(userId: string, ttlMs = 10 * 60 * 1000): string {
  const exp = Date.now() + ttlMs;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAuthTicket(ticket: string): string | null {
  const parts = ticket.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = createHmac("sha256", secret()).update(`${userId}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export function userHasPassword(passwordHash: string): boolean {
  return passwordHash.length >= 20;
}
