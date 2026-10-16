"use client";

import { useEffect, useRef, useState } from "react";
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
  const initials = (user?.name || user?.email || "·")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative mx-auto flex w-full max-w-page items-center justify-between gap-2 overflow-x-clip px-5 py-4 md:px-14 md:py-7">
      <Link href="/" className="shrink-0 font-serif text-2xl font-medium text-ink no-underline md:text-[30px]">
        {t("brand")}
      </Link>
      <div className="flex shrink-0 items-center justify-end gap-1.5 md:gap-4">
        <nav className="flex shrink-0 items-center gap-0.5 rounded-full border border-[rgba(80,60,45,0.12)] bg-card p-1 text-[11px] font-semibold md:gap-1 md:text-xs">
          {LOCALES.map((l) => (
            <Link
              key={l.id}
              href={pathname}
              locale={l.id}
              className={`rounded-full px-2 py-1 no-underline md:px-2.5 ${
                locale === l.id ? "bg-ink text-card" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex shrink-0 items-center justify-end gap-1.5 md:gap-2">
            {user.role === "admin" ? (
              <Link href="/admin" className="hidden shrink-0 text-sm font-semibold text-gold-deep no-underline md:inline">
                {t("nav.admin")}
              </Link>
            ) : null}
            <StarsMenu stars={stars} />
            <AvatarMenu locale={locale} email={user.email} initials={initials} isAdmin={user.role === "admin"} />
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

function AvatarMenu({
  locale,
  email,
  initials,
  isAdmin
}: {
  locale: string;
  email?: string | null;
  initials: string;
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const face = (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(80,60,45,0.2)] text-xs font-semibold text-muted md:h-11 md:w-11 md:text-sm">
      {initials}
    </span>
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        className="md:hidden"
        aria-expanded={open}
        aria-haspopup="menu"
        title={email ?? t("account")}
        onClick={() => setOpen((v) => !v)}
      >
        {face}
      </button>
      <Link href="/account" className="hidden no-underline md:flex" title={email ?? ""}>
        {face}
      </Link>
      <form action={signOutAction} className="hidden md:block">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="ps-1 text-sm text-muted">
          {t("logout")}
        </button>
      </form>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-[200px] rounded-[18px] border border-line bg-card p-2 shadow-[0_20px_50px_rgba(42,33,29,.15)] md:hidden"
        >
          {isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-sm font-semibold text-gold-deep no-underline hover:bg-sand"
            >
              {t("admin")}
            </Link>
          ) : null}
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-sm text-ink no-underline hover:bg-sand"
          >
            {t("account")}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" role="menuitem" className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-sm text-muted hover:bg-sand">
              {t("logout")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
