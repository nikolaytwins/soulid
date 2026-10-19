"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";
import { V2AuthCard } from "@/components/v2/AuthCard";

function RegisterForm() {
  const t = useTranslations("auth");
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(useSearchParams().get("next"), `/${locale}/v2/account`);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const field = "w-full rounded-2xl border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 py-3 text-sm";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, locale })
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setPending(false);
      setError(json.error === "exists" ? t("exists") : t("invalid"));
      return;
    }
    const login = await signIn("credentials", { email, password, redirect: false, callbackUrl: next });
    setPending(false);
    if (login?.error) {
      window.location.href = `/${locale}/v2/login?next=${encodeURIComponent(next)}`;
      return;
    }
    window.location.href = next;
  }

  return (
    <V2AuthCard>
      <h1 className="font-display text-4xl font-medium">{t("registerTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className={field} placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={6} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={pending} className="min-h-12 rounded-full bg-[#2B1A33] py-4 text-[15px] font-bold text-white">
          {t("submitRegister")}
        </button>
      </form>
      <p className="text-sm text-[#6E6878]">
        {t("hasAccount")}{" "}
        <a href={`/${locale}/v2/login?next=${encodeURIComponent(next)}`} className="font-semibold">
          {t("submitLogin")}
        </a>
      </p>
    </V2AuthCard>
  );
}

export default function V2RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
