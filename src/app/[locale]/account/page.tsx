import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { formatDob } from "@/lib/domain/star-page";
import { formatMoney, isIndividuallySold, productName } from "@/lib/domain/catalog";
import { ensureFreeEntitlements, getUnlockOrder, nextPurchasable } from "@/lib/domain/access";
import { parseRelation } from "@/lib/domain/relations";
import { SPHERE_IDS, type SphereId, type StarResult } from "@/lib/engine";
import { Cabinet, type CabinetPurchase, type CabinetStarData } from "@/components/account/Cabinet";
import type { CabinetStarLabels } from "@/components/account/CabinetStar";
import { listSavedCards } from "@/lib/payments/saved";

export const dynamic = "force-dynamic";

function parseStar(json: string): StarResult | null {
  try {
    return JSON.parse(json) as StarResult;
  } catch {
    return null;
  }
}

function firstName(name: string, email: string) {
  const raw = name.trim() || email.split("@")[0] || "·";
  return raw.split(/\s+/)[0];
}

function initialsOf(name: string, email: string) {
  const src = name.trim() || email;
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AccountPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ star?: string; paid?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login?next=/${locale}/account`);
  const t = await getTranslations("account");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect(`/${locale}/login?next=/${locale}/account`);

  const [profiles, purchases, products, order, savedCards] = await Promise.all([
    prisma.birthProfile.findMany({
      where: { userId: user.id },
      include: { entitlements: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.purchase.findMany({
      where: { userId: user.id },
      include: { product: { include: { translations: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.product.findMany({ include: { translations: true } }),
    getUnlockOrder(),
    listSavedCards(user.id)
  ]);

  for (const p of profiles) {
    await ensureFreeEntitlements({ userId: user.id, profileId: p.id });
  }
  const refreshed = await prisma.birthProfile.findMany({
    where: { userId: user.id },
    include: { entitlements: true },
    orderBy: { createdAt: "asc" }
  });

  const sphereProducts = products.filter((p) => p.kind === "sphere");
  const sphereNames = Object.fromEntries(
    SPHERE_IDS.map((id) => [
      id,
      productName(sphereProducts.find((p) => p.sphere === id) ?? { translations: [] }, locale)?.name ?? id
    ])
  ) as Record<SphereId, string>;
  const soul = t("soulMission").split(/\s+/);
  const starLabels: CabinetStarLabels = {
    ...sphereNames,
    missionTop: soul[0] ?? t("soulMission"),
    missionBottom: soul.slice(1).join(" ") || ""
  };

  const fallbackName = user.name?.trim() || firstName("", user.email);
  const stars: CabinetStarData[] = refreshed.map((p) => {
    const star = parseStar(p.calculationJson);
    const unlocked = new Set(p.entitlements.map((e) => e.sphere as SphereId));
    const next = nextPurchasable(order, unlocked);
    const nextProduct = next ? sphereProducts.find((x) => x.sphere === next) : null;
    const bundle = products.find((x) => x.kind === "bundle");
    const buyProduct = nextProduct && isIndividuallySold(nextProduct) ? nextProduct : bundle;
    const relation = parseRelation(p.relation);
    const name = (p.displayName ?? "").trim() || (relation === "self" ? fallbackName : t("unnamed"));
    return {
      id: p.id,
      name,
      relation,
      date: formatDob(p.dateOfBirth, locale),
      unlockedCount: order.filter((s) => unlocked.has(s)).length,
      values: {
        personality: star?.core.personality.value ?? 0,
        spirituality: star?.core.spirituality.value ?? 0,
        money: star?.core.money.value ?? 0,
        relationships: star?.core.relationships.value ?? 0,
        health: star?.core.health.value ?? 0
      },
      nextSku: buyProduct && !buyProduct.isFree ? buyProduct.sku : buyProduct?.sku ?? null,
      nextName: nextProduct && isIndividuallySold(nextProduct) ? (next ? sphereNames[next] : "") : productName(bundle ?? { translations: [] }, locale)?.name ?? "",
      nextPrice: buyProduct ? formatMoney(buyProduct.priceAmount, buyProduct.currency, locale) : "",
      canDelete: relation !== "self" && refreshed.length > 1
    };
  });

  const purchaseRows: CabinetPurchase[] = purchases.map((p) => ({
    id: p.id,
    name: productName(p.product, locale)?.name ?? p.product.sku,
    date: formatDob(p.createdAt.toISOString().slice(0, 10), locale),
    amount: formatMoney(p.amount, p.currency, locale),
    status: p.status === "paid" ? t("paid") : p.status === "pending" ? t("pending") : t("failed")
  }));

  const displayName = user.name?.trim() || firstName("", user.email);

  return (
    <Cabinet
      locale={locale}
      user={{
        name: displayName,
        email: user.email,
        initials: initialsOf(displayName, user.email),
        role: user.role
      }}
      stars={stars}
      order={order}
      sphereNames={sphereNames}
      starLabels={starLabels}
      purchases={purchaseRows}
      savedCards={savedCards}
      initialStarId={sp.star && stars.some((s) => s.id === sp.star) ? sp.star : (stars[0]?.id ?? null)}
      paidToast={sp.paid === "1" ? t("toastPaid") : null}
    />
  );
}
