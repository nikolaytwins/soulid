"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getSession, signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";
import { V2AuthCard } from "@/components/v2/AuthCard";
import { v2Href } from "@/lib/v2";

function LoginForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(params.get("next"), `/${locale}/v2/account`);
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
    const account = `/${locale}/v2/account`;
    const toAdmin = session?.user?.role === "admin" && (next === account || next === `${account}/`);
    window.location.href = toAdmin ? `/${locale}/admin` : next;
  }

  const field = "w-full rounded-2xl border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 py-3 text-sm";

  return (
    <V2AuthCard>
      <h1 className="font-display text-4xl font-medium">{t("loginTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className={field} type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={6} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={pending} className="min-h-12 rounded-full bg-[#2B1A33] py-4 text-[15px] font-bold text-white">
          {t("submitLogin")}
        </button>
      </form>
      <p className="text-sm text-[#6E6878]">
        {t("noAccount")}{" "}
        <a href={`/${locale}/v2/register?next=${encodeURIComponent(next)}`} className="font-semibold">
          {t("submitRegister")}
        </a>
      </p>
      <Link href={v2Href("/forgot-password")} className="text-sm">
        {t("forgot")}
      </Link>
    </V2AuthCard>
  );
}

export default function V2LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
