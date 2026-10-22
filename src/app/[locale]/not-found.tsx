import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { V3_FONT_DISPLAY, V3_INK, V3_MUTED, V3_RED } from "@/lib/v3";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-start justify-center gap-4 px-[clamp(20px,3vw,48px)] py-16">
      <p className="text-[11px] tracking-[0.22em]" style={{ color: V3_RED }}>
        404
      </p>
      <h1 className="text-4xl uppercase tracking-[0.03em]" style={{ fontFamily: V3_FONT_DISPLAY, color: V3_INK }}>
        {t("title")}
      </h1>
      <p style={{ color: V3_MUTED }}>{t("body")}</p>
      <Link
        href="/"
        className="px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white no-underline"
        style={{ background: V3_RED }}
      >
        {t("home")}
      </Link>
    </main>
  );
}
