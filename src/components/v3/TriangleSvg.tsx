import { createElement as h } from "react";
import { diamond, pts as joinPts, starGeometry, type Pt } from "@/components/star/geometry";
import type { SphereId, StarResult } from "@/lib/engine";
import { ZONE_TO_SPHERE } from "@/lib/engine";
import { V3_GOLD, V3_INK, V3_RED } from "@/lib/v3";

const G = V3_GOLD;
const R = V3_RED;
const INK = V3_INK;
const F = "Forum, serif";

export function V2TriangleSvg({
  width,
  sphere,
  star,
  onPoint
}: {
  width: number;
  sphere: SphereId;
  star: StarResult;
  onPoint: (zoneIndex: number) => void;
}) {
  const z = ZONE_TO_SPHERE.indexOf(sphere);
  const jl = (z + 4) % 5;
  const jr = z;
  const A: Pt = [0, 0];
  const Cl: Pt = [-45, 138];
  const Cr: Pt = [45, 138];
  const SpL: Pt = [-31.5, 96.6];
  const SpR: Pt = [31.5, 96.6];
  const M: Pt = [0, 138];
  const pts = [A, Cl, Cr].map((p) => p.join(",")).join(" ");
  const NP = { style: { pointerEvents: "none" as const } };
  const tri = star.spheres[sphere];
  const sm = [tri.innerLeft.value, tri.innerRight.value, tri.innerBottom.value];
  const IV = [star.bridges.p23.value, star.bridges.p34.value, star.bridges.p45.value, star.bridges.p51.value, star.bridges.p12.value];
  const OV = [
    star.core.spirituality.value,
    star.core.money.value,
    star.core.relationships.value,
    star.core.health.value,
    star.core.personality.value
  ];

  const L = (p: Pt, q: Pt, kk: string) =>
    h("line", { key: kk, x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: G, strokeWidth: 0.9, ...NP });
  const T = (x: number, y: number, v: number | string, fill: string, sz: number, kk: string) =>
    h(
      "text",
      {
        key: kk,
        x,
        y,
        textAnchor: "middle",
        dominantBaseline: "central",
        fontSize: sz,
        fill,
        fontFamily: F,
        ...NP
      },
      v
    );
  const D = (p: Pt, kk: string, r = 2.4) => h("circle", { key: kk, cx: p[0], cy: p[1], r, fill: G, ...NP });
  const corner = (p: Pt, j: number, kk: string) => [
    D(p, kk, 3.6),
    h("circle", {
      key: kk + "h",
      cx: p[0],
      cy: p[1],
      r: 16,
      fill: "transparent",
      style: { cursor: "pointer" },
      onClick: () => onPoint(j)
    })
  ];

  return h(
    "svg",
    { viewBox: "-74 -40 148 204", style: { width, display: "block", overflow: "visible", flexShrink: 0 }, dir: "ltr" },
    h("polygon", {
      key: "p",
      points: pts,
      fill: "rgba(225,32,32,.05)",
      stroke: R,
      strokeWidth: 2,
      strokeLinejoin: "round",
      ...NP
    }),
    L(A, M, "l1"),
    L(SpL, SpR, "l2"),
    L(SpL, M, "l3"),
    L(SpR, M, "l4"),
    D(SpL, "d1"),
    D(SpR, "d2"),
    // Inner bottom = fatal error in every sphere
    h("polygon", { key: "fatal", points: diamond(M[0], M[1], 5), fill: G, ...NP }),
    T(-45, 94, sm[0], INK, 12, "t1"),
    T(45, 94, sm[1], INK, 12, "t2"),
    T(0, 152, sm[2], R, 12, "t3"),
    ...corner(Cl, jl, "cl"),
    ...corner(Cr, jr, "cr"),
    T(-60, 152, IV[jl], R, 15, "t4"),
    T(60, 152, IV[jr], R, 15, "t5"),
    D(A, "ac", 4.4),
    T(0, -22, OV[z], R, 30, "t0")
  );
}

export function V2MiniStar({
  zones,
  size = 26,
  locked = false,
  center = false
}: {
  zones: number[];
  size?: number;
  onDark?: boolean;
  locked?: boolean;
  center?: boolean;
}) {
  const { O, I } = starGeometry();
  const fill = locked ? "rgba(185,147,83,.35)" : R;
  const el = [];
  zones.forEach((i) =>
    el.push(h("polygon", { key: "z" + i, points: joinPts([O[i], I[(i + 4) % 5], I[i]]), fill }))
  );
  if (center) el.push(h("polygon", { key: "c", points: joinPts(I), fill: R }));
  el.push(
    h("polygon", {
      key: "o",
      points: joinPts([O[0], O[2], O[4], O[1], O[3]]),
      fill: "none",
      stroke: G,
      strokeWidth: 7,
      strokeLinejoin: "round"
    })
  );
  O.forEach((p, i) => el.push(h("circle", { key: "d" + i, cx: p[0], cy: p[1], r: 10, fill: G })));
  return h(
    "svg",
    {
      viewBox: "-115 -115 230 215",
      width: size,
      height: (size * 215) / 230,
      style: { display: "block", overflow: "visible" },
      dir: "ltr"
    },
    el
  );
}

export function V2LockIcon({ color = "currentColor", size = 11 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1.4" fill={color} />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke={color} strokeWidth="1.3" fill="none" />
    </svg>
  );
}
