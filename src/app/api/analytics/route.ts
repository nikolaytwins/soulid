import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyticsFromCookies, trackEvent } from "@/lib/analytics";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import {
  readUtmCookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE
} from "@/lib/utm";

const ALLOWED = new Set([
  "page_view",
  "sphere_viewed",
  "locked_sphere_clicked",
  "unlock_intent",
  "checkout_started"
]);

const schema = z.object({
  name: z.string().min(1).max(80),
  profileId: z.string().max(64).optional(),
  path: z.string().max(240).optional(),
  visitorId: z.string().max(80).optional(),
  sessionId: z.string().max(80).optional(),
  referrer: z.string().max(500).optional(),
  locale: z.string().max(8).optional(),
  payload: z.record(z.unknown()).optional()
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":an", 180, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !ALLOWED.has(parsed.data.name)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const session = await auth();
  const jar = await cookies();
  const cookieCtx = await analyticsFromCookies();
  const utm = readUtmCookie(jar.get("ss_utm")?.value);
  const visitorId = parsed.data.visitorId || cookieCtx.visitorId;
  const sessionId = parsed.data.sessionId || cookieCtx.sessionId;
  const path = parsed.data.path || cookieCtx.path;
  const referrer = parsed.data.referrer || cookieCtx.referrer || utm.referrer;

  const eventId = await trackEvent({
    name: parsed.data.name,
    userId: session?.user?.id,
    profileId: parsed.data.profileId,
    visitorId,
    sessionId,
    locale: parsed.data.locale,
    path,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    referrer,
    payload: parsed.data.payload
  });

  const res = NextResponse.json({ ok: true, eventId });
  if (visitorId) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      path: "/",
      maxAge: VISITOR_MAX_AGE,
      sameSite: "lax"
    });
  }
  if (sessionId) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      path: "/",
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax"
    });
  }
  return res;
}
