import { prisma } from "@/lib/db";
import { calculateStarFromIso, SPHERE_IDS, sphereSlotKind, type SphereId, type StarResult } from "@/lib/engine";
import { ensureFreeEntitlements, getUnlockOrder, getUnlockedSpheres, nextPurchasable } from "@/lib/domain/access";
import { formatMoney, isIndividuallySold, productName } from "@/lib/domain/catalog";
import { getInterpretation, type ContentBlock } from "@/lib/domain/content";
import { formatDob } from "@/lib/domain/dob";

export { formatDob };

export type SphereCopy = {
  id: SphereId;
  name: string;
  purpose: string;
  part: string;
  zone: number;
};

export type ArcReading = {
  id: string;
  point: string;
  value: number;
  role: string;
  roleUp: string;
  content: ContentBlock | null;
};

export type StarPageModel = {
  profileId: string;
  isoDate: string;
  displayDate: string;
  star: StarResult;
  order: SphereId[];
  unlocked: SphereId[];
  nextSphere: SphereId | null;
  spheres: Record<SphereId, SphereCopy>;
  prices: Record<SphereId, { sku: string; amount: number; formatted: string; isFree: boolean; soldSeparately: boolean }>;
  bundle: { sku: string; amount: number; formatted: string } | null;
  showBundle: boolean;
  loggedIn: boolean;
  locale: string;
  canEdit: boolean;
  siblingStars: { id: string; displayDate: string; unlocked: number; total: number }[];
  unlockCopy: Record<
    string,
    { blockedTitle: string; blockedBody: string; whyTitle: string; whyBody: string }
  >;
};

const PARTS: Record<SphereId, { ru: string; en: string; ar: string; zone: number }> = {
  personality: { ru: "Левая часть звезды", en: "Left point of the star", ar: "الرأس الأيسر", zone: 4 },
  spirituality: { ru: "Верхняя часть звезды", en: "Top point of the star", ar: "الرأس العلوي", zone: 0 },
  money: { ru: "Правая часть звезды", en: "Right point of the star", ar: "الرأس الأيمن", zone: 1 },
  relationships: { ru: "Нижняя правая часть звезды", en: "Lower-right point", ar: "الرأس الأيمن السفلي", zone: 2 },
  health: { ru: "Нижняя левая часть звезды", en: "Lower-left point", ar: "الرأس الأيسر السفلي", zone: 3 }
};

function loc<T extends { ru: string; en: string; ar: string }>(obj: T, locale: string): string {
  if (locale === "en") return obj.en;
  if (locale === "ar") return obj.ar;
  return obj.ru;
}

export async function loadStarPage(profileId: string, locale: string, userId: string | null): Promise<StarPageModel | null> {
  const profile = await prisma.birthProfile.findUnique({ where: { id: profileId } });
  if (!profile) return null;
  if (userId) {
    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, blockedAt: true }
    });
    if (!viewer || viewer.blockedAt) {
      if (profile.userId) return null;
      userId = null;
    }
  }
  if (profile.userId) {
    if (!userId) return null;
    if (profile.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== "admin") return null;
    } else {
      await ensureFreeEntitlements({ userId, profileId: profile.id });
    }
  }

  let star: StarResult;
  try {
    star = JSON.parse(profile.calculationJson) as StarResult;
  } catch {
    star = calculateStarFromIso(profile.dateOfBirth);
  }

  const order = await getUnlockOrder();
  const unlockedSet = await getUnlockedSpheres(profileId);
  if (!userId) {
    const free = await prisma.product.findMany({ where: { isFree: true, kind: "sphere" } });
    for (const p of free) if (p.sphere) unlockedSet.add(p.sphere as SphereId);
  }
  const unlocked = order.filter((s) => unlockedSet.has(s));
  const nextSphere = nextPurchasable(order, unlockedSet);

  const products = await prisma.product.findMany({ include: { translations: true } });
  const prices = {} as StarPageModel["prices"];
  const spheres = {} as Record<SphereId, SphereCopy>;

  for (const id of SPHERE_IDS) {
    const product = products.find((p) => p.sphere === id && p.kind === "sphere");
    const tr = product ? productName(product, locale) : null;
    spheres[id] = {
      id,
      name: tr?.name ?? id,
      purpose: tr?.description ?? "",
      part: loc(PARTS[id], locale),
      zone: PARTS[id].zone
    };
    if (product) {
      prices[id] = {
        sku: product.sku,
        amount: product.priceAmount,
        formatted: formatMoney(product.priceAmount, product.currency, locale),
        isFree: product.isFree,
        soldSeparately: isIndividuallySold(product)
      };
    }
  }

  const bundleProd = products.find((p) => p.kind === "bundle");
  const show = (await prisma.siteSetting.findUnique({ where: { key: "show_unlock_everything" } }))?.value !== "false";

  const rules = await prisma.unlockRule.findMany();
  const unlockCopy: StarPageModel["unlockCopy"] = {};
  for (const r of rules) {
    unlockCopy[r.sphere] = {
      blockedTitle: locale === "en" ? r.blockedTitleEn : locale === "ar" ? r.blockedTitleAr : r.blockedTitleRu,
      blockedBody: locale === "en" ? r.blockedBodyEn : locale === "ar" ? r.blockedBodyAr : r.blockedBodyRu,
      whyTitle: locale === "en" ? r.whyTitleEn : locale === "ar" ? r.whyTitleAr : r.whyTitleRu,
      whyBody: locale === "en" ? r.whyBodyEn : locale === "ar" ? r.whyBodyAr : r.whyBodyRu
    };
  }

  const siblingStars: StarPageModel["siblingStars"] = [];
  const canListSiblings = Boolean(
    profile.userId && userId && (profile.userId === userId || (await prisma.user.findUnique({ where: { id: userId } }))?.role === "admin")
  );
  if (canListSiblings && profile.userId) {
    const siblings = await prisma.birthProfile.findMany({
      where: { userId: profile.userId },
      include: { entitlements: true },
      orderBy: { createdAt: "desc" }
    });
    for (const sibling of siblings) {
      siblingStars.push({
        id: sibling.id,
        displayDate: formatDob(sibling.dateOfBirth, locale),
        unlocked: sibling.entitlements.length,
        total: order.length
      });
    }
  }

  return {
    profileId,
    isoDate: profile.dateOfBirth,
    displayDate: formatDob(profile.dateOfBirth, locale),
    star,
    order,
    unlocked,
    nextSphere,
    spheres,
    prices,
    bundle: bundleProd
      ? {
          sku: bundleProd.sku,
          amount: bundleProd.priceAmount,
          formatted: formatMoney(bundleProd.priceAmount, bundleProd.currency, locale)
        }
      : null,
    showBundle: show,
    loggedIn: !!userId,
    locale,
    canEdit: !profile.userId || profile.userId === userId,
    siblingStars,
    unlockCopy
  };
}

export async function loadSphereArcs(
  star: StarResult,
  sphere: SphereId,
  locale: string,
  labels: { ancestral: string; fatal: string; apex: string; inner: string }
): Promise<ArcReading[]> {
  const t = star.spheres[sphere];
  const baseRole = (point: "leftBase" | "rightBase") =>
    sphereSlotKind(sphere, point) === "fatal_error" ? labels.fatal : labels.ancestral;
  const items: { point: string; value: number; role: string; kind: string }[] = [
    { point: "apex", value: t.apex.value, role: labels.apex, kind: "apex" },
    {
      point: "leftBase",
      value: t.leftBase.value,
      role: baseRole("leftBase"),
      kind: sphereSlotKind(sphere, "leftBase")
    },
    {
      point: "rightBase",
      value: t.rightBase.value,
      role: baseRole("rightBase"),
      kind: sphereSlotKind(sphere, "rightBase")
    },
    { point: "innerLeft", value: t.innerLeft.value, role: labels.inner, kind: "inner" },
    { point: "innerRight", value: t.innerRight.value, role: labels.inner, kind: "inner" },
    { point: "innerBottom", value: t.innerBottom.value, role: labels.inner, kind: "inner" }
  ];
  const out: ArcReading[] = [];
  for (const it of items) {
    const content = await getInterpretation({ sphere, point: it.point, value: it.value, locale });
    out.push({
      id: `arc-${sphere}-${it.point}`,
      point: it.point,
      value: it.value,
      role: it.role,
      roleUp: locale === "ar" ? it.role : it.role.toUpperCase(),
      content
    });
  }
  return out;
}
