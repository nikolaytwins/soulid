"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getSession, signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-url";

function LoginForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const locale = String(useParams().locale ?? "ru");
  const next = safeNextPath(params.get("next"), `/${locale}/account`);
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
    const account = `/${locale}/account`;
    const toAdmin =
      session?.user?.role === "admin" && (next === account || next === `${account}/`);
    window.location.href = toAdmin ? `/${locale}/admin` : next;
  }

  const field = "w-full rounded-xl border border-line bg-card px-4 py-3 text-sm";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-12">
      <h1 className="font-serif text-4xl font-medium">{t("loginTitle")}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className={field} type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={6} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={pending} className="rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card">
          {t("submitLogin")}
        </button>
      </form>
      <p className="text-sm text-muted">
        {t("noAccount")}{" "}
        <a href={`/${locale}/register?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-deep">
          {t("submitRegister")}
        </a>
      </p>
      <Link href="/forgot-password" className="text-sm">
        {t("forgot")}
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
