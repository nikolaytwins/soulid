export type Theme = {
  line: string;
  outline: string;
  lockedFill: string;
  centerFill: string;
  a1: string;
  a2: string;
  aStroke: string;
  glow: string;
  aText: string;
  aNum: string;
  ink: string;
  muted: string;
  card: string;
  lock: string;
  guide: string;
};

export const starTheme: Theme = {
  line: "#9C8B7E",
  outline: "#A8968A",
  lockedFill: "rgba(120,95,75,0.07)",
  centerFill: "rgba(120,95,75,0.05)",
  a1: "#F7DDB0",
  a2: "#E2A95E",
  aStroke: "#C78A3E",
  glow: "#F0B865",
  aText: "#3A2716",
  aNum: "#8E5F2A",
  ink: "#2A211D",
  muted: "#8E8178",
  card: "#FBF8F4",
  lock: "#A89A8F",
  guide: "rgba(120,95,75,0.14)"
};

export type Pt = [number, number];

export function polar(angleDeg: number, r: number): Pt {
  return [r * Math.cos((angleDeg * Math.PI) / 180), r * Math.sin((angleDeg * Math.PI) / 180)];
}

export const OUTER_ANGLES = [-90, -18, 54, 126, 198] as const;
export const INNER_ANGLES = [-54, 18, 90, 162, 234] as const;

export function starGeometry() {
  const O = OUTER_ANGLES.map((a) => polar(a, 100));
  const I = INNER_ANGLES.map((a) => polar(a, 38.2));
  return { O, I };
}

export function lerp(p: Pt, q: Pt, k: number): Pt {
  return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
}

export function pts(arr: Pt[]): string {
  return arr.map((p) => p.join(",")).join(" ");
}

export function diamond(x: number, y: number, r: number): string {
  return `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
}

export const LABEL_POS: Pt[] = [
  [0, -118],
  [106, -4],
  [58.8, 101],
  [-58.8, 101],
  [-106, -4]
];

export const ZONE_TO_SPHERE_INDEX = [1, 2, 3, 4, 0];
