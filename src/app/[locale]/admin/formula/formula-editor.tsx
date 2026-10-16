"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  BOOK_FORMULA,
  BRIDGE_KIND,
  DATE_POINT_IDS,
  DATE_SOURCES,
  FORMULA_ORDER,
  SPHERE_IDS,
  allowedSumParts,
  calculateStar,
  formulaWorkbook,
  isValidCalendarDate,
  parseStarFormula,
  reductionChain,
  type DateSource,
  type FormulaPointId,
  type SphereId,
  type StarFormula,
  type WorkbookRow
} from "@/lib/engine";
import { LtrText } from "@/components/ui/LtrText";
import { resetFormulaAction, saveFormulaAction } from "../actions";

const DESTINIES: { id: FormulaPointId; n: number }[] = [
  { id: "personality", n: 1 },
  { id: "spirituality", n: 2 },
  { id: "money", n: 3 },
  { id: "relationships", n: 4 },
  { id: "health", n: 5 },
  { id: "soulMission", n: 6 }
];

const EDGES: { id: FormulaPointId; n: number; a: number; b: number }[] = [
  { id: "p12", n: 1, a: 1, b: 2 },
  { id: "p23", n: 2, a: 2, b: 3 },
  { id: "p34", n: 3, a: 3, b: 4 },
  { id: "p45", n: 4, a: 4, b: 5 },
  { id: "p51", n: 5, a: 5, b: 1 }
];

const DESTINY_N = Object.fromEntries(DESTINIES.map((d) => [d.id, d.n])) as Record<FormulaPointId, number | undefined>;

export function FormulaEditor({ initial }: { initial: StarFormula }) {
  const t = useTranslations("admin");
  const tPoints = useTranslations("points");
  const tTerms = useTranslations("terms");
  const [formula, setFormula] = useState<StarFormula>(initial);
  const [day, setDay] = useState(5);
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(1992);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const names = useMemo(() => {
    const map = {} as Record<FormulaPointId, string>;
    for (const id of FORMULA_ORDER) map[id] = t(`formulaPoint_${id}`);
    return map;
  }, [t]);

  const sphereNames = useMemo(() => {
    const map = {} as Record<SphereId, string>;
    for (const id of SPHERE_IDS) map[id] = t(`formulaPoint_${id}`);
    return map;
  }, [t]);

  const sourceLabel: Record<DateSource, string> = {
    day: t("formulaDay"),
    month: t("formulaMonth"),
    yearDigitSum: t("formulaYearDigits"),
    year: t("formulaYear")
  };

  const valid = isValidCalendarDate(year, month, day);
  const rows = useMemo(() => {
    if (!valid) return null;
    return Object.fromEntries(formulaWorkbook({ year, month, day }, formula).map((row) => [row.id, row])) as Record<
      FormulaPointId,
      WorkbookRow
    >;
  }, [valid, year, month, day, formula]);
  const star = useMemo(() => {
    if (!valid) return null;
    try {
      return calculateStar({ year, month, day }, { formula });
    } catch {
      return null;
    }
  }, [valid, year, month, day, formula]);

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
    start(async () => {
      const res = await resetFormulaAction();
      if (res.ok) {
        setFormula(BOOK_FORMULA);
        setSaved(true);
      }
    });
  }

  function partLabel(part: FormulaPointId) {
    const n = DESTINY_N[part];
    return n ? t("formulaPartN", { n, name: names[part] }) : names[part];
  }

  function working(id: FormulaPointId) {
    const row = rows?.[id];
    if (!row) return null;
    return <Working row={row} keep={t("formulaKeep", { n: row.value })} reduce={t} arcana={tTerms("arcana")} />;
  }

  function sumPicker(id: FormulaPointId) {
    const spec = formula[id];
    return (
      <div className="mt-3">
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
                {partLabel(part)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-10 ${pending ? "opacity-80" : ""}`}>
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">{t("formulaExampleDate")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("formulaExampleHint")}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-faint">
            {t("formulaDayShort")}
            <input
              type="number"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-20 rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-faint">
            {t("formulaMonthShort")}
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-20 rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-faint">
            {t("formulaYearShort")}
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-28 rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
          {!valid ? <p className="text-sm text-red-700">{t("formulaBadDate")}</p> : null}
          <div className="flex flex-wrap items-center gap-2 pb-0.5">
            <button type="button" onClick={save} className="rounded-xl bg-ink px-4 py-2 text-sm text-card">
              {t("save")}
            </button>
            <button type="button" onClick={reset} className="rounded-xl border border-line bg-card px-4 py-2 text-sm text-ink">
              {t("formulaReset")}
            </button>
            {saved ? <p className="text-sm text-muted">{t("formulaSaved")}</p> : null}
          </div>
        </div>
        {rows ? (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {DESTINIES.map(({ id, n }) => (
              <div key={id} className="rounded-xl bg-cream px-3 py-3 text-center">
                <div className="text-[10px] font-semibold tracking-[0.12em] text-faint">
                  {n}. {names[id]}
                </div>
                <div className="mt-1 font-sans text-3xl font-semibold text-gold-text">
                  <LtrText>{rows[id].value}</LtrText>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("formulaVertices")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("formulaVerticesLead")}</p>
        <div className="mt-4 flex flex-col gap-3">
          {DESTINIES.map(({ id, n }) => {
            const spec = formula[id];
            const isDate = DATE_POINT_IDS.includes(id);
            return (
              <article key={id} className="rounded-2xl border border-line bg-card p-5">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t("formulaDestinyTitle", { n, name: names[id] })}</p>
                    <p className="mt-0.5 text-sm text-muted">{t(`formulaCorner_${id}`)}</p>
                  </div>
                  {rows ? <Arcana n={rows[id].value} label={tTerms("arcana")} /> : null}
                </header>
                {isDate ? (
                  <label className="mt-3 flex flex-col gap-1 text-sm text-muted">
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
                  sumPicker(id)
                )}
                {working(id)}
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("formulaBridges")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("formulaBridgesLead")}</p>
        <div className="mt-4 flex flex-col gap-3">
          {EDGES.map(({ id, n, a, b }) => (
            <article key={id} className="rounded-2xl border border-line bg-card p-5">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t("formulaEdgeTitle", { n, a, b })}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {BRIDGE_KIND[id as "p12"] === "fatal_error" ? tPoints("fatal") : tPoints("ancestral")}
                    {" · "}
                    {names[id]}
                  </p>
                </div>
                {rows ? <Arcana n={rows[id].value} label={tTerms("arcana")} /> : null}
              </header>
              {sumPicker(id)}
              {working(id)}
            </article>
          ))}
        </div>
      </section>

      {star ? (
        <section>
          <h2 className="font-serif text-2xl">{t("formulaInner")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("formulaInnerLead")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SPHERE_IDS.map((id) => {
              const tri = star.spheres[id];
              const bits = [
                [t("formulaInnerApexLeft"), tri.apex.value, tri.leftBase.value],
                [t("formulaInnerApexRight"), tri.apex.value, tri.rightBase.value],
                [t("formulaInnerBase"), tri.leftBase.value, tri.rightBase.value]
              ] as const;
              return (
                <article key={id} className="rounded-2xl border border-line bg-card p-5">
                  <p className="font-semibold">{sphereNames[id]}</p>
                  <ul className="mt-3 flex flex-col gap-2 text-sm">
                    {bits.map(([label, x, y]) => {
                      const raw = x + y;
                      const chain = reductionChain(raw);
                      return (
                        <li key={label} className="flex items-baseline justify-between gap-3">
                          <span className="text-muted">{label}</span>
                          <LtrText className="font-medium tabular-nums">
                            {x} + {y} = {raw}
                            {chain.steps.map((step) => ` → ${step.expr} = ${step.to}`).join("")}
                          </LtrText>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} className="rounded-xl bg-ink px-4 py-2 text-card">
          {t("save")}
        </button>
        <button type="button" onClick={reset} className="rounded-xl border border-line bg-card px-4 py-2 text-ink">
          {t("formulaReset")}
        </button>
        {saved ? <p className="text-sm text-muted">{t("formulaSaved")}</p> : null}
      </div>
    </div>
  );
}

function Arcana({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex h-12 min-w-12 flex-col items-center justify-center rounded-full bg-[linear-gradient(180deg,#F7D9A4,#D9A055)] px-3 text-[#3A2716]">
      <span className="font-sans text-xl font-bold leading-none">
        <LtrText>{n}</LtrText>
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );
}

function Working({
  row,
  keep,
  reduce,
  arcana
}: {
  row: WorkbookRow;
  keep: string;
  reduce: ReturnType<typeof useTranslations>;
  arcana: string;
}) {
  const showSum = row.expr.includes("+") || row.reductions.length > 0;
  return (
    <div className="mt-4 rounded-xl bg-cream px-4 py-3 font-sans text-[15px] leading-relaxed text-ink">
      {showSum ? (
        <p>
          <LtrText className="font-semibold">
            {row.expr} = {row.raw}
          </LtrText>
        </p>
      ) : null}
      {row.reductions.length === 0 ? (
        <p className="mt-1 text-sm text-muted">{keep}</p>
      ) : (
        row.reductions.map((step) => (
          <p key={step.from} className="mt-1">
            {reduce("formulaReduceOnce", {
              from: String(step.from),
              digits: step.expr,
              to: String(step.to)
            })}
          </p>
        ))
      )}
      <p className="mt-2 text-sm font-semibold">
        {reduce("formulaArcanaResult", { arcana, n: row.value })}
      </p>
    </div>
  );
}
