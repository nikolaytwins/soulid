"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { V3AuthCard } from "@/components/v3/AuthCard";

export default function ForgotPage() {
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
    <V3AuthCard>
      <h1 className="font-[Forum,serif] text-4xl font-medium">{t("resetTitle")}</h1>
      <p className="text-[#6E6878]">{t("resetHint")}</p>
      {sent ? (
        <p>{t("resetSent")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.55)] px-4 py-3"
            type="email"
            required
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="min-h-12 bg-[#E12020] py-4 font-bold text-white">{t("resetSubmit")}</button>
        </form>
      )}
    </V3AuthCard>
  );
}
