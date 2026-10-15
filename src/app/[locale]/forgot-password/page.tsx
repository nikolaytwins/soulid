"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-12">
      <h1 className="font-serif text-4xl font-medium">{t("resetTitle")}</h1>
      <p className="text-muted">{t("resetHint")}</p>
      {sent ? (
        <p>{t("resetSent")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-xl border border-line bg-card px-4 py-3"
            type="email"
            required
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="rounded-[14px] bg-ink py-4 font-semibold text-card">{t("resetSubmit")}</button>
        </form>
      )}
    </main>
  );
}
