import { SPHERE_IDS, type SphereId, type StarResult } from "./types";

export type PatternKind = "repeating" | "combination";
export type PatternScope = "star" | "sphere";

export type NumberLocation = {
  value: number;
  sphere: SphereId | "soulMission";
  point: string;
  spheres: Array<SphereId | "soulMission">;
};

export type PatternRuleInput = {
  id: string;
  kind: PatternKind;
  values: number[];
  minCount: number;
  scope: PatternScope;
  sphere: string | null;
};

export type PatternMatch = {
  ruleId: string;
  kind: PatternKind;
  values: number[];
  count: number;
  occurrences: NumberLocation[];
  involvedSpheres: Array<SphereId | "soulMission">;
};

export function canonicalMatchKey(kind: PatternKind, values: number[], sphere?: string | null): string {
  const nums = [...new Set(values)].sort((a, b) => a - b).join("+");
  const scope = sphere ? `:sphere:${sphere}` : "";
  return kind === "repeating" ? `repeat:${nums}${scope}` : `combo:${nums}${scope}`;
}

export function collectNumberLocations(star: StarResult): NumberLocation[] {
  const out: NumberLocation[] = [];
  for (const id of SPHERE_IDS) {
    out.push({
      value: star.core[id].value,
      sphere: id,
      point: "apex",
      spheres: [id]
    });
  }
  out.push({
    value: star.core.soulMission.value,
    sphere: "soulMission",
    point: "apex",
    spheres: ["soulMission"]
  });
  (["p12", "p23", "p34", "p45", "p51"] as const).forEach((bridge) => {
    const pt = star.bridges[bridge];
    out.push({
      value: pt.value,
      sphere: pt.spheres[0],
      point: bridge,
      spheres: [...pt.spheres]
    });
  });
  for (const id of SPHERE_IDS) {
    const tri = star.spheres[id];
    (
      [
        ["innerLeft", tri.innerLeft.value],
        ["innerRight", tri.innerRight.value],
        ["innerBottom", tri.innerBottom.value]
      ] as const
    ).forEach(([point, value]) => {
      out.push({ value, sphere: id, point, spheres: [id] });
    });
  }
  return out;
}

export function countDistinctValues(locations: NumberLocation[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const loc of locations) {
    counts.set(loc.value, (counts.get(loc.value) ?? 0) + 1);
  }
  return counts;
}

function inScope(locations: NumberLocation[], rule: PatternRuleInput): NumberLocation[] {
  if (rule.scope !== "sphere" || !rule.sphere) return locations;
  return locations.filter((loc) => loc.spheres.includes(rule.sphere as SphereId) || loc.sphere === rule.sphere);
}

export function matchPatternRules(star: StarResult, rules: PatternRuleInput[]): PatternMatch[] {
  const all = collectNumberLocations(star);
  const matches: PatternMatch[] = [];

  for (const rule of rules) {
    const scoped = inScope(all, rule);
    if (rule.kind === "repeating") {
      const target = rule.values[0];
      if (target == null) continue;
      const occurrences = scoped.filter((loc) => loc.value === target);
      if (occurrences.length >= rule.minCount) {
        matches.push({
          ruleId: rule.id,
          kind: rule.kind,
          values: [target],
          count: occurrences.length,
          occurrences,
          involvedSpheres: uniqueSpheres(occurrences)
        });
      }
      continue;
    }

    if (rule.kind === "combination") {
      const needed = [...new Set(rule.values)];
      if (needed.length < 2) continue;
      const present = new Set(scoped.map((loc) => loc.value));
      if (!needed.every((n) => present.has(n))) continue;
      const occurrences = scoped.filter((loc) => needed.includes(loc.value));
      matches.push({
        ruleId: rule.id,
        kind: rule.kind,
        values: needed,
        count: needed.length,
        occurrences,
        involvedSpheres: uniqueSpheres(occurrences)
      });
    }
  }

  return matches;
}

function uniqueSpheres(locations: NumberLocation[]): Array<SphereId | "soulMission"> {
  return [...new Set(locations.flatMap((loc) => loc.spheres))];
}

export function patternIsVisible(
  match: PatternMatch,
  unlocked: Set<SphereId>
): boolean {
  return match.involvedSpheres.every((sphere) => {
    if (sphere === "soulMission") return unlocked.size >= 5;
    return unlocked.has(sphere);
  });
}
