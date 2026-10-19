"use client";

import { useTranslations } from "next-intl";
import { cardLabel } from "@/lib/payments/card-label";

export function PayHint({
  saved,
  onNewCard,
  className,
  buttonClassName
}: {
  saved: { brand: string; last4: string } | null;
  onNewCard?: () => void;
  className?: string;
  buttonClassName?: string;
}) {
  const t = useTranslations("offer");
  if (saved) {
    return (
      <p className={className}>
        {t("payWithSaved", { card: cardLabel(saved.brand, saved.last4) })}
        {onNewCard ? (
          <>
            {" · "}
            <button type="button" onClick={onNewCard} className={buttonClassName}>
              {t("newCard")}
            </button>
          </>
        ) : null}
      </p>
    );
  }
  return <p className={className}>{t("willSave")}</p>;
}
