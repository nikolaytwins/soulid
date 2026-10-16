"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOutAction } from "@/app/[locale]/auth-actions";
import { StarsMenu } from "./StarsMenu";
import type { NavStar } from "@/lib/domain/nav-stars";

const LOCALES = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" }
] as const;

export function Header({
  locale,
  user,
  stars = []
}: {
  locale: string;
  user: { name?: string | null; email?: string | null; role?: string } | null;
  stars?: NavStar[];
}) {
  const t = useTranslations();
  const pathname = usePathname();
  if (pathname === "/account") return null;
  const initials = (user?.name || user?.email || "·")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative mx-auto flex w-full max-w-page items-center justify-between px-5 py-4 md:px-14 md:py-7">
      <Link href="/" className="font-serif text-2xl font-medium text-ink no-underline md:text-[30px]">
        {t("brand")}
      </Link>
      <div className="flex items-center gap-3 md:gap-4">
        <nav className="flex items-center gap-1 rounded-full border border-[rgba(80,60,45,0.12)] bg-card p-1 text-xs font-semibold">
          {LOCALES.map((l) => (
            <Link
              key={l.id}
              href={pathname}
              locale={l.id}
              className={`rounded-full px-2.5 py-1 no-underline ${
                locale === l.id ? "bg-ink text-card" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            {user.role === "admin" ? (
              <Link href="/admin" className="hidden text-sm text-muted no-underline md:inline">
                {t("nav.admin")}
              </Link>
            ) : null}
            <StarsMenu stars={stars} />
            <Link href="/account" className="no-underline" title={user.email ?? ""}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(80,60,45,0.2)] text-xs font-semibold text-muted md:h-11 md:w-11 md:text-sm">
                {initials}
              </span>
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="text-sm text-muted">
                {t("nav.logout")}
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-9 items-center justify-center rounded-full border border-[rgba(80,60,45,0.2)] px-3 text-xs font-semibold text-muted no-underline md:h-11 md:px-4 md:text-sm"
          >
            {t("nav.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
