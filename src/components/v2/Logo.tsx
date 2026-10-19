"use client";

import { useTranslations } from "next-intl";
import { LOGO_DOTS } from "@/lib/v2";

export function V2Logo({ size = 20 }: { size?: number }) {
  const t = useTranslations();
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid grid-cols-3 gap-[3px]" aria-hidden>
        {LOGO_DOTS.map((c) => (
          <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
      </span>
      <span className="font-display font-semibold tracking-tight" style={{ fontSize: size, color: "#2B1A33" }}>
        {t("brand")}
      </span>
    </span>
  );
}
