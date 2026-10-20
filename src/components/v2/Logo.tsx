"use client";

import { useTranslations } from "next-intl";
import { LOGO_DOTS } from "@/lib/v2";

export function V2Logo({ size = 20 }: { size?: number }) {
  const t = useTranslations();
  return (
    <span className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <span className="hidden shrink-0 grid-cols-3 gap-[3px] sm:grid" aria-hidden>
        {LOGO_DOTS.map((c) => (
          <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
      </span>
      <span
        className="whitespace-nowrap font-display text-[17px] font-semibold tracking-tight sm:text-[20px]"
        style={{ color: "#2B1A33", ...(size !== 20 ? { fontSize: size } : null) }}
      >
        {t("brand")}
      </span>
    </span>
  );
}
