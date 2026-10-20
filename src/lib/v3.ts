import type { SphereId } from "@/lib/engine";

export const V3_PREFIX = "/v3";

export function isV3Path(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === V3_PREFIX || pathname.startsWith(`${V3_PREFIX}/`);
}

export function v3Href(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === V3_PREFIX || clean.startsWith(`${V3_PREFIX}/`)) return clean;
  return `${V3_PREFIX}${clean === "/" ? "" : clean}` || V3_PREFIX;
}

export const V3_INK = "#1A1A1A";
export const V3_BODY = "#2E2A28";
export const V3_MUTED = "#4A4441";
export const V3_FAINT = "#6B6461";
export const V3_RED = "#E12020";
export const V3_RED_HOVER = "#C41818";
export const V3_GOLD = "#B99353";
export const V3_CREAM = "#F6F3F3";
export const V3_CARD = "rgba(255,255,255,.44)";
export const V3_CARD_STRONG = "rgba(255,255,255,.55)";
export const V3_BOOK_BG = "/v3/book-bg.png";

export const V3_FONT_DISPLAY = "Forum, serif";
export const V3_FONT_BODY = "'Noto Sans', system-ui, sans-serif";

export type SphereTint = {
  t: string;
  a1: string;
  a2: string;
  ink: string;
  acc: string;
};

/** Soft paper tints — accent stays red/gold in chrome. */
export const SPHERE_TINT: Record<SphereId, SphereTint> = {
  personality: { t: "rgba(185,147,83,.18)", a1: "#E8D4B0", a2: V3_GOLD, ink: V3_INK, acc: V3_RED },
  spirituality: { t: "rgba(225,32,32,.08)", a1: "#F2C4C4", a2: V3_RED, ink: V3_INK, acc: V3_RED },
  money: { t: "rgba(185,147,83,.22)", a1: "#E4D2A8", a2: V3_GOLD, ink: V3_INK, acc: V3_GOLD },
  relationships: { t: "rgba(225,32,32,.06)", a1: "#EFD0D0", a2: V3_RED, ink: V3_INK, acc: V3_RED },
  health: { t: "rgba(185,147,83,.16)", a1: "#D9E0C8", a2: V3_GOLD, ink: V3_INK, acc: V3_GOLD }
};

export const V3_MISSION: SphereTint = {
  t: "rgba(225,32,32,.06)",
  a1: "#E8C8C8",
  a2: V3_RED,
  ink: V3_INK,
  acc: V3_RED
};

export const V3_NEU: SphereTint = {
  t: "rgba(185,147,83,.14)",
  a1: "#E8D4B0",
  a2: V3_GOLD,
  ink: V3_INK,
  acc: V3_GOLD
};

export const V3_STAR_THEME = {
  line: V3_GOLD,
  outline: V3_GOLD,
  lockedFill: "rgba(255,255,255,0.01)",
  centerFill: "rgba(185,147,83,.16)",
  aStroke: V3_RED,
  glow: V3_GOLD,
  aNum: V3_RED,
  ink: V3_INK,
  muted: V3_GOLD,
  card: "#FFFFFF",
  lock: V3_GOLD,
  guide: "rgba(185,147,83,0.45)",
  openFill: "rgba(185,147,83,.18)",
  openFillHover: "rgba(185,147,83,.32)",
  activeFill: "rgba(225,32,32,.05)",
  activeFillHover: "rgba(225,32,32,.10)",
  nextFill: "rgba(255,255,255,.3)",
  nextFillHover: "rgba(225,32,32,.07)"
};
