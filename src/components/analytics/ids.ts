import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  UTM_COOKIE,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
  type Utm
} from "@/lib/utm";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  if (!match) return undefined;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function ensureClientIds(): { visitorId: string; sessionId: string } {
  let visitorId = readCookie(VISITOR_COOKIE);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
  }
  writeCookie(VISITOR_COOKIE, visitorId, VISITOR_MAX_AGE);

  let sessionId = readCookie(SESSION_COOKIE);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  writeCookie(SESSION_COOKIE, sessionId, SESSION_MAX_AGE);
  return { visitorId, sessionId };
}

export function captureUtm() {
  const url = new URL(window.location.href);
  const hasUtm =
    url.searchParams.get("utm_source") ||
    url.searchParams.get("utm_medium") ||
    url.searchParams.get("utm_campaign");
  const existing = readCookie(UTM_COOKIE);
  if (existing && !hasUtm) return;
  const payload: Utm = {
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
    landingPage: url.pathname
  };
  writeCookie(UTM_COOKIE, JSON.stringify(payload), 60 * 60 * 24 * 90);
}

export function trackClient(
  name: string,
  extra?: {
    profileId?: string;
    payload?: Record<string, unknown>;
    path?: string;
  }
) {
  if (typeof window === "undefined") return;
  const ids = ensureClientIds();
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      profileId: extra?.profileId,
      payload: extra?.payload,
      path: extra?.path ?? window.location.pathname,
      visitorId: ids.visitorId,
      sessionId: ids.sessionId,
      referrer: document.referrer || undefined,
      locale: window.location.pathname.split("/")[1]
    }),
    keepalive: true
  }).catch(() => undefined);
}
