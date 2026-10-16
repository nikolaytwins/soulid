"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function AdminModeSwitch({ mode }: { mode: "admin" | "cabinet" }) {
  const t = useTranslations("admin");
  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold no-underline ${
      active ? "bg-ink text-card" : "text-muted"
    }`;
  return (
    <div className="flex shrink-0 items-center rounded-full border border-[rgba(80,60,45,0.16)] bg-card p-1">
      <Link href="/admin" className={pill(mode === "admin")}>
        {t("modeAdmin")}
      </Link>
      <Link href="/account" className={pill(mode === "cabinet")}>
        {t("modeCabinet")}
      </Link>
    </div>
  );
}
