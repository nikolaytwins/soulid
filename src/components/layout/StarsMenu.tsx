"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LtrText } from "@/components/ui/LtrText";
import { NewStarDialog } from "./NewStarDialog";
import type { NavStar } from "@/lib/domain/nav-stars";
import { isV2Path, v2Href } from "@/lib/v2";
import { isV3Path, v3Href } from "@/lib/v3";

export function StarsMenu({ stars }: { stars: NavStar[] }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const v2 = isV2Path(pathname);
  const v3 = isV3Path(pathname);
  function starHref(id: string) {
    if (v3) return v3Href(`/star/${id}`);
    if (v2) return v2Href(`/star/${id}`);
    return `/star/${id}`;
  }
  function accountHref() {
    if (v2) return v2Href("/account");
    return "/account";
  }
  const [open, setOpen] = useState(false);
  const [create, setCreate] = useState(false);
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
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[rgba(80,60,45,0.2)] bg-card px-2.5 text-xs font-semibold text-muted md:h-11 md:gap-1.5 md:px-4 md:text-sm"
      >
        {t("myStars")}
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className={open ? "rotate-180" : undefined}>
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-[260px] rounded-[18px] border border-line bg-card p-2 shadow-[0_20px_50px_rgba(42,33,29,.15)]"
        >
          {stars.length ? (
            <div className="mb-1.5 max-h-[240px] overflow-y-auto">
              {stars.map((s) => {
                const href = starHref(s.id);
                const on =
                  pathname === href ||
                  pathname === `/star/${s.id}` ||
                  pathname === `/v2/star/${s.id}` ||
                  pathname === `/v3/star/${s.id}`;
                return (
                  <Link
                    key={s.id}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-sm no-underline ${
                      on ? "bg-ink font-semibold text-card" : "text-ink hover:bg-sand"
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    {s.label !== s.date ? (
                      <LtrText className={`shrink-0 text-[11px] ${on ? "text-card/70" : "text-faint"}`}>{s.date}</LtrText>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2.5 text-sm text-faint">{t("noStars")}</p>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setCreate(true);
            }}
            className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-gold-deep hover:bg-sand"
          >
            + {t("newStar")}
          </button>
          <Link
            href={accountHref()}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-sm text-muted no-underline hover:bg-sand"
          >
            {t("allStars")}
          </Link>
        </div>
      ) : null}
      <NewStarDialog open={create} onClose={() => setCreate(false)} />
    </div>
  );
}
