import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("legalPage");
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed text-muted">
      <h1 className="font-serif text-4xl text-ink">{t("privacyTitle")}</h1>
      <p className="mt-4">{t("privacyUpdated")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyWhoTitle")}</h2>
      <p className="mt-3">{t("privacyWho")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyWhatTitle")}</h2>
      <p className="mt-3">{t("privacyWhat")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyWhyTitle")}</h2>
      <p className="mt-3">{t("privacyWhy")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyKeepTitle")}</h2>
      <p className="mt-3">{t("privacyKeep")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyRightsTitle")}</h2>
      <p className="mt-3">{t("privacyRights")}</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">{t("privacyCookiesTitle")}</h2>
      <p className="mt-3">{t("privacyCookies")}</p>
    </main>
  );
}
