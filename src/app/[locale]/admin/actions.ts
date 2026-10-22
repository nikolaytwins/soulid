"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function revalidateCatalog() {
  for (const locale of ["ru", "en", "ar"] as const) {
    revalidatePath(`/${locale}/admin/products`);
  }
  revalidatePath("/admin/products");
}

export async function saveProductPriceAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(form.get("id"));
  const isFree = form.get("isFree") === "1" || form.get("isFree") === "on";
  const major = Number(String(form.get("amount") ?? form.get("rubles") ?? "").replace(",", "."));
  const priceAmount = Number.isFinite(major) ? Math.max(0, Math.round(major * 100)) : 0;
  await prisma.product.update({
    where: { id },
    data: isFree ? { isFree: true, priceAmount: 0 } : { isFree: false, priceAmount, currency: "USD" }
  });
  revalidateCatalog();
}

function blockedCopy(prevName: string, curName: string, locale: "ru" | "en" | "ar") {
  if (locale === "en") {
    return {
      title: `Open ${prevName} first`,
      body: `You cannot enter ${curName} before ${prevName} is unlocked.`
    };
  }
  if (locale === "ar") {
    return {
      title: `افتح مجال ${prevName} أولاً`,
      body: `لا يمكن الانتقال إلى ${curName} قبل فتح ${prevName}.`
    };
  }
  return {
    title: `Сначала раскройте сферу ${prevName}`,
    body: `Невозможно перейти к сфере ${curName}, пока не раскрыта сфера ${prevName}.`
  };
}

export async function reorderUnlocksAction(orderedIds: string[]) {
  const admin = await requireAdmin();
  if (!admin) return;
  const ids = orderedIds.filter(Boolean);
  if (ids.length === 0) return;
  const rules = await prisma.unlockRule.findMany();
  if (rules.length !== ids.length || ids.some((id) => !rules.some((r) => r.id === id))) return;
  const products = await prisma.product.findMany({
    where: { kind: "sphere" },
    include: { translations: true }
  });
  const name = (sphere: string, locale: string) =>
    products.find((p) => p.sphere === sphere)?.translations.find((t) => t.locale === locale)?.name ?? sphere;

  const ordered = ids.map((id) => rules.find((r) => r.id === id)!);
  for (let i = 0; i < ordered.length; i++) {
    const rule = ordered[i];
    const prev = i === 0 ? null : ordered[i - 1];
    const ru = prev ? blockedCopy(name(prev.sphere, "ru"), name(rule.sphere, "ru"), "ru") : { title: "", body: "" };
    const en = prev ? blockedCopy(name(prev.sphere, "en"), name(rule.sphere, "en"), "en") : { title: "", body: "" };
    const ar = prev ? blockedCopy(name(prev.sphere, "ar"), name(rule.sphere, "ar"), "ar") : { title: "", body: "" };
    await prisma.unlockRule.update({
      where: { id: rule.id },
      data: {
        sortOrder: i,
        requiredPrev: prev?.sphere ?? null,
        blockedTitleRu: ru.title,
        blockedBodyRu: ru.body,
        blockedTitleEn: en.title,
        blockedBodyEn: en.body,
        blockedTitleAr: ar.title,
        blockedBodyAr: ar.body
      }
    });
    const product = products.find((p) => p.sphere === rule.sphere);
    if (product) {
      await prisma.product.update({ where: { id: product.id }, data: { sortOrder: i } });
    }
  }
  revalidateCatalog();
}

export async function saveInterpretationAction(form: FormData): Promise<{
  ok: boolean;
  sync: { auto: string[]; kept: string[]; fail: string[] };
}> {
  const empty = { ok: false as const, sync: { auto: [] as string[], kept: [] as string[], fail: [] as string[] } };
  const admin = await requireAdmin();
  if (!admin) return empty;
  const { serializePlainBody, serializeStructuredBody } = await import("@/lib/domain/content");
  const { syncAutoTranslations } = await import("@/lib/domain/sync-translations");
  const contentType = String(form.get("contentType") ?? "plain");
  const title = String(form.get("title") ?? "");
  const body =
    contentType === "structured"
      ? serializeStructuredBody(
          [0, 1, 2, 3].map((i) => ({
            mark: String(form.get(`blockMark${i}`) ?? ""),
            label: String(form.get(`blockLabel${i}`) ?? ""),
            text: String(form.get(`blockText${i}`) ?? "")
          }))
        )
      : serializePlainBody(String(form.get("text") ?? ""));
  const current = await prisma.interpretation.findUnique({ where: { id: String(form.get("id")) } });
  if (!current) return empty;
  await prisma.interpretation.update({
    where: { id: current.id },
    data: {
      title,
      body,
      contentType,
      isDemo: false,
      origin: "manual"
    }
  });
  const sync = await syncAutoTranslations({
    sphere: current.sphere,
    point: current.point,
    arcanaValue: current.arcanaValue,
    sourceLocale: current.locale,
    title,
    contentType,
    body
  });
  return { ok: true, sync };
}

function parseArcanaList(raw: string): number[] {
  return [...new Set(raw.split(/[,+\s]+/).map((part) => Number(part.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= 22))].sort(
    (a, b) => a - b
  );
}

export async function savePatternAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const { canonicalMatchKey } = await import("@/lib/engine/patterns");
  const id = String(form.get("id") ?? "");
  const kind = String(form.get("kind") ?? "repeating") === "combination" ? "combination" : "repeating";
  const values = parseArcanaList(String(form.get("values") ?? ""));
  if (values.length === 0) return;
  const scope = String(form.get("scope") ?? "star") === "sphere" ? "sphere" : "star";
  const sphereRaw = String(form.get("sphere") ?? "").trim();
  const sphere = scope === "sphere" && sphereRaw ? sphereRaw : null;
  const locale = String(form.get("locale") ?? "ru");
  const minCount = Math.max(2, Number(form.get("minCount") ?? 2) || 2);
  const matchKey = canonicalMatchKey(kind, values, sphere);
  const data = {
    kind,
    matchKey,
    valuesJson: JSON.stringify(kind === "repeating" ? [values[0]] : values),
    minCount: kind === "repeating" ? minCount : values.length,
    scope,
    sphere,
    locale,
    title: String(form.get("title") ?? ""),
    body: String(form.get("body") ?? ""),
    contentType: "plain",
    isActive: form.get("isActive") === "on",
    sortOrder: Number(form.get("sortOrder") ?? 0) || 0
  };
  if (id) {
    await prisma.patternRule.update({ where: { id }, data });
  } else {
    await prisma.patternRule.create({ data });
  }
  revalidatePath("/admin/patterns");
}

export async function deletePatternAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  await prisma.patternRule.delete({ where: { id: String(form.get("id")) } });
  revalidatePath("/admin/patterns");
}

const LOCALES = ["ru", "en", "ar"] as const;

function revalidateEntitlementSurfaces(profileId: string, userId: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/star/${profileId}`);
    revalidatePath(`/${locale}/v2/star/${profileId}`);
    revalidatePath(`/${locale}/account`);
    revalidatePath(`/${locale}/v2/account`);
    revalidatePath(`/${locale}/admin/unlocks`);
    revalidatePath(`/${locale}/admin/users`);
    revalidatePath(`/${locale}/admin/users/${userId}`);
    revalidatePath(`/${locale}/admin/unlocks`, "page");
  }
  revalidatePath(`/admin/unlocks`);
}

export async function saveFormulaAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const };
  const { parseStarFormula } = await import("@/lib/engine");
  const { saveStarFormula } = await import("@/lib/domain/formula");
  let parsed = null;
  try {
    parsed = parseStarFormula(JSON.parse(String(form.get("formula") ?? "")));
  } catch {
    parsed = null;
  }
  if (!parsed) return { ok: false as const };
  await saveStarFormula(parsed);
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/admin/formula`);
  }
  revalidatePath("/admin/formula");
  return { ok: true as const };
}

export async function resetFormulaAction() {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const };
  const { BOOK_FORMULA } = await import("@/lib/engine");
  const { saveStarFormula } = await import("@/lib/domain/formula");
  await saveStarFormula(BOOK_FORMULA);
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/admin/formula`);
  }
  revalidatePath("/admin/formula");
  return { ok: true as const };
}

export async function adminGrantSphereAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const { ADMIN_ENTITLEMENT_SOURCE, grantSpheres, getUnlockOrder } = await import("@/lib/domain/access");
  const { SPHERE_IDS } = await import("@/lib/engine");
  const profileId = String(form.get("profileId") ?? "");
  const action = String(form.get("action") ?? "");
  const profile = await prisma.birthProfile.findUnique({ where: { id: profileId } });
  if (!profile?.userId) return;

  const order = await getUnlockOrder();
  if (action === "reset") {
    const { resetProfileEntitlements } = await import("@/lib/domain/access");
    await resetProfileEntitlements({ userId: profile.userId, profileId: profile.id });
    revalidateEntitlementSurfaces(profile.id, profile.userId);
    return;
  }

  let spheres: (typeof SPHERE_IDS)[number][] = [];
  if (action === "all") {
    spheres = [...order];
  } else if ((SPHERE_IDS as readonly string[]).includes(action)) {
    spheres = [action as (typeof SPHERE_IDS)[number]];
  } else {
    return;
  }

  await grantSpheres({
    userId: profile.userId,
    profileId: profile.id,
    spheres,
    purchaseId: null,
    source: ADMIN_ENTITLEMENT_SOURCE
  });
  revalidateEntitlementSurfaces(profile.id, profile.userId);
}
