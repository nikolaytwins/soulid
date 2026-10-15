"use client";

import { useEffect } from "react";

export function UtmCapture() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const has =
      url.searchParams.get("utm_source") ||
      url.searchParams.get("utm_medium") ||
      url.searchParams.get("utm_campaign");
    if (!has && !document.referrer) return;
    const payload = {
      utmSource: url.searchParams.get("utm_source") ?? undefined,
      utmMedium: url.searchParams.get("utm_medium") ?? undefined,
      utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
      landingPage: url.pathname
    };
    const existing = document.cookie.split("; ").find((c) => c.startsWith("ss_utm="));
    if (!existing || has) {
      document.cookie = `ss_utm=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
    }
  }, []);
  return null;
}
