import { sourceLabel } from "@/lib/utm";

export const FUNNEL_STEPS = [
  { id: "visit", events: ["page_view"] },
  { id: "calculate", events: ["calculation_completed"] },
  { id: "star", events: ["sphere_viewed"] },
  { id: "unlock", events: ["locked_sphere_clicked", "unlock_intent"] },
  { id: "checkout", events: ["checkout_started"] },
  { id: "paid", events: ["purchase"] }
] as const;

export type FunnelStepId = (typeof FUNNEL_STEPS)[number]["id"];
export type AnalyticsRange = "7d" | "30d" | "90d";

export type RawAnalyticsEvent = {
  id: string;
  name: string;
  visitorId: string | null;
  sessionId: string | null;
  userId: string | null;
  path: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  createdAt: Date;
};

export function rangeDays(range: string | undefined): AnalyticsRange {
  if (range === "7d" || range === "90d") return range;
  return "30d";
}

export function rangeStart(range: AnalyticsRange, now = new Date()): Date {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(now.getTime() - days * 86_400_000);
}

export function isStarPath(path: string | null | undefined): boolean {
  return Boolean(path && /\/star\/[^/?#]+/.test(path));
}

export function actorKey(event: RawAnalyticsEvent, userToVisitor: Map<string, string>): string {
  if (event.visitorId) return event.visitorId;
  if (event.userId && userToVisitor.has(event.userId)) return userToVisitor.get(event.userId)!;
  if (event.userId) return `u:${event.userId}`;
  if (event.sessionId) return `s:${event.sessionId}`;
  return `e:${event.id}`;
}

export function userVisitorMap(events: RawAnalyticsEvent[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const event of events) {
    if (event.userId && event.visitorId && !map.has(event.userId)) {
      map.set(event.userId, event.visitorId);
    }
  }
  return map;
}

function sessionTally() {
  const byActor = new Map<string, Set<string>>();
  return {
    add(actor: string, sessionId: string | null) {
      const set = byActor.get(actor) ?? new Set();
      if (sessionId) set.add(sessionId);
      byActor.set(actor, set);
    },
    size() {
      let n = 0;
      for (const set of byActor.values()) n += Math.max(1, set.size);
      return n;
    }
  };
}

export function funnelRank(event: RawAnalyticsEvent): number {
  if (event.name === "purchase") return 5;
  if (event.name === "checkout_started") return 4;
  if (event.name === "locked_sphere_clicked" || event.name === "unlock_intent") return 3;
  if (event.name === "sphere_viewed" || (event.name === "page_view" && isStarPath(event.path))) return 2;
  if (event.name === "calculation_completed") return 1;
  if (event.name === "page_view") return 0;
  return -1;
}

export function buildFunnel(events: RawAnalyticsEvent[]) {
  const userToVisitor = userVisitorMap(events);
  const reached = FUNNEL_STEPS.map(() => new Set<string>());
  const lastStep = new Map<string, number>();
  const firstTouch = new Map<string, RawAnalyticsEvent>();
  const sessions = sessionTally();
  const emails = new Set<string>();

  for (const event of events) {
    const actor = actorKey(event, userToVisitor);
    const rank = funnelRank(event);
    if (rank >= 0) {
      const prev = lastStep.get(actor) ?? -1;
      if (rank > prev) lastStep.set(actor, rank);
      for (let i = 0; i <= rank; i += 1) reached[i].add(actor);
    }
    if (event.name === "email_captured") emails.add(actor);
    sessions.add(actor, event.sessionId);
    const existing = firstTouch.get(actor);
    if (!existing || event.createdAt < existing.createdAt) firstTouch.set(actor, event);
  }

  const counts = reached.map((set) => set.size);
  const dropOff = FUNNEL_STEPS.slice(0, -1).map((step, i) => {
    const from = counts[i];
    const to = counts[i + 1];
    const lost = Math.max(0, from - to);
    return {
      from: step.id,
      to: FUNNEL_STEPS[i + 1].id,
      fromCount: from,
      toCount: to,
      lost,
      rate: from === 0 ? 0 : lost / from
    };
  });

  const stuck = FUNNEL_STEPS.map((step, i) => {
    let n = 0;
    for (const rank of lastStep.values()) {
      if (rank === i) n += 1;
    }
    return { step: step.id, count: n };
  }).filter((row) => row.step !== "paid" && row.count > 0);

  const sources = new Map<
    string,
    {
      visitors: Set<string>;
      sessions: ReturnType<typeof sessionTally>;
      calculated: Set<string>;
      paid: Set<string>;
      campaign: string | null;
    }
  >();
  for (const [actor, event] of firstTouch) {
    const source = sourceLabel(event);
    const row = sources.get(source) ?? {
      visitors: new Set(),
      sessions: sessionTally(),
      calculated: new Set(),
      paid: new Set(),
      campaign: event.utmCampaign
    };
    row.visitors.add(actor);
    row.sessions.add(actor, event.sessionId);
    if (!row.campaign && event.utmCampaign) row.campaign = event.utmCampaign;
    sources.set(source, row);
  }
  for (const event of events) {
    const actor = actorKey(event, userToVisitor);
    const first = firstTouch.get(actor);
    if (!first) continue;
    const row = sources.get(sourceLabel(first));
    if (!row) continue;
    row.sessions.add(actor, event.sessionId);
    if (event.name === "calculation_completed") row.calculated.add(actor);
    if (event.name === "purchase") row.paid.add(actor);
  }

  const sourceRows = [...sources.entries()]
    .map(([source, row]) => ({
      source,
      campaign: row.campaign,
      visitors: row.visitors.size,
      sessions: row.sessions.size(),
      calculated: row.calculated.size,
      paid: row.paid.size
    }))
    .sort((a, b) => b.visitors - a.visitors || b.paid - a.paid);

  return {
    visitors: reached[0].size,
    sessions: sessions.size(),
    emails: emails.size,
    funnel: FUNNEL_STEPS.map((step, i) => ({
      id: step.id,
      count: counts[i],
      conversionFromStart: counts[0] === 0 ? 0 : counts[i] / counts[0],
      conversionFromPrev: i === 0 || counts[i - 1] === 0 ? 1 : counts[i] / counts[i - 1]
    })),
    dropOff,
    stuck,
    sources: sourceRows
  };
}

export function dailySessions(events: RawAnalyticsEvent[], from: Date, to: Date) {
  const days: { date: string; sessions: number; visitors: number }[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  const byDay = new Map<string, { sessions: ReturnType<typeof sessionTally>; visitors: Set<string> }>();
  const userToVisitor = userVisitorMap(events);
  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const row = byDay.get(key) ?? { sessions: sessionTally(), visitors: new Set() };
    const actor = actorKey(event, userToVisitor);
    row.sessions.add(actor, event.sessionId);
    row.visitors.add(actor);
    byDay.set(key, row);
  }
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    const row = byDay.get(date);
    days.push({ date, sessions: row?.sessions.size() ?? 0, visitors: row?.visitors.size ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
