"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LtrText } from "@/components/ui/LtrText";
import { NewStarDialog } from "./NewStarDialog";
import type { NavStar } from "@/lib/domain/nav-stars";
import { V3_FAINT, V3_INK, V3_GOLD } from "@/lib/v3";

export function StarsMenu({ stars }: { stars: NavStar[] }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
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
        className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap border border-[rgba(26,26,26,0.15)] bg-[rgba(255,255,255,.55)] px-2.5 text-xs font-semibold md:h-11 md:gap-1.5 md:px-4 md:text-sm"
        style={{ color: V3_INK }}
      >
        {t("myStars")}
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className={open ? "rotate-180" : undefined}>
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-[260px] bg-white p-2 shadow-[0_20px_50px_rgba(26,26,26,.12)]"
        >
          {stars.length ? (
            <div className="mb-1.5 max-h-[240px] overflow-y-auto">
              {stars.map((s) => {
                const href = `/star/${s.id}`;
                const on = pathname === href || pathname.endsWith(`/star/${s.id}`);
                return (
                  <Link
                    key={s.id}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm no-underline"
                    style={{
                      background: on ? V3_INK : "transparent",
                      color: on ? "#FFFFFF" : V3_INK,
                      fontWeight: on ? 600 : 400
                    }}
                  >
                    <span className="truncate">{s.label}</span>
                    {s.label !== s.date ? (
                      <LtrText className={`shrink-0 text-[11px] ${on ? "text-white/70" : "text-[#6B6461]"}`}>
                        {s.date}
                      </LtrText>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2.5 text-sm" style={{ color: V3_FAINT }}>
              {t("noStars")}
            </p>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setCreate(true);
            }}
            className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold"
            style={{ color: V3_GOLD }}
          >
            + {t("newStar")}
          </button>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-3 py-2.5 text-sm no-underline"
            style={{ color: V3_FAINT }}
          >
            {t("allStars")}
          </Link>
        </div>
      ) : null}
      <NewStarDialog open={create} onClose={() => setCreate(false)} />
    </div>
  );
}
