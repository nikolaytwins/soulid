"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";

function RegisterForm() {
  const t = useTranslations("auth");
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(useSearchParams().get("next"), `/${locale}/account`);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const field = "w-full rounded-xl border border-line bg-card px-4 py-3 text-sm";

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
      window.location.href = `/${locale}/login?next=${encodeURIComponent(next)}`;
      return;
    }
    window.location.href = next;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-12">
      <h1 className="font-serif text-4xl font-medium">{t("registerTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className={field} placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={6} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={pending} className="rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card">
          {t("submitRegister")}
        </button>
      </form>
      <p className="text-sm text-muted">
        {t("hasAccount")}{" "}
        <a href={`/${locale}/login?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-deep">
          {t("submitLogin")}
        </a>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
