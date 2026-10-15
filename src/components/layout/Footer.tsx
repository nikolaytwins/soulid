import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-faint md:px-14">
      <span>
        © {new Date().getFullYear()} {t("brand")}
      </span>
      <div className="flex gap-4">
        <Link href="/legal/privacy">{t("legal.privacy")}</Link>
        <Link href="/legal/terms">{t("legal.terms")}</Link>
      </div>
    </footer>
  );
}
