"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { V2AuthCard } from "@/components/v2/AuthCard";

export default function V2ForgotPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setSent(true);
  }

  return (
    <V2AuthCard>
      <h1 className="font-display text-4xl font-medium">{t("resetTitle")}</h1>
      <p className="text-[#6E6878]">{t("resetHint")}</p>
      {sent ? (
        <p>{t("resetSent")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-2xl border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 py-3"
            type="email"
            required
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="min-h-12 rounded-full bg-[#2B1A33] py-4 font-bold text-white">{t("resetSubmit")}</button>
        </form>
      )}
    </V2AuthCard>
  );
}
