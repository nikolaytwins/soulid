import type { SphereId } from "@/lib/engine";

export const V2_PREFIX = "/v2";

export function isV2Path(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === V2_PREFIX || pathname.startsWith(`${V2_PREFIX}/`);
}

export function v2Href(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === V2_PREFIX || clean.startsWith(`${V2_PREFIX}/`)) return clean;
  return `${V2_PREFIX}${clean === "/" ? "" : clean}` || V2_PREFIX;
}

export type SphereTint = {
  t: string;
  a1: string;
  a2: string;
  ink: string;
  acc: string;
};

export const V2_INK = "#2B1A33";
export const V2_CREAM = "#F8F1E9";
export const V2_MUTED = "#8A8494";
export const V2_BODY = "#5B5566";
export const V2_GOLD = "#E9C27C";
export const V2_CARD = "#FFFFFF";

export const SPHERE_TINT: Record<SphereId, SphereTint> = {
  personality: { t: "#FBE1D3", a1: "#F8C9B0", a2: "#E8957A", ink: "#5C2716", acc: "#D97F5E" },
  spirituality: { t: "#EFDDF6", a1: "#E3C5F1", a2: "#B686D6", ink: "#3D1C57", acc: "#A270CB" },
  money: { t: "#F8EACB", a1: "#F3D9A0", a2: "#D9A957", ink: "#4D3410", acc: "#C49445" },
  relationships: { t: "#FADCE6", a1: "#F6C2D3", a2: "#DE85A3", ink: "#5E1C34", acc: "#CC6E91" },
  health: { t: "#DCEDEB", a1: "#BFE0DB", a2: "#78B5AC", ink: "#173F3B", acc: "#5FA299" }
};

export const V2_NEU: SphereTint = {
  t: "#F6E3C4",
  a1: "#F0D3A4",
  a2: "#D9A55C",
  ink: "#4A3016",
  acc: "#C48A3E"
};

/** Section color #4B5F99 from the Soul mission palette. */
export const V2_MISSION: SphereTint = {
  t: "#E8EBF4",
  a1: "#A8B3D1",
  a2: "#4B5F99",
  ink: "#2A3658",
  acc: "#4B5F99"
};

export const V2_STAR_THEME = {
  line: "#9A93A3",
  outline: "#B5AEBD",
  lockedFill: "rgba(43,26,51,0.05)",
  centerFill: "rgba(43,26,51,0.04)",
  aStroke: V2_INK,
  glow: V2_GOLD,
  aNum: V2_INK,
  ink: V2_INK,
  muted: V2_MUTED,
  card: V2_CARD,
  lock: "#AFA8B8",
  guide: "rgba(43,26,51,0.10)"
};

export const LOGO_DOTS = ["#E8957A", "#B686D6", "#D9A957", "#DE85A3", "#78B5AC", V2_INK] as const;
