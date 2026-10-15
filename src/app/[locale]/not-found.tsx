import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-start justify-center gap-4 px-5 py-16">
      <p className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">404</p>
      <h1 className="font-serif text-4xl font-medium">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
      <Link href="/" className="rounded-[14px] bg-ink px-5 py-3 text-sm font-semibold text-card no-underline">
        {t("home")}
      </Link>
    </main>
  );
}
