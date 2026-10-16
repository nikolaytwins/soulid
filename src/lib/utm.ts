export const UTM_COOKIE = "ss_utm";
export const VISITOR_COOKIE = "ss_vid";
export const SESSION_COOKIE = "ss_sid";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
export const SESSION_MAX_AGE = 60 * 30;

export type Utm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
};

export function parseUtm(url: URL, referrer?: string | null): Utm {
  return {
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    referrer: referrer ?? undefined,
    landingPage: url.pathname
  };
}

export function utmCookie(utm: Utm): string {
  return encodeURIComponent(JSON.stringify(utm));
}

export function readUtmCookie(raw: string | undefined): Utm {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as Utm;
  } catch {
    return {};
  }
}

export function hostFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isInternalHost(host: string | null): boolean {
  if (!host) return false;
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith("twinlabs.ru") ||
    host.endsWith("soulstar.local")
  );
}

export function sourceLabel(input: {
  utmSource?: string | null;
  referrer?: string | null;
}): string {
  const utm = input.utmSource?.trim().toLowerCase();
  if (utm) return utm;
  const host = hostFromReferrer(input.referrer);
  if (!host || isInternalHost(host)) return "direct";
  if (host.includes("google")) return "google";
  if (host.includes("yandex") || host === "ya.ru" || host.endsWith(".ya.ru")) return "yandex";
  if (host.includes("telegram") || host === "t.me" || host.endsWith(".t.me")) return "telegram";
  if (host.includes("instagram") || host.includes("ig.me")) return "instagram";
  if (host === "vk.com" || host.endsWith(".vk.com") || host === "vk.ru" || host.endsWith(".vk.ru")) {
    return "vk";
  }
  if (host.includes("facebook") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
  if (host.includes("youtube") || host === "youtu.be") return "youtube";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("whatsapp")) return "whatsapp";
  return host;
}
