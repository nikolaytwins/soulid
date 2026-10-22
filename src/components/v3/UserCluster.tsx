"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOutAction } from "@/app/[locale]/auth-actions";
import { StarsMenu } from "@/components/layout/StarsMenu";
import type { NavStar } from "@/lib/domain/nav-stars";
import { V3_FAINT, V3_FONT_DISPLAY, V3_GOLD, V3_INK, V3_RED } from "@/lib/v3";

const LOCALES = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" }
] as const;

export function V3UserCluster({
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
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <nav
        className="flex items-center gap-0.5 p-1 text-[11px] font-semibold"
        style={{ background: "rgba(255,255,255,.55)" }}
      >
        {LOCALES.map((l) => (
          <Link
            key={l.id}
            href={pathname}
            locale={l.id}
            className="px-2 py-1 no-underline"
            style={{
              background: locale === l.id ? V3_INK : "transparent",
              color: locale === l.id ? "#FFFFFF" : V3_FAINT
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {user ? (
        <>
          <StarsMenu stars={stars} />
          <V3Avatar locale={locale} email={user.email} initials={initials} isAdmin={user.role === "admin"} />
        </>
      ) : (
        <a
          href={`/${locale}/login?next=${encodeURIComponent(`/${locale}${pathname || ""}`)}`}
          className="flex h-11 items-center px-4 text-sm font-semibold text-white no-underline"
          style={{ background: V3_RED }}
        >
          {t("nav.login")}
        </a>
      )}
    </div>
  );
}

function V3Avatar({
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearClose();
    setOpen(true);
  }

  function scheduleClose() {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    return () => clearClose();
  }, []);

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        href="/account"
        title={email ?? t("account")}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center no-underline"
        style={{
          border: `1px solid ${V3_GOLD}`,
          background: "rgba(255,255,255,.55)",
          color: V3_INK,
          fontFamily: V3_FONT_DISPLAY,
          fontSize: 16
        }}
      >
        {initials}
      </Link>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-1 w-[200px] bg-white p-2 shadow-[0_20px_50px_rgba(26,26,26,.12)]"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-3 py-2.5 text-sm font-semibold no-underline hover:bg-[#F6F3F3]"
              style={{ color: V3_GOLD }}
            >
              {t("admin")}
            </Link>
          ) : null}
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-3 py-2.5 text-sm no-underline hover:bg-[#F6F3F3]"
            style={{ color: V3_INK }}
          >
            {t("account")}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-[#F6F3F3]"
              style={{ color: V3_FAINT }}
            >
              {t("logout")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
