"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { SphereId } from "@/lib/engine";
import { sphereSlotKind, ZONE_TO_SPHERE } from "@/lib/engine";
import { V2StarSvg, type HoverTip } from "./StarSvg";
import { V2LockIcon, V2MiniStar, V2TriangleSvg } from "./TriangleSvg";
import { SphereArt } from "./SphereArt";
import { V3Logo } from "./Logo";
import { V3UserCluster } from "./UserCluster";
import { CornerFrame } from "./CornerFrame";
import { sphereInnerDots, starGeometry, type Pt } from "@/components/star/geometry";
import type { ArcReading, StarPageModel } from "@/lib/domain/star-page";
import type { PatternReading } from "@/lib/domain/patterns";
import type { NavStar } from "@/lib/domain/nav-stars";
import { trackPixel } from "@/components/analytics/MetaPixel";
import { trackClient } from "@/components/analytics/ids";
import { signIn } from "next-auth/react";
import { LtrText } from "@/components/ui/LtrText";
import {
  SPHERE_TINT,
  V3_BOOK_BG,
  V3_BTN_RED,
  V3_CARD,
  V3_FONT_BODY,
  V3_FONT_DISPLAY,
  V3_GOLD,
  V3_INK,
  V3_MISSION,
  V3_MUTED,
  V3_RED,
} from "@/lib/v3";
import { PayHint } from "@/components/pay/PayHint";

type ViewId = SphereId | "soulMission";

type Panel =
  | { type: "point"; j: number; ctx: SphereId }
  | { type: "offer"; k: SphereId }
  | { type: "blocked"; k: SphereId }
  | { type: "mission" };

const BRIDGES = ["p23", "p34", "p45", "p51", "p12"] as const;
const INNER_SLOTS = ["innerLeft", "innerRight", "innerBottom"] as const;

export function V3StarExperience({
  model,
  readings,
  missionReading,
  patterns = [],
  focusLatest,
  user,
  stars = []
}: {
  model: StarPageModel;
  readings: Record<SphereId, ArcReading[]>;
  missionReading: ArcReading | null;
  patterns?: PatternReading[];
  focusLatest?: boolean;
  user: { name?: string | null; email?: string | null; role?: string } | null;
  stars?: NavStar[];
}) {
  const t = useTranslations();
  const arcana = t("terms.arcana");
  const unlocked = useMemo(() => new Set(model.unlocked), [model.unlocked]);
  const nOpen = model.unlocked.length;
  const missionOpen = nOpen >= 5;
  const firstOpen =
    (focusLatest ? [...model.order].reverse().find((s) => unlocked.has(s)) : model.order.find((s) => unlocked.has(s))) ??
    model.order[0];
  const [active, setActive] = useState<ViewId>(firstOpen);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [why, setWhy] = useState(false);
  const [hoverPt, setHoverPt] = useState<number | null>(null);
  const [hoverZone, setHoverZone] = useState<number | null>(null);
  const [hoverTip, setHoverTip] = useState<HoverTip | null>(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [payEmail, setPayEmail] = useState("");
  const [payPassword, setPayPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hoverOk, setHoverOk] = useState(false);
  const [width, setWidth] = useState(1440);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const apply = () => setHoverOk(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    const onR = () => setWidth(window.innerWidth);
    onR();
    window.addEventListener("resize", onR);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", onR);
    };
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
    return () => window.removeEventListener("keydown", onK);
  }, [firstOpen, model.profileId]);

  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panel]);

  const isMob = width < 900;
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
    setHoverTip(null);
  }

  function onMission() {
    setWhy(false);
    setHoverPt(null);
    setHoverTip(null);
    trackClient("sphere_viewed", { profileId: model.profileId, payload: { sphere: "soulMission" } });
    if (missionOpen) {
      setActive("soulMission");
      setPanel(null);
      requestAnimationFrame(() => scrollTo("decode"));
      return;
    }
    setPanel({ type: "mission" });
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
    setHoverTip(null);
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (id === "decode" ? 8 : 90), behavior: "smooth" });
  }

  async function buy(
    sku: string,
    useSavedMethod = true,
    extra?: { recChannel?: "email" | "tg"; recContact?: string; email?: string }
  ) {
    setBusy(true);
    setPayError("");
    try {
      if (!model.loggedIn) {
        const email = extra?.email?.trim() || payEmail.trim();
        if (!email) {
          setPayError(t("offer.emailRequired"));
          if (model.nextSphere && sku !== model.recommendation?.sku) setPanel({ type: "offer", k: model.nextSphere });
          setBusy(false);
          return;
        }
        const idRes = await fetch("/api/auth/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, profileId: model.profileId, locale: model.locale })
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
            email,
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
            email: identified.email ?? email,
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
        body: JSON.stringify({
          profileId: model.profileId,
          sku,
          useSavedMethod,
          recChannel: extra?.recChannel,
          recContact: extra?.recContact
        })
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

  async function goCheckout(sku: string, useSavedMethod = true) {
    if (busy || !sku) return;
    if (!model.loggedIn && panel?.type !== "offer") {
      setPendingSku(sku);
      if (model.nextSphere) setPanel({ type: "offer", k: model.nextSphere });
      return;
    }
    const paySku = pendingSku || sku;
    setPendingSku(null);
    await buy(paySku, useSavedMethod);
  }

  const labels = Object.fromEntries(model.order.map((id) => [id, model.spheres[id].name])) as Record<SphereId, string>;
  const viewingMission = active === "soulMission";
  const act = viewingMission
    ? {
        name: t("starPage.soulMission"),
        purpose: missionOpen ? t("starPage.soulMissionPurpose") : t("offer.missionLocked"),
        part: t("starPage.soulMissionPart"),
        zone: -1
      }
    : model.spheres[active];
  const col = viewingMission ? V3_MISSION : SPHERE_TINT[active];
  const arcs = viewingMission ? (missionOpen && missionReading ? [missionReading] : []) : (readings[active] ?? []);
  const activeOpen = viewingMission ? missionOpen : unlocked.has(active);
  const progressText = t("starPage.progressCount", { n: nOpen, total: 5 });
  const missionWords = t("starPage.soulMission").split(" ");
  const missionLabel: [string, string] = [missionWords[0] ?? "Миссия", missionWords.slice(1).join(" ") || "души"];
  const missionChip: "a" | "o" | "x" | "l" = viewingMission && missionOpen ? "a" : missionOpen ? "o" : !model.nextSphere ? "x" : "l";
  const missionChipStyle: Record<"a" | "o" | "x" | "l", React.CSSProperties> = {
    a: { background: V3_MISSION.a2, color: "#FFFFFF" },
    o: { background: V3_MISSION.t, color: V3_MISSION.ink },
    x: { background: "#FFFFFF", color: V3_MISSION.ink, outline: "1.5px dashed " + V3_MISSION.acc, outlineOffset: -2 },
    l: { background: "transparent", color: "#6B6461", fontWeight: 600 }
  };
  const nextIdx = viewingMission ? -1 : model.order.indexOf(active) + 1;
  const nextId = nextIdx >= 0 ? model.order[nextIdx] : undefined;
  const nextOpen = Boolean(nextId && unlocked.has(nextId));
  const offerNext = Boolean(model.nextSphere && nOpen < 5 && !nextOpen);
  const showMissionNext = !viewingMission && !nextId && missionOpen;

  function skuForSphere(k: SphereId): string | undefined {
    const price = model.prices[k];
    if (price?.soldSeparately) return price.sku;
    return model.bundle?.sku;
  }

  function numberTip(): React.ReactNode {
    if (!hoverOk || !hoverTip || panel) return null;
    const { O, I } = starGeometry();
    let at: Pt = [0, 0];
    let eyebrow = "";
    let value = "";
    let hint = "";
    if (hoverTip.kind === "bridge") {
      at = I[hoverTip.j];
      const ks = ptSpheres(hoverTip.j);
      const open = ks.some((s) => unlocked.has(s));
      const ctx = active !== "soulMission" && ks.includes(active) ? active : ks.find((s) => unlocked.has(s));
      const pointKey =
        ctx && model.star.spheres[ctx].leftBase.id === BRIDGES[hoverTip.j] ? "leftBase" : "rightBase";
      const fatal = ctx ? sphereSlotKind(ctx, pointKey) === "fatal_error" : false;
      eyebrow = (fatal ? t("points.fatal") : t("points.ancestral")).toUpperCase();
      value = open ? t("points.arcana", { arcana, value: model.star.bridges[BRIDGES[hoverTip.j]].value }) : t("points.hidden");
      hint =
        open && ctx
          ? t("points.clickRead", { name: model.spheres[ctx].name })
          : t("points.opensWith", { name: model.spheres[ks[0]].name });
    } else if (hoverTip.kind === "apex") {
      const sphere = ZONE_TO_SPHERE[hoverTip.zone];
      const open = unlocked.has(sphere);
      at = O[hoverTip.zone];
      eyebrow = t("points.apex", { arcana }).toUpperCase();
      value = open ? t("points.arcana", { arcana, value: model.star.spheres[sphere].apex.value }) : t("points.hidden");
      hint = open ? t("points.clickRead", { name: model.spheres[sphere].name }) : t("points.opensWith", { name: model.spheres[sphere].name });
    } else if (hoverTip.kind === "inner") {
      const sphere = ZONE_TO_SPHERE[hoverTip.zone];
      const open = unlocked.has(sphere);
      at = sphereInnerDots(hoverTip.zone)[hoverTip.slot];
      const n = model.star.spheres[sphere][INNER_SLOTS[hoverTip.slot]].value;
      eyebrow = t("points.inner", { arcana }).toUpperCase();
      value = open ? t("points.arcana", { arcana, value: n }) : t("points.hidden");
      hint = open ? t("points.clickRead", { name: model.spheres[sphere].name }) : t("points.opensWith", { name: model.spheres[sphere].name });
    } else {
      at = [0, 0];
      eyebrow = t("points.soul").toUpperCase();
      value = missionOpen ? t("points.arcana", { arcana, value: model.star.core.soulMission.value }) : t("points.hidden");
      hint = missionOpen ? t("points.clickRead", { name: t("points.soul") }) : t("offer.missionLocked");
    }
    // Matches v3 StarSvg viewBox="-155 -152 310 276"
    const vb = { x: -155, y: -152, w: 310, h: 276 };
    return (
      <div
        className="pointer-events-none absolute z-[3] flex w-[230px] flex-col gap-1 px-4 py-3 shadow-[0_12px_30px_rgba(90,60,30,.15)]"
        style={{
          background: "rgba(255,255,255,.96)",
          color: V3_INK,
          borderTop: `1px solid ${V3_RED}`,
          left: `${((at[0] - vb.x) / vb.w) * 100}%`,
          top: `${((at[1] - vb.y) / vb.h) * 100}%`,
          transform: "translate(-50%, calc(-100% - 18px))"
        }}
      >
        <span className="text-[11px] tracking-[0.16em]" style={{ color: V3_RED }}>{eyebrow}</span>
        <span className="text-[20px]" style={{ fontFamily: V3_FONT_DISPLAY }}>{value}</span>
        <span className="text-xs leading-snug" style={{ color: V3_MUTED }}>{hint}</span>
      </div>
    );
  }

  const chipD = isMob ? 44 : 48;
  const chipBase: React.CSSProperties = {
    width: chipD,
    height: chipD,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: V3_FONT_DISPLAY,
    fontWeight: 400,
    boxSizing: "border-box",
    padding: 0,
    fontSize: 22,
    lineHeight: 1,
    cursor: "default",
    border: "none"
  };

  const seq = (target: SphereId | null) => {
    const base: React.CSSProperties = {
      fontSize: 12,
      fontWeight: 700,
      padding: "6px 11px",
      borderRadius: 999,
      whiteSpace: "nowrap"
    };
    const spheres = model.order.map((id, i) => {
      const tint = SPHERE_TINT[id];
      let st: React.CSSProperties;
      if (unlocked.has(id)) st = { background: tint.t, color: tint.ink, border: "1px solid " + tint.t };
      else if (id === model.nextSphere) st = { background: "#FFFFFF", color: tint.ink, border: "1.5px dashed " + tint.acc };
      else if (id === target) st = { background: "transparent", color: V3_INK, border: "1px dashed #6B6461" };
      else st = { background: "transparent", color: "#AFA8B8", border: "1px solid rgba(26,26,26,.10)" };
      return (
        <span key={id} style={{ ...base, ...st }}>
          {unlocked.has(id) ? "✓ " : `${i + 1}. `}
          {model.spheres[id].name}
        </span>
      );
    });
    const missionSt: React.CSSProperties = missionOpen
      ? { background: V3_MISSION.t, color: V3_MISSION.ink, border: "1px solid " + V3_MISSION.t }
      : target === null && panel?.type === "mission"
        ? { background: "transparent", color: V3_INK, border: "1px dashed #6B6461" }
        : { background: "transparent", color: "#AFA8B8", border: "1px solid rgba(26,26,26,.10)" };
    return [
      ...spheres,
      <span key="soulMission" style={{ ...base, ...missionSt }}>
        {missionOpen ? "✓ " : "6. "}
        {t("starPage.soulMission")}
      </span>
    ];
  };

  const starBlock = (
    <div className="star-ltr relative w-full max-w-[600px]" dir="ltr">
      <V2StarSvg
        star={model.star}
        mobile={isMob}
        lockStyle="blur"
        activeSphere={viewingMission ? null : active}
        missionActive={viewingMission}
        unlocked={model.unlocked}
        nextSphere={model.nextSphere}
        hoverPt={hoverPt}
        hoverZone={hoverZone}
        hoverTip={hoverTip}
        selectedPt={panel?.type === "point" ? panel.j : null}
        labels={labels}
        missionLabel={missionLabel}
        onSphere={onSphere}
        onPoint={onPoint}
        onMission={onMission}
        onHoverPt={setHoverPt}
        onHoverZone={setHoverZone}
        onHoverTip={setHoverTip}
      />
      {numberTip()}
    </div>
  );

  const nextTint = model.nextSphere ? SPHERE_TINT[model.nextSphere] : null;

  return (
    <div className="v3-root min-h-screen overflow-x-clip" style={{ background: `#F6F3F3 url(${V3_BOOK_BG}) center/cover fixed`, color: V3_INK, fontFamily: V3_FONT_BODY, fontWeight: 300 }}>
      <div className="mx-auto flex max-w-[1360px] items-center gap-2 px-[clamp(16px,3vw,40px)] py-5 sm:gap-3">
        <Link href={"/"} className="flex min-w-0 flex-1 items-center no-underline">
          <V3Logo />
        </Link>
        <Link
          href={"/"}
          className="hidden items-center gap-3.5 py-2 pe-2 ps-[18px] text-sm no-underline md:flex"
          style={{ color: V3_INK, background: "rgba(255,255,255,.55)" }}
        >
          <span className="text-[#6B6461]">{t("starPage.dob")}</span>
          <b style={{ fontFamily: V3_FONT_DISPLAY, fontSize: 20, color: V3_RED, letterSpacing: "0.04em", fontWeight: 400 }}>
            <LtrText>{model.displayDate}</LtrText>
          </b>
          <span className="border border-[#1A1A1A] px-3 py-[7px] text-[12px] uppercase tracking-[0.08em]">{t("starPage.change")}</span>
        </Link>
        <V3UserCluster locale={model.locale} user={user} stars={stars} />
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-[clamp(16px,3vw,40px)] pb-24 pt-1">
        <div className="flex flex-row-reverse flex-wrap gap-4">
          <CornerFrame
            className="flex min-w-0 flex-[1.3_1_520px] flex-col gap-3 overflow-visible p-[clamp(24px,3vw,44px)]"
            style={{ background: V3_CARD }}
            arm={52}
          >
            <div className="relative flex flex-wrap items-start justify-end gap-4 text-xs tracking-[0.06em]" style={{ color: V3_MUTED }}>
              <div className="flex flex-wrap gap-[18px]">
                <LegendDot fill="rgba(185,147,83,.35)" label={t("v2.openLegend")} />
                <LegendDot solidBorder label={t("v2.readingLegend")} />
                <LegendDot dashed label={t("v2.nextLegend")} />
                <LegendDot outlineMuted label={t("v2.lockedLegend")} />
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-[620px]">{starBlock}</div>
            </div>
          </CornerFrame>

          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
            <div className="flex flex-col gap-2.5 px-1 pt-2">
              <span className="text-xs uppercase tracking-[0.2em]" style={{ color: V3_RED }}>{t("starPage.eyebrow")}</span>
              <span className="text-balance text-[clamp(34px,4vw,54px)] uppercase leading-[1.02] tracking-[0.02em]" style={{ fontFamily: V3_FONT_DISPLAY }}>
                {t("v3.starTitle")}
              </span>
              <span className="max-w-[440px] text-[15px] leading-[1.7]" style={{ color: "#3A3532" }}>
                {t("v3.starLead")}
              </span>
              <Link href={"/"} className="flex items-center gap-2 text-sm no-underline md:hidden" style={{ color: V3_INK }}>
                <span className="text-[#6B6461]">{t("starPage.dob")}</span>
                <b>
                  <LtrText>{model.displayDate}</LtrText>
                </b>
              </Link>
            </div>
            <CornerFrame
              className="relative flex flex-1 flex-col gap-5 overflow-visible p-[clamp(24px,2.6vw,36px)]"
              style={{ background: V3_CARD }}
              arm={55}
            >
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-xs tracking-[0.2em]" style={{ color: V3_RED }}>
                  {viewingMission ? t("offer.center") : t("v2.sphereOf", { n: model.order.indexOf(active) + 1 })}
                </span>
                <span className="flex h-[52px] w-[52px] items-center justify-center">
                  <V2MiniStar zones={viewingMission ? [] : [act.zone]} size={24} center={viewingMission} />
                </span>
              </div>
              <div className="relative flex flex-col gap-3">
                <span className="text-[clamp(36px,3.6vw,50px)] uppercase leading-none tracking-[0.03em]" style={{ fontFamily: V3_FONT_DISPLAY }}>{act.name}</span>
                <span className="text-[15px] leading-[1.7] text-pretty" style={{ color: "#3A3532" }}>{act.purpose}</span>
              </div>
              {activeOpen ? (
                <div className="relative flex flex-col gap-3">
                  <span className="text-xs uppercase tracking-[0.14em]" style={{ color: V3_MUTED }}>
                    {t("starPage.yourNumbers")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {arcs.map((ar, i) => {
                      const style: React.CSSProperties =
                        i === 0
                          ? { ...chipBase, background: V3_RED, color: "#FFFFFF", fontSize: 24 }
                          : i < 3
                            ? {
                                ...chipBase,
                                background: "rgba(255,255,255,.7)",
                                color: V3_RED,
                                border: `1.5px solid ${V3_GOLD}`,
                                cursor: "pointer"
                              }
                            : {
                                ...chipBase,
                                background: "transparent",
                                color: V3_INK,
                                border: "1px solid rgba(185,147,83,.55)"
                              };
                      return (
                        <button
                          key={ar.id}
                          type="button"
                          title={ar.role}
                          style={style}
                          onClick={() => {
                            if (!viewingMission && i === 1) onPoint((ZONE_TO_SPHERE.indexOf(active) + 4) % 5);
                            else if (!viewingMission && i === 2) onPoint(ZONE_TO_SPHERE.indexOf(active));
                            else scrollTo(ar.id);
                          }}
                        >
                          {ar.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => scrollTo("decode")}
                className={`${V3_BTN_RED} relative flex min-h-14 w-full items-center justify-between px-[22px] text-[18px] uppercase tracking-[0.12em]`}
                style={{ fontFamily: V3_FONT_DISPLAY }}
              >
                {t("v2.readDecode")}
                <span aria-hidden className="text-xl">
                  ↓
                </span>
              </button>
            </CornerFrame>
          </div>
        </div>

        <section id="decode" className="flex flex-col gap-6 pt-10 lg:gap-6 lg:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <span
              className="text-[clamp(34px,4.4vw,56px)] uppercase leading-none tracking-[0.03em]"
              style={{ fontFamily: V3_FONT_DISPLAY }}
            >
              {t("starPage.decodeTitle")}
            </span>
            <span className="text-sm" style={{ color: V3_MUTED }}>
              {t("v2.openedCount")}{" "}
              <b style={{ color: V3_RED, fontFamily: V3_FONT_DISPLAY, fontSize: 22, fontWeight: 400 }}>{progressText}</b>
            </span>
          </div>
          <div
            className="sticky top-2.5 z-[5] flex gap-1 overflow-x-auto p-1.5 no-scrollbar"
            style={{ background: "rgba(255,255,255,.78)", backdropFilter: "blur(12px)", borderTop: `1px solid ${V3_RED}` }}
          >
            {model.order.map((id) => {
              const tint = SPHERE_TINT[id];
              const st = id === active ? "a" : unlocked.has(id) ? "o" : id === model.nextSphere ? "x" : "l";
              const v: Record<string, React.CSSProperties> = {
                a: { background: V3_RED, color: "#FFFFFF" },
                o: { background: "rgba(185,147,83,.22)", color: V3_INK },
                x: { background: "transparent", color: V3_INK, outline: "1.5px dashed " + V3_RED, outlineOffset: -2 },
                l: { background: "transparent", color: "#6B6461", fontWeight: 600 }
              };
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSphere(id)}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none px-4 py-2.5 text-sm font-bold"
                  style={{ minHeight: 44, border: "none", cursor: "pointer", ...v[st] }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-none"
                    style={{ background: st === "a" ? "#FFFFFF" : st === "l" ? "#D9D4DE" : tint.a2 }}
                  />
                  {model.spheres[id].name}
                  {!unlocked.has(id) ? <V2LockIcon /> : null}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onMission}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none px-4 py-2.5 text-sm font-bold"
              style={{ minHeight: 44, border: "none", cursor: "pointer", ...missionChipStyle[missionChip] }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-none"
                style={{ background: missionChip === "a" ? "#FFFFFF" : missionChip === "l" ? "#D9D4DE" : V3_MISSION.a2 }}
              />
              {t("starPage.soulMission")}
              {!missionOpen ? <V2LockIcon /> : null}
            </button>
          </div>

          <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:gap-4">
            <aside
              className="relative hidden min-w-0 flex-[1_1_300px] flex-col gap-[18px] overflow-hidden p-[22px] lg:flex"
              style={{ maxWidth: 360, position: "sticky", top: 84, background: V3_CARD }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(rgba(217,165,92,.16) 1.2px, transparent 1.7px)",
                  backgroundSize: "16px 16px"
                }}
              />
              <div className="relative flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-none bg-[#F8EACB]">
                  <V2MiniStar zones={viewingMission ? [] : [act.zone]} size={24} center={viewingMission} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{t("starPage.fragment")}</span>
                  <span className="text-xs opacity-70">{act.part}</span>
                </div>
              </div>
              {activeOpen && !viewingMission ? (
                <div className="relative flex justify-center py-1">
                  <V2TriangleSvg width={isMob ? 150 : 190} sphere={active} star={model.star} onPoint={onPoint} />
                </div>
              ) : null}
              {activeOpen ? (
                <div className="relative flex flex-col gap-0.5 border-t border-[rgba(26,26,26,.08)] pt-2.5">
                  <span className="px-2 pb-1.5 pt-2 text-[11px] tracking-[0.2em]" style={{ color: V3_RED }}>
                    {t("starPage.contents")}
                  </span>
                  {arcs.map((ar, i) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => scrollTo(ar.id)}
                      className="flex items-center gap-3 rounded-[14px] px-2 py-2 text-left hover:bg-[#F6F3F3]"
                      style={{ color: V3_INK, background: "none", border: "none", cursor: "pointer" }}
                    >
                      <span
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center text-[18px]"
                        style={{
                          borderRadius: "50%",
                          fontFamily: V3_FONT_DISPLAY,
                          color: i === 0 ? "#FFFFFF" : V3_RED,
                          background: i === 0 ? V3_RED : "transparent",
                          border: i === 0 ? "none" : `1px solid ${V3_GOLD}`,
                          boxSizing: "border-box"
                        }}
                      >
                        {ar.value}
                      </span>
                      <span className="flex flex-col gap-px">
                        <span className="text-sm font-bold">{ar.content?.title ?? t("points.arcana", { arcana, value: ar.value })}</span>
                        <span className="text-xs text-[#6B6461]">{ar.role}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </aside>

            <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-[999_1_520px] lg:gap-4">
              <CornerFrame
                className="flex flex-col gap-4 p-[clamp(24px,3vw,40px)] lg:flex-row lg:flex-wrap lg:items-center lg:gap-6"
                style={{ background: V3_CARD }}
                arm={50}
              >
                <div className="relative aspect-[2/1] w-full overflow-hidden lg:order-last lg:aspect-auto lg:flex lg:min-h-[240px] lg:w-auto lg:flex-[1_1_240px] lg:justify-center">
                  <div className="relative h-full min-h-[220px] w-full max-w-[300px]">
                    <SphereArt sphere={viewingMission ? undefined : active} mission={viewingMission} />
                  </div>
                </div>
                <div className="relative z-[1] flex min-w-0 flex-col items-start justify-center gap-4 lg:flex-[1_1_300px]">
                  <span className="text-xs tracking-[0.2em]" style={{ color: V3_RED }}>
                    {viewingMission
                      ? t("offer.center")
                      : `${t("v2.sphereOf", { n: model.order.indexOf(active) + 1 })} · ${act.part.toUpperCase()}`}
                  </span>
                  <span
                    className="text-[clamp(40px,4.4vw,62px)] uppercase leading-none tracking-[0.03em]"
                    style={{ fontFamily: V3_FONT_DISPLAY }}
                  >
                    {act.name}
                  </span>
                  <span className="text-[17px] leading-[1.75] text-pretty" style={{ color: "#2E2A28" }}>
                    {act.purpose}
                  </span>
                  <span
                    className="px-3 py-1.5 text-[12px] tracking-[0.14em]"
                    style={
                      activeOpen
                        ? { color: "#8A6A33", border: `1px solid ${V3_GOLD}` }
                        : { color: "#6B6461", border: "1px solid rgba(26,26,26,.2)" }
                    }
                  >
                    {activeOpen ? `✓ ${t("starPage.openedBadge")}` : t("starPage.lockedBadge")}
                  </span>
                </div>
              </CornerFrame>
              {activeOpen && !viewingMission ? (
                <div className="flex items-center gap-4 p-4 lg:hidden">
                  <V2TriangleSvg width={120} sphere={active} star={model.star} onPoint={onPoint} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-bold">{t("starPage.fragment")}</span>
                    <span className="text-xs leading-snug text-[#6B6461]">{t("starPage.tapTriangle")}</span>
                  </div>
                </div>
              ) : null}

              {activeOpen
                ? arcs.map((ar, i) => (
                    <CornerFrame
                      key={ar.id}
                      id={ar.id}
                      className="relative flex flex-col gap-5 overflow-visible p-[clamp(22px,3vw,36px)]"
                      style={{ background: V3_CARD, scrollMarginTop: 90 }}
                      arm={40}
                    >
                      <div className="relative flex items-center gap-5">
                        <span
                          className="flex shrink-0 items-center justify-center"
                          style={{
                            width: i === 0 ? 84 : 66,
                            height: i === 0 ? 84 : 66,
                            borderRadius: "50%",
                            fontSize: i === 0 ? 44 : 32,
                            color: V3_RED,
                            border: `${i === 0 ? 1.5 : 1}px solid ${V3_GOLD}`,
                            background: "rgba(255,255,255,.6)",
                            fontFamily: V3_FONT_DISPLAY,
                            lineHeight: 1
                          }}
                        >
                          {ar.value}
                        </span>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs tracking-[0.18em]" style={{ color: V3_RED }}>
                            {ar.roleUp}
                          </span>
                          <span
                            className="text-[clamp(28px,2.8vw,38px)] uppercase leading-none tracking-[0.03em]"
                            style={{ fontFamily: V3_FONT_DISPLAY }}
                          >
                            {ar.content?.title ?? t("points.arcana", { arcana, value: ar.value })}
                          </span>
                        </div>
                      </div>
                      {ar.content?.type === "structured" ? (
                        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3.5">
                          {ar.content.blocks.map((sb) => (
                            <div
                              key={sb.label}
                              className="flex flex-col gap-2.5 px-5 py-5"
                              style={{ background: "rgba(255,255,255,.55)", border: "1px solid rgba(185,147,83,.35)" }}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 text-[22px]" style={{ color: V3_RED, fontFamily: V3_FONT_DISPLAY }}>
                                  {sb.mark}
                                </span>
                                <span className="text-[19px] uppercase tracking-[0.06em]" style={{ fontFamily: V3_FONT_DISPLAY }}>
                                  {sb.label}
                                </span>
                              </div>
                              <div className="text-base leading-[1.7] text-pretty" style={{ color: "#2E2A28" }}>
                                {sb.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="relative flex max-w-[720px] flex-col gap-3.5">
                          {ar.content?.type === "plain" && ar.content.lead ? (
                            <div className="text-[17px] leading-[1.8] text-pretty" style={{ color: "#2E2A28" }}>
                              {ar.content.lead}
                            </div>
                          ) : null}
                          {(ar.content?.type === "plain" ? ar.content.paragraphs : []).map((pp) => (
                            <div key={pp.slice(0, 32)} className="text-[17px] leading-[1.8] text-pretty" style={{ color: "#2E2A28" }}>
                              {pp}
                            </div>
                          ))}
                        </div>
                      )}
                    </CornerFrame>
                  ))
                : null}

              {patterns.length > 0 ? (
                <section className="flex flex-col gap-4 p-8">
                  <span className="text-[11px] font-bold tracking-[0.16em] text-[#B99353]">{t("starPage.patternsEyebrow")}</span>
                  <span className="font-[Forum,serif] text-[32px] font-medium">{t("starPage.patternsTitle")}</span>
                  {patterns.map((pattern) => (
                    <article key={pattern.id} className="flex flex-col gap-2 rounded-none border border-[rgba(26,26,26,.08)] p-5">
                      <span className="font-[Forum,serif] text-2xl font-medium">{pattern.title}</span>
                      {pattern.content?.type === "plain"
                        ? pattern.content.paragraphs.map((pp) => (
                            <p key={pp.slice(0, 24)} className="text-[17px] leading-[1.75] text-[#5B5566]">
                              {pp}
                            </p>
                          ))
                        : null}
                    </article>
                  ))}
                </section>
              ) : null}

              {offerNext && model.nextSphere && nextTint ? (
                <div
                  className="relative flex flex-col gap-4 overflow-hidden p-[clamp(16px,3vw,36px)] lg:flex-row lg:flex-wrap lg:gap-6"
                  style={{ border: "1.5px solid #B99353", color: V3_INK }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: "repeating-conic-gradient(from 0deg at 90% 10%,rgba(217,165,92,.08) 0deg 5deg,transparent 5deg 16deg)"
                    }}
                  />
                  <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[26px] lg:order-last lg:aspect-auto lg:min-h-[240px] lg:w-auto lg:flex-[1_1_240px]">
                    <SphereArt sphere={model.nextSphere} variant="next" />
                  </div>
                  <div className="relative z-[1] flex min-w-0 flex-col items-start gap-4 lg:flex-[1_1_320px]">
                    <span className="text-xs font-bold tracking-[0.16em] text-[#B99353]">{t("starPage.nextStep")}</span>
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-none bg-[#F8EACB]">
                        <V2MiniStar zones={[model.spheres[model.nextSphere].zone]} size={26} />
                      </span>
                      <span className="font-[Forum,serif] text-[clamp(24px,2.6vw,32px)] font-medium leading-tight">
                        {model.spheres[model.nextSphere].name}
                      </span>
                    </div>
                    <span className="text-[15px] leading-relaxed text-[#6E6878]">{t("starPage.lead")}</span>
                    <span className="text-base leading-relaxed text-[#5B5566]">{model.spheres[model.nextSphere].purpose}</span>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      {model.prices[model.nextSphere]?.soldSeparately ? (
                        <button
                          type="button"
                          disabled={busy}
                          onPointerUp={(e) => {
                            if (e.pointerType === "mouse" && e.button !== 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const sku = model.prices[model.nextSphere!]?.sku;
                            if (!sku || busy) return;
                            void goCheckout(sku);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="relative z-[1] min-h-[54px] w-full touch-manipulation px-[26px] py-4 text-[15px] uppercase tracking-[0.1em] text-white [-webkit-tap-highlight-color:transparent] sm:w-auto"
                          style={{ background: nextTint.a1, color: nextTint.ink, border: "none", cursor: "pointer", touchAction: "manipulation" }}
                        >
                          {busy ? "…" : t("starPage.openSpherePrice", { price: model.prices[model.nextSphere].formatted })}
                        </button>
                      ) : null}
                      {model.showBundle && model.bundle && nOpen < 5 ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => goCheckout(model.bundle!.sku)}
                          className="relative z-[1] min-h-11 bg-transparent p-2 text-sm text-[#6E6878] underline underline-offset-4"
                        >
                          {t("v2.unlockAllShort", { price: model.bundle.formatted })}
                        </button>
                      ) : null}
                    </div>
                    <PayHint
                      saved={model.savedCard}
                      onNewCard={
                        busy
                          ? undefined
                          : () =>
                              goCheckout(
                                model.prices[model.nextSphere!]?.soldSeparately
                                  ? model.prices[model.nextSphere!].sku
                                  : (model.bundle?.sku ?? ""),
                                false
                              )
                      }
                      className="text-sm text-[#6E6878]"
                      buttonClassName="bg-transparent p-0 text-sm font-semibold text-[#B99353] underline underline-offset-4"
                    />
                    {payError ? <p className="text-sm text-red-700">{payError}</p> : null}
                    <p className="text-[11px] leading-relaxed text-[#6B6461]">{t("legal.disclaimer")}</p>
                  </div>
                </div>
              ) : null}

              {nextOpen && nextId ? (
                <div className="flex flex-wrap items-center gap-5 p-7">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-none bg-white">
                    <V2MiniStar zones={[model.spheres[nextId].zone]} size={26} />
                  </span>
                  <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                    <span className="text-xs font-bold tracking-[0.16em] opacity-70">{t("starPage.further")}</span>
                    <span className="font-[Forum,serif] text-[28px] font-medium">{model.spheres[nextId].name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(nextId);
                      scrollTo("decode");
                    }}
                    className={`${V3_BTN_RED} min-h-[52px] px-6 py-4 text-[15px] font-bold uppercase tracking-[0.1em]`}
                  >
                    {t("starPage.readSphere")}
                  </button>
                </div>
              ) : null}

              {showMissionNext ? (
                <div
                  className="flex flex-wrap items-stretch gap-6 overflow-hidden rounded-none p-[clamp(22px,3vw,36px)]"
                  style={{ background: V3_MISSION.t, border: `1.5px solid ${V3_MISSION.a2}` }}
                >
                  <div className="relative flex min-w-0 flex-[1_1_280px] flex-col items-start justify-center gap-4">
                    <span className="text-xs font-bold tracking-[0.16em]" style={{ color: V3_MISSION.ink }}>
                      {t("starPage.allOpen")}
                    </span>
                    <span className="font-[Forum,serif] text-[34px] font-medium" style={{ color: V3_MISSION.ink }}>
                      {t("starPage.soulMission")}
                    </span>
                    <span className="text-base leading-relaxed" style={{ color: V3_MISSION.ink, opacity: 0.82 }}>
                      {t("starPage.soulMissionLead")}
                    </span>
                    <button
                      type="button"
                      onClick={onMission}
                      className="min-h-[52px] rounded-none px-[26px] py-4 text-[15px] font-extrabold text-white"
                      style={{ background: V3_MISSION.ink }}
                    >
                      {t("starPage.openMission")}
                    </button>
                  </div>
                  <div className="relative min-h-[220px] flex-[1_1_240px]">
                    <SphereArt mission />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {mounted && panel
        ? createPortal(
            <Overlay panel={panel} isMob={isMob} onClose={close}>
              {isMob ? <div className="h-1 w-10 self-center rounded-sm bg-[rgba(26,26,26,.2)]" /> : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold tracking-[0.14em] text-[#6B6461]">
                  {panel.type === "point"
                    ? t("points.pointEyebrow", { arcana, value: model.star.bridges[BRIDGES[panel.j]].value })
                    : panel.type === "offer"
                      ? t("offer.nextEyebrow", { n: model.order.indexOf(panel.k) + 1 })
                      : panel.type === "mission"
                        ? t("offer.center")
                        : t("offer.sphereOf", { n: model.order.indexOf(panel.k) + 1 })}
                </span>
                <button
                  type="button"
                  aria-label={t("points.close")}
                  onClick={close}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-[#F6F3F3] text-xl"
                  style={{ color: V3_INK, border: "none" }}
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
                  <div
                    className="flex items-center gap-3.5 rounded-none p-4"
                    style={{ background: "#FFFFFF", border: `1.5px solid ${SPHERE_TINT[panel.k].a2}`, color: V3_INK }}
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white">
                      <V2MiniStar zones={[model.spheres[panel.k].zone]} size={28} />
                    </span>
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-[Forum,serif] text-[28px] font-medium leading-none">{model.spheres[panel.k].name}</span>
                      <span className="rounded-none bg-white px-2.5 py-1 text-xs font-bold">{t("offer.available")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold">{t("offer.whySphere")}</span>
                    <span className="text-[15px] leading-relaxed text-[#5B5566]">{model.spheres[panel.k].purpose}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">{seq(panel.k)}</div>
                  <div className="flex items-baseline justify-between border-t border-[rgba(26,26,26,.08)] pt-4">
                    <span className="text-sm text-[#6E6878]">{t("offer.priceLabel")}</span>
                    <span className="font-[Forum,serif] text-2xl font-medium">{model.prices[panel.k].formatted}</span>
                  </div>
                  {!model.loggedIn ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[13px] font-bold">{t("offer.emailTitle")}</span>
                      <p className="text-sm leading-relaxed text-[#5B5566]">{t("offer.emailLead")}</p>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={payEmail}
                        onChange={(e) => setPayEmail(e.target.value)}
                        placeholder={t("offer.emailPlaceholder")}
                        className="min-h-12 rounded-[14px] border border-[rgba(26,26,26,.10)] bg-[#F6F3F3] px-4 text-sm"
                      />
                      {needsPassword ? (
                        <>
                          <p className="text-sm text-[#5B5566]">{t("offer.passwordLead")}</p>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={payPassword}
                            onChange={(e) => setPayPassword(e.target.value)}
                            placeholder={t("offer.passwordPlaceholder")}
                            className="min-h-12 rounded-[14px] border border-[rgba(26,26,26,.10)] bg-[#F6F3F3] px-4 text-sm"
                          />
                        </>
                      ) : (
                        <button type="button" onClick={() => setNeedsPassword(true)} className="self-start bg-transparent py-1 text-sm font-bold">
                          {t("offer.hasAccount")}
                        </button>
                      )}
                    </div>
                  ) : null}
                  {payError ? <p className="text-sm text-red-700">{payError}</p> : null}
                  {model.prices[panel.k]?.soldSeparately ? (
                    <button
                      type="button"
                      disabled={busy}
                      onPointerUp={(e) => {
                        if (e.pointerType === "mouse" && e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const sku = pendingSku || skuForSphere(panel.k) || model.prices[panel.k].sku;
                        if (!sku || busy) return;
                        void goCheckout(sku);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={`${V3_BTN_RED} relative z-10 min-h-[54px] touch-manipulation py-4 text-[15px] font-bold uppercase tracking-[0.1em] [-webkit-tap-highlight-color:transparent]`}
                      style={{ touchAction: "manipulation" }}
                    >
                      {busy ? "…" : t("starPage.openSpherePrice", { price: model.prices[panel.k].formatted })}
                    </button>
                  ) : null}
                  {model.showBundle && model.bundle && nOpen < 5 ? (
                    <button
                      type="button"
                      disabled={busy}
                      onPointerUp={(e) => {
                        if (e.pointerType === "mouse" && e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (!model.bundle?.sku || busy) return;
                        void goCheckout(model.bundle.sku);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="relative z-10 min-h-11 touch-manipulation bg-transparent p-2 text-sm text-[#6E6878] underline underline-offset-4"
                      style={{ touchAction: "manipulation" }}
                    >
                      {t("v2.unlockAllShort", { price: model.bundle.formatted })}
                    </button>
                  ) : null}
                  <PayHint
                    saved={model.savedCard}
                    onNewCard={
                      busy
                        ? undefined
                        : () =>
                            goCheckout(pendingSku || skuForSphere(panel.k) || model.prices[panel.k].sku, false)
                    }
                    className="text-sm text-[#6E6878]"
                    buttonClassName="bg-transparent p-0 text-sm font-semibold text-[#B99353] underline underline-offset-4"
                  />
                  <p className="text-[11px] leading-relaxed text-[#6B6461]">{t("legal.disclaimer")}</p>
                  <button type="button" onClick={close} className="min-h-11 bg-transparent text-sm text-[#6E6878]">
                    {t("offer.notNow")}
                  </button>
                </>
              ) : null}

              {panel.type === "blocked" ? (
                <>
                  <div className="flex items-center gap-3.5 rounded-none border border-[rgba(26,26,26,.10)] bg-white p-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white">
                      <V2MiniStar zones={[model.spheres[panel.k].zone]} size={28} locked />
                    </span>
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-[Forum,serif] text-[28px] font-medium leading-none">{model.spheres[panel.k].name}</span>
                      <span className="rounded-none bg-white px-2.5 py-1 text-xs font-bold text-[#6E6878]">{t("offer.blocked")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 rounded-[20px] bg-[#F6F3F3] p-[18px]">
                    <span className="text-[17px] font-bold leading-snug">{model.unlockCopy[panel.k]?.blockedTitle}</span>
                    <span className="text-sm leading-relaxed text-[#5B5566]">{model.unlockCopy[panel.k]?.blockedBody}</span>
                    <button
                      type="button"
                      onClick={() => setWhy((v) => !v)}
                      className="min-h-8 self-start bg-transparent py-1 text-sm font-bold underline underline-offset-4"
                    >
                      {t("offer.why")}
                    </button>
                    {why ? (
                      <span className="border-t border-[rgba(26,26,26,.08)] pt-2.5 text-sm leading-relaxed text-[#5B5566]">
                        {model.unlockCopy[panel.k]?.whyBody}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold">{t("offer.whySphere")}</span>
                    <span className="text-[15px] leading-relaxed text-[#5B5566]">{model.spheres[panel.k].purpose}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">{seq(panel.k)}</div>
                  {model.nextSphere ? (
                    <button
                      type="button"
                      onClick={() => setPanel({ type: "offer", k: model.nextSphere! })}
                      className={`${V3_BTN_RED} min-h-[54px] touch-manipulation py-4 text-[15px] font-bold uppercase tracking-[0.1em]`}
                    >
                      {t("offer.goToNeeded", { name: model.spheres[model.nextSphere].name })}
                    </button>
                  ) : null}
                </>
              ) : null}

              {panel.type === "mission" ? (
                <>
                  <div className="relative min-h-[160px] overflow-hidden rounded-none">
                    <SphereArt mission />
                  </div>
                  <div
                    className="relative flex items-center gap-3.5 overflow-hidden rounded-none p-[18px]"
                    style={{ background: V3_MISSION.t, color: V3_MISSION.ink, border: `1.5px solid ${V3_MISSION.a2}` }}
                  >
                    <span
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-none"
                      style={{ background: "rgba(75,95,153,.18)" }}
                    >
                      <V2MiniStar zones={[]} size={28} center locked />
                    </span>
                    <div className="relative flex flex-col items-start gap-2">
                      <span className="font-[Forum,serif] text-[28px] font-medium leading-none">{t("starPage.soulMission")}</span>
                      <span className="rounded-none bg-white px-2.5 py-1 text-xs font-bold text-[#6E6878]">{t("offer.blocked")}</span>
                    </div>
                  </div>
                  <div className="text-base leading-[1.7] text-[#5B5566]">{t("offer.missionLocked")}</div>
                  <div className="flex flex-wrap gap-1.5">{seq(null)}</div>
                </>
              ) : null}
            </Overlay>,
            document.body
          )
        : null}
    </div>
  );
}

function LegendDot({
  fill,
  dashed,
  solidBorder,
  outlineMuted,
  label
}: {
  fill?: string;
  dashed?: boolean;
  solidBorder?: boolean;
  outlineMuted?: boolean;
  label: string;
}) {
  const swatch: React.CSSProperties = dashed
    ? { border: `1px dashed ${V3_RED}`, boxSizing: "border-box", background: "transparent" }
    : solidBorder
      ? { border: `1.5px solid ${V3_RED}`, boxSizing: "border-box", background: "transparent" }
      : outlineMuted
        ? { border: "1px solid rgba(185,147,83,.5)", boxSizing: "border-box", background: "transparent" }
        : { background: fill };
  return (
    <span
      className="flex items-center gap-2 text-xs tracking-[0.06em]"
      style={{ color: outlineMuted ? "#8F8885" : V3_MUTED }}
    >
      <span className="h-2.5 w-3.5 shrink-0" style={swatch} />
      {label}
    </span>
  );
}

function Overlay({
  panel,
  isMob,
  onClose,
  children
}: {
  panel: Panel;
  isMob: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeReady = useRef(false);
  useEffect(() => {
    closeReady.current = false;
    const t = window.setTimeout(() => {
      closeReady.current = true;
    }, 700);
    return () => window.clearTimeout(t);
  }, [panel]);
  const isPointD = panel.type === "point" && !isMob;
  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(26,26,26,.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: isMob ? "flex-end" : isPointD ? "stretch" : "center",
    justifyContent: isMob ? "center" : isPointD ? "flex-end" : "center",
    touchAction: "none"
  };
  const sheetBase: React.CSSProperties = {
    background: "#FFFFFF",
    color: V3_INK,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxSizing: "border-box",
    overflowY: "auto",
    overscrollBehavior: "contain",
    boxShadow: "0 30px 80px rgba(26,26,26,.25)",
    touchAction: "pan-y",
    WebkitOverflowScrolling: "touch"
  };
  const sheet: React.CSSProperties = isMob
    ? {
        ...sheetBase,
        width: "100%",
        maxWidth: 520,
        maxHeight: "88vh",
        borderRadius: 0,
        padding: "10px 20px max(28px, env(safe-area-inset-bottom))"
      }
    : isPointD
      ? { ...sheetBase, width: 540, height: "calc(100vh - 24px)", margin: 12, borderRadius: 0, padding: "32px 40px 48px", gap: 22 }
      : { ...sheetBase, width: 500, maxHeight: "88vh", borderRadius: 0, padding: 32 };
  return (
    <div
      style={overlay}
      onPointerDown={(e) => {
        // Close on a real backdrop tap only. Ghost `click` from the gesture that
        // opened the sheet must not dismiss it or steal the CTA press.
        if (!closeReady.current) return;
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={sheet}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
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
  const pointKey = model.star.spheres[ctx].leftBase.id === bridge ? "leftBase" : "rightBase";
  const fatal = sphereSlotKind(ctx, pointKey) === "fatal_error";
  const content = readings[ctx]?.find((a) => a.point === pointKey)?.content;
  const typeLabel = readings[ctx]?.find((a) => a.point === pointKey)?.role ?? (fatal ? t("points.fatal") : t("points.ancestral"));
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-none bg-[#B99353] text-[22px] font-extrabold" style={{ color: V3_INK }}>
          {value}
        </span>
        <span className="font-[Forum,serif] text-[28px] font-medium leading-tight">{typeLabel}</span>
      </div>
      <div className="flex gap-1.5 rounded-none bg-[#F6F3F3] p-[5px]">
        {ks.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              if (unlocked.has(k)) onCtx(k);
            }}
            className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-none px-3 py-2.5 text-sm font-bold"
            style={{
              border: "none",
              background: k === ctx ? SPHERE_TINT[k].a2 : "transparent",
              color: k === ctx ? "#FFFFFF" : unlocked.has(k) ? "#5B5566" : "#AFA8B8",
              cursor: unlocked.has(k) ? "pointer" : "default"
            }}
          >
            {model.spheres[k].name}
            {!unlocked.has(k) ? <V2LockIcon /> : null}
          </button>
        ))}
      </div>
      <div className="text-[17px] font-bold leading-snug">{t("points.leadIn", { name: model.spheres[ctx].name })}</div>
      {content?.type === "plain" ? (
        <>
          {content.lead ? <div className="text-pretty text-base leading-[1.75] text-[#5B5566]">{content.lead}</div> : null}
          {content.paragraphs.map((p) => (
            <div key={p.slice(0, 16)} className="text-pretty text-base leading-[1.75] text-[#5B5566]">
              {p}
            </div>
          ))}
        </>
      ) : content?.type === "structured" ? (
        content.blocks.map((sb) => (
          <div key={sb.label} className="flex flex-col gap-2 rounded-none border border-[rgba(26,26,26,.08)] bg-white px-4 py-3">
            <span className="text-sm font-bold">
              {sb.mark} {sb.label}
            </span>
            <span className="text-pretty text-base leading-[1.75] text-[#5B5566]">{sb.text}</span>
          </div>
        ))
      ) : null}
      <div className="rounded-none bg-[#F6F3F3] px-4 py-3.5 text-[13px] leading-relaxed text-[#6E6878]">
        {unlocked.has(other) ? t("points.samePoint", { name: model.spheres[other].name }) : t("points.samePointLocked", { name: model.spheres[other].name })}
      </div>
    </>
  );
}
