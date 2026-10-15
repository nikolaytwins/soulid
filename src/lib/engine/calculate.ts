import { reduceToArcana, isValidCalendarDate } from "./reduce";
import type {
  BirthDate,
  BridgeId,
  DebugStep,
  SphereId,
  SphereTriangle,
  StarPoint,
  StarResult,
  StarResultDebug
} from "./types";
import { BRIDGE_KIND, SPHERE_IDS, SPHERE_META } from "./types";
import {
  BOOK_FORMULA,
  dateRaw,
  formulaLabel,
  type FormulaPointId,
  type StarFormula
} from "./formula";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function point(
  id: string,
  kind: StarPoint["kind"],
  raw: number,
  spheres: SphereId[],
  extraSteps: string[] = []
): StarPoint {
  const reduced = reduceToArcana(raw);
  return {
    id,
    kind,
    value: reduced.value,
    raw,
    steps: [...extraSteps, ...reduced.steps],
    spheres
  };
}

function debugFrom(p: StarPoint, label: string, formula: string): DebugStep {
  return {
    id: p.id,
    label,
    formula,
    raw: p.raw,
    value: p.value,
    steps: p.steps
  };
}

/**
 * Personal pentagram from a birth date.
 *
 * Notebook / book mapping (letters on the handwritten star):
 *   A = personality (day)
 *   B = spirituality (month)
 *   C = money (digit sum of year)
 *   D = A+B = p12
 *   E = B+C = p23
 *   F = A+B+C = relationships
 *   G = C+F = p34
 *   H = A+B+C+F = health
 *   K = H+A = p51
 *   J = H+F = p45  (fatal error)
 *   L = A+B+C+F+H = soul mission
 */
export function calculateStar(date: BirthDate): StarResult;
export function calculateStar(date: BirthDate, options: { debug: true; formula?: StarFormula }): StarResultDebug;
export function calculateStar(date: BirthDate, options?: { debug?: boolean; formula?: StarFormula }): StarResult;
export function calculateStar(date: BirthDate, options?: { debug?: boolean; formula?: StarFormula }): StarResult | StarResultDebug {
  const { year, month, day } = date;
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error(`Invalid calendar date: ${year}-${pad(month)}-${pad(day)}`);
  }

  const isoDate = `${year}-${pad(month)}-${pad(day)}`;
  const formula = options?.formula ?? BOOK_FORMULA;
  const names: Record<string, string> = {
    personality: "A1",
    spirituality: "A2",
    money: "A3",
    relationships: "A4",
    health: "A5",
    soulMission: "A6",
    p12: "P12",
    p23: "P23",
    p34: "P34",
    p45: "P45",
    p51: "P51"
  };
  const computed: Partial<Record<FormulaPointId, StarPoint>> = {};

  const make = (id: FormulaPointId, kind: StarPoint["kind"], spheres: SphereId[]) => {
    const spec = formula[id] ?? BOOK_FORMULA[id];
    let raw = 0;
    const extra: string[] = [];
    if (spec.type === "date") {
      const got = dateRaw(date, spec.source);
      raw = got.raw;
      extra.push(`${id} = ${got.note}`);
    } else {
      const parts = spec.of.map((pid) => computed[pid as FormulaPointId]?.value ?? 0);
      raw = parts.reduce((a, b) => a + b, 0);
      extra.push(
        `${id} = ${spec.of.map((pid, i) => `${pid}:${parts[i]}`).join("+") || "0"}`
      );
    }
    computed[id] = point(id, kind, raw, spheres, extra);
  };

  make("personality", "apex", ["personality"]);
  make("spirituality", "apex", ["spirituality"]);
  make("money", "apex", ["money"]);
  make("relationships", "apex", ["relationships"]);
  make("health", "apex", ["health"]);
  make("soulMission", "soul_mission", []);
  make("p12", BRIDGE_KIND.p12, ["personality", "spirituality"]);
  make("p23", BRIDGE_KIND.p23, ["spirituality", "money"]);
  make("p34", BRIDGE_KIND.p34, ["money", "relationships"]);
  make("p45", BRIDGE_KIND.p45, ["relationships", "health"]);
  make("p51", BRIDGE_KIND.p51, ["health", "personality"]);

  const personality = computed.personality!;
  const spirituality = computed.spirituality!;
  const money = computed.money!;
  const relationships = computed.relationships!;
  const health = computed.health!;
  const soulMission = computed.soulMission!;
  const p12 = computed.p12!;
  const p23 = computed.p23!;
  const p34 = computed.p34!;
  const p45 = computed.p45!;
  const p51 = computed.p51!;

  const core = { personality, spirituality, money, relationships, health, soulMission };
  const bridges = { p12, p23, p34, p45, p51 };

  const triangle = (
    sphere: SphereId,
    apex: StarPoint,
    left: StarPoint,
    right: StarPoint
  ): SphereTriangle => {
    const innerLeft = point(
      `${sphere}.innerLeft`,
      "past_life",
      apex.value + left.value,
      [sphere],
      [`${sphere} innerLeft = apex+leftBase = ${apex.value}+${left.value}`]
    );
    const innerRight = point(
      `${sphere}.innerRight`,
      "past_life",
      apex.value + right.value,
      [sphere],
      [`${sphere} innerRight = apex+rightBase = ${apex.value}+${right.value}`]
    );
    const innerBottom = point(
      `${sphere}.innerBottom`,
      "past_life",
      left.value + right.value,
      [sphere],
      [`${sphere} innerBottom = leftBase+rightBase = ${left.value}+${right.value}`]
    );
    return {
      sphere,
      apex: { ...apex, spheres: [sphere] },
      leftBase: left,
      rightBase: right,
      innerLeft,
      innerRight,
      innerBottom
    };
  };

  const spheres = Object.fromEntries(
    SPHERE_IDS.map((id) => {
      const [leftId, rightId] = SPHERE_META[id].neighbors;
      return [id, triangle(id, computed[id]!, computed[leftId]!, computed[rightId]!)];
    })
  ) as Record<SphereId, SphereTriangle>;

  const result: StarResult = {
    birthDate: { year, month, day },
    isoDate,
    core,
    bridges,
    spheres
  };

  if (!options?.debug) return result;

  const debug: DebugStep[] = [
    debugFrom(personality, "A1 Personality (left)", formulaLabel(formula.personality, names)),
    debugFrom(spirituality, "A2 Spirituality (top)", formulaLabel(formula.spirituality, names)),
    debugFrom(money, "A3 Money / realization (right)", formulaLabel(formula.money, names)),
    debugFrom(relationships, "A4 Relationships (bottom-right)", formulaLabel(formula.relationships, names)),
    debugFrom(health, "A5 Health (bottom-left)", formulaLabel(formula.health, names)),
    debugFrom(soulMission, "A6 Soul mission (center)", formulaLabel(formula.soulMission, names)),
    debugFrom(p12, "P12 ancestral (personality–spirituality)", formulaLabel(formula.p12, names)),
    debugFrom(p23, "P23 ancestral (spirituality–money)", formulaLabel(formula.p23, names)),
    debugFrom(p34, "P34 ancestral (money–relationships)", formulaLabel(formula.p34, names)),
    debugFrom(p45, "P45 fatal error (relationships–health)", formulaLabel(formula.p45, names)),
    debugFrom(p51, "P51 ancestral (health–personality)", formulaLabel(formula.p51, names)),
    ...SPHERE_IDS.flatMap((id) => {
      const t = spheres[id];
      return [
        debugFrom(t.innerLeft, `${id} inner left`, "apex + leftBase"),
        debugFrom(t.innerRight, `${id} inner right`, "apex + rightBase"),
        debugFrom(t.innerBottom, `${id} inner bottom`, "leftBase + rightBase")
      ];
    })
  ];

  return { ...result, debug };
}

export function calculateStarFromIso(isoDate: string, options?: { debug?: boolean; formula?: StarFormula }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Expected YYYY-MM-DD, got ${isoDate}`);
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return options?.debug ? calculateStar(date, { debug: true, formula: options.formula }) : calculateStar(date, { formula: options?.formula });
}

export function bridgeIdAtZone(zoneIndex: number): BridgeId {
  const map: BridgeId[] = ["p23", "p34", "p45", "p51", "p12"];
  return map[zoneIndex] ?? "p23";
}
