"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { SphereId, StarResult } from "@/lib/engine";
import { BRIDGE_KIND, ZONE_TO_SPHERE } from "@/lib/engine";
import { StarSvg } from "./StarSvg";
import { MiniStar, TriangleSvg } from "./TriangleSvg";
import { starGeometry } from "./geometry";
import type { ArcReading, StarPageModel } from "@/lib/domain/star-page";
import type { PatternReading } from "@/lib/domain/patterns";
import { trackPixel } from "@/components/analytics/MetaPixel";
import { trackClient } from "@/components/analytics/ids";
import { signIn } from "next-auth/react";
import { LtrText } from "@/components/ui/LtrText";
import { NewStarDialog } from "@/components/layout/NewStarDialog";

type ViewId = SphereId | "soulMission";

type Panel =
  | { type: "point"; j: number; ctx: SphereId }
  | { type: "offer"; k: SphereId }
  | { type: "blocked"; k: SphereId };

const BRIDGES = ["p23", "p34", "p45", "p51", "p12"] as const;

export function StarExperience({
  model,
  readings,
  missionReading,
  patterns = [],
  focusLatest
}: {
  model: StarPageModel;
  readings: Record<SphereId, ArcReading[]>;
  missionReading: ArcReading | null;
  patterns?: PatternReading[];
  focusLatest?: boolean;
}) {
  const t = useTranslations();
  const arcana = t("terms.arcana");
  const unlocked = useMemo(() => new Set(model.unlocked), [model.unlocked]);
  const firstOpen =
    (focusLatest ? [...model.order].reverse().find((s) => unlocked.has(s)) : model.order.find((s) => unlocked.has(s))) ??
    model.order[0];
  const [active, setActive] = useState<ViewId>(firstOpen);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [why, setWhy] = useState(false);
  const [hoverPt, setHoverPt] = useState<number | null>(null);
  const [hoverZone, setHoverZone] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [payEmail, setPayEmail] = useState("");
  const [payPassword, setPayPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hoverOk, setHoverOk] = useState(false);
  const [newStar, setNewStar] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const apply = () => setHoverOk(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setMounted(true);
    const onK = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setWhy(false);
      }
    };
    window.addEventListener("keydown", onK);
    trackClient("sphere_viewed", { profileId: model.profileId, payload: { sphere: firstOpen } });
    return () => {
      window.removeEventListener("keydown", onK);
    };
  }, [firstOpen, model.profileId]);

  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panel]);

  const close = () => {
    setPanel(null);
    setWhy(false);
  };

  function onSphere(k: SphereId) {
    if (unlocked.has(k)) {
      setActive(k);
      setPanel(null);
      trackClient("sphere_viewed", { profileId: model.profileId, payload: { sphere: k } });
      return;
    }
    trackClient("locked_sphere_clicked", { profileId: model.profileId, payload: { sphere: k } });
    if (k === model.nextSphere) {
      trackClient("unlock_intent", { profileId: model.profileId, payload: { sphere: k } });
      setPanel({ type: "offer", k });
    } else {
      setPanel({ type: "blocked", k });
    }
    setWhy(false);
    setHoverPt(null);
  }

  function onMission() {
    setActive("soulMission");
    setPanel(null);
    trackClient("sphere_viewed", { profileId: model.profileId, payload: { sphere: "soulMission" } });
  }

  function ptSpheres(j: number): SphereId[] {
    return model.star.bridges[BRIDGES[j]].spheres;
  }

  function onPoint(j: number) {
    const ks = ptSpheres(j);
    const open = ks.filter((s) => unlocked.has(s));
    if (!open.length) return onSphere(ks[0]);
    const ctx = active !== "soulMission" && ks.includes(active) ? active : open[0];
    setPanel({ type: "point", j, ctx });
    setHoverPt(null);
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (id === "decode" ? 8 : 90), behavior: "smooth" });
  }

  async function buy(sku: string) {
    setBusy(true);
    setPayError("");
    try {
      if (!model.loggedIn) {
        if (!payEmail.trim()) {
          setPayError(t("offer.emailRequired"));
          if (model.nextSphere) setPanel({ type: "offer", k: model.nextSphere });
          setBusy(false);
          return;
        }
        const idRes = await fetch("/api/auth/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: payEmail.trim(), profileId: model.profileId, locale: model.locale })
        });
        const identified = (await idRes.json()) as {
          status?: "ready" | "ticket" | "needs_password";
          ticket?: string;
          email?: string;
          error?: string;
        };
        if (identified.error === "blocked" || idRes.status === 403) {
          setPayError(t("offer.blockedAccount"));
          setBusy(false);
          return;
        }
        if (identified.status === "needs_password") {
          setNeedsPassword(true);
          if (!payPassword) {
            setPayError(t("offer.passwordRequired"));
            setBusy(false);
            return;
          }
          const login = await signIn("credentials", {
            email: payEmail.trim(),
            password: payPassword,
            redirect: false
          });
          if (login?.error) {
            setPayError(t("auth.invalid"));
            setBusy(false);
            return;
          }
        } else if (identified.status === "ticket" && identified.ticket) {
          const login = await signIn("credentials", {
            email: identified.email ?? payEmail.trim(),
            ticket: identified.ticket,
            redirect: false
          });
          if (login?.error) {
            setPayError(t("starPage.checkoutError"));
            setBusy(false);
            return;
          }
        } else if (identified.status !== "ready") {
          setPayError(t("starPage.checkoutError"));
          setBusy(false);
          return;
        }
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: model.profileId, sku })
      });
      const json = (await res.json()) as { url?: string; error?: string; eventId?: string };
      if (json.eventId) trackPixel("InitiateCheckout", { content_type: "product", content_ids: [sku] }, json.eventId);
      if (json.url) window.location.href = json.url;
      else setPayError(json.error === "blocked" ? t("offer.blockedAccount") : t("starPage.checkoutError"));
    } catch {
      setPayError(t("starPage.checkoutError"));
    }
    setBusy(false);
  }

  const labels = Object.fromEntries(model.order.map((id) => [id, model.spheres[id].name])) as Record<SphereId, string>;
  const viewingMission = active === "soulMission";
  const nOpen = model.unlocked.length;
  const missionOpen = nOpen >= 5;

  function skuForSphere(k: SphereId): string | undefined {
    const price = model.prices[k];
    if (price?.soldSeparately) return price.sku;
    return model.bundle?.sku;
  }
  const act =
    active === "soulMission"
      ? {
          name: t("starPage.soulMission"),
          purpose: missionOpen ? t("starPage.soulMissionPurpose") : t("offer.missionLocked"),
          part: t("starPage.soulMissionPart"),
          zone: 0,
          center: true
        }
      : { ...model.spheres[active], center: false };
  const arcs = active === "soulMission" ? (missionOpen && missionReading ? [missionReading] : []) : (readings[active] ?? []);
  const progressText = t("starPage.progressCount", { n: nOpen, total: 5 });
  const activeOpen = active === "soulMission" ? missionOpen : unlocked.has(active);
  const missionWords = t("starPage.soulMission").split(" ");
  const missionLabel: [string, string] = [missionWords[0] ?? "Миссия", missionWords.slice(1).join(" ") || "души"];

  const chips = (big: boolean) => {
    const d = big ? 40 : 36;
    const b: React.CSSProperties = {
      width: d,
      height: d,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Manrope, sans-serif",
      fontWeight: 600,
      boxSizing: "border-box",
      padding: 0,
      fontSize: big ? 15 : 14
    };
    return arcs.map((ar, i) => {
      const style: React.CSSProperties =
        i === 0
          ? { ...b, background: "linear-gradient(160deg,#F3CF94,#D9A055)", color: "#3A2716", border: "none", fontSize: big ? 16 : 15 }
          : i < 3
            ? { ...b, background: "transparent", border: "1.5px solid #E2AE63", color: "#8E5F2A", cursor: "pointer" }
            : { ...b, background: "transparent", border: "1px solid rgba(80,60,45,.15)", color: "#5E534C", fontSize: big ? 14 : 13 };
      return (
        <button
          key={ar.id}
          type="button"
          title={ar.role}
          style={style}
          onClick={() => {
            if (active !== "soulMission" && i === 1) onPoint((ZONE_TO_SPHERE.indexOf(active) + 4) % 5);
            else if (active !== "soulMission" && i === 2) onPoint(ZONE_TO_SPHERE.indexOf(active));
            else scrollTo(ar.id);
          }}
        >
          {ar.value}
        </button>
      );
    });
  };

  function pillStyle(k: ViewId): React.CSSProperties {
    const st: "a" | "o" | "x" | "l" =
      k === "soulMission"
        ? viewingMission
          ? "a"
          : missionOpen
            ? "o"
            : "l"
        : k === active
          ? "a"
          : unlocked.has(k)
            ? "o"
            : k === model.nextSphere
              ? "x"
              : "l";
    const base: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 16px",
      minHeight: 44,
      borderRadius: 999,
      fontSize: 14,
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
      boxSizing: "border-box"
    };
    const v: Record<string, React.CSSProperties> = {
      a: { background: "#2A211D", color: "#FBF8F4", border: "1px solid #2A211D", fontWeight: 600 },
      o: { background: "#FBF8F4", color: "#2A211D", border: "1px solid rgba(80,60,45,.16)", fontWeight: 600 },
      x: { background: "transparent", color: "#8E5F2A", border: "1px dashed #E2AE63", fontWeight: 600 },
      l: { background: "transparent", color: "#8E8178", border: "1px solid rgba(80,60,45,.12)", fontWeight: 500 }
    };
    return { ...base, ...v[st] };
  }

  const nextIdx = active === "soulMission" ? -1 : model.order.indexOf(active) + 1;
  const nextId = nextIdx >= 0 ? model.order[nextIdx] : undefined;
  const nextOpen = nextId && unlocked.has(nextId);
  const offerNext = Boolean(model.nextSphere && nOpen < 5 && (viewingMission || !nextOpen));
  const showMissionNext = !viewingMission && !nextId && missionOpen;

  let tip: React.ReactNode = null;
  if (hoverOk && hoverPt != null && !panel) {
    const { I } = starGeometry();
    const p = I[hoverPt];
    const ks = ptSpheres(hoverPt);
    const open = ks.some((s) => unlocked.has(s));
    const ctx = active !== "soulMission" && ks.includes(active) ? active : ks.find((s) => unlocked.has(s));
    const fatal = BRIDGE_KIND[BRIDGES[hoverPt]] === "fatal_error";
    tip = (
      <div
        className="pointer-events-none absolute z-20 flex w-[220px] -translate-x-1/2 flex-col gap-1 rounded-xl bg-ink px-3.5 py-3 text-card shadow-[0_12px_30px_rgba(42,33,29,.25)]"
        style={{
          left: `${((p[0] + 138) / 276) * 100}%`,
          top: `${((p[1] + 134) / 250) * 100}%`,
          transform: "translate(-50%, calc(-100% - 18px))"
        }}
      >
        <span className="text-[11px] font-bold tracking-[0.14em] text-gold-pale">
          {(fatal ? t("points.fatal") : t("points.ancestral")).toUpperCase()}
        </span>
        <span className="text-[15px] font-semibold">
          {open ? t("points.arcana", { arcana, value: model.star.bridges[BRIDGES[hoverPt]].value }) : t("points.hidden")}
        </span>
        <span className="text-xs leading-snug text-[#CFC4BA]">
          {open && ctx
            ? t("points.clickRead", { name: model.spheres[ctx].name })
            : t("points.opensWith", { name: model.spheres[ks[0]].name })}
        </span>
      </div>
    );
  }

  const seq = (target: SphereId | null) =>
    model.order.map((id, i) => {
      let cls = "rounded-full px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap border ";
      if (unlocked.has(id)) cls += "bg-open-bg text-open-text border-open-bg";
      else if (id === model.nextSphere) cls += "bg-[#FBF1E2] text-gold-text border-gold";
      else if (id === target) cls += "border-dashed border-faint text-ink bg-transparent";
      else cls += "border-[rgba(80,60,45,0.12)] text-lock bg-transparent";
      return (
        <span key={id} className={cls}>
          {unlocked.has(id) ? "✓ " : `${i + 1}. `}
          {model.spheres[id].name}
        </span>
      );
    });

  async function goCheckout(sku: string) {
    if (busy) return;
    if (!model.loggedIn && panel?.type !== "offer") {
      setPendingSku(sku);
      if (model.nextSphere) setPanel({ type: "offer", k: model.nextSphere });
      return;
    }
    const actual = pendingSku ?? sku;
    await buy(actual);
  }

  return (
    <div className="relative min-h-screen bg-cream text-ink">
      <div
        className="pointer-events-none absolute left-1/2 top-10 hidden h-[860px] w-[1000px] -translate-x-1/2 md:block"
        style={{ background: "radial-gradient(closest-side,rgba(242,205,150,.45),rgba(245,240,234,0))" }}
      />

      <div className="hidden min-[1280px]:block">
        <div className="relative mx-auto grid max-w-page grid-cols-[240px_minmax(0,1fr)_300px] items-center gap-5 px-6 pb-[72px] pt-2 xl:grid-cols-[320px_minmax(0,1fr)_380px] xl:gap-6 xl:px-14">
          <HeroCopy model={model} t={t} nOpen={nOpen} progressText={progressText} onNewStar={() => setNewStar(true)} />
          <div className="flex justify-center">
            <div className="relative w-full max-w-[640px]">
              <StarBlock
                star={model.star}
                mobile={false}
                active={viewingMission ? null : active}
                missionActive={viewingMission}
                unlocked={model.unlocked}
                next={model.nextSphere}
                hoverPt={hoverPt}
                hoverZone={hoverZone}
                selectedPt={panel?.type === "point" ? panel.j : null}
                labels={labels}
                missionLabel={missionLabel}
                onSphere={onSphere}
                onPoint={onPoint}
                onMission={() => {
                  onMission();
                  scrollTo("decode");
                }}
                onHoverPt={setHoverPt}
                onHoverZone={setHoverZone}
              />
              {tip}
            </div>
          </div>
          <ActiveCard
            act={act}
            part={act.part}
            chips={chips(true)}
            onDecode={() => scrollTo("decode")}
            t={t}
            zone={act.zone}
            center={act.center}
            open={activeOpen}
          />
        </div>
      </div>
      <div className="min-[1280px]:hidden">
        <MobileHero
          model={model}
          t={t}
          nOpen={nOpen}
          progressText={progressText}
          act={act}
          chips={chips(false)}
          active={viewingMission ? null : active}
          missionActive={viewingMission}
          labels={labels}
          missionLabel={missionLabel}
          hoverPt={hoverPt}
          hoverZone={hoverZone}
          selectedPt={panel?.type === "point" ? panel.j : null}
          onSphere={onSphere}
          onPoint={onPoint}
          onMission={() => {
            onMission();
            scrollTo("decode");
          }}
          onHoverPt={setHoverPt}
          onHoverZone={setHoverZone}
          onDecode={() => scrollTo("decode")}
          open={activeOpen}
          tip={tip}
          onNewStar={() => setNewStar(true)}
        />
      </div>

      <section id="decode" className="relative mx-auto flex max-w-page flex-col gap-7 px-0 pt-9 min-[1280px]:px-6 min-[1280px]:pb-28 min-[1280px]:pt-0 xl:min-[1280px]:px-14">
        <div className="hidden h-px bg-line min-[1280px]:block" />
        <h2 className="px-5 font-serif font-medium text-[32px] min-[1280px]:px-0 min-[1280px]:pt-4 min-[1280px]:text-[48px]">
          {t("starPage.decodeTitle")}
        </h2>
        <div className="sticky top-0 z-[5] border-b border-line bg-cream min-[1280px]:flex min-[1280px]:items-center min-[1280px]:gap-2.5 min-[1280px]:py-3.5">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3 min-[1280px]:overflow-visible min-[1280px]:px-0 min-[1280px]:py-0">
            {model.order.map((id) => (
              <button key={id} type="button" onClick={() => onSphere(id)} style={pillStyle(id)}>
                {model.spheres[id].name}
                {unlocked.has(id) ? <span className="text-gold">✓</span> : null}
                {!unlocked.has(id) ? <LockIcon /> : null}
              </button>
            ))}
            <button type="button" onClick={onMission} style={pillStyle("soulMission")}>
              {t("starPage.soulMission")}
              {missionOpen ? <span className="text-gold">✓</span> : <LockIcon />}
            </button>
          </div>
          <span className="ms-auto hidden text-[13px] text-muted min-[1280px]:inline">
              {t("starPage.opened")}: <b className="text-ink">{progressText}</b>
            </span>
        </div>

        <div className="flex flex-col min-[1280px]:grid min-[1280px]:grid-cols-[340px_minmax(0,1fr)] min-[1280px]:items-start min-[1280px]:gap-20 min-[1280px]:pt-4">
          <aside className="sticky top-24 hidden flex-col gap-[22px] rounded-3xl border border-line bg-card p-7 min-[1280px]:flex">
              <div className="flex items-center gap-3">
                <MiniStar zones={act.center ? [] : [act.zone]} size={26} center={act.center} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{t("starPage.fragment")}</span>
                  <span className="text-xs text-faint">{act.part}</span>
                </div>
              </div>
              <div className="flex justify-center py-1">
                {activeOpen && active !== "soulMission" ? (
                  <TriangleSvg width={220} sphere={active} star={model.star} onPoint={onPoint} />
                ) : null}
              </div>
              <div className="h-px bg-line" />
              {activeOpen ? (
              <div className="flex flex-col gap-1">
                <span className="pb-1.5 text-[11px] font-semibold tracking-[0.18em] text-faint">{t("starPage.contents")}</span>
                {arcs.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => scrollTo(ar.id)}
                    className="flex items-center gap-3 rounded-[10px] px-1.5 py-2 text-left hover:bg-sand"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold text-xs font-bold text-gold-text">
                      {ar.value}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{ar.content?.title ?? t("points.arcana", { arcana, value: ar.value })}</span>
                      <span className="text-xs text-faint">{ar.role}</span>
                    </span>
                  </button>
                ))}
              </div>
              ) : null}
            </aside>

          <div className="flex max-w-[720px] flex-col gap-10 px-5 min-[1280px]:px-0">
            <div className="flex flex-col items-start gap-4 pt-5 min-[1280px]:pt-0">
              <span className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">
                {viewingMission
                  ? t("offer.center")
                  : `${t("offer.sphereOf", { n: model.order.indexOf(active) + 1 })} · ${act.part.toUpperCase()}`}
              </span>
              <div className="flex items-center gap-4">
                <h3 className="font-serif text-[40px] font-medium leading-none min-[1280px]:text-[60px]">{act.name}</h3>
                <span
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                    activeOpen ? "bg-open-bg text-open-text" : "bg-[#F1EBE4] text-muted"
                  }`}
                >
                  {activeOpen ? t("starPage.openedBadge") : t("starPage.lockedBadge")}
                </span>
              </div>
              <p className="text-base leading-relaxed text-muted min-[1280px]:text-lg">{act.purpose}</p>
              {activeOpen && active !== "soulMission" ? (
                <div className="flex w-full items-center gap-4 rounded-[20px] border border-line bg-card p-4 min-[1280px]:hidden">
                  <TriangleSvg width={96} sphere={active} star={model.star} onPoint={onPoint} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-faint">{t("starPage.fragment")}</span>
                    <span className="text-[13px] font-semibold">{t("starPage.tapTriangle")}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {activeOpen
              ? arcs.map((ar) => (
              <section key={ar.id} id={ar.id} className="flex flex-col gap-4 border-t border-line pt-9">
                <div className="flex items-center gap-4">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-pale to-gold-mid text-lg font-bold text-[#3A2716]">
                    {ar.value}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold tracking-[0.18em] text-gold-deep">{ar.roleUp}</span>
                    <span className="font-serif text-[34px] font-medium leading-tight">{ar.content?.title ?? t("points.arcana", { arcana, value: ar.value })}</span>
                  </div>
                </div>
                {ar.content?.type === "structured" ? (
                  <div className="flex flex-col gap-3.5">
                    {ar.content.blocks.map((sb) => (
                      <div key={sb.label} className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-card px-6 py-[22px]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sand text-[13px] font-bold text-gold-text">
                            {sb.mark}
                          </span>
                          <span className="text-base font-semibold">{sb.label}</span>
                        </div>
                        <p className="text-[17px] leading-relaxed text-muted">{sb.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {ar.content?.type === "plain" && ar.content.lead ? (
                      <p className="text-[17px] leading-[1.75] text-muted">{ar.content.lead}</p>
                    ) : null}
                    {(ar.content?.type === "plain" ? ar.content.paragraphs : []).map((pp) => (
                      <p key={pp.slice(0, 32)} className="text-[17px] leading-[1.75] text-muted">
                        {pp}
                      </p>
                    ))}
                  </>
                )}
              </section>
            ))
              : null}

            {payError ? <p className="text-sm text-red-700">{payError}</p> : null}

            {patterns.length > 0 ? (
              <section className="mt-4 flex flex-col gap-4 border-t border-line pt-9">
                <span className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">{t("starPage.patternsEyebrow")}</span>
                <h3 className="font-serif text-[32px] font-medium leading-tight min-[1280px]:text-[40px]">{t("starPage.patternsTitle")}</h3>
                <p className="text-[17px] leading-relaxed text-muted">{t("starPage.patternsLead")}</p>
                {patterns.map((pattern) => (
                  <article key={pattern.id} className="flex flex-col gap-3 rounded-[20px] border border-line bg-card px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold tracking-[0.16em] text-gold-deep">
                        {pattern.kind === "repeating" ? t("starPage.patternRepeat") : t("starPage.patternCombo")}
                      </span>
                      <span className="font-sans text-sm font-semibold">{pattern.values.join(" · ")}</span>
                      {pattern.kind === "repeating" ? (
                        <span className="text-xs text-faint">×{pattern.count}</span>
                      ) : null}
                      {pattern.locked ? (
                        <span className="rounded-full bg-[#F1EBE4] px-2 py-1 text-[11px] font-semibold text-muted">
                          {t("starPage.patternLocked")}
                        </span>
                      ) : null}
                    </div>
                    <span className="font-serif text-[26px] font-medium leading-tight">{pattern.title}</span>
                    {pattern.locked ? (
                      <p className="text-sm leading-relaxed text-muted">{t("starPage.patternLockedHint")}</p>
                    ) : pattern.content?.type === "plain" ? (
                      pattern.content.paragraphs.map((pp) => (
                        <p key={pp.slice(0, 24)} className="text-[17px] leading-[1.75] text-muted">
                          {pp}
                        </p>
                      ))
                    ) : null}
                  </article>
                ))}
              </section>
            ) : null}

            {offerNext && model.nextSphere ? (
              <div className="mt-4 flex flex-col gap-5 rounded-3xl bg-ink p-9 text-card">
                <span className="text-[11px] font-bold tracking-[0.22em] text-gold">{t("starPage.nextStep")}</span>
                <div className="flex items-center gap-4">
                  <MiniStar zones={[model.spheres[model.nextSphere].zone]} size={26} onDark />
                  <div className="flex flex-col gap-1.5">
                    <span className="font-serif text-[38px] font-medium leading-tight">
                      {t("starPage.nextLevel", { name: model.spheres[model.nextSphere].name })}
                    </span>
                    <span className="text-sm text-[#CFC4BA]">
                      {t("starPage.lead")}
                    </span>
                  </div>
                </div>
                <p className="text-base leading-relaxed text-[#E6DCD2]">{model.spheres[model.nextSphere].purpose}</p>
                <div className="flex flex-wrap items-center gap-5">
                  {model.prices[model.nextSphere]?.soldSeparately ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => goCheckout(model.prices[model.nextSphere!].sku)}
                      className="rounded-[14px] bg-gold px-6 py-4 text-[15px] font-bold text-ink"
                    >
                      {t("starPage.openSpherePrice", { price: model.prices[model.nextSphere].formatted })}
                    </button>
                  ) : null}
                  {model.showBundle && model.bundle && nOpen < 5 ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => goCheckout(model.bundle!.sku)}
                      className={
                        model.prices[model.nextSphere]?.soldSeparately
                          ? "bg-transparent p-2 text-sm text-[#CFC4BA] underline underline-offset-4"
                          : "rounded-[14px] bg-gold px-6 py-4 text-[15px] font-bold text-ink"
                      }
                    >
                      {t("starPage.unlockAll", { price: model.bundle.formatted })}
                    </button>
                  ) : null}
                </div>
                {!model.loggedIn ? <p className="text-sm text-[#CFC4BA]">{t("offer.emailLead")}</p> : null}
                <p className="text-[11px] leading-relaxed text-[#A8988C]">{t("legal.disclaimer")}</p>
                {payError ? <p className="text-sm text-red-400">{payError}</p> : null}
              </div>
            ) : null}

            {nextOpen && nextId ? (
              <div className="mt-4 flex items-center gap-5 rounded-3xl border-[1.5px] border-gold bg-card p-8">
                <MiniStar zones={[model.spheres[nextId].zone]} size={26} />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">{t("starPage.further")}</span>
                  <span className="font-serif text-[32px] font-medium">{model.spheres[nextId].name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActive(nextId);
                    scrollTo("decode");
                  }}
                  className="rounded-[14px] bg-ink px-[22px] py-[15px] text-[15px] font-semibold text-card"
                >
                  {t("starPage.readSphere")}
                </button>
              </div>
            ) : null}

            {showMissionNext ? (
              <div className="mt-4 flex items-center gap-5 rounded-3xl border-[1.5px] border-gold bg-card p-8">
                <MiniStar zones={[]} size={26} center />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">{t("starPage.further")}</span>
                  <span className="font-serif text-[32px] font-medium">{t("starPage.soulMission")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onMission();
                    scrollTo("decode");
                  }}
                  className="rounded-[14px] bg-ink px-[22px] py-[15px] text-[15px] font-semibold text-card"
                >
                  {t("starPage.readSphere")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {mounted && panel
        ? createPortal(
            <div
              className={
                panel.type === "point"
                  ? "fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(42,33,29,0.38)] min-[1280px]:items-stretch min-[1280px]:justify-end"
                  : "fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(42,33,29,0.38)] min-[1280px]:items-center"
              }
              onClick={close}
              role="dialog"
              aria-modal="true"
            >
              <div
                className={
                  panel.type === "point"
                    ? "flex max-h-[88vh] w-full max-w-[430px] flex-col gap-[18px] overflow-y-auto rounded-t-3xl bg-card px-5 pb-7 pt-2.5 text-ink shadow-overlay min-[1280px]:h-screen min-[1280px]:max-h-none min-[1280px]:w-[540px] min-[1280px]:max-w-none min-[1280px]:rounded-none min-[1280px]:rounded-l-3xl min-[1280px]:px-11 min-[1280px]:pb-12 min-[1280px]:pt-8 min-[1280px]:gap-[22px]"
                    : "flex max-h-[88vh] w-full max-w-[430px] flex-col gap-[18px] overflow-y-auto rounded-t-3xl bg-card px-5 pb-7 pt-2.5 text-ink shadow-overlay min-[1280px]:w-[500px] min-[1280px]:max-w-none min-[1280px]:rounded-3xl min-[1280px]:p-8"
                }
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-1 w-10 self-center rounded-sm bg-[rgba(80,60,45,0.2)] min-[1280px]:hidden" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                {panel.type === "point"
                  ? t("points.pointEyebrow", { arcana, value: model.star.bridges[BRIDGES[panel.j]].value })
                  : panel.type === "offer"
                    ? t("offer.nextEyebrow", { n: model.order.indexOf(panel.k) + 1 })
                    : t("offer.sphereOf", { n: model.order.indexOf(panel.k) + 1 })}
              </span>
              <button
                type="button"
                aria-label={t("points.close")}
                onClick={close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(80,60,45,0.15)] bg-cream text-xl text-muted"
              >
                ×
              </button>
            </div>

            {panel.type === "point" ? (
              <PointPanel
                model={model}
                j={panel.j}
                ctx={panel.ctx}
                unlocked={unlocked}
                t={t}
                readings={readings}
                onCtx={(s) => setPanel({ type: "point", j: panel.j, ctx: s })}
              />
            ) : null}

            {panel.type === "offer" ? (
              <>
                <div className="flex items-center gap-3.5">
                  <MiniStar zones={[model.spheres[panel.k].zone]} size={30} />
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-serif text-[38px] font-medium leading-none">{model.spheres[panel.k].name}</span>
                    <span className="rounded-full border border-gold bg-[#FBF1E2] px-2.5 py-1 text-xs font-semibold text-gold-text">
                      {t("offer.available")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold">{t("offer.whySphere")}</span>
                  <span className="text-[15px] leading-relaxed text-muted">{model.spheres[panel.k].purpose}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">{seq(panel.k)}</div>
                <div className="flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-sm text-muted">{t("offer.priceLabel")}</span>
                  <span className="text-2xl font-bold text-gold-text">{model.prices[panel.k].formatted}</span>
                </div>
                {!model.loggedIn ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-semibold">{t("offer.emailTitle")}</span>
                    <p className="text-sm leading-relaxed text-muted">{t("offer.emailLead")}</p>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={payEmail}
                      onChange={(e) => setPayEmail(e.target.value)}
                      placeholder={t("offer.emailPlaceholder")}
                      className="min-h-12 rounded-[14px] border border-line bg-cream px-4 text-sm"
                    />
                    {needsPassword ? (
                      <>
                        <p className="text-sm text-muted">{t("offer.passwordLead")}</p>
                        <input
                          type="password"
                          autoComplete="current-password"
                          value={payPassword}
                          onChange={(e) => setPayPassword(e.target.value)}
                          placeholder={t("offer.passwordPlaceholder")}
                          className="min-h-12 rounded-[14px] border border-line bg-cream px-4 text-sm"
                        />
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNeedsPassword(true)}
                        className="self-start bg-transparent py-1 text-sm text-gold-deep"
                      >
                        {t("offer.hasAccount")}
                      </button>
                    )}
                  </div>
                ) : null}
                {model.prices[panel.k]?.soldSeparately ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => goCheckout(pendingSku ?? skuForSphere(panel.k) ?? model.prices[panel.k].sku)}
                    className="min-h-[50px] rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card"
                  >
                    {t("starPage.openSpherePrice", { price: model.prices[panel.k].formatted })}
                  </button>
                ) : null}
                {model.showBundle && model.bundle && nOpen < 5 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => goCheckout(model.bundle!.sku)}
                    className={
                      model.prices[panel.k]?.soldSeparately
                        ? "min-h-11 bg-transparent text-sm text-gold-deep underline underline-offset-4"
                        : "min-h-[50px] rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card"
                    }
                  >
                    {t("starPage.unlockAll", { price: model.bundle.formatted })}
                  </button>
                ) : null}
                <p className="text-[11px] leading-relaxed text-faint">{t("legal.disclaimer")}</p>
                {payError ? <p className="text-sm text-red-700">{payError}</p> : null}
                <button type="button" onClick={close} className="min-h-11 bg-transparent text-sm text-muted">
                  {t("offer.notNow")}
                </button>
              </>
            ) : null}

            {panel.type === "blocked" ? (
              <>
                <div className="flex items-center gap-3.5">
                  <MiniStar zones={[model.spheres[panel.k].zone]} size={30} locked />
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-serif text-[38px] font-medium leading-none">{model.spheres[panel.k].name}</span>
                    <span className="rounded-full bg-[#F1EBE4] px-2.5 py-1 text-xs font-semibold text-muted">{t("offer.blocked")}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-cream p-[18px]">
                  <span className="text-[17px] font-semibold leading-snug">{model.unlockCopy[panel.k]?.blockedTitle}</span>
                  <span className="text-sm leading-relaxed text-muted">{model.unlockCopy[panel.k]?.blockedBody}</span>
                  <button
                    type="button"
                    onClick={() => setWhy((v) => !v)}
                    className="min-h-8 self-start bg-transparent py-1 text-sm font-semibold text-gold-deep underline underline-offset-4"
                  >
                    {t("offer.why")}
                  </button>
                  {why ? (
                    <span className="border-t border-line pt-2.5 text-sm leading-relaxed text-muted">
                      {model.unlockCopy[panel.k]?.whyBody}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold">{t("offer.whySphere")}</span>
                  <span className="text-[15px] leading-relaxed text-muted">{model.spheres[panel.k].purpose}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">{seq(panel.k)}</div>
                {model.nextSphere ? (
                  <button
                    type="button"
                    onClick={() => setPanel({ type: "offer", k: model.nextSphere! })}
                    className="min-h-[50px] rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card"
                  >
                    {t("offer.goToNeeded", { name: model.spheres[model.nextSphere].name })}
                  </button>
                ) : null}
              </>
            ) : null}

              </div>
            </div>,
            document.body
          )
        : null}
      <NewStarDialog open={newStar} onClose={() => setNewStar(false)} />
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1.4" fill="currentColor" />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

function StarBlock(props: {
  star: StarResult;
  mobile: boolean;
  active: SphereId | null;
  missionActive?: boolean;
  unlocked: SphereId[];
  next: SphereId | null;
  hoverPt: number | null;
  hoverZone: number | null;
  selectedPt: number | null;
  labels: Record<SphereId, string>;
  missionLabel: [string, string];
  onSphere: (s: SphereId) => void;
  onPoint: (j: number) => void;
  onMission: () => void;
  onHoverPt: (i: number | null) => void;
  onHoverZone: (i: number | null) => void;
}) {
  return (
    <div className="star-ltr" dir="ltr">
      <StarSvg
        star={props.star}
        mobile={props.mobile}
        activeSphere={props.active}
        missionActive={props.missionActive}
        unlocked={props.unlocked}
        nextSphere={props.next}
        hoverPt={props.hoverPt}
        hoverZone={props.hoverZone}
        selectedPt={props.selectedPt}
        labels={props.labels}
        missionLabel={props.missionLabel}
        onSphere={props.onSphere}
        onPoint={props.onPoint}
        onMission={props.onMission}
        onHoverPt={props.onHoverPt}
        onHoverZone={props.onHoverZone}
      />
    </div>
  );
}

function StarSwitcher({
  model,
  t,
  onNewStar,
  compact
}: {
  model: StarPageModel;
  t: ReturnType<typeof useTranslations>;
  onNewStar: () => void;
  compact?: boolean;
}) {
  const stars = model.siblingStars;
  const chip = compact ? "rounded-full px-2.5 py-1 text-[12px] no-underline" : "rounded-full px-3 py-1.5 text-[13px] no-underline";
  return (
    <div className={`flex flex-col gap-2 ${compact ? "items-center" : ""}`}>
      {stars.length > 1 ? (
        <span className="text-[11px] font-bold tracking-[0.18em] text-faint">{t("starPage.yourStars")}</span>
      ) : null}
      <div className={`flex flex-wrap gap-1.5 ${compact ? "max-w-full justify-center" : ""}`}>
        {stars.map((s) => (
          <Link
            key={s.id}
            href={`/star/${s.id}`}
            className={`${chip} ${
              s.id === model.profileId ? "bg-ink font-semibold text-card" : "border border-line bg-card text-ink"
            }`}
          >
            <LtrText>{s.name || s.displayDate}</LtrText>
            <LtrText className="ms-1 text-[11px] opacity-70">
              {s.unlocked}/{s.total}
            </LtrText>
          </Link>
        ))}
        <button
          type="button"
          onClick={onNewStar}
          className={`${chip} border border-dashed border-gold font-semibold text-gold-text`}
        >
          + {t("nav.newStar")}
        </button>
      </div>
    </div>
  );
}

function HeroCopy({
  model,
  t,
  nOpen,
  progressText,
  onNewStar
}: {
  model: StarPageModel;
  t: ReturnType<typeof useTranslations>;
  nOpen: number;
  progressText: string;
  onNewStar: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-[11px] font-semibold tracking-[0.22em] text-faint">{t("starPage.eyebrow")}</div>
      <h1 className="text-balance font-serif text-[56px] font-medium leading-none">{t("starPage.title")}</h1>
      <p className="text-pretty text-[15px] leading-relaxed text-muted">{t("starPage.lead")}</p>
      <StarSwitcher model={model} t={t} onNewStar={onNewStar} />
      <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand text-gold-deep">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3.5" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 7.5h14M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-xs text-faint">{t("starPage.dob")}</span>
          <span className="text-base font-semibold">
            <LtrText>{model.displayDate}</LtrText>
          </span>
        </div>
        <Link href="/" className="rounded-full border border-[rgba(80,60,45,0.15)] px-3.5 py-2 text-[13px] text-muted no-underline">
          {t("starPage.change")}
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted">{t("starPage.opened")}</span>
          <span className="font-bold">{progressText}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-[3px] ${i < nOpen ? "bg-gold" : "bg-[rgba(80,60,45,0.12)]"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActiveCard({
  act,
  part,
  chips,
  onDecode,
  t,
  zone,
  center,
  open
}: {
  act: { name: string; purpose: string };
  part: string;
  chips: React.ReactNode;
  onDecode: () => void;
  t: ReturnType<typeof useTranslations>;
  zone: number;
  center?: boolean;
  open: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-line bg-[rgba(251,248,244,0.92)] p-8 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold tracking-[0.22em] text-gold-deep">{t("starPage.openSphere")}</span>
        <MiniStar zones={center ? [] : [zone]} size={26} center={center} />
      </div>
      <div className="flex flex-col items-start gap-3">
        <div className="font-serif text-[42px] font-medium leading-none">{act.name}</div>
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${open ? "bg-open-bg text-open-text" : "bg-[#F1EBE4] text-muted"}`}
          >
            {open ? t("starPage.openedBadge") : t("starPage.lockedBadge")}
          </span>
          <span className="text-[13px] text-faint">{part}</span>
        </div>
      </div>
      <p className="text-pretty text-[15px] leading-relaxed text-muted">{act.purpose}</p>
      {open ? (
        <>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold">{t("starPage.yourNumbers")}</span>
            <div className="flex flex-wrap gap-2">{chips}</div>
          </div>
          {center ? null : (
            <div className="flex items-start gap-2.5 rounded-xl bg-cream px-3.5 py-3 text-[13px] leading-relaxed text-muted">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border-[1.5px] border-[#C78A3E]" />
              <span>{t("starPage.clickHint")}</span>
            </div>
          )}
        </>
      ) : null}
      <button
        type="button"
        onClick={onDecode}
        className="flex items-center justify-center gap-2.5 rounded-[14px] bg-ink py-4 text-[15px] font-semibold text-card"
      >
        {t("starPage.goDecode")}
      </button>
    </div>
  );
}

function MobileHero(props: {
  model: StarPageModel;
  t: ReturnType<typeof useTranslations>;
  nOpen: number;
  progressText: string;
  act: { name: string; purpose: string; zone: number; center?: boolean };
  chips: React.ReactNode;
  active: SphereId | null;
  missionActive?: boolean;
  labels: Record<SphereId, string>;
  missionLabel: [string, string];
  hoverPt: number | null;
  hoverZone: number | null;
  selectedPt: number | null;
  onSphere: (s: SphereId) => void;
  onPoint: (j: number) => void;
  onMission: () => void;
  onHoverPt: (i: number | null) => void;
  onHoverZone: (i: number | null) => void;
  onDecode: () => void;
  open: boolean;
  tip: React.ReactNode;
  onNewStar: () => void;
}) {
  const { model, t, open } = props;
  return (
    <div className="relative mx-auto max-w-[430px] overflow-visible pb-10">
      <div
        className="pointer-events-none absolute left-1/2 top-[150px] h-[520px] w-[520px] -translate-x-1/2"
        style={{ background: "radial-gradient(closest-side,rgba(242,205,150,.45),rgba(245,240,234,0))" }}
      />
      <div className="relative flex flex-col items-center gap-2.5 px-5 pt-1.5 text-center">
        <span className="text-[10px] font-semibold tracking-[0.22em] text-faint">{t("starPage.eyebrow")}</span>
        <span className="font-serif text-[32px] font-medium leading-tight">{t("starPage.title")}</span>
        <div className="flex items-center gap-2.5 text-sm">
          <span className="font-semibold">
            <LtrText>{model.displayDate}</LtrText>
          </span>
          <Link href="/" className="rounded-full border border-[rgba(80,60,45,0.15)] px-3 py-1 text-xs text-muted no-underline">
            {t("starPage.change")}
          </Link>
        </div>
        <div className="pt-1">
          <StarSwitcher model={model} t={t} onNewStar={props.onNewStar} compact />
        </div>
      </div>
      <div className="px-1.5 pt-1">
        <div className="relative">
          <StarBlock
            star={model.star}
            mobile
            active={props.active}
            missionActive={props.missionActive}
            unlocked={model.unlocked}
            next={model.nextSphere}
            hoverPt={props.hoverPt}
            hoverZone={props.hoverZone}
            selectedPt={props.selectedPt}
            labels={props.labels}
            missionLabel={props.missionLabel}
            onSphere={props.onSphere}
            onPoint={props.onPoint}
            onMission={props.onMission}
            onHoverPt={props.onHoverPt}
            onHoverZone={props.onHoverZone}
          />
          {props.tip}
        </div>
      </div>
      <div className="relative flex flex-col gap-2 px-5 pb-4">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`h-[5px] rounded ${i < props.nOpen ? "bg-gold" : "bg-[rgba(80,60,45,0.12)]"}`} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>
            {t("starPage.opened")}: {props.progressText}
          </span>
          <span className="text-faint">{t("starPage.tapHint")}</span>
        </div>
      </div>
      <div className="relative mx-3.5 flex flex-col gap-3.5 rounded-[22px] border-[1.5px] border-gold bg-card p-5">
        <div className="flex items-center gap-2.5">
          <MiniStar zones={props.act.center ? [] : [props.act.zone]} size={26} center={props.act.center} />
          <span className="flex-1 text-[17px] font-semibold">{props.act.name}</span>
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${open ? "bg-open-bg text-open-text" : "bg-[#F1EBE4] text-muted"}`}
          >
            {open ? t("starPage.openedBadge") : t("starPage.lockedBadge")}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted">{props.act.purpose}</p>
        {open ? <div className="flex flex-wrap gap-1.5">{props.chips}</div> : null}
        <button
          type="button"
          onClick={props.onDecode}
          className="flex min-h-12 items-center justify-center rounded-[14px] bg-ink py-3.5 text-[15px] font-semibold text-card"
        >
          {t("starPage.goDecode")}
        </button>
      </div>
    </div>
  );
}

function PointPanel({
  model,
  j,
  ctx,
  unlocked,
  t,
  readings,
  onCtx
}: {
  model: StarPageModel;
  j: number;
  ctx: SphereId;
  unlocked: Set<SphereId>;
  t: ReturnType<typeof useTranslations>;
  readings: Record<SphereId, ArcReading[]>;
  onCtx: (s: SphereId) => void;
}) {
  const bridge = BRIDGES[j];
  const value = model.star.bridges[bridge].value;
  const ks = model.star.bridges[bridge].spheres;
  const other = ks.find((k) => k !== ctx)!;
  const fatal = BRIDGE_KIND[bridge] === "fatal_error";
  const pointKey = model.star.spheres[ctx].leftBase.id === bridge ? "leftBase" : "rightBase";
  const content = readings[ctx]?.find((a) => a.point === pointKey)?.content;
  const typeLabel = readings[ctx]?.find((a) => a.point === pointKey)?.role ?? (fatal ? t("points.fatal") : t("points.ancestral"));
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold text-xl font-bold text-gold-text">
          {value}
        </span>
        <span className="font-serif text-[38px] font-medium leading-none">{typeLabel}</span>
      </div>
      <div className="flex gap-1.5 rounded-xl bg-[#F1EBE4] p-1">
        {ks.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              if (unlocked.has(k)) onCtx(k);
            }}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2.5 text-sm font-semibold ${
              k === ctx ? "bg-card text-ink shadow-[0_2px_8px_rgba(80,60,45,0.10)]" : unlocked.has(k) ? "text-muted" : "text-lock"
            }`}
          >
            {model.spheres[k].name}
            {!unlocked.has(k) ? <LockIcon /> : null}
          </button>
        ))}
      </div>
      <div className="text-[17px] font-semibold leading-snug">{t("points.leadIn", { name: model.spheres[ctx].name })}</div>
      {content?.type === "plain" ? (
        <>
          {content.lead ? <div className="text-pretty text-base leading-[1.75] text-muted">{content.lead}</div> : null}
          {content.paragraphs.map((p) => (
            <div key={p.slice(0, 16)} className="text-pretty text-base leading-[1.75] text-muted">
              {p}
            </div>
          ))}
        </>
      ) : content?.type === "structured" ? (
        content.blocks.map((sb) => (
          <div key={sb.label} className="flex flex-col gap-2 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="text-sm font-semibold">
              {sb.mark} {sb.label}
            </span>
            <span className="text-pretty text-base leading-[1.75] text-muted">{sb.text}</span>
          </div>
        ))
      ) : null}
      <div className="rounded-xl bg-cream px-3.5 py-3 text-[13px] leading-relaxed text-faint">
        {unlocked.has(other) ? t("points.samePoint", { name: model.spheres[other].name }) : t("points.samePointLocked", { name: model.spheres[other].name })}
      </div>
    </>
  );
}
