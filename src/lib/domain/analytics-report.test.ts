import { describe, expect, it } from "vitest";
import { actorKey, buildFunnel, funnelRank, isStarPath } from "./analytics-report";
import { sourceLabel } from "@/lib/utm";
import type { RawAnalyticsEvent } from "./analytics-report";

function ev(partial: Partial<RawAnalyticsEvent> & Pick<RawAnalyticsEvent, "id" | "name">): RawAnalyticsEvent {
  return {
    visitorId: null,
    sessionId: null,
    userId: null,
    path: null,
    utmSource: null,
    utmCampaign: null,
    referrer: null,
    createdAt: new Date("2026-10-01T10:00:00Z"),
    ...partial
  };
}

describe("analytics funnel", () => {
  it("treats star page views as the star step", () => {
    expect(isStarPath("/ru/star/abc")).toBe(true);
    expect(funnelRank(ev({ id: "1", name: "page_view", path: "/ru/star/abc" }))).toBe(2);
    expect(funnelRank(ev({ id: "2", name: "page_view", path: "/ru" }))).toBe(0);
  });

  it("counts unique visitors through the funnel and drop-off", () => {
    const events = [
      ev({ id: "a", name: "page_view", visitorId: "v1", sessionId: "s1", utmSource: "instagram" }),
      ev({ id: "b", name: "calculation_completed", visitorId: "v1", sessionId: "s1" }),
      ev({ id: "c", name: "sphere_viewed", visitorId: "v1", sessionId: "s1" }),
      ev({ id: "d", name: "page_view", visitorId: "v2", sessionId: "s2", referrer: "https://google.com/search" }),
      ev({
        id: "e",
        name: "purchase",
        userId: "u1",
        createdAt: new Date("2026-10-01T11:00:00Z")
      }),
      ev({
        id: "f",
        name: "checkout_started",
        visitorId: "v1",
        userId: "u1",
        sessionId: "s1"
      })
    ];
    const report = buildFunnel(events);
    expect(report.visitors).toBe(2);
    expect(report.sessions).toBe(2);
    expect(report.funnel.find((s) => s.id === "calculate")?.count).toBe(1);
    expect(report.funnel.find((s) => s.id === "paid")?.count).toBe(1);
    expect(report.dropOff.find((d) => d.from === "visit")?.lost).toBe(1);
    const instagram = report.sources.find((s) => s.source === "instagram");
    const google = report.sources.find((s) => s.source === "google");
    expect(instagram?.visitors).toBe(1);
    expect(google?.visitors).toBe(1);
  });

  it("merges webhook purchases onto the visitor via userId", () => {
    const map = new Map([["u1", "v1"]]);
    expect(actorKey(ev({ id: "p", name: "purchase", userId: "u1" }), map)).toBe("v1");
  });
});

describe("source labels", () => {
  it("prefers utm over referrer and maps known hosts", () => {
    expect(sourceLabel({ utmSource: "IG", referrer: "https://google.com" })).toBe("ig");
    expect(sourceLabel({ utmSource: null, referrer: "https://www.yandex.ru/search" })).toBe("yandex");
    expect(sourceLabel({ referrer: "https://t.me/soul" })).toBe("telegram");
    expect(sourceLabel({ referrer: "https://test.twinlabs.ru/" })).toBe("direct");
    expect(sourceLabel({})).toBe("direct");
  });
});
