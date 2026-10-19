import { getTranslations } from "next-intl/server";

export default async function V2TermsPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-[clamp(16px,3vw,40px)] py-12 leading-relaxed text-[#5B5566]">
      <div className="rounded-[36px] bg-white p-8 md:p-12">
        <h1 className="font-display text-4xl text-[#2B1A33]">{t("termsTitle")}</h1>
        <p className="mt-4">{t("termsLead")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("termsPaidTitle")}</h2>
        <p className="mt-3">{t("termsPaid")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("termsPayTitle")}</h2>
        <p className="mt-3">{t("termsPay")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("termsDisclaimerTitle")}</h2>
        <p className="mt-3">{t("termsDisclaimer")}</p>
      </div>
    </main>
  );
}
