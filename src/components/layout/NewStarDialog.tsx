"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { DobForm } from "@/components/landing/DobForm";
import { V3_FONT_DISPLAY, V3_INK, V3_MUTED } from "@/lib/v3";

export function NewStarDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("account");
  useEffect(() => {
    if (!open) return;
    const onK = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onK);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onK);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(60,45,35,.28)] p-0 min-[640px]:items-center min-[640px]:p-6"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[430px] flex-col gap-4 bg-[#F8F5F4] p-6 shadow-[0_30px_80px_rgba(60,40,20,.25)] min-[640px]:p-8"
        style={{ borderTop: "1px solid #E12020" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] uppercase leading-none tracking-[0.03em]" style={{ fontFamily: V3_FONT_DISPLAY, color: V3_INK }}>
              {t("modalCreate")}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: V3_MUTED }}>
              {t("createHint")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: V3_MUTED }}>
            {t("close")}
          </button>
        </div>
        <DobForm compact />
      </div>
    </div>,
    document.body
  );
}
