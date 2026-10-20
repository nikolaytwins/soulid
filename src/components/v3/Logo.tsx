"use client";

import { useTranslations } from "next-intl";
import { V3_FONT_DISPLAY, V3_GOLD, V3_INK, V3_RED } from "@/lib/v3";

export function V3Logo({ size = 24 }: { size?: number }) {
  const t = useTranslations();
  return (
    <span className="flex min-w-0 items-center gap-3">
      <svg
        width={size + 6}
        height={size + 6}
        viewBox="-110 -110 220 210"
        aria-hidden
        className="shrink-0"
      >
        <polygon
          points="0,-100 22.4,-30.9 95.1,-30.9 36.3,11.8 58.8,80.9 0,38.2 -58.8,80.9 -36.3,11.8 -95.1,-30.9 -22.4,-30.9"
          fill="none"
        />
        <polyline
          points="0,-100 58.8,80.9 -95.1,-30.9 95.1,-30.9 -58.8,80.9 0,-100"
          fill="none"
          stroke={V3_GOLD}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <circle cx={0} cy={-100} r={11} fill={V3_RED} />
      </svg>
      <span
        className="whitespace-nowrap text-[20px] uppercase tracking-[0.14em] sm:text-[24px]"
        style={{ color: V3_INK, fontFamily: V3_FONT_DISPLAY }}
      >
        {t("brand")}
      </span>
    </span>
  );
}
