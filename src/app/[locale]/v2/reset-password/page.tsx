"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { V2AuthCard } from "@/components/v2/AuthCard";
import { v2Href } from "@/lib/v2";

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
      <V2AuthCard>
        <p>{t("passwordChanged")}</p>
        <Link href={v2Href("/login")}>{t("submitLogin")}</Link>
      </V2AuthCard>
    );
  }

  return (
    <V2AuthCard>
      <h1 className="font-display text-4xl font-medium">{t("resetTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="rounded-2xl border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 py-3"
          type="password"
          minLength={6}
          required
          placeholder={t("newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="min-h-12 rounded-full bg-[#2B1A33] py-4 font-bold text-white">{t("savePassword")}</button>
      </form>
    </V2AuthCard>
  );
}

export default function V2ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
