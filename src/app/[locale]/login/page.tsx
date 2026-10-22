"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getSession, signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";
import { V3AuthCard } from "@/components/v3/AuthCard";
import { V3_BTN_RED, V3_FONT_DISPLAY, V3_MUTED, V3_RED } from "@/lib/v3";

function LoginForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(params.get("next"), `/${locale}`);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: next });
    setPending(false);
    if (res?.error) {
      const code = (res as { code?: string }).code ?? res.error;
      setError(code === "blocked" ? t("blocked") : t("invalid"));
      return;
    }
    const session = await getSession();
    const toAdmin = session?.user?.role === "admin" && !params.get("next");
    window.location.href = toAdmin ? `/${locale}/admin` : next;
  }

  const field =
    "w-full border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.55)] px-4 py-3 text-sm text-[#1A1A1A]";

  return (
    <V3AuthCard>
      <h1 className="text-4xl uppercase tracking-[0.03em]" style={{ fontFamily: V3_FONT_DISPLAY }}>
        {t("loginTitle")}
      </h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          className={`${V3_BTN_RED} min-h-12 py-4 text-[15px] font-semibold uppercase tracking-[0.1em]`}
        >
          {t("submitLogin")}
        </button>
      </form>
      <p className="text-sm" style={{ color: V3_MUTED }}>
        {t("noAccount")}{" "}
        <a href={`/${locale}/register?next=${encodeURIComponent(next)}`} className="font-semibold no-underline" style={{ color: V3_RED }}>
          {t("submitRegister")}
        </a>
      </p>
      <Link href="/forgot-password" className="text-sm no-underline" style={{ color: V3_MUTED }}>
        {t("forgot")}
      </Link>
      <Link href={"/"} className="text-sm no-underline" style={{ color: V3_MUTED }}>
        ← {locale === "en" ? "Back" : locale === "ar" ? "رجوع" : "Назад"}
      </Link>
    </V3AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
