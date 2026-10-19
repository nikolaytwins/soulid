"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { StarPageModel } from "@/lib/domain/star-page";
import { V2_INK } from "@/lib/v2";
import { PayHint } from "@/components/pay/PayHint";

const REVIEWS = [
  { ini: "Е", nameKey: "r1Name", metaKey: "r1Meta", textKey: "r1Text" },
  { ini: "М", nameKey: "r2Name", metaKey: "r2Meta", textKey: "r2Text" },
  { ini: "О", nameKey: "r3Name", metaKey: "r3Meta", textKey: "r3Text" }
] as const;

export function V2PersonalBlocks({
  model,
  email,
  busy,
  payError,
  onOrder
}: {
  model: StarPageModel;
  email?: string | null;
  busy: boolean;
  payError: string;
  onOrder: (input: { channel: "email" | "tg"; contact: string; email?: string; useSavedMethod?: boolean }) => void;
}) {
  const t = useTranslations("v2");
  const rec = model.recommendation;
  const [channel, setChannel] = useState<"email" | "tg">(model.recommendation?.channel ?? "email");
  const [tg, setTg] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const openedNames = model.unlocked.map((id) => model.spheres[id].name).filter(Boolean);
  const scope =
    model.unlocked.length >= 5 ? t("rec.scopeAll") : t("rec.scopeOpen", { list: openedNames.join(", ") || "—" });
  const accountEmail = email?.trim() || guestEmail.trim();
  const contact =
    channel === "tg"
      ? tg.trim()
        ? t("rec.tgContact", { handle: tg.trim().startsWith("@") ? tg.trim() : `@${tg.trim()}` })
        : t("rec.tgHint")
      : accountEmail
        ? t("rec.emailContact", { email: accountEmail })
        : t("rec.emailHint");

  const eta = rec?.eta ?? t("rec.etaSoon");
  const where = rec?.channel === "tg" ? t("rec.whereTg") : t("rec.whereEmail");

  const steps = useMemo(
    () => [
      { n: 1, title: t("rec.s1Title"), text: t("rec.s1Text") },
      { n: 2, title: t("rec.s2Title"), text: t("rec.s2Text") },
      { n: 3, title: t("rec.s3Title"), text: t("rec.s3Text") }
    ],
    [t]
  );

  function submit() {
    if (!rec || busy) return;
    const handle = tg.trim().startsWith("@") ? tg.trim() : tg.trim() ? `@${tg.trim()}` : "";
    onOrder({
      channel,
      contact: channel === "tg" ? handle : accountEmail,
      email: accountEmail || undefined
    });
  }

  return (
    <>
      {rec ? (
        <div
          id="personal"
          className="relative mt-12 flex flex-wrap gap-[clamp(24px,4vw,48px)] overflow-hidden rounded-[40px] p-[clamp(24px,4vw,56px)]"
          style={{ background: V2_INK, color: "#FFFFFF", boxSizing: "border-box" }}
        >
          <div
            className="pointer-events-none absolute -bottom-40 -left-[120px] h-[420px] w-[420px] rounded-full"
            style={{
              background: "repeating-radial-gradient(circle,rgba(233,194,124,.16) 0 1px,transparent 1.5px 22px)"
            }}
          />
          <div className="relative flex min-w-0 flex-[1.2_1_380px] flex-col items-start gap-[22px]">
            <span className="rounded-full bg-[rgba(233,194,124,.16)] px-3.5 py-1.5 text-xs font-bold tracking-[0.12em] text-[#E9C27C]">
              {t("rec.eyebrow")}
            </span>
            <span className="text-balance font-display text-[clamp(30px,4vw,50px)] font-medium leading-[1.05]">
              {t("rec.title")}
            </span>
            <span className="max-w-[560px] text-pretty text-[17px] leading-[1.65] text-[#E2D8E6]">{t("rec.lead")}</span>
            <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-2.5">
              {steps.map((rs) => (
                <div
                  key={rs.n}
                  className="flex flex-col gap-2.5 rounded-3xl border border-[rgba(233,194,124,.18)] bg-[rgba(255,255,255,.06)] p-[18px]"
                >
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E9C27C] text-sm font-extrabold text-[#2B1A33]">
                    {rs.n}
                  </span>
                  <span className="text-[15px] font-bold">{rs.title}</span>
                  <span className="text-[13px] leading-relaxed text-[#CFC3D4]">{rs.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="relative flex w-full min-w-0 flex-[1_1_320px] flex-col gap-[18px] self-start rounded-[32px] p-[clamp(22px,3vw,32px)]"
            style={{ background: "#FFFFFF", color: V2_INK, boxSizing: "border-box" }}
          >
            {rec.ordered ? (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6E3C4] text-2xl font-extrabold text-[#8A5A1F]">
                  ✓
                </span>
                <span className="font-display text-[26px] font-medium leading-tight">{t("rec.doneTitle")}</span>
                <span className="text-[15px] leading-relaxed text-[#5B5566]">
                  {t("rec.doneLead", { where, eta })}
                </span>
                <div className="flex flex-col gap-1.5 rounded-[18px] bg-[#F8F1E9] px-4 py-3.5">
                  <div className="flex justify-between text-[13px] font-bold">
                    <span>{t("rec.status")}</span>
                    <span className="text-[#8A5A1F]">{t("rec.preparing")}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-[3px] bg-[rgba(43,26,51,.08)]">
                    <div
                      className="h-full w-[15%] rounded-[3px]"
                      style={{ background: "linear-gradient(90deg,#F0D3A4,#D9A55C)" }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-[#6E6878]">{t("rec.priceLabel")}</span>
                  <span className="whitespace-nowrap font-display text-[30px] font-medium">{rec.formatted}</span>
                </div>
                <div className="flex flex-col gap-1.5 rounded-[18px] bg-[#F8F1E9] px-4 py-3.5">
                  <span className="text-[13px] font-bold">{t("rec.includes")}</span>
                  <span className="text-sm leading-relaxed text-[#5B5566]">{scope}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{t("rec.whereLabel")}</span>
                  <div className="flex gap-1.5 rounded-full bg-[#F8F1E9] p-1.5">
                    {(["email", "tg"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setChannel(k)}
                        className="min-h-[42px] flex-1 rounded-full px-3 py-2.5 text-sm font-bold"
                        style={{
                          border: "none",
                          cursor: "pointer",
                          background: channel === k ? V2_INK : "transparent",
                          color: channel === k ? "#FFFFFF" : "#5B5566"
                        }}
                      >
                        {k === "email" ? t("rec.channelEmail") : t("rec.channelTg")}
                      </button>
                    ))}
                  </div>
                  {channel === "tg" ? (
                    <input
                      value={tg}
                      onChange={(e) => setTg(e.target.value)}
                      placeholder={t("rec.tgPlaceholder")}
                      className="min-h-11 rounded-[14px] border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 text-sm"
                    />
                  ) : !email ? (
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder={t("rec.emailPlaceholder")}
                      className="min-h-11 rounded-[14px] border border-[rgba(43,26,51,.10)] bg-[#F8F1E9] px-4 text-sm"
                    />
                  ) : null}
                  <span className="text-[13px] text-[#6E6878]">{contact}</span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="min-h-14 rounded-full bg-[#2B1A33] px-[22px] py-[17px] text-[15px] font-bold text-white"
                  style={{ border: "none", cursor: "pointer", opacity: busy ? 0.7 : 1 }}
                >
                  {t("rec.cta", { price: rec.formatted })}
                </button>
                <PayHint
                  saved={model.savedCard}
                  onNewCard={
                    busy
                      ? undefined
                      : () =>
                          onOrder({
                            channel,
                            contact: channel === "tg" ? (tg.trim().startsWith("@") ? tg.trim() : `@${tg.trim()}`) : accountEmail,
                            email: accountEmail,
                            useSavedMethod: false
                          })
                  }
                  className="text-center text-[13px] leading-relaxed text-[#6E6878]"
                  buttonClassName="bg-transparent p-0 text-[13px] font-semibold text-[#B07A33] underline underline-offset-4"
                />
                <span className="text-center text-[13px] leading-relaxed text-[#6E6878]">{t("rec.etaNote")}</span>
                {payError ? <p className="text-sm text-red-700">{payError}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="relative min-h-[320px] min-w-0 flex-[1_1_300px]">
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[36px]"
            style={{ background: "linear-gradient(150deg,#F6E3C4,#D9A55C)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(rgba(43,26,51,.10) 1.2px, transparent 1.7px)",
                backgroundSize: "16px 16px"
              }}
            />
          </div>
        </div>
        <div className="relative flex min-w-0 flex-[2_1_420px] flex-col items-start justify-center gap-[18px] overflow-hidden rounded-[36px] bg-white p-[clamp(22px,3vw,40px)]">
          <div
            className="pointer-events-none absolute -right-[90px] -top-[90px] h-[300px] w-[300px] rounded-full"
            style={{
              background: "repeating-radial-gradient(circle,rgba(217,165,92,.22) 0 1px,transparent 1.5px 18px)"
            }}
          />
          <span className="relative rounded-full bg-[#F6E3C4] px-3.5 py-1.5 text-xs font-bold tracking-[0.12em] text-[#6B4416]">
            {t("expert.eyebrow")}
          </span>
          <span className="relative font-display text-[clamp(28px,3.4vw,42px)] font-medium leading-[1.05]">{t("expert.name")}</span>
          <span className="relative max-w-[560px] text-pretty text-base leading-[1.65] text-[#5B5566]">{t("expert.bio")}</span>
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex min-h-14 items-center gap-3 rounded-full bg-[#2B1A33] py-2 pl-2 pr-[22px] text-[15px] font-bold text-white no-underline"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#F0D3A4,#D9A55C)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1A33" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#2B1A33" stroke="none" />
              </svg>
            </span>
            {t("expert.ig")}
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <span className="font-display text-[clamp(30px,4vw,48px)] font-medium leading-none">{t("reviews.title")}</span>
          <span className="text-sm text-[#6E6878]">{t("reviews.lead")}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {REVIEWS.map((rv) => (
            <div key={rv.nameKey} className="flex flex-col gap-[18px] rounded-[32px] bg-white p-[26px]">
              <span className="h-[22px] font-display text-[44px] leading-[0.6] text-[#D9A55C]">“</span>
              <span className="flex-1 text-pretty text-base leading-[1.65] text-[#3E3346]">{t(`reviews.${rv.textKey}`)}</span>
              <div className="flex items-center gap-3 border-t border-[rgba(43,26,51,.08)] pt-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6E3C4] text-[15px] font-extrabold text-[#6B4416]">
                  {rv.ini}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{t(`reviews.${rv.nameKey}`)}</span>
                  <span className="text-xs text-[#8A8494]">{t(`reviews.${rv.metaKey}`)}</span>
                </div>
                <span className="text-[13px] tracking-[2px] text-[#C48A3E]">★★★★★</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
