import { prisma } from "@/lib/db";
import { createHash, randomUUID } from "node:crypto";

export function newEventId(): string {
  return randomUUID();
}

export async function trackEvent(params: {
  name: string;
  eventId?: string;
  userId?: string | null;
  profileId?: string | null;
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
      userId: params.userId ?? undefined,
      profileId: params.profileId ?? undefined,
      locale: params.locale,
      path: params.path,
      utmSource: params.utmSource ?? undefined,
      utmMedium: params.utmMedium ?? undefined,
      utmCampaign: params.utmCampaign ?? undefined,
      referrer: params.referrer ?? undefined,
      payload: JSON.stringify(params.payload ?? {})
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
