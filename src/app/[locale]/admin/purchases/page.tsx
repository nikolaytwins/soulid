import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/domain/catalog";
import { getTranslations } from "next-intl/server";
import { LtrText } from "@/components/ui/LtrText";

export const dynamic = "force-dynamic";

export default async function AdminPurchases({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getTranslations("admin");
  const { status } = await searchParams;
  const where = status && ["pending", "paid", "failed", "canceled"].includes(status) ? { status } : {};
  const [rows, ledger, paid] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: true, product: { include: { translations: true } }, profile: true, entitlements: true }
    }),
    prisma.ledgerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 120
    }),
    prisma.purchase.aggregate({
      where: { status: "paid" },
      _count: true,
      _sum: { amount: true }
    })
  ]);

  const filters = ["all", "paid", "pending", "failed", "canceled"] as const;

  return (
    <div>
      <h1 className="font-serif text-3xl">{t("ledgerTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("ledgerLead")}</p>
      <div className="mt-4 rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
        {t("ledgerPaidSummary", {
          n: paid._count,
          money: formatMoney(paid._sum.amount ?? 0, rows[0]?.currency ?? "USD", "ru")
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((id) => (
          <Link
            key={id}
            href={id === "all" ? "/admin/purchases" : `/admin/purchases?status=${id}`}
            className={`rounded-full px-3 py-1.5 text-sm no-underline ${
              (id === "all" && !status) || status === id ? "bg-ink text-card" : "bg-card text-ink"
            }`}
          >
            {t(`ledgerFilter_${id}`)}
          </Link>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-faint">
            <tr>
              <th className="px-4 py-3">{t("colDate")}</th>
              <th className="px-4 py-3">{t("changeEmail")}</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">{t("colAmount")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
              <th className="px-4 py-3">{t("ledgerProvider")}</th>
              <th className="px-4 py-3">{t("ledgerSpheres")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={7}>
                  {t("noPayments")}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <LtrText>{(r.paidAt ?? r.createdAt).toISOString().slice(0, 19)}</LtrText>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${r.userId}`} className="font-semibold text-gold-deep">
                      {r.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.product.sku}</td>
                  <td className="px-4 py-3">{formatMoney(r.amount, r.currency, "ru")}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.provider}</td>
                  <td className="px-4 py-3">{r.entitlements.map((e) => e.sphere).join(", ") || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-serif text-2xl">{t("ledgerLog")}</h2>
      <p className="mt-1 text-sm text-muted">{t("ledgerLogLead")}</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-faint">
            <tr>
              <th className="px-4 py-3">{t("colDate")}</th>
              <th className="px-4 py-3">{t("ledgerKind")}</th>
              <th className="px-4 py-3">{t("ledgerActor")}</th>
              <th className="px-4 py-3">{t("ledgerSummary")}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <LtrText>{e.createdAt.toISOString().slice(0, 19)}</LtrText>
                </td>
                <td className="px-4 py-3">{e.kind}</td>
                <td className="px-4 py-3">{e.actorType}</td>
                <td className="px-4 py-3">{e.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
