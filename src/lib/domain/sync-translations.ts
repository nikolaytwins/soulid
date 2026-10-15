import { prisma } from "@/lib/db";
import {
  CONTENT_LOCALES,
  canAutoOverwrite,
  isContentLocale,
  syncQuery,
  translateInterpretation,
  type ContentLocale
} from "./translate";

export { syncQuery };

export type TranslationSyncResult = {
  auto: ContentLocale[];
  kept: ContentLocale[];
  fail: ContentLocale[];
};

export async function syncAutoTranslations(params: {
  sphere: string;
  point: string;
  arcanaValue: number;
  sourceLocale: string;
  title: string;
  contentType: string;
  body: string;
}): Promise<TranslationSyncResult> {
  const result: TranslationSyncResult = { auto: [], kept: [], fail: [] };
  if (!isContentLocale(params.sourceLocale)) return result;
  const targets = CONTENT_LOCALES.filter((locale) => locale !== params.sourceLocale);

  for (const locale of targets) {
    const sibling = await prisma.interpretation.findUnique({
      where: {
        sphere_point_arcanaValue_locale: {
          sphere: params.sphere,
          point: params.point,
          arcanaValue: params.arcanaValue,
          locale
        }
      }
    });
    if (sibling && !canAutoOverwrite(sibling.origin)) {
      result.kept.push(locale);
      continue;
    }
    try {
      const translated = await translateInterpretation({
        title: params.title,
        contentType: params.contentType,
        body: params.body,
        from: params.sourceLocale,
        to: locale
      });
      await prisma.interpretation.upsert({
        where: {
          sphere_point_arcanaValue_locale: {
            sphere: params.sphere,
            point: params.point,
            arcanaValue: params.arcanaValue,
            locale
          }
        },
        create: {
          sphere: params.sphere,
          point: params.point,
          arcanaValue: params.arcanaValue,
          locale,
          title: translated.title,
          body: translated.body,
          contentType: params.contentType,
          isDemo: false,
          origin: "auto"
        },
        update: {
          title: translated.title,
          body: translated.body,
          contentType: params.contentType,
          isDemo: false,
          origin: "auto"
        }
      });
      result.auto.push(locale);
    } catch {
      result.fail.push(locale);
    }
  }

  return result;
}
