"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { V3AuthCard } from "@/components/v3/AuthCard";
import { V3_BTN_RED } from "@/lib/v3";

function ResetForm() {
  const t = useTranslations("auth");
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    if (!res.ok) setError(t("invalid"));
    else setDone(true);
  }

  if (done) {
    return (
      <V3AuthCard>
        <p>{t("passwordChanged")}</p>
        <Link href="/login">{t("submitLogin")}</Link>
      </V3AuthCard>
    );
  }

  return (
    <V3AuthCard>
      <h1 className="font-[Forum,serif] text-4xl font-medium">{t("resetTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.55)] px-4 py-3"
          type="password"
          minLength={6}
          required
          placeholder={t("newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className={`${V3_BTN_RED} min-h-12 py-4 font-bold`}>{t("savePassword")}</button>
      </form>
    </V3AuthCard>
  );
}

export default function V2ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
