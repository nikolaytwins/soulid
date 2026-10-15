"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  BOOK_FORMULA,
  DATE_POINT_IDS,
  DATE_SOURCES,
  FORMULA_ORDER,
  allowedSumParts,
  parseStarFormula,
  type DateSource,
  type FormulaPointId,
  type StarFormula
} from "@/lib/engine";
import { resetFormulaAction, saveFormulaAction } from "../actions";

const VERTICES: FormulaPointId[] = [
  "personality",
  "spirituality",
  "money",
  "relationships",
  "health",
  "soulMission"
];
const BRIDGES: FormulaPointId[] = ["p12", "p23", "p34", "p45", "p51"];

type DebugStep = { id: string; label: string; formula: string; raw: number; value: number; steps: string[] };

export function FormulaEditor({ initial }: { initial: StarFormula }) {
  const t = useTranslations("admin");
  const tTerms = useTranslations("terms");
  const [formula, setFormula] = useState<StarFormula>(initial);
  const [day, setDay] = useState(5);
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(1992);
  const [debug, setDebug] = useState<DebugStep[] | null>(null);
  const [isoDate, setIsoDate] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const names = useMemo(() => {
    const map = {} as Record<FormulaPointId, string>;
    for (const id of FORMULA_ORDER) map[id] = t(`formulaPoint_${id}`);
    return map;
  }, [t]);

  const sourceLabel: Record<DateSource, string> = {
    day: t("formulaDay"),
    month: t("formulaMonth"),
    yearDigitSum: t("formulaYearDigits"),
    year: t("formulaYear")
  };

  function setDateSource(id: FormulaPointId, source: DateSource) {
    setSaved(false);
    setFormula((prev) => ({ ...prev, [id]: { type: "date", source } }));
  }

  function togglePart(id: FormulaPointId, part: FormulaPointId) {
    setSaved(false);
    setFormula((prev) => {
      const cur = prev[id];
      const of = cur.type === "sum" ? [...cur.of] : [];
      const next = of.includes(part) ? of.filter((x) => x !== part) : [...of, part];
      next.sort((a, b) => FORMULA_ORDER.indexOf(a as FormulaPointId) - FORMULA_ORDER.indexOf(b as FormulaPointId));
      return { ...prev, [id]: { type: "sum", of: next } };
    });
  }

  function save() {
    setError("");
    start(async () => {
      const parsed = parseStarFormula(formula);
      if (!parsed) return;
      const form = new FormData();
      form.set("formula", JSON.stringify(parsed));
      const res = await saveFormulaAction(form);
      if (res.ok) {
        setFormula(parsed);
        setSaved(true);
      }
    });
  }

  function reset() {
    setError("");
    start(async () => {
      const res = await resetFormulaAction();
      if (res.ok) {
        setFormula(BOOK_FORMULA);
        setSaved(true);
        setDebug(null);
      }
    });
  }

  async function test(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/debug-calculation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, month, year, formula })
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "error");
      setDebug(null);
      return;
    }
    setIsoDate(json.isoDate ?? "");
    setDebug(json.debug ?? []);
  }

  function rows(ids: FormulaPointId[]) {
    return ids.map((id) => {
      const spec = formula[id];
      const isDate = DATE_POINT_IDS.includes(id);
      return (
        <div key={id} className="rounded-2xl border border-line bg-card px-4 py-3">
          <p className="font-semibold">{names[id]}</p>
          {isDate ? (
            <label className="mt-2 flex flex-col gap-1 text-sm text-muted">
              {t("formulaFromDate")}
              <select
                value={spec.type === "date" ? spec.source : "day"}
                onChange={(e) => setDateSource(id, e.target.value as DateSource)}
                className="mt-1 max-w-xs rounded-xl border border-line bg-cream px-3 py-2 text-ink"
              >
                {DATE_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel[source]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-muted">{t("formulaSumOf")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allowedSumParts(id).map((part) => {
                  const on = spec.type === "sum" && spec.of.includes(part);
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => togglePart(id, part)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        on ? "bg-ink text-card" : "border border-line bg-cream text-ink"
                      }`}
                    >
                      {names[part]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className={`flex flex-col gap-10 ${pending ? "opacity-80" : ""}`}>
      <section>
        <h2 className="font-serif text-2xl">{t("formulaVertices")}</h2>
        <div className="mt-4 flex flex-col gap-2">{rows(VERTICES)}</div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("formulaBridges")}</h2>
        <div className="mt-4 flex flex-col gap-2">{rows(BRIDGES)}</div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} className="rounded-xl bg-ink px-4 py-2 text-card">
          {t("save")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-line bg-card px-4 py-2 text-ink"
        >
          {t("formulaReset")}
        </button>
        {saved ? <p className="text-sm text-muted">{t("formulaSaved")}</p> : null}
      </div>

      <section>
        <h2 className="font-serif text-2xl">{t("formulaTest")}</h2>
        <p className="mt-1 text-sm text-muted">{t("formulaTestLead")}</p>
        <form onSubmit={test} className="mt-4 flex flex-wrap gap-2">
          <input
            type="number"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="w-20 rounded-xl border border-line bg-cream px-3 py-2"
            aria-label="day"
          />
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-20 rounded-xl border border-line bg-cream px-3 py-2"
            aria-label="month"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 rounded-xl border border-line bg-cream px-3 py-2"
            aria-label="year"
          />
          <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-card">
            {t("formulaRun")}
          </button>
        </form>
        {error ? <p className="mt-3 text-red-700">{error}</p> : null}
        {debug ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card p-4">
            <div className="font-semibold">{isoDate}</div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-faint">
                  <th className="py-2">{t("formulaStep")}</th>
                  <th>{t("formula")}</th>
                  <th>raw</th>
                  <th>{t("formulaArcana", { arcana: tTerms("arcana") })}</th>
                </tr>
              </thead>
              <tbody>
                {debug.map((s) => (
                  <tr key={s.id + s.label} className="border-t border-line align-top">
                    <td className="py-2 pr-3 font-medium">{s.label}</td>
                    <td className="pr-3">{s.formula}</td>
                    <td className="pr-3">{s.raw}</td>
                    <td className="pr-3 font-bold">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
