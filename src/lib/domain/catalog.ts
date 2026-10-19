import { prisma } from "@/lib/db";

export const RECOMMENDATION_SKU = "personal_recommendation";

export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  const major = amountMinor / 100;
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(major);
  }
  if (currency === "RUB") {
    const formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : locale === "ar" ? "ar" : "ru-RU", {
      maximumFractionDigits: 0
    }).format(major);
    return `${formatted} ₽`;
  }
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(major);
  } catch {
    return `${major} ${currency}`;
  }
}

export function isIndividuallySold(product: {
  kind: string;
  isFree: boolean;
  isActive: boolean;
  priceAmount: number;
}): boolean {
  return product.kind === "sphere" && product.isActive && !product.isFree && product.priceAmount > 0;
}

export async function getProductBySku(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: { translations: true }
  });
}

export async function getSphereProduct(sphere: string) {
  return prisma.product.findFirst({
    where: { sphere, kind: "sphere", isActive: true },
    include: { translations: true }
  });
}

export function productName(
  product: { translations: { locale: string; name: string; description: string }[] },
  locale: string
) {
  return (
    product.translations.find((t) => t.locale === locale) ??
    product.translations.find((t) => t.locale === "en") ??
    product.translations[0]
  );
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function ensureRecommendationProduct() {
  const existing = await prisma.product.findUnique({
    where: { sku: RECOMMENDATION_SKU },
    include: { translations: true }
  });
  if (existing) return existing;
  return prisma.product.create({
    data: {
      sku: RECOMMENDATION_SKU,
      kind: "addon",
      sortOrder: 100,
      priceAmount: 199000,
      currency: "RUB",
      isActive: true,
      isFree: false,
      translations: {
        create: [
          {
            locale: "ru",
            name: "Персональная рекомендация",
            description: "Резюме открытых сфер и рекомендации по связям между ними"
          },
          {
            locale: "en",
            name: "Personal recommendation",
            description: "A summary of opened spheres and advice on how they connect"
          },
          {
            locale: "ar",
            name: "توصية شخصية",
            description: "ملخص للمجالات المفتوحة وتوصيات تراعي الروابط بينها"
          }
        ]
      }
    },
    include: { translations: true }
  });
}

export function formatRecEta(locale: string, from: Date): string {
  const eta = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const date = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "ar" ? "ar" : "ru-RU", {
    day: "numeric",
    month: "long"
  }).format(eta);
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "ar" ? "ar" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(eta);
  return `${date}, ${time}`;
}
