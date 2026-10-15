"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

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
      <main className="mx-auto max-w-md px-5 py-12">
        <p>{t("passwordChanged")}</p>
        <Link href="/login">{t("submitLogin")}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-5 py-12">
      <h1 className="font-serif text-4xl font-medium">{t("resetTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="rounded-xl border border-line px-4 py-3"
          type="password"
          minLength={6}
          required
          placeholder={t("newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="rounded-[14px] bg-ink py-4 font-semibold text-card">{t("savePassword")}</button>
      </form>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
