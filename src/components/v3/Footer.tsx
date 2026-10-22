import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { V3_FAINT } from "@/lib/v3";

export async function V3Footer() {
  const t = await getTranslations();
  return (
    <footer className="mx-auto max-w-[1320px] px-[clamp(20px,3vw,48px)] py-10">
      <p className="max-w-3xl text-[11px] leading-relaxed" style={{ color: V3_FAINT }}>
        {t("legal.disclaimer")}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: V3_FAINT }}>
        <span>
          © {new Date().getFullYear()} {t("brand")}
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/legal/privacy" className="no-underline" style={{ color: V3_FAINT }}>
            {t("legal.privacy")}
          </Link>
          <Link href="/legal/terms" className="no-underline" style={{ color: V3_FAINT }}>
            {t("legal.terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
