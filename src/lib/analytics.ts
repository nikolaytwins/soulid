import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { readUtmCookie, SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/utm";

export function newEventId(): string {
  return randomUUID();
}

export type AnalyticsContext = {
  visitorId?: string;
  sessionId?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  path?: string;
};

export async function analyticsFromCookies(): Promise<AnalyticsContext> {
  const jar = await cookies();
  const utm = readUtmCookie(jar.get("ss_utm")?.value);
  return {
    visitorId: jar.get(VISITOR_COOKIE)?.value,
    sessionId: jar.get(SESSION_COOKIE)?.value,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    referrer: utm.referrer,
    path: utm.landingPage
  };
}

export async function visitorForUser(userId: string | null | undefined): Promise<AnalyticsContext> {
  if (!userId) return {};
  const last = await prisma.analyticsEvent.findFirst({
    where: { userId, visitorId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { visitorId: true, sessionId: true, utmSource: true, utmMedium: true, utmCampaign: true, referrer: true }
  });
  if (!last) return {};
  return {
    visitorId: last.visitorId ?? undefined,
    sessionId: last.sessionId ?? undefined,
    utmSource: last.utmSource,
    utmMedium: last.utmMedium,
    utmCampaign: last.utmCampaign,
    referrer: last.referrer
  };
}

export async function trackEvent(params: {
  name: string;
  eventId?: string;
  userId?: string | null;
  profileId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  locale?: string;
  path?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  payload?: Record<string, unknown>;
}): Promise<string> {
  const eventId = params.eventId ?? newEventId();
  await prisma.analyticsEvent.create({
    data: {
      name: params.name,
      eventId,
      payload: JSON.stringify(params.payload ?? {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.profileId ? { profileId: params.profileId } : {}),
      ...(params.visitorId ? { visitorId: params.visitorId } : {}),
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      ...(params.locale ? { locale: params.locale } : {}),
      ...(params.path ? { path: params.path } : {}),
      ...(params.utmSource ? { utmSource: params.utmSource } : {}),
      ...(params.utmMedium ? { utmMedium: params.utmMedium } : {}),
      ...(params.utmCampaign ? { utmCampaign: params.utmCampaign } : {}),
      ...(params.referrer ? { referrer: params.referrer } : {})
    }
  });
  return eventId;
}

export async function sendMetaCapi(params: {
  eventName: string;
  eventId: string;
  eventTime?: number;
  email?: string;
  value?: number;
  currency?: string;
  sourceUrl?: string;
}): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!token || !pixel) return;

  const hashedEmail = params.email
    ? createHash("sha256").update(params.email.trim().toLowerCase()).digest("hex")
    : undefined;

  const body = {
    data: [
      {
        event_name: params.eventName,
        event_time: params.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: "website",
        event_source_url: params.sourceUrl ?? process.env.APP_URL,
        user_data: hashedEmail ? { em: [hashedEmail] } : {},
        custom_data:
          params.value != null
            ? { value: params.value / 100, currency: params.currency ?? "RUB" }
            : undefined
      }
    ],
    test_event_code: process.env.META_CAPI_TEST_EVENT_CODE || undefined
  };

  await fetch(`https://graph.facebook.com/v20.0/${pixel}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).catch((err) => {
    console.error("Meta CAPI error", err);
  });
}
