import { prisma } from "@/lib/db";
import { buildFunnel, dailySessions, rangeStart, type AnalyticsRange } from "./analytics-report";

export async function loadAnalyticsReport(range: AnalyticsRange) {
  const to = new Date();
  const from = rangeStart(range, to);
  const [events, paid] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: from } },
      select: {
        id: true,
        name: true,
        visitorId: true,
        sessionId: true,
        userId: true,
        path: true,
        utmSource: true,
        utmCampaign: true,
        referrer: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.purchase.aggregate({
      where: { status: "paid", paidAt: { gte: from } },
      _count: true,
      _sum: { amount: true }
    })
  ]);

  const built = buildFunnel(events);
  return {
    range,
    from,
    to,
    ...built,
    paidCount: paid._count,
    paidAmount: paid._sum.amount ?? 0,
    daily: dailySessions(events, from, to)
  };
}
