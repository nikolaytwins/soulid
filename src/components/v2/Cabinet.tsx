"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  createStarAction,
  deleteAccountAction,
  deleteStarAction,
  saveProfileNameAction,
  updateStarAction
} from "@/app/[locale]/account/actions";
import { CabinetStar, type CabinetStarLabels } from "@/components/account/CabinetStar";
import { LtrText } from "@/components/ui/LtrText";
import { STAR_RELATIONS, type StarRelation } from "@/lib/domain/relations";
import type { SphereId } from "@/lib/engine";
import { PayHint } from "@/components/pay/PayHint";
import { cardLabel } from "@/lib/payments/card-label";

export type CabinetStarData = {
  id: string;
  name: string;
  relation: StarRelation;
  date: string;
  unlockedCount: number;
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "#F8F1E9",
  border: "1px solid rgba(80,60,45,.14)",
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 16,
  color: "#2B1A33",
  outline: "none"
};

function fmtDate(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join(".");
}

function relEyebrow(rel: StarRelation, t: ReturnType<typeof useTranslations>) {
  const label = t(`rel_${rel}`).toUpperCase();
  return rel === "self" ? t("myStarEyebrow") : t("relStarEyebrow", { rel: label });
}

function segs(n: number, hgt: number) {
  return [0, 1, 2, 3, 4].map((i) => ({
    height: hgt,
    borderRadius: 3,
    background: i < n ? "#E2AE63" : "rgba(80,60,45,.12)"
  }));
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
  const legal = useTranslations("legal");
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
      window.location.href = "/";
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
  const rows = order.map((id, k) => {
    const st: "o" | "x" | "l" = k < n ? "o" : k === n ? "x" : "l";
    return { id, name: sphereNames[id], num: String(k + 1), st };
  });

  const textBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "8px 4px",
    fontSize: 14,
    fontWeight: 600,
    color: "#5E534C",
    cursor: "pointer"
  };

  return (
    <div
      style={{
        background: "#F8F1E9",
        minHeight: "100vh",
        color: "#2B1A33",
        fontFamily: "Manrope, sans-serif",
        position: "relative",
        overflow: "clip"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 60,
          width: 1100,
          height: 800,
          transform: "translateX(-50%)",
          background: "radial-gradient(closest-side,rgba(242,205,150,.4),rgba(245,240,234,0))",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "8px clamp(20px,4vw,56px) 96px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 48
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, letterSpacing: ".22em", color: "#8E8178", fontWeight: 600 }}>{todayLabel}</span>
            <span
              style={{
                fontFamily: "Unbounded, sans-serif",
                fontSize: "clamp(36px,5vw,56px)",
                lineHeight: 1,
                fontWeight: 500
              }}
            >
              {greeting}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <button type="button" style={textBtn} onClick={() => { setProfileName(user.name); setErr(""); setSheet("profile"); }}>
              {t("menuProfile")}
            </button>
            <button type="button" style={textBtn} onClick={() => setSheet("purchases")}>
              {t("menuPurchases")}
            </button>
            <button type="button" style={textBtn} onClick={() => setSheet("support")}>
              {t("menuSupport")}
            </button>
            <button
              type="button"
              onClick={openCreate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(160deg,#F3CF94,#D9A055)",
                border: "none",
                borderRadius: 999,
                padding: "12px 22px",
                fontSize: 15,
                fontWeight: 700,
                color: "#2B1A33",
                cursor: "pointer",
                minHeight: 46,
                boxShadow: "0 8px 24px rgba(217,160,85,.45),0 0 0 4px rgba(242,205,150,.35)"
              }}
            >
              + {t("newStar")}
            </button>
          </div>
        </div>

        {cur ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
              gap: 24,
              background: "rgba(251,248,244,.85)",
              border: "1px solid rgba(80,60,45,.10)",
              borderRadius: 28,
              padding: "clamp(20px,3vw,40px)",
              boxShadow: "0 20px 50px rgba(120,85,50,.08)",
              alignItems: "center"
            }}
          >
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 480 }}>
                <CabinetStar id={cur.id} big openCount={cur.unlockedCount} values={cur.values} labels={starLabels} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 11, letterSpacing: ".22em", color: "#B9813F", fontWeight: 700 }}>{relEyebrow(cur.relation, t)}</span>
                  <span
                    style={{
                      fontFamily: "Unbounded, sans-serif",
                      fontSize: "clamp(34px,4vw,48px)",
                      lineHeight: 1,
                      fontWeight: 500
                    }}
                  >
                    {cur.name}
                  </span>
                  <span style={{ fontSize: 14, color: "#5E534C" }}>
                    {t("dob")}:{" "}
                    <b style={{ color: "#2B1A33" }}>
                      <LtrText>{cur.date}</LtrText>
                    </b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openEdit}
                  style={{
                    background: "none",
                    border: "1px solid rgba(80,60,45,.15)",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 13,
                    color: "#5E534C",
                    cursor: "pointer",
                    minHeight: 40
                  }}
                >
                  {t("edit")}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#5E534C" }}>{t("opened")}</span>
                  <span style={{ fontWeight: 700 }}>{t("openCount", { n, total: 5 })}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                  {segs(n, 6).map((s, i) => (
                    <span key={i} style={s} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(80,60,45,.10)" }}>
                {rows.map((r) => (
                  <SphereRow key={r.id} num={r.num} name={r.name} st={r.st} nextPrice={cur.nextPrice} t={t} />
                ))}
                <SphereRow
                  num="6"
                  name={t("soulMission")}
                  st={n >= 5 ? "o" : "l"}
                  nextPrice={cur.nextPrice}
                  t={t}
                />
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href={`/v2/star/${cur.id}`}
                  className="no-underline"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#2B1A33",
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 600,
                    padding: "16px 20px",
                    borderRadius: 14,
                    boxSizing: "border-box"
                  }}
                >
                  {t("continue")}
                </Link>
                {n < 5 && cur.nextSku ? (
                  <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => buy(true)}
                      style={{
                        width: "100%",
                        background: "#E2AE63",
                        color: "#2B1A33",
                        border: "none",
                        borderRadius: 14,
                        padding: "16px 20px",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
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
                  <span
                    style={{
                      flex: 1,
                      minWidth: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: "#E3EBDD",
                      color: "#4B6B43",
                      borderRadius: 14,
                      padding: "16px 20px",
                      fontSize: 15,
                      fontWeight: 600,
                      boxSizing: "border-box"
                    }}
                  >
                    ✓ {t("allOpen")}
                  </span>
                ) : null}
              </div>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "#A8988C" }}>{legal("disclaimer")}</p>
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: "Unbounded, sans-serif", fontSize: 36, fontWeight: 500, flex: 1 }}>{t("stars")}</span>
            <span style={{ fontSize: 13, color: "#8E8178" }}>{t("starsCount", { n: stars.length })}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    alignItems: "flex-start",
                    textAlign: "left",
                    background: "#FFFFFF",
                    borderRadius: 22,
                    padding: 20,
                    cursor: "pointer",
                    color: "#2B1A33",
                    border: on ? "1.5px solid #E2AE63" : "1px solid rgba(80,60,45,.10)",
                    boxShadow: on ? "0 12px 30px rgba(120,85,50,.10)" : "none"
                  }}
                >
                  <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "6px 0 2px" }}>
                    <CabinetStar id={s.id} openCount={s.unlockedCount} values={s.values} labels={starLabels} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, letterSpacing: ".16em", color: "#B9813F", fontWeight: 700 }}>{relEyebrow(s.relation, t)}</span>
                    <span style={{ fontFamily: "Unbounded, sans-serif", fontSize: 26, lineHeight: 1.05, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 13, color: "#8E8178" }}>
                      <LtrText>{s.date}</LtrText>
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 3, width: "100%" }}>
                    {segs(s.unlockedCount, 4).map((st, i) => (
                      <span key={i} style={st} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: "#5E534C" }}>
                    {s.unlockedCount >= 5 ? t("cardDone") : t("cardProgress", { n: s.unlockedCount })}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={openCreate}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minHeight: 300,
                background: "transparent",
                border: "1.5px dashed rgba(142,95,42,.4)",
                borderRadius: 22,
                padding: 24,
                cursor: "pointer",
                color: "#8E5F2A"
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#F6E6CC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 500
                }}
              >
                +
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#2B1A33" }}>{t("createStar")}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "#8E8178", textAlign: "center", maxWidth: 200 }}>{t("createHint")}</span>
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "#2B1A33",
            color: "#FFFFFF",
            padding: "14px 20px",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 12px 30px rgba(42,33,29,.25)"
          }}
        >
          {toast}
        </div>
      ) : null}

      {sheet ? (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(42,33,29,.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 32,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxShadow: "0 30px 80px rgba(42,33,29,.25)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontSize: 36, lineHeight: 1, fontWeight: 500 }}>
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
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(80,60,45,.15)",
                  background: "#F8F1E9",
                  color: "#5E534C",
                  fontSize: 20,
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>

            {sheet === "create" || sheet === "edit" ? (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("fieldName")}</span>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setErr("");
                    }}
                    placeholder={t("namePlaceholder")}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("fieldDate")}</span>
                  <input
                    value={form.date}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, date: fmtDate(e.target.value) }));
                      setErr("");
                    }}
                    placeholder="ДД.ММ.ГГГГ"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("fieldRel")}</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STAR_RELATIONS.map((r) => {
                      const on = form.rel === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, rel: r }))}
                          style={{
                            padding: "9px 14px",
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            minHeight: 40,
                            background: on ? "#2B1A33" : "transparent",
                            color: on ? "#FFFFFF" : "#5E534C",
                            border: on ? "1px solid #2B1A33" : "1px solid rgba(43,26,51,.16)"
                          }}
                        >
                          {t(`rel_${r}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {sheet === "edit" ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "#5E534C",
                      background: "#F8F1E9",
                      borderRadius: 12,
                      padding: "12px 14px"
                    }}
                  >
                    <span style={{ width: 8, height: 8, marginTop: 5, borderRadius: "50%", border: "1.5px solid #C78A3E", flexShrink: 0 }} />
                    <span>{t("noteEdit")}</span>
                  </div>
                ) : null}
                {err ? <span style={{ fontSize: 14, fontWeight: 600, color: "#A4472F" }}>{err}</span> : null}
                <button
                  type="button"
                  onClick={saveStar}
                  disabled={pending}
                  style={{
                    background: "#2B1A33",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: 50,
                    opacity: pending ? 0.7 : 1
                  }}
                >
                  {sheet === "edit" ? t("save") : t("build")}
                </button>
                {sheet === "edit" && cur?.canDelete ? (
                  <button
                    type="button"
                    onClick={removeStar}
                    style={{ background: "none", border: "none", color: "#A4472F", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}
                  >
                    {t("deleteStar")}
                  </button>
                ) : null}
              </>
            ) : null}

            {sheet === "profile" ? (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("fieldName")}</span>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Email</span>
                  <input value={user.email} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("savedCard")}</span>
                  {cards.length === 0 ? <p style={{ margin: 0, fontSize: 14, color: "#8A8494" }}>{t("noSavedCard")}</p> : null}
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "#F8F1E9",
                        borderRadius: 12,
                        padding: "12px 14px"
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{cardLabel(c.brand, c.last4)}</span>
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
                        style={{ background: "none", border: "none", color: "#A4472F", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        {t("removeCard")}
                      </button>
                    </div>
                  ))}
                </div>
                {err ? <span style={{ fontSize: 14, fontWeight: 600, color: "#A4472F" }}>{err}</span> : null}
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={pending}
                  style={{
                    background: "#2B1A33",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: 50
                  }}
                >
                  {t("save")}
                </button>
                <Link href="/v2/forgot-password" className="text-center text-sm font-semibold">
                  {t("changePassword")}
                </Link>
                <a href="/api/me/export" className="text-center text-sm font-semibold">
                  {t("exportData")}
                </a>
                <p style={{ fontSize: 13, color: "#8E8178", lineHeight: 1.5 }}>{t("deleteLead")}</p>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={user.email}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={wipeAccount}
                  disabled={pending}
                  style={{ background: "none", border: "none", color: "#A4472F", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}
                >
                  {t("deleteAccount")}
                </button>
              </>
            ) : null}

            {sheet === "purchases" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {purchases.length === 0 ? <p style={{ fontSize: 14, color: "#8E8178" }}>{t("noPurchases")}</p> : null}
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "#F8F1E9"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#8E8178" }}>
                        <LtrText>{p.date}</LtrText>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 14 }}>
                      <div>{p.amount}</div>
                      <div style={{ color: "#8E8178" }}>{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {sheet === "support" ? (
              <>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5E534C" }}>{t("supportBody")}</p>
                <a
                  href="mailto:hello@soulstar.local"
                  style={{
                    background: "#2B1A33",
                    color: "#FFFFFF",
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                    minHeight: 50
                  }}
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

function SphereRow({
  num,
  name,
  st,
  nextPrice,
  t
}: {
  num: string;
  name: string;
  st: "o" | "x" | "l";
  nextPrice: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const open = st === "o";
  const next = st === "x";
  const dot: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    boxSizing: "border-box",
    ...(open
      ? { background: "linear-gradient(160deg,#F3CF94,#D9A055)", color: "#3A2716" }
      : next
        ? { border: "1.5px dashed #E2AE63", color: "#8E5F2A" }
        : { border: "1px solid rgba(80,60,45,.15)", color: "#A89A8F" })
  };
  const tag: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    ...(open
      ? { background: "#E3EBDD", color: "#4B6B43" }
      : next
        ? { background: "#FBF1E2", color: "#8E5F2A", border: "1px solid #E2AE63" }
        : { color: "#A89A8F" })
  };
  const tagText = open ? `✓ ${t("openedBadge")}` : next ? t("nextPrice", { price: nextPrice }) : t("locked");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid rgba(80,60,45,.08)"
      }}
    >
      <span style={dot}>{num}</span>
      <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{name}</span>
      <span style={tag}>{tagText}</span>
    </div>
  );
}
