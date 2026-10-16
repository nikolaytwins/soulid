import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { productName } from "@/lib/domain/catalog";
import { UnlockOrder } from "./unlock-order";
import { PriceRow } from "./price-row";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const [products, rules] = await Promise.all([
    prisma.product.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
    prisma.unlockRule.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  const spheres = products.filter((p) => p.kind === "sphere");
  const bundles = products.filter((p) => p.kind !== "sphere");
  const label = (p: (typeof products)[number]) => productName(p, locale)?.name ?? p.sku;

  const orderItems = rules.map((r) => {
    const product = spheres.find((p) => p.sphere === r.sphere);
    return {
      id: r.id,
      name: product ? label(product) : r.sphere,
      free: product?.isFree ?? false
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-3xl">{t("products")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("pricesLead")}</p>
      </div>

      <section>
        <h2 className="font-serif text-2xl">{t("orderTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("orderLead")}</p>
        <div className="mt-4">
          <UnlockOrder items={orderItems} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("pricesTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("pricesHint")}</p>
        <div className="mt-4 flex flex-col gap-2">
          {spheres.map((p) => (
            <PriceRow
              key={`${p.id}-${p.isFree}-${p.priceAmount}`}
              id={p.id}
              name={label(p)}
              amount={Math.round(p.priceAmount / 100)}
              isFree={p.isFree}
              hint={p.sphere === "health" ? t("healthGiftHint") : undefined}
            />
          ))}
          {bundles.map((p) => (
            <PriceRow
              key={`${p.id}-${p.isFree}-${p.priceAmount}`}
              id={p.id}
              name={label(p)}
              hint={t("bundleHint")}
              amount={Math.round(p.priceAmount / 100)}
              isFree={p.isFree}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
