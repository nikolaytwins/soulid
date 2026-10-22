import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { rangeStart, type AnalyticsRange } from "@/lib/domain/analytics-report";
import { au } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

const RANGES = ["7d", "30d", "90d"] as const;

function homeRange(raw: string | undefined): AnalyticsRange {
  if (raw === "30d" || raw === "90d") return raw;
  return "7d";
}

function formatWhen(d: Date, locale: string) {
  return d.toLocaleDateString(locale === "en" ? "en-GB" : locale === "ar" ? "ar" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function AdminHome({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const { range: rawRange } = await searchParams;
  const range = homeRange(rawRange);
  const since = rangeStart(range);
  const [users, purchases, profiles, paid, recent, visits] = await Promise.all([
    prisma.user.count(),
    prisma.purchase.count(),
    prisma.birthProfile.count(),
    prisma.purchase.count({ where: { status: "paid" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { profiles: true } } }
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since }, sessionId: { not: null } },
      distinct: ["sessionId"],
      select: { sessionId: true }
    })
  ]);
  const period = t("analyticsPeriod", { range: t(`analyticsRange_${range}`) });
  const totals = [
    [t("users"), users, "/admin/users"],
    [t("profiles"), profiles, "/admin/users"],
    [t("purchases"), purchases, "/admin/purchases"],
    [t("paid"), paid, "/admin/purchases"]
  ] as const;
  return (
    <div>
      <h1 className={au.h1}>{t("title")}</h1>
      <p className={`${au.lead} mt-3`}>{t("lead")}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className={au.card}>
          <Link href={`/admin/analytics?range=${range}`} className="block p-5 no-underline text-[#1A1A1A]">
            <div className={au.faint}>{t("analyticsVisits")}</div>
            <div className="mt-1 text-4xl font-semibold">{visits.length}</div>
            <div className="mt-1 text-xs text-[#6B6461]">{period}</div>
          </Link>
          <div className="flex flex-wrap gap-1 border-t border-[rgba(26,26,26,.10)] px-3 py-2">
            {RANGES.map((item) => (
              <Link
                key={item}
                href={`/admin?range=${item}`}
                className={range === item ? `${au.pillOn} px-2.5 py-1 text-[11px]` : `${au.pillOff} border-0 bg-transparent px-2.5 py-1 text-[11px] text-[#6B6461]`}
              >
                {t(`analyticsRange_${item}`)}
              </Link>
            ))}
          </div>
        </div>
        {totals.map(([l, v, href]) => (
          <Link key={href + String(l)} href={href} className={`${au.card} p-5 no-underline text-[#1A1A1A]`}>
            <div className={au.faint}>{l}</div>
            <div className="mt-1 text-4xl font-semibold">{v}</div>
          </Link>
        ))}
      </div>
      <h2 className={`${au.h2} mt-10`}>{t("recentPeople")}</h2>
      <p className={au.lead}>{t("recentPeopleLead")}</p>
      <div className={`mt-3 flex flex-col overflow-hidden ${au.card}`}>
        {recent.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#4A4441]">{t("emptyUsers")}</div>
        ) : (
          recent.map((u) => (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className={`flex items-center justify-between gap-3 border-t border-[rgba(26,26,26,.08)] px-5 py-3.5 no-underline text-[#1A1A1A] first:border-t-0 ${au.rowHover}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{u.email}</span>
                <span className={au.faint}>{formatWhen(u.createdAt, locale)}</span>
              </span>
              <span className="shrink-0 text-sm text-[#4A4441]">{t("starsCount", { n: u._count.profiles })}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
