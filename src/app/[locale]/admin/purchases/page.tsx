import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/domain/catalog";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminPurchases() {
  const t = await getTranslations("admin");
  const rows = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { user: true, product: { include: { translations: true } }, profile: true }
  });
  return (
    <div>
      <h1 className="font-serif text-3xl">{t("purchases")}</h1>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-faint">
            <tr>
              <th className="px-4 py-3">{t("colDate")}</th>
              <th className="px-4 py-3">{t("changeEmail")}</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">{t("colAmount")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3">{r.createdAt.toISOString().slice(0, 19)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${r.userId}`} className="font-semibold text-gold-deep">
                    {r.user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.product.sku}</td>
                <td className="px-4 py-3">{formatMoney(r.amount, r.currency, "ru")}</td>
                <td className="px-4 py-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
