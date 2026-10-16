import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mx-auto max-w-page px-5 py-8 md:px-14">
      <p className="max-w-3xl text-[11px] leading-relaxed text-faint">{t("legal.disclaimer")}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-faint">
        <span>
          © {new Date().getFullYear()} {t("brand")}
        </span>
        <div className="flex gap-4">
          <Link href="/legal/privacy">{t("legal.privacy")}</Link>
          <Link href="/legal/terms">{t("legal.terms")}</Link>
        </div>
      </div>
    </footer>
  );
}
