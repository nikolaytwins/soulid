import { getTranslations } from "next-intl/server";

export default async function V2PrivacyPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-[clamp(16px,3vw,40px)] py-12 leading-relaxed text-[#5B5566]">
      <div className="rounded-[36px] bg-white p-8 md:p-12">
        <h1 className="font-display text-4xl text-[#2B1A33]">{t("privacyTitle")}</h1>
        <p className="mt-4">{t("privacyUpdated")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyWhoTitle")}</h2>
        <p className="mt-3">{t("privacyWho")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyWhatTitle")}</h2>
        <p className="mt-3">{t("privacyWhat")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyWhyTitle")}</h2>
        <p className="mt-3">{t("privacyWhy")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyKeepTitle")}</h2>
        <p className="mt-3">{t("privacyKeep")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyRightsTitle")}</h2>
        <p className="mt-3">{t("privacyRights")}</p>
        <h2 className="mt-8 font-display text-2xl text-[#2B1A33]">{t("privacyCookiesTitle")}</h2>
        <p className="mt-3">{t("privacyCookies")}</p>
      </div>
    </main>
  );
}
