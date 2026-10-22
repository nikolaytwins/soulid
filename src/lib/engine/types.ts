export const SPHERE_IDS = [
  "personality",
  "spirituality",
  "money",
  "relationships",
  "health"
] as const;

export type SphereId = (typeof SPHERE_IDS)[number];

export type CoreId = SphereId | "soulMission";

export const BRIDGE_IDS = ["p12", "p23", "p34", "p45", "p51"] as const;
export type BridgeId = (typeof BRIDGE_IDS)[number];

export const SPHERE_POINT_IDS = [
  "apex",
  "leftBase",
  "rightBase",
  "innerLeft",
  "innerRight",
  "innerBottom"
] as const;
export type SpherePointId = (typeof SPHERE_POINT_IDS)[number];

export type PointKind = "apex" | "ancestral_program" | "fatal_error" | "past_life" | "soul_mission";

export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

export interface ArcanaValue {
  value: number;
  raw: number;
  steps: string[];
}

export interface StarPoint {
  id: string;
  kind: PointKind;
  value: number;
  raw: number;
  steps: string[];
  spheres: SphereId[];
}

export interface SphereTriangle {
  sphere: SphereId;
  apex: StarPoint;
  leftBase: StarPoint;
  rightBase: StarPoint;
  innerLeft: StarPoint;
  innerRight: StarPoint;
  innerBottom: StarPoint;
}

export interface StarResult {
  birthDate: BirthDate;
  isoDate: string;
  core: {
    personality: StarPoint;
    spirituality: StarPoint;
    money: StarPoint;
    relationships: StarPoint;
    health: StarPoint;
    soulMission: StarPoint;
  };
  bridges: {
    p12: StarPoint;
    p23: StarPoint;
    p34: StarPoint;
    p45: StarPoint;
    p51: StarPoint;
  };
  spheres: Record<SphereId, SphereTriangle>;
}

export interface DebugStep {
  id: string;
  label: string;
  formula: string;
  raw: number;
  value: number;
  steps: string[];
}

export interface StarResultDebug extends StarResult {
  debug: DebugStep[];
}

export const SPHERE_META: Record<
  SphereId,
  {
    zone: number;
    neighbors: [BridgeId, BridgeId];
  }
> = {
  spirituality: { zone: 0, neighbors: ["p12", "p23"] },
  money: { zone: 1, neighbors: ["p23", "p34"] },
  relationships: { zone: 2, neighbors: ["p34", "p45"] },
  health: { zone: 3, neighbors: ["p45", "p51"] },
  personality: { zone: 4, neighbors: ["p51", "p12"] }
};

/**
 * Outer bridges between neighbouring spheres are ancestral programs.
 * The fatal error is the bottom inner point of each sphere triangle (apex+… bases → innerBottom).
 */
export const BRIDGE_KIND: Record<BridgeId, Extract<PointKind, "ancestral_program" | "fatal_error">> = {
  p12: "ancestral_program",
  p23: "ancestral_program",
  p34: "ancestral_program",
  p45: "ancestral_program",
  p51: "ancestral_program"
};

export function sphereSlotKind(_sphere: SphereId, point: SpherePointId): PointKind {
  if (point === "apex") return "apex";
  if (point === "innerBottom") return "fatal_error";
  if (point === "innerLeft" || point === "innerRight") return "past_life";
  return "ancestral_program";
}

/** Inner pentagon vertex index in the SVG (clockwise from between spirit/money). */
export const BRIDGE_ZONE_INDEX: Record<BridgeId, number> = {
  p23: 0,
  p34: 1,
  p45: 2,
  p51: 3,
  p12: 4
};

export const ZONE_TO_SPHERE: SphereId[] = [
  "spirituality",
  "money",
  "relationships",
  "health",
  "personality"
];
