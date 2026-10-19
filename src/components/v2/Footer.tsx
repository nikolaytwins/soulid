import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { v2Href } from "@/lib/v2";

export async function V2Footer() {
  const t = await getTranslations();
  return (
    <footer className="mx-auto max-w-[1360px] px-[clamp(16px,3vw,40px)] py-8">
      <p className="max-w-3xl text-[11px] leading-relaxed text-[#8A8494]">{t("legal.disclaimer")}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#8A8494]">
        <span>
          © {new Date().getFullYear()} {t("brand")}
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href={v2Href("/legal/privacy")} className="text-[#8A8494]">
            {t("legal.privacy")}
          </Link>
          <Link href={v2Href("/legal/terms")} className="text-[#8A8494]">
            {t("legal.terms")}
          </Link>
          <Link href="/" className="text-[#8A8494]">
            {t("v2.classic")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
