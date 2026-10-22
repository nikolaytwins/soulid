"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { EditableInterpretation } from "@/lib/domain/content";
import { saveInterpretationAction } from "../actions";
import { ClearReadingButton } from "./clear-reading";

type Sync = { auto: string[]; kept: string[]; fail: string[] };

const field =
  "mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.72)] px-3 py-2.5 text-sm text-[#1A1A1A]";
const saveBtn = "v3-btn-red rounded-none px-4 py-2.5 text-sm font-semibold disabled:opacity-60";

export function InterpretationForm({
  id,
  arcanaValue,
  contentType,
  initialOrigin,
  title,
  edit,
  sphereName,
  arcanaWord,
  pointLabel
}: {
  id: string;
  arcanaValue: number;
  contentType: string;
  initialOrigin: string;
  title: string;
  edit: EditableInterpretation;
  sphereName: string;
  arcanaWord: string;
  pointLabel: string;
}) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [origin, setOrigin] = useState(initialOrigin);
  const [status, setStatus] = useState<string | null>(null);
  const structured = contentType === "structured";

  function statusText(sync: Sync) {
    const parts = [t("contentSaved")];
    if (sync.auto.length) parts.push(t("contentSavedAuto", { locales: sync.auto.join(",").toUpperCase() }));
    if (sync.kept.length) parts.push(t("contentSavedKept", { locales: sync.kept.join(",").toUpperCase() }));
    if (sync.fail.length) parts.push(t("contentSavedFail", { locales: sync.fail.join(",").toUpperCase() }));
    return parts.join(" ");
  }

  const originLabel =
    origin === "manual" ? t("contentOriginManual") : origin === "auto" ? t("contentOriginAuto") : t("contentOriginDemo");
  const originCls =
    origin === "manual"
      ? "bg-open-bg text-open-text"
      : origin === "auto"
        ? "bg-sand text-gold-text"
        : "bg-[#F1EBE4] text-faint";

  return (
    <form
      id={`arc-${arcanaValue}`}
      className="scroll-mt-24 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          setStatus(null);
          const res = await saveInterpretationAction(data);
          if (!res?.ok) {
            setStatus(t("contentSaveFailed"));
            return;
          }
          setOrigin("manual");
          setStatus(statusText(res.sync));
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="contentType" value={contentType} />

      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-none bg-[#B99353] text-sm font-bold text-white">
          {arcanaValue}
        </span>
        <div>
          <div className="text-[11px] font-bold tracking-[0.16em] text-[#B99353]">
            {t("contentArcana", { n: arcanaValue, arcana: arcanaWord })}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{sphereName}</span>
            <span className="text-faint">{pointLabel}</span>
            <span className={`rounded-none px-2 py-0.5 text-[11px] font-semibold ${originCls}`}>{originLabel}</span>
          </div>
        </div>
      </div>

      <label className="text-xs font-semibold tracking-wide text-faint">
        {t("contentTitle")}
        <input name="title" defaultValue={title} className={field} />
      </label>

      {structured ? (
        <div className="mt-4 grid gap-3">
          {edit.blocks.map((b, i) => (
            <div key={i} className="rounded-none border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.72)] p-3">
              <input type="hidden" name={`blockMark${i}`} value={b.mark} />
              <label className="text-xs font-semibold tracking-wide text-faint">
                {t("contentBlockLabel")}
                <input name={`blockLabel${i}`} defaultValue={b.label} className={field} />
              </label>
              <label className="mt-2 block text-xs font-semibold tracking-wide text-faint">
                {t("contentBlockText")}
                <textarea name={`blockText${i}`} defaultValue={b.text} rows={3} className={field} />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <label className="mt-3 block text-xs font-semibold tracking-wide text-faint">
          {t("contentText")}
          <textarea name="text" defaultValue={edit.text} rows={12} className={field} />
        </label>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={saveBtn}>
          {pending ? "…" : t("save")}
        </button>
        <ClearReadingButton label={t("contentClear")} />
        {status ? <span className="text-sm text-[#4B6B43]">{status}</span> : null}
      </div>
    </form>
  );
}
