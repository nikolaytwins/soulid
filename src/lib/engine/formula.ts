import type { BirthDate } from "./types";
import { reductionChain } from "./reduce";

export const DATE_SOURCES = ["day", "month", "yearDigitSum", "year"] as const;
export type DateSource = (typeof DATE_SOURCES)[number];

export type PointFormula = { type: "date"; source: DateSource } | { type: "sum"; of: string[] };

export type FormulaPointId =
  | "personality"
  | "spirituality"
  | "money"
  | "relationships"
  | "health"
  | "soulMission"
  | "p12"
  | "p23"
  | "p34"
  | "p45"
  | "p51";

export const FORMULA_ORDER: FormulaPointId[] = [
  "personality",
  "spirituality",
  "money",
  "relationships",
  "health",
  "soulMission",
  "p12",
  "p23",
  "p34",
  "p45",
  "p51"
];

export type StarFormula = Record<FormulaPointId, PointFormula>;

export const BOOK_FORMULA: StarFormula = {
  personality: { type: "date", source: "day" },
  spirituality: { type: "date", source: "month" },
  money: { type: "date", source: "yearDigitSum" },
  relationships: { type: "sum", of: ["personality", "spirituality", "money"] },
  health: { type: "sum", of: ["personality", "spirituality", "money", "relationships"] },
  soulMission: { type: "sum", of: ["personality", "spirituality", "money", "relationships", "health"] },
  p12: { type: "sum", of: ["personality", "spirituality"] },
  p23: { type: "sum", of: ["spirituality", "money"] },
  p34: { type: "sum", of: ["money", "relationships"] },
  p45: { type: "sum", of: ["relationships", "health"] },
  p51: { type: "sum", of: ["health", "personality"] }
};

const DATE_SET = new Set<string>(DATE_SOURCES);

export function dateRaw(date: BirthDate, source: DateSource): { raw: number; note: string } {
  if (source === "day") return { raw: date.day, note: `день ${date.day}` };
  if (source === "month") return { raw: date.month, note: `месяц ${date.month}` };
  if (source === "year") return { raw: date.year, note: `год ${date.year}` };
  const digits = String(date.year).split("");
  const raw = digits.reduce((a, d) => a + Number(d), 0);
  return { raw, note: `цифры года ${date.year} → ${digits.join("+")} = ${raw}` };
}

export function datePartsExpr(date: BirthDate, source: DateSource): string {
  if (source === "yearDigitSum") return String(date.year).split("").join(" + ");
  if (source === "year") return String(date.year);
  if (source === "month") return String(date.month);
  return String(date.day);
}

export type WorkbookRow = {
  id: FormulaPointId;
  expr: string;
  raw: number;
  value: number;
  reductions: ReturnType<typeof reductionChain>["steps"];
};

export function formulaWorkbook(date: BirthDate, formula: StarFormula = BOOK_FORMULA): WorkbookRow[] {
  const values: Partial<Record<FormulaPointId, number>> = {};
  return FORMULA_ORDER.map((id) => {
    const spec = formula[id] ?? BOOK_FORMULA[id];
    let expr: string;
    let raw: number;
    if (spec.type === "date") {
      raw = dateRaw(date, spec.source).raw;
      expr = datePartsExpr(date, spec.source);
    } else {
      const parts = spec.of.map((pid) => values[pid as FormulaPointId] ?? 0);
      raw = parts.reduce((a, b) => a + b, 0);
      expr = spec.of.length ? parts.join(" + ") : "0";
    }
    const reduced = reductionChain(raw);
    values[id] = reduced.value;
    return { id, expr, raw, value: reduced.value, reductions: reduced.steps };
  });
}

export function formulaLabel(point: PointFormula, names: Record<string, string>): string {
  if (point.type === "date") {
    if (point.source === "day") return "день рождения";
    if (point.source === "month") return "месяц рождения";
    if (point.source === "year") return "год рождения";
    return "сумма цифр года";
  }
  if (point.of.length === 0) return "—";
  return point.of.map((id) => names[id] ?? id).join(" + ");
}

export const DATE_POINT_IDS: FormulaPointId[] = ["personality", "spirituality", "money"];

export function parseStarFormula(raw: unknown): StarFormula | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const out = { ...BOOK_FORMULA };
  for (const id of FORMULA_ORDER) {
    const row = input[id];
    if (!row || typeof row !== "object") continue;
    const rec = row as { type?: string; source?: string; of?: unknown };
    if (DATE_POINT_IDS.includes(id)) {
      if (rec.type === "date" && rec.source && DATE_SET.has(rec.source)) {
        out[id] = { type: "date", source: rec.source as DateSource };
      }
      continue;
    }
    if (rec.type === "sum" && Array.isArray(rec.of)) {
      const allowed = new Set(allowedSumParts(id));
      const of = rec.of.filter((x): x is string => typeof x === "string" && allowed.has(x as FormulaPointId));
      out[id] = { type: "sum", of };
    }
  }
  return out;
}

export function allowedSumParts(id: FormulaPointId): FormulaPointId[] {
  const i = FORMULA_ORDER.indexOf(id);
  return FORMULA_ORDER.slice(0, i);
}
