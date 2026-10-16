import { describe, expect, it } from "vitest";
import { reduceToArcana, sumDigits } from "./reduce";
import { calculateStar, calculateStarFromIso } from "./calculate";
import { BOOK_FORMULA, formulaWorkbook, parseStarFormula } from "./formula";
import { reductionChain } from "./reduce";
import { collectNumberLocations, countDistinctValues, matchPatternRules } from "./patterns";
import { SPHERE_IDS, sphereSlotKind } from "./types";

describe("reduceToArcana", () => {
  it("keeps values 1–22", () => {
    expect(reduceToArcana(1).value).toBe(1);
    expect(reduceToArcana(21).value).toBe(21);
    expect(reduceToArcana(22).value).toBe(22);
  });

  it("reduces book examples", () => {
    expect(reduceToArcana(25).value).toBe(7);
    expect(reduceToArcana(28).value).toBe(10);
    expect(reduceToArcana(29).value).toBe(11);
    expect(reduceToArcana(32).value).toBe(5);
    expect(reduceToArcana(40).value).toBe(4);
    expect(reduceToArcana(44).value).toBe(8);
    expect(reduceToArcana(24).value).toBe(6);
  });

  it("repeats until ≤22", () => {
    expect(reduceToArcana(99).value).toBe(18);
    expect(reduceToArcana(999).value).toBe(9);
  });

  it("exposes digit-sum helper", () => {
    expect(sumDigits(1992)).toBe(21);
    expect(sumDigits(1999)).toBe(28);
  });
});

describe("calculateStar — book example 05.03.1992", () => {
  const star = calculateStar({ year: 1992, month: 3, day: 5 });

  it("computes A1–A6", () => {
    expect(star.core.personality.value).toBe(5);
    expect(star.core.spirituality.value).toBe(3);
    expect(star.core.money.value).toBe(21);
    expect(star.core.relationships.value).toBe(11);
    expect(star.core.health.value).toBe(4);
    expect(star.core.soulMission.value).toBe(8);
  });

  it("computes bridges including fatal error P45", () => {
    expect(star.bridges.p12.value).toBe(8);
    expect(star.bridges.p23.value).toBe(6);
    expect(star.bridges.p34.value).toBe(5);
    expect(star.bridges.p45.value).toBe(15);
    expect(star.bridges.p45.kind).toBe("fatal_error");
    expect(star.bridges.p51.value).toBe(9);
    expect(star.bridges.p12.kind).toBe("ancestral_program");
  });

  it("computes personality inner triangle from the book (9+5=14, 5+8=13, 9+8=17)", () => {
    const t = star.spheres.personality;
    expect(t.apex.value).toBe(5);
    expect(t.leftBase.value).toBe(9);
    expect(t.rightBase.value).toBe(8);
    expect(t.innerLeft.value).toBe(14);
    expect(t.innerRight.value).toBe(13);
    expect(t.innerBottom.value).toBe(17);
  });

  it("computes remaining inner triangles (matches HTML demo values)", () => {
    expect(star.spheres.spirituality.innerLeft.value).toBe(11);
    expect(star.spheres.spirituality.innerRight.value).toBe(9);
    expect(star.spheres.spirituality.innerBottom.value).toBe(14);

    expect(star.spheres.money.innerLeft.value).toBe(9);
    expect(star.spheres.money.innerRight.value).toBe(8);
    expect(star.spheres.money.innerBottom.value).toBe(11);

    expect(star.spheres.relationships.innerLeft.value).toBe(16);
    expect(star.spheres.relationships.innerRight.value).toBe(8);
    expect(star.spheres.relationships.innerBottom.value).toBe(20);

    expect(star.spheres.health.innerLeft.value).toBe(19);
    expect(star.spheres.health.innerRight.value).toBe(13);
    expect(star.spheres.health.innerBottom.value).toBe(6);
  });

  it("tags shared bridges with both neighbouring spheres", () => {
    expect(star.bridges.p12.spheres).toEqual(["personality", "spirituality"]);
    expect(star.bridges.p45.spheres).toEqual(["relationships", "health"]);
  });

  it("marks only P45 bases as fatal error (relationships right, health left)", () => {
    for (const id of SPHERE_IDS) {
      const t = star.spheres[id];
      expect(sphereSlotKind(id, "leftBase")).toBe(t.leftBase.kind);
      expect(sphereSlotKind(id, "rightBase")).toBe(t.rightBase.kind);
      expect(sphereSlotKind(id, "apex")).toBe("apex");
      expect(sphereSlotKind(id, "innerLeft")).toBe("past_life");
    }
    expect(sphereSlotKind("relationships", "rightBase")).toBe("fatal_error");
    expect(sphereSlotKind("health", "leftBase")).toBe("fatal_error");
    expect(sphereSlotKind("relationships", "leftBase")).toBe("ancestral_program");
    expect(sphereSlotKind("health", "rightBase")).toBe("ancestral_program");
    expect(sphereSlotKind("personality", "leftBase")).toBe("ancestral_program");
    expect(sphereSlotKind("personality", "rightBase")).toBe("ancestral_program");
    expect(sphereSlotKind("spirituality", "leftBase")).toBe("ancestral_program");
    expect(sphereSlotKind("money", "rightBase")).toBe("ancestral_program");
  });

  it("returns debug traces when requested", () => {
    const debug = calculateStar({ year: 1992, month: 3, day: 5 }, { debug: true });
    expect(debug.debug.length).toBeGreaterThan(15);
    const a3 = debug.debug.find((s) => s.id === "money");
    expect(a3?.formula).toMatch(/цифр года|year/i);
    expect(a3?.value).toBe(21);
  });

  it("applies an override formula without changing the book default", () => {
    const custom = { ...BOOK_FORMULA, personality: { type: "date" as const, source: "month" as const } };
    const star = calculateStar({ year: 1992, month: 3, day: 5 }, { formula: custom });
    expect(star.core.personality.value).toBe(3);
    expect(calculateStar({ year: 1992, month: 3, day: 5 }).core.personality.value).toBe(5);
  });
});

describe("formula workbook (book example 05.03.1992)", () => {
  it("writes sums the way the book does", () => {
    const rows = Object.fromEntries(
      formulaWorkbook({ year: 1992, month: 3, day: 5 }).map((row) => [row.id, row])
    );
    expect(rows.personality).toMatchObject({ expr: "5", raw: 5, value: 5 });
    expect(rows.spirituality).toMatchObject({ expr: "3", raw: 3, value: 3 });
    expect(rows.money).toMatchObject({ expr: "1 + 9 + 9 + 2", raw: 21, value: 21 });
    expect(rows.relationships).toMatchObject({ expr: "5 + 3 + 21", raw: 29, value: 11 });
    expect(rows.health).toMatchObject({ expr: "5 + 3 + 21 + 11", raw: 40, value: 4 });
    expect(rows.soulMission).toMatchObject({ expr: "5 + 3 + 21 + 11 + 4", raw: 44, value: 8 });
    expect(rows.p12).toMatchObject({ expr: "5 + 3", raw: 8, value: 8 });
    expect(rows.p23).toMatchObject({ expr: "3 + 21", raw: 24, value: 6 });
    expect(rows.p34).toMatchObject({ expr: "21 + 11", raw: 32, value: 5 });
    expect(rows.p45).toMatchObject({ expr: "11 + 4", raw: 15, value: 15 });
    expect(rows.p51).toMatchObject({ expr: "4 + 5", raw: 9, value: 9 });
  });

  it("reduces 29 → 2+9=11 like the book", () => {
    expect(reductionChain(29)).toEqual({
      value: 11,
      steps: [{ from: 29, expr: "2 + 9", to: 11 }]
    });
  });
});

describe("parseStarFormula", () => {
  it("keeps book defaults and ignores later points in a sum", () => {
    const parsed = parseStarFormula({
      personality: { type: "date", source: "month" },
      p12: { type: "sum", of: ["personality", "p23"] }
    });
    expect(parsed?.personality).toEqual({ type: "date", source: "month" });
    expect(parsed?.spirituality).toEqual(BOOK_FORMULA.spirituality);
    expect(parsed?.p12).toEqual({ type: "sum", of: ["personality"] });
  });
});

describe("edge dates", () => {
  it("reduces days 23–31", () => {
    expect(calculateStar({ year: 1990, month: 1, day: 23 }).core.personality.value).toBe(5);
    expect(calculateStar({ year: 1990, month: 1, day: 28 }).core.personality.value).toBe(10);
    expect(calculateStar({ year: 1990, month: 1, day: 31 }).core.personality.value).toBe(4);
  });

  it("rejects invalid dates", () => {
    expect(() => calculateStar({ year: 2024, month: 2, day: 31 })).toThrow(/Invalid/);
    expect(() => calculateStarFromIso("05.03.1992")).toThrow();
  });

  it("parses ISO dates", () => {
    const star = calculateStarFromIso("1992-03-05");
    expect(star.isoDate).toBe("1992-03-05");
    expect(star.core.personality.value).toBe(5);
  });
});

describe("pattern architecture 05.03.1992", () => {
  const star = calculateStar({ year: 1992, month: 3, day: 5 });

  it("counts repeating 14 at least twice as distinct positions", () => {
    const counts = countDistinctValues(collectNumberLocations(star));
    expect(counts.get(14) ?? 0).toBeGreaterThanOrEqual(2);
    expect(counts.get(5) ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("matches repeating and combination rules without CMS", () => {
    const matches = matchPatternRules(star, [
      { id: "r14", kind: "repeating", values: [14], minCount: 2, scope: "star", sphere: null },
      { id: "c53", kind: "combination", values: [5, 3], minCount: 2, scope: "star", sphere: null },
      { id: "miss", kind: "combination", values: [22, 1], minCount: 2, scope: "star", sphere: null }
    ]);
    expect(matches.map((m) => m.ruleId).sort()).toEqual(["c53", "r14"]);
  });
});
