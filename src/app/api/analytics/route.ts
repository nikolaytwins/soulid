import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const ALLOWED = new Set(["sphere_viewed", "locked_sphere_clicked", "checkout_started"]);

const schema = z.object({
  name: z.string().min(1).max(80),
  profileId: z.string().optional(),
  payload: z.record(z.unknown()).optional()
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":an", 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !ALLOWED.has(parsed.data.name)) return NextResponse.json({ ok: false }, { status: 400 });
  const session = await auth();
  const eventId = await trackEvent({
    name: parsed.data.name,
    userId: session?.user?.id,
    profileId: parsed.data.profileId,
    payload: parsed.data.payload
  });
  return NextResponse.json({ ok: true, eventId });
}
