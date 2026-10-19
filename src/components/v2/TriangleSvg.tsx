import { createElement as h } from "react";
import { diamond, pts as joinPts, starGeometry, type Pt } from "@/components/star/geometry";
import type { SphereId, StarResult } from "@/lib/engine";
import { ZONE_TO_SPHERE } from "@/lib/engine";
import { SPHERE_TINT, V2_GOLD, V2_STAR_THEME } from "@/lib/v2";

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
  const c = V2_STAR_THEME;
  const col = SPHERE_TINT[sphere];
  const z = ZONE_TO_SPHERE.indexOf(sphere);
  const id = "v2tr" + width + sphere;
  const jl = (z + 4) % 5;
  const jr = z;
  const A: Pt = [0, 0];
  const Cl: Pt = [-45, 138];
  const Cr: Pt = [45, 138];
  const Sl: Pt = [-31.5, 96.6];
  const Sr: Pt = [31.5, 96.6];
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
    h("line", { key: kk, x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: col.ink, strokeWidth: 0.9, opacity: 0.45, ...NP });
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
        fontFamily: "Manrope, sans-serif",
        fontWeight: 800,
        ...NP
      },
      v
    );
  const D = (p: Pt, kk: string) => h("circle", { key: kk, cx: p[0], cy: p[1], r: 2.6, fill: col.ink, ...NP });
  const corner = (p: Pt, j: number, kk: string) => {
    const r = 5.5;
    const o = { fill: "#FFFFFF", stroke: c.ink, strokeWidth: 1.6, ...NP };
    return [
      j === 2
        ? h("polygon", { key: kk, ...o, points: diamond(p[0], p[1], r * 1.25) })
        : h("circle", { key: kk, ...o, cx: p[0], cy: p[1], r }),
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
  };

  return h(
    "svg",
    { viewBox: "-72 -24 144 186", style: { width, display: "block", overflow: "visible", flexShrink: 0 }, dir: "ltr" },
    h(
      "defs",
      { key: "d" },
      h(
        "linearGradient",
        { id: id + "g", x1: 0, y1: 0, x2: 0, y2: 1 },
        h("stop", { offset: 0, stopColor: col.a1 }),
        h("stop", { offset: 1, stopColor: col.a2 })
      ),
      h(
        "radialGradient",
        { id: id + "n" },
        h("stop", { offset: 0, stopColor: "#FFFFFF" }),
        h("stop", { offset: 1, stopColor: col.a1 })
      ),
      h("filter", { id: id + "f", x: "-60%", y: "-60%", width: "220%", height: "220%" }, h("feGaussianBlur", { stdDeviation: 9 }))
    ),
    h("polygon", { key: "gl", points: pts, fill: col.a2, opacity: 0.4, filter: `url(#${id}f)`, ...NP }),
    h("polygon", { key: "p", points: pts, fill: `url(#${id}g)`, stroke: "#FFFFFF", strokeWidth: 2.4, strokeLinejoin: "round", ...NP }),
    L(A, M, "l1"),
    L(Sl, Sr, "l2"),
    L(Sl, M, "l3"),
    L(Sr, M, "l4"),
    D(Sl, "d1"),
    D(Sr, "d2"),
    D(M, "d3"),
    T(-44, 96.6, sm[0], col.ink, 10, "t1"),
    T(44, 96.6, sm[1], col.ink, 10, "t2"),
    T(0, 151, sm[2], col.ink, 10, "t3"),
    ...corner(Cl, jl, "cl"),
    ...corner(Cr, jr, "cr"),
    T(-60, 150, IV[jl], c.ink, 11, "t4"),
    T(60, 150, IV[jr], c.ink, 11, "t5"),
    h("circle", { key: "ac", r: 13.5, fill: `url(#${id}n)`, stroke: "#FFFFFF", strokeWidth: 1.6, ...NP }),
    T(0, 0, OV[z], col.ink, 13, "t0")
  );
}

export function V2MiniStar({
  zones,
  size = 26,
  onDark = false,
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
  const c = V2_STAR_THEME;
  const sphere = zones.length ? ZONE_TO_SPHERE[zones[0]] : null;
  const col = sphere ? SPHERE_TINT[sphere] : null;
  const fill = locked ? c.lock : col ? (onDark ? col.a1 : col.a2) : V2_GOLD;
  const stroke = locked ? c.lock : onDark || !col ? (col ? col.a1 : V2_GOLD) : col.ink;
  const el = [];
  zones.forEach((i) =>
    el.push(
      h("polygon", {
        key: "z" + i,
        points: joinPts([O[i], I[(i + 4) % 5], I[i]]),
        fill,
        opacity: locked ? 0.4 : 1
      })
    )
  );
  if (center) el.push(h("polygon", { key: "c", points: joinPts(I), fill, opacity: 0.6 }));
  for (let i = 0; i < 5; i++) {
    el.push(
      h("line", {
        key: "l" + i,
        x1: O[i][0],
        y1: O[i][1],
        x2: O[(i + 2) % 5][0],
        y2: O[(i + 2) % 5][1],
        stroke,
        strokeWidth: 10,
        strokeLinejoin: "round",
        strokeLinecap: "round"
      })
    );
  }
  return h(
    "svg",
    {
      viewBox: "-112 -112 224 210",
      width: size,
      height: (size * 210) / 224,
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
