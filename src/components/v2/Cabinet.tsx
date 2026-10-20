"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  createStarAction,
  deleteAccountAction,
  deleteStarAction,
  saveProfileNameAction,
  updateStarAction
} from "@/app/[locale]/account/actions";
import type { CabinetStarLabels } from "@/components/account/CabinetStar";
import { LtrText } from "@/components/ui/LtrText";
import { STAR_RELATIONS, type StarRelation } from "@/lib/domain/relations";
import { ZONE_TO_SPHERE, type SphereId, type StarResult } from "@/lib/engine";
import { PayHint } from "@/components/pay/PayHint";
import { cardLabel } from "@/lib/payments/card-label";
import { SPHERE_TINT, V2_GOLD, V2_INK, V2_NEU, v2Href } from "@/lib/v2";
import { V2StarSvg } from "./StarSvg";
import { V2LockIcon, V2MiniStar } from "./TriangleSvg";

export type CabinetStarData = {
  id: string;
  name: string;
  relation: StarRelation;
  date: string;
  unlockedCount: number;
  unlocked: SphereId[];
  star: StarResult | null;
  values: Record<SphereId, number>;
  nextSku: string | null;
  nextName: string;
  nextPrice: string;
  canDelete: boolean;
};

export type CabinetPurchase = {
  id: string;
  name: string;
  date: string;
  amount: string;
  status: string;
};

const inputClass =
  "min-h-12 w-full rounded-[14px] border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 text-base text-[#2B1A33] outline-none";

function fmtDate(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join(".");
}

function relEyebrow(rel: StarRelation, t: ReturnType<typeof useTranslations>) {
  const label = t(`rel_${rel}`).toUpperCase();
  return rel === "self" ? t("myStarEyebrow") : t("relStarEyebrow", { rel: label });
}

export function V2Cabinet({
  locale,
  user,
  stars,
  order,
  sphereNames,
  starLabels,
  purchases,
  savedCards = [],
  initialStarId,
  paidToast
}: {
  locale: string;
  user: { name: string; email: string; initials: string; role: string };
  stars: CabinetStarData[];
  order: SphereId[];
  sphereNames: Record<SphereId, string>;
  starLabels: CabinetStarLabels;
  purchases: CabinetPurchase[];
  savedCards?: { id: string; brand: string; last4: string }[];
  initialStarId: string | null;
  paidToast: string | null;
}) {
  const t = useTranslations("account");
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialStarId ?? stars[0]?.id ?? null);
  const [sheet, setSheet] = useState<null | "create" | "edit" | "profile" | "purchases" | "support">(null);
  const [form, setForm] = useState({ name: "", date: "", rel: "partner" as StarRelation });
  const [profileName, setProfileName] = useState(user.name);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<string | null>(paidToast);
  const [pending, start] = useTransition();
  const [cards, setCards] = useState(savedCards);
  const tt = useRef<number | null>(null);

  const cur = stars.find((s) => s.id === selectedId) ?? stars[0] ?? null;
  const missionLabel: [string, string] = [starLabels.missionTop, starLabels.missionBottom];

  useEffect(() => {
    setCards(savedCards);
  }, [savedCards]);

  useEffect(() => {
    if (!toast) return;
    if (tt.current) window.clearTimeout(tt.current);
    tt.current = window.setTimeout(() => setToast(null), 2600);
    return () => {
      if (tt.current) window.clearTimeout(tt.current);
    };
  }, [toast]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const name = user.name.split(/\s+/)[0] || user.name;
    if (h < 5 || h >= 18) return t("greetEvening", { name });
    if (h < 12) return t("greetMorning", { name });
    return t("greetDay", { name });
  }, [t, user.name]);

  const todayLabel = useMemo(() => {
    const now = new Date();
    const months = [
      t("month_0"),
      t("month_1"),
      t("month_2"),
      t("month_3"),
      t("month_4"),
      t("month_5"),
      t("month_6"),
      t("month_7"),
      t("month_8"),
      t("month_9"),
      t("month_10"),
      t("month_11")
    ];
    return `${now.getDate()} ${months[now.getMonth()]}`.toUpperCase();
  }, [t]);

  function flash(msg: string) {
    setToast(msg);
  }

  function openCreate() {
    setErr("");
    setForm({ name: "", date: "", rel: "partner" });
    setSheet("create");
  }

  function openEdit() {
    if (!cur) return;
    setErr("");
    setForm({ name: cur.name, date: cur.date, rel: cur.relation });
    setSheet("edit");
  }

  function close() {
    setSheet(null);
    setErr("");
  }

  function saveStar() {
    const data = new FormData();
    data.set("name", form.name);
    data.set("date", form.date);
    data.set("relation", form.rel);
    if (sheet === "edit" && cur) data.set("id", cur.id);
    start(async () => {
      const res = sheet === "create" ? await createStarAction(data) : await updateStarAction(data);
      if (!res.ok) {
        setErr(res.error === "name" ? t("errName") : res.error === "date" ? t("errDate") : t("errGeneric"));
        return;
      }
      close();
      if (sheet === "create" && "id" in res && res.id) {
        setSelectedId(res.id);
        flash(t("toastCreated"));
      } else if ("dateChanged" in res && res.dateChanged) flash(t("toastRecalc"));
      else flash(t("toastSaved"));
      router.refresh();
    });
  }

  function removeStar() {
    if (!cur) return;
    const data = new FormData();
    data.set("id", cur.id);
    start(async () => {
      const res = await deleteStarAction(data);
      if (!res.ok) {
        setErr(t("errGeneric"));
        return;
      }
      close();
      flash(t("toastDeleted", { name: cur.name }));
      setSelectedId(stars.find((s) => s.id !== cur.id)?.id ?? null);
      router.refresh();
    });
  }

  function wipeAccount() {
    const data = new FormData();
    data.set("confirm", deleteConfirm);
    start(async () => {
      const res = await deleteAccountAction(data);
      if (!res.ok) {
        setErr(res.error === "confirm" ? t("deleteConfirmErr") : t("errGeneric"));
        return;
      }
      window.location.href = `/${locale}/v2`;
    });
  }

  function saveProfile() {
    const data = new FormData();
    data.set("name", profileName);
    start(async () => {
      const res = await saveProfileNameAction(data);
      if (!res.ok) {
        setErr(t("errName"));
        return;
      }
      close();
      flash(t("toastProfile"));
      router.refresh();
    });
  }

  async function buy(useSavedMethod = true) {
    if (!cur?.nextSku) return;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: cur.id, sku: cur.nextSku, returnTo: "account", skin: "v2", useSavedMethod })
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (json.url) window.location.href = json.url;
    else flash(json.error === "blocked" ? t("blocked") : t("checkoutError"));
  }

  const n = cur?.unlockedCount ?? 0;
  const nextSphere = n < 5 ? (order[n] ?? null) : null;
  const rows = order.map((id, k) => {
    const st: "o" | "x" | "l" = k < n ? "o" : k === n ? "x" : "l";
    return { id, name: sphereNames[id], st };
  });

  return (
    <div className="relative mx-auto flex max-w-[1360px] flex-col gap-4 overflow-x-clip px-[clamp(16px,3vw,40px)] pb-24 pt-1">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-2">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span suppressHydrationWarning className="text-xs font-bold tracking-[0.16em] text-[#8A8494]">
            {todayLabel}
          </span>
          <h1 suppressHydrationWarning className="text-balance font-display text-[clamp(32px,4vw,52px)] font-medium leading-[1.08]">
            {greeting}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#5B5566]"
            onClick={() => {
              setProfileName(user.name);
              setErr("");
              setSheet("profile");
            }}
          >
            {t("menuProfile")}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#5B5566]"
            onClick={() => setSheet("purchases")}
          >
            {t("menuPurchases")}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#5B5566]"
            onClick={() => setSheet("support")}
          >
            {t("menuSupport")}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-11 items-center rounded-full bg-[#2B1A33] px-5 py-2.5 text-sm font-bold text-white"
          >
            + {t("newStar")}
          </button>
        </div>
      </div>

      {cur ? (
        <div className="flex flex-row-reverse flex-wrap items-stretch gap-4">
          <div className="relative flex min-w-0 flex-[1.3_1_520px] flex-col gap-3 overflow-hidden rounded-[36px] bg-white p-[clamp(20px,3vw,36px)]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(rgba(43,26,51,.11) 1.2px, transparent 1.7px)",
                backgroundSize: "20px 20px",
                WebkitMaskImage: "radial-gradient(circle at 50% 55%, #000 20%, transparent 75%)",
                maskImage: "radial-gradient(circle at 50% 55%, #000 20%, transparent 75%)"
              }}
            />
            <div className="relative flex justify-center">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "radial-gradient(closest-side,rgba(242,205,150,.55),rgba(255,255,255,0))" }}
              />
              <CabinetPreview
                svgId={`cab-${cur.id}`}
                star={cur.star}
                unlocked={cur.unlocked}
                nextSphere={nextSphere}
                labels={sphereNames}
                missionLabel={missionLabel}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
            <div className="relative flex flex-1 flex-col gap-5 overflow-hidden rounded-[36px] bg-white p-[clamp(20px,2.6vw,30px)]">
              <div
                className="pointer-events-none absolute -right-[90px] -top-[90px] h-[300px] w-[300px] rounded-full"
                style={{ background: "repeating-radial-gradient(circle,rgba(217,165,92,.22) 0 1px,transparent 1.5px 18px)" }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-xs font-bold tracking-[0.16em] text-[#B07A33]">{relEyebrow(cur.relation, t)}</span>
                  <span className="font-display text-[clamp(32px,3.4vw,44px)] font-medium leading-none">{cur.name}</span>
                  <span className="text-sm text-[#5B5566]">
                    {t("dob")}:{" "}
                    <b style={{ color: V2_INK }}>
                      <LtrText>{cur.date}</LtrText>
                    </b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openEdit}
                  className="shrink-0 rounded-full bg-[#F8F1E9] px-4 py-2 text-[13px] font-bold text-[#5B5566]"
                >
                  {t("edit")}
                </button>
              </div>

              <div className="relative flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[#6E6878]">{t("opened")}</span>
                  <b style={{ color: V2_INK }}>{t("openCount", { n, total: 5 })}</b>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {order.map((id, i) => (
                    <span
                      key={id}
                      className="h-1.5 rounded-full"
                      style={{ background: i < n ? SPHERE_TINT[id].a2 : "#E8E2EC" }}
                    />
                  ))}
                </div>
              </div>

              <div className="relative flex flex-wrap gap-1.5">
                {rows.map((r) => (
                  <SphereChip key={r.id} id={r.id} name={r.name} st={r.st} />
                ))}
                <SphereChip id={null} name={t("soulMission")} st={n >= 5 ? "o" : "l"} />
              </div>

              <Link
                href={v2Href(`/star/${cur.id}`)}
                className="relative flex min-h-14 items-center justify-between rounded-full bg-[#2B1A33] py-2 pe-2 ps-[22px] text-[15px] font-bold text-white no-underline"
              >
                {t("continue")}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#2B1A33]">→</span>
              </Link>

              {n < 5 && cur.nextSku ? (
                <div className="relative flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => buy(true)}
                    className="min-h-[52px] rounded-full px-[26px] py-4 text-[15px] font-extrabold"
                    style={{ background: V2_GOLD, color: V2_INK }}
                  >
                    {t("buyNext", { name: cur.nextName, price: cur.nextPrice })}
                  </button>
                  <PayHint
                    saved={cards[0] ?? null}
                    onNewCard={() => buy(false)}
                    className="text-sm text-[#8A8494]"
                    buttonClassName="bg-transparent p-0 text-sm font-semibold text-[#B07A33] underline underline-offset-4"
                  />
                </div>
              ) : null}

              {n >= 5 ? (
                <span className="relative flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#E3EBDD] px-5 text-[15px] font-bold text-[#4B6B43]">
                  ✓ {t("allOpen")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <span className="font-display text-[clamp(30px,4vw,48px)] font-medium leading-none">{t("stars")}</span>
          <span className="text-sm text-[#6E6878]">{t("starsCount", { n: stars.length })}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {stars.map((s) => {
            const on = s.id === cur?.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedId(s.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex flex-col items-start gap-4 rounded-[36px] bg-white p-6 text-left"
                style={{
                  color: V2_INK,
                  outline: on ? `1.5px solid ${V2_GOLD}` : "1.5px solid transparent",
                  boxShadow: on ? "0 12px 30px rgba(43,26,51,.10)" : "none"
                }}
              >
                <div className="flex w-full justify-center py-1">
                  <V2MiniStar
                    zones={s.unlocked.map((id) => ZONE_TO_SPHERE.indexOf(id)).filter((z) => z >= 0)}
                    size={72}
                    center={s.unlockedCount >= 5}
                  />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[11px] font-bold tracking-[0.16em] text-[#B07A33]">{relEyebrow(s.relation, t)}</span>
                  <span className="font-display text-[26px] font-medium leading-[1.05]">{s.name}</span>
                  <span className="text-[13px] text-[#8A8494]">
                    <LtrText>{s.date}</LtrText>
                  </span>
                </div>
                <div className="grid w-full grid-cols-5 gap-1">
                  {order.map((id, i) => (
                    <span
                      key={id}
                      className="h-1 rounded-full"
                      style={{ background: i < s.unlockedCount ? SPHERE_TINT[id].a2 : "#E8E2EC" }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#6E6878]">
                  {s.unlockedCount >= 5 ? t("cardDone") : t("cardProgress", { n: s.unlockedCount })}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[36px] border border-dashed border-[rgba(43,26,51,.22)] bg-transparent p-6"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8EACB] text-2xl font-medium" style={{ color: V2_INK }}>
              +
            </span>
            <span className="text-base font-bold" style={{ color: V2_INK }}>
              {t("createStar")}
            </span>
            <span className="max-w-[200px] text-center text-[13px] leading-relaxed text-[#8A8494]">{t("createHint")}</span>
          </button>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-7 left-1/2 z-[60] -translate-x-1/2 rounded-[18px] bg-[#2B1A33] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(43,26,51,.25)]">
          {toast}
        </div>
      ) : null}

      {sheet ? (
        <div
          onClick={close}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(43,26,51,.4)] p-4 backdrop-blur-[4px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[500px] flex-col gap-[18px] overflow-y-auto rounded-[32px] bg-white p-8 shadow-[0_30px_80px_rgba(43,26,51,.25)]"
            style={{ color: V2_INK }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[28px] font-medium leading-none">
                {sheet === "create"
                  ? t("modalCreate")
                  : sheet === "edit"
                    ? t("modalEdit")
                    : sheet === "profile"
                      ? t("menuProfile")
                      : sheet === "purchases"
                        ? t("menuPurchases")
                        : t("menuSupport")}
              </span>
              <button
                type="button"
                aria-label={t("close")}
                onClick={close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F1E9] text-xl"
                style={{ color: V2_INK }}
              >
                ×
              </button>
            </div>

            {sheet === "create" || sheet === "edit" ? (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("fieldName")}</span>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setErr("");
                    }}
                    placeholder={t("namePlaceholder")}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("fieldDate")}</span>
                  <input
                    value={form.date}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, date: fmtDate(e.target.value) }));
                      setErr("");
                    }}
                    placeholder="ДД.ММ.ГГГГ"
                    inputMode="numeric"
                    className={inputClass}
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("fieldRel")}</span>
                  <div className="flex flex-wrap gap-2">
                    {STAR_RELATIONS.map((r) => {
                      const on = form.rel === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, rel: r }))}
                          className="min-h-10 rounded-full px-3.5 py-2 text-sm font-bold"
                          style={{
                            background: on ? V2_INK : "transparent",
                            color: on ? "#FFFFFF" : "#5B5566",
                            border: on ? "none" : "1px solid rgba(43,26,51,.16)"
                          }}
                        >
                          {t(`rel_${r}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {sheet === "edit" ? (
                  <div className="flex gap-2.5 rounded-[18px] bg-[#F8F1E9] px-3.5 py-3 text-[13px] leading-relaxed text-[#5B5566]">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ border: "1.5px solid #C78A3E" }} />
                    <span>{t("noteEdit")}</span>
                  </div>
                ) : null}
                {err ? <span className="text-sm font-bold text-[#A4472F]">{err}</span> : null}
                <button
                  type="button"
                  onClick={saveStar}
                  disabled={pending}
                  className="min-h-[54px] rounded-full bg-[#2B1A33] py-4 text-[15px] font-bold text-white disabled:opacity-70"
                >
                  {sheet === "edit" ? t("save") : t("build")}
                </button>
                {sheet === "edit" && cur?.canDelete ? (
                  <button type="button" onClick={removeStar} className="min-h-11 bg-transparent text-sm font-bold text-[#A4472F]">
                    {t("deleteStar")}
                  </button>
                ) : null}
              </>
            ) : null}

            {sheet === "profile" ? (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("fieldName")}</span>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">Email</span>
                  <input value={user.email} readOnly className={`${inputClass} opacity-70`} />
                </label>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("savedCard")}</span>
                  {cards.length === 0 ? <p className="m-0 text-sm text-[#8A8494]">{t("noSavedCard")}</p> : null}
                  {cards.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-[#F8F1E9] px-3.5 py-3">
                      <span className="text-[15px] font-bold">{cardLabel(c.brand, c.last4)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          start(async () => {
                            const res = await fetch(`/api/me/payment-methods?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
                            if (!res.ok) return;
                            setCards((prev) => prev.filter((x) => x.id !== c.id));
                            flash(t("cardRemoved"));
                            router.refresh();
                          });
                        }}
                        className="bg-transparent text-[13px] font-bold text-[#A4472F]"
                      >
                        {t("removeCard")}
                      </button>
                    </div>
                  ))}
                </div>
                {err ? <span className="text-sm font-bold text-[#A4472F]">{err}</span> : null}
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={pending}
                  className="min-h-[54px] rounded-full bg-[#2B1A33] py-4 text-[15px] font-bold text-white"
                >
                  {t("save")}
                </button>
                <Link href={v2Href("/forgot-password")} className="text-center text-sm font-semibold">
                  {t("changePassword")}
                </Link>
                <a href="/api/me/export" className="text-center text-sm font-semibold">
                  {t("exportData")}
                </a>
                <p className="text-[13px] leading-relaxed text-[#8A8494]">{t("deleteLead")}</p>
                <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={user.email} className={inputClass} />
                <button type="button" onClick={wipeAccount} disabled={pending} className="min-h-11 bg-transparent text-sm font-bold text-[#A4472F]">
                  {t("deleteAccount")}
                </button>
              </>
            ) : null}

            {sheet === "purchases" ? (
              <div className="flex flex-col gap-2.5">
                {purchases.length === 0 ? <p className="text-sm text-[#8A8494]">{t("noPurchases")}</p> : null}
                {purchases.map((p) => (
                  <div key={p.id} className="flex justify-between gap-3 rounded-[18px] bg-[#F8F1E9] px-4 py-3.5">
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-[#8A8494]">
                        <LtrText>{p.date}</LtrText>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{p.amount}</div>
                      <div className="text-[#8A8494]">{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {sheet === "support" ? (
              <>
                <p className="text-[15px] leading-relaxed text-[#5B5566]">{t("supportBody")}</p>
                <a
                  href="mailto:hello@soulstar.local"
                  className="flex min-h-[54px] items-center justify-center rounded-full bg-[#2B1A33] py-4 text-center text-[15px] font-bold text-white no-underline"
                >
                  {t("supportCta")}
                </a>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SphereChip({ id, name, st }: { id: SphereId | null; name: string; st: "o" | "x" | "l" }) {
  const tint = id ? SPHERE_TINT[id] : V2_NEU;
  const v: Record<"o" | "x" | "l", CSSProperties> = {
    o: { background: tint.t, color: tint.ink },
    x: { background: "#FFFFFF", color: tint.ink, outline: "1.5px dashed " + tint.acc, outlineOffset: -2 },
    l: id
      ? { background: "transparent", color: "#8A8494" }
      : { background: "#FFFFFF", color: tint.ink, outline: "1.5px dashed " + tint.acc, outlineOffset: -2 }
  };
  return (
    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold" style={v[st]}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: st === "l" ? "#D9D4DE" : tint.a2 }} />
      {name}
      {st !== "o" ? <V2LockIcon /> : null}
    </span>
  );
}

function CabinetPreview({
  svgId,
  star,
  unlocked,
  nextSphere,
  labels,
  missionLabel
}: {
  svgId: string;
  star: StarResult | null;
  unlocked: SphereId[];
  nextSphere: SphereId | null;
  labels: Record<SphereId, string>;
  missionLabel: [string, string];
}) {
  if (!star) return null;
  const ignore = () => undefined;
  return (
    <div className="star-ltr pointer-events-none relative w-full max-w-[600px]" dir="ltr">
      <V2StarSvg
        svgId={svgId}
        star={star}
        mobile
        activeSphere={unlocked[unlocked.length - 1] ?? null}
        unlocked={unlocked}
        nextSphere={nextSphere}
        hoverPt={null}
        hoverZone={null}
        hoverTip={null}
        selectedPt={null}
        onSphere={ignore}
        onPoint={ignore}
        onMission={ignore}
        onHoverPt={ignore}
        onHoverZone={ignore}
        onHoverTip={ignore}
        labels={labels}
        missionLabel={missionLabel}
      />
    </div>
  );
}
