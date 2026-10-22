import { getTranslations } from "next-intl/server";
import { V3_FONT_DISPLAY, V3_INK, V3_MUTED } from "@/lib/v3";

export default async function PrivacyPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-[clamp(20px,3vw,48px)] py-12 leading-relaxed" style={{ color: V3_MUTED }}>
      <h1 className="text-4xl uppercase tracking-[0.03em]" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyTitle")}
      </h1>
      <p className="mt-4">{t("privacyUpdated")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyWhoTitle")}
      </h2>
      <p className="mt-3">{t("privacyWho")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyWhatTitle")}
      </h2>
      <p className="mt-3">{t("privacyWhat")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyWhyTitle")}
      </h2>
      <p className="mt-3">{t("privacyWhy")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyKeepTitle")}
      </h2>
      <p className="mt-3">{t("privacyKeep")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyRightsTitle")}
      </h2>
      <p className="mt-3">{t("privacyRights")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("privacyCookiesTitle")}
      </h2>
      <p className="mt-3">{t("privacyCookies")}</p>
    </main>
  );
}
