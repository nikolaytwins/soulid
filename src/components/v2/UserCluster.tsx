"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOutAction } from "@/app/[locale]/auth-actions";
import { StarsMenu } from "@/components/layout/StarsMenu";
import type { NavStar } from "@/lib/domain/nav-stars";
import { v2Href } from "@/lib/v2";

const LOCALES = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" }
] as const;

export function V2UserCluster({
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
      <nav className="flex items-center gap-0.5 rounded-full bg-white p-1 text-[11px] font-semibold">
        {LOCALES.map((l) => (
          <Link
            key={l.id}
            href={pathname}
            locale={l.id}
            className={`rounded-full px-2 py-1 no-underline ${
              locale === l.id ? "bg-[#2B1A33] text-white" : "text-[#8A8494]"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {user ? (
        <>
          <StarsMenu stars={stars} />
          <V2Avatar locale={locale} email={user.email} initials={initials} isAdmin={user.role === "admin"} />
        </>
      ) : (
        <Link
          href={v2Href("/login")}
          className="flex h-11 items-center rounded-full bg-[#2B1A33] px-4 text-sm font-semibold text-white no-underline"
        >
          {t("nav.login")}
        </Link>
      )}
    </div>
  );
}

function V2Avatar({
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

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        title={email ?? t("account")}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2B1A33] text-[13px] font-bold text-white"
      >
        {initials}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-[200px] rounded-[18px] bg-white p-2 shadow-[0_20px_50px_rgba(43,26,51,.15)]"
        >
          {isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-sm font-semibold text-[#B07A33] no-underline hover:bg-[#F8F1E9]"
            >
              {t("admin")}
            </Link>
          ) : null}
          <Link
            href={v2Href("/account")}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-sm text-[#2B1A33] no-underline hover:bg-[#F8F1E9]"
          >
            {t("account")}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-sm text-[#8A8494] hover:bg-[#F8F1E9]"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
