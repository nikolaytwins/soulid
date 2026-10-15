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
