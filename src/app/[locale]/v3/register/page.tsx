"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";
import { V3AuthCard } from "@/components/v3/AuthCard";
import { V3_FONT_DISPLAY, V3_MUTED, V3_RED, v3Href } from "@/lib/v3";

function RegisterForm() {
  const t = useTranslations("auth");
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(useSearchParams().get("next"), `/${locale}/v3`);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const field =
    "w-full border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.55)] px-4 py-3 text-sm text-[#1A1A1A]";

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
      window.location.href = `/${locale}/v3/login?next=${encodeURIComponent(next)}`;
      return;
    }
    window.location.href = next;
  }

  return (
    <V3AuthCard>
      <h1 className="text-4xl uppercase tracking-[0.03em]" style={{ fontFamily: V3_FONT_DISPLAY }}>
        {t("registerTitle")}
      </h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className={field} placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className={field}
          type="password"
          required
          minLength={6}
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          disabled={pending}
          className="min-h-12 py-4 text-[15px] font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-60"
          style={{ background: V3_RED }}
        >
          {t("submitRegister")}
        </button>
      </form>
      <p className="text-sm" style={{ color: V3_MUTED }}>
        {t("hasAccount")}{" "}
        <a href={`/${locale}/v3/login?next=${encodeURIComponent(next)}`} className="font-semibold no-underline" style={{ color: V3_RED }}>
          {t("submitLogin")}
        </a>
      </p>
      <Link href={v3Href("/")} className="text-sm no-underline" style={{ color: V3_MUTED }}>
        ← {locale === "en" ? "Back" : locale === "ar" ? "رجوع" : "Назад"}
      </Link>
    </V3AuthCard>
  );
}

export default function V3RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
