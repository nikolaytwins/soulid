import { rangeDays, type FunnelStepId } from "@/lib/domain/analytics-report";
import { loadAnalyticsReport } from "@/lib/domain/analytics-load";
import { formatMoney } from "@/lib/domain/catalog";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { LtrText } from "@/components/ui/LtrText";

export const dynamic = "force-dynamic";

const RANGES = ["7d", "30d", "90d"] as const;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default async function AdminAnalytics({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const t = await getTranslations("admin");
  const { range: rawRange } = await searchParams;
  const range = rangeDays(rawRange);
  const report = await loadAnalyticsReport(range);
  const maxDaily = Math.max(1, ...report.daily.map((d) => d.sessions));
  const funnelMax = Math.max(1, ...report.funnel.map((s) => s.count));
  const paidVisitors = report.funnel.find((s) => s.id === "paid")?.count ?? 0;

  const stepLabel = (id: FunnelStepId) => t(`analyticsStep_${id}`);

  const kpis = [
    [t("analyticsVisits"), String(report.sessions)],
    [t("analyticsPeople"), String(report.visitors)],
    [t("analyticsStars"), String(report.funnel.find((s) => s.id === "calculate")?.count ?? 0)],
    [t("analyticsEmails"), String(report.emails)],
    [t("analyticsCheckouts"), String(report.funnel.find((s) => s.id === "checkout")?.count ?? 0)],
    [t("analyticsPaidPeople"), String(paidVisitors)]
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[Forum,serif] text-4xl font-normal tracking-[0.02em]">{t("analytics")}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">{t("analyticsLead")}</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((item) => (
            <Link
              key={item}
              href={`/admin/analytics?range=${item}`}
              className={`rounded-none px-3.5 py-1.5 text-sm no-underline ${
                range === item ? "admin-pill-on" : "admin-pill-off"
              }`}
            >
              {t(`analyticsRange_${item}`)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5">
            <div className="text-sm text-faint">{label}</div>
            <div className="font-sans text-4xl font-semibold">
              <LtrText>{value}</LtrText>
            </div>
            <div className="mt-1 text-xs text-muted">{t("analyticsPeriod", { range: t(`analyticsRange_${range}`) })}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] px-5 py-4 text-sm text-muted">
        {t("analyticsRevenue", {
          money: formatMoney(report.paidAmount, "RUB", "ru"),
          n: report.paidCount
        })}
        {" · "}
        {t("analyticsVisitToPaid", { pct: pct(report.visitors === 0 ? 0 : paidVisitors / report.visitors) })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5">
          <h2 className="font-[Forum,serif] text-2xl font-normal">{t("analyticsFunnel")}</h2>
          <p className="mt-1 text-sm text-muted">{t("analyticsFunnelLead")}</p>
          <div className="mt-5 flex flex-col gap-3">
            {report.funnel.map((step) => (
              <div key={step.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span>{stepLabel(step.id)}</span>
                  <span className="text-muted">
                    <LtrText>{step.count}</LtrText>
                    {" · "}
                    <LtrText>{pct(step.conversionFromStart)}</LtrText>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-none bg-[rgba(26,26,26,.08)]">
                  <div
                    className="h-full rounded-none bg-[#B99353]"
                    style={{ width: `${Math.max(step.count === 0 ? 0 : 6, (step.count / funnelMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5">
          <h2 className="font-[Forum,serif] text-2xl font-normal">{t("analyticsDrop")}</h2>
          <p className="mt-1 text-sm text-muted">{t("analyticsDropLead")}</p>
          <div className="mt-5 flex flex-col overflow-hidden rounded-none border border-[rgba(26,26,26,.10)]">
            {report.stuck.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted">{t("analyticsEmpty")}</div>
            ) : (
              report.stuck.map((row) => (
                <div
                  key={row.step}
                  className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm first:border-t-0"
                >
                  <span>{t("analyticsStuckAt", { step: stepLabel(row.step) })}</span>
                  <span className="font-semibold">
                    <LtrText>{row.count}</LtrText>
                  </span>
                </div>
              ))
            )}
          </div>
          <ul className="mt-4 flex flex-col gap-1 text-sm text-muted">
            {report.dropOff.map((row) => (
              <li key={row.from}>
                {t("analyticsLostBetween", {
                  from: stepLabel(row.from),
                  to: stepLabel(row.to),
                  n: row.lost,
                  pct: pct(row.rate)
                })}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5">
        <h2 className="font-[Forum,serif] text-2xl font-normal">{t("analyticsDaily")}</h2>
        <div className="mt-5 flex h-40 items-end gap-1">
          {report.daily.map((day) => (
            <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${day.date}: ${day.sessions}`}>
              <div
                className="w-full rounded-none bg-[#B99353]"
                style={{ height: `${Math.max(day.sessions === 0 ? 0 : 4, (day.sessions / maxDaily) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-faint">
          <LtrText>{report.daily[0]?.date}</LtrText>
          <LtrText>{report.daily.at(-1)?.date}</LtrText>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-[Forum,serif] text-2xl font-normal">{t("analyticsSources")}</h2>
        <p className="mt-1 text-sm text-muted">{t("analyticsSourcesLead")}</p>
        <div className="mt-4 overflow-x-auto rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)]">
          <table className="w-full text-left text-sm">
            <thead className="text-faint">
              <tr>
                <th className="px-4 py-3">{t("analyticsColSource")}</th>
                <th className="px-4 py-3">{t("analyticsColCampaign")}</th>
                <th className="px-4 py-3">{t("analyticsPeople")}</th>
                <th className="px-4 py-3">{t("analyticsVisits")}</th>
                <th className="px-4 py-3">{t("analyticsStars")}</th>
                <th className="px-4 py-3">{t("paid")}</th>
              </tr>
            </thead>
            <tbody>
              {report.sources.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={6}>
                    {t("analyticsEmpty")}
                  </td>
                </tr>
              ) : (
                report.sources.map((row) => (
                  <tr key={row.source} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold">
                      {["direct", "google", "yandex", "telegram", "instagram", "vk", "facebook", "youtube", "tiktok", "whatsapp"].includes(
                        row.source
                      )
                        ? t(`analyticsSource_${row.source}`)
                        : row.source}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.campaign || "—"}</td>
                    <td className="px-4 py-3">
                      <LtrText>{row.visitors}</LtrText>
                    </td>
                    <td className="px-4 py-3">
                      <LtrText>{row.sessions}</LtrText>
                    </td>
                    <td className="px-4 py-3">
                      <LtrText>{row.calculated}</LtrText>
                    </td>
                    <td className="px-4 py-3">
                      <LtrText>{row.paid}</LtrText>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
