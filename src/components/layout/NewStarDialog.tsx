"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { DobForm } from "@/components/landing/DobForm";

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(42,33,29,.38)] p-0 min-[640px]:items-center min-[640px]:p-6" onClick={onClose}>
      <div
        className="flex w-full max-w-[430px] flex-col gap-4 rounded-t-3xl bg-card p-6 shadow-[0_30px_80px_rgba(42,33,29,.25)] min-[640px]:rounded-3xl min-[640px]:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-[28px] font-medium leading-none">{t("modalCreate")}</h2>
            <p className="text-sm leading-relaxed text-muted">{t("createHint")}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            {t("close")}
          </button>
        </div>
        <DobForm compact />
      </div>
    </div>,
    document.body
  );
}
