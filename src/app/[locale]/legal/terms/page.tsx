import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed text-muted">
      <h1 className="font-serif text-4xl text-ink">{t("termsTitle")}</h1>
      <p className="mt-4">{t("termsLead")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("termsPaidTitle")}</h2>
      <p className="mt-3">{t("termsPaid")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("termsPayTitle")}</h2>
      <p className="mt-3">{t("termsPay")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("termsDisclaimerTitle")}</h2>
      <p className="mt-3">{t("termsDisclaimer")}</p>
    </main>
  );
}
