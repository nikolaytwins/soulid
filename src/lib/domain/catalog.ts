import { prisma } from "@/lib/db";

export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  const major = amountMinor / 100;
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
