import { getTranslations } from "next-intl/server";
import { V3_FONT_DISPLAY, V3_INK, V3_MUTED } from "@/lib/v3";

export default async function TermsPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-[clamp(20px,3vw,48px)] py-12 leading-relaxed" style={{ color: V3_MUTED }}>
      <h1 className="text-4xl uppercase tracking-[0.03em]" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("termsTitle")}
      </h1>
      <p className="mt-4">{t("termsLead")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("termsPaidTitle")}
      </h2>
      <p className="mt-3">{t("termsPaid")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("termsPayTitle")}
      </h2>
      <p className="mt-3">{t("termsPay")}</p>
      <h2 className="mt-8 text-2xl" style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}>
        {t("termsDisclaimerTitle")}
      </h2>
      <p className="mt-3">{t("termsDisclaimer")}</p>
    </main>
  );
}
