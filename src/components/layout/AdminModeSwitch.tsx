"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { au } from "@/lib/admin-ui";

export function AdminModeSwitch({ mode }: { mode: "admin" | "cabinet" }) {
  const t = useTranslations("admin");
  return (
    <div className={au.switchTrack}>
      <Link href="/admin" className={mode === "admin" ? au.pillOn : `${au.pillOff} border-0 bg-transparent`}>
        {t("modeAdmin")}
      </Link>
      <Link href="/account" className={mode === "cabinet" ? au.pillOn : `${au.pillOff} border-0 bg-transparent`}>
        {t("modeCabinet")}
      </Link>
    </div>
  );
}
