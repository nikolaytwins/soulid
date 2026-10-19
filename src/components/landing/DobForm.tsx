"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { isV2Path, v2Href } from "@/lib/v2";

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function DobForm({
  defaultDate,
  compact
}: {
  defaultDate?: { day: number; month: number; year: number };
  compact?: boolean;
}) {
  const t = useTranslations("landing");
  const months = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const now = new Date();
  const [day, setDay] = useState(defaultDate?.day ?? 5);
  const [month, setMonth] = useState(defaultDate?.month ?? 3);
  const [year, setYear] = useState(defaultDate?.year ?? 1992);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const maxDay = useMemo(() => daysInMonth(year, month), [year, month]);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [day, maxDay]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, month, year })
    });
    const raw = await res.text();
    let json: { id?: string; error?: string } = {};
    try {
      json = raw ? (JSON.parse(raw) as { id?: string; error?: string }) : {};
    } catch {
      json = {};
    }
    setPending(false);
    if (!res.ok || !json.id) {
      setError(json.error || t("invalid"));
      return;
    }
    const href = isV2Path(pathname) ? v2Href(`/star/${json.id}`) : `/star/${json.id}`;
    router.push(href);
  }

  const v2 = isV2Path(pathname);
  const selectCls = v2
    ? "rounded-2xl border border-[rgba(43,26,51,0.10)] bg-[#F8F1E9] px-3 py-3 text-sm font-semibold text-[#2B1A33] min-h-12"
    : "rounded-xl border border-[rgba(80,60,45,0.12)] bg-card px-3 py-3 text-sm font-semibold text-ink min-h-12";

  return (
    <form onSubmit={onSubmit} className={compact ? "flex flex-col gap-3" : "flex w-full max-w-md flex-col gap-4"}>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-faint">
          {t("day")}
          <select className={selectCls} value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-faint">
          {t("month")}
          <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {months(`months.${m - 1}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-faint">
          {t("year")}
          <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 120 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={
          v2
            ? "min-h-12 rounded-full bg-[#2B1A33] px-4 py-4 text-[15px] font-bold text-white disabled:opacity-60"
            : "min-h-12 rounded-[14px] bg-ink px-4 py-4 text-[15px] font-semibold text-card disabled:opacity-60"
        }
      >
        {pending ? "…" : t("cta")}
      </button>
    </form>
  );
}
