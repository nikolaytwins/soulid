import { createElement as h } from "react";
import { diamond, pts as joinPts, starGeometry, starTheme, type Pt } from "./geometry";
import type { SphereId, StarResult } from "@/lib/engine";
import { ZONE_TO_SPHERE } from "@/lib/engine";

export function TriangleSvg({
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
  const c = starTheme;
  const z = ZONE_TO_SPHERE.indexOf(sphere);
  const id = "tr" + width + sphere;
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
    h("line", { key: kk, x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: c.aStroke, strokeWidth: 0.9, opacity: 0.85, ...NP });
  const T = (x: number, y: number, v: number | string, col: string, sz: number, kk: string) =>
    h(
      "text",
      {
        key: kk,
        x,
        y,
        textAnchor: "middle",
        dominantBaseline: "central",
        fontSize: sz,
        fill: col,
        fontFamily: "Manrope, sans-serif",
        fontWeight: 700,
        ...NP
      },
      v
    );
  const D = (p: Pt, kk: string) => h("circle", { key: kk, cx: p[0], cy: p[1], r: 2.6, fill: c.aStroke, ...NP });
  const corner = (p: Pt, j: number, kk: string) => {
    const r = 5.5;
    const o = { fill: c.card, stroke: c.aStroke, strokeWidth: 1.6, ...NP };
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
        h("stop", { offset: 0, stopColor: c.a1 }),
        h("stop", { offset: 1, stopColor: c.a2 })
      ),
      h(
        "radialGradient",
        { id: id + "n" },
        h("stop", { offset: 0, stopColor: "#F7D9A4" }),
        h("stop", { offset: 1, stopColor: "#D9A055" })
      ),
      h("filter", { id: id + "f", x: "-60%", y: "-60%", width: "220%", height: "220%" }, h("feGaussianBlur", { stdDeviation: 9 }))
    ),
    h("polygon", { key: "gl", points: pts, fill: c.glow, opacity: 0.45, filter: `url(#${id}f)`, ...NP }),
    h("polygon", { key: "p", points: pts, fill: `url(#${id}g)`, stroke: c.aStroke, strokeWidth: 1.8, strokeLinejoin: "round", ...NP }),
    L(A, M, "l1"),
    L(Sl, Sr, "l2"),
    L(Sl, M, "l3"),
    L(Sr, M, "l4"),
    D(Sl, "d1"),
    D(Sr, "d2"),
    D(M, "d3"),
    T(-44, 96.6, sm[0], c.ink, 10, "t1"),
    T(44, 96.6, sm[1], c.ink, 10, "t2"),
    T(0, 151, sm[2], c.ink, 10, "t3"),
    ...corner(Cl, jl, "cl"),
    ...corner(Cr, jr, "cr"),
    T(-60, 150, IV[jl], c.aNum, 11, "t4"),
    T(60, 150, IV[jr], c.aNum, 11, "t5"),
    h("circle", { key: "ag", r: 18, fill: c.glow, opacity: 0.5, filter: `url(#${id}f)`, ...NP }),
    h("circle", { key: "ac", r: 13.5, fill: `url(#${id}n)`, stroke: "#FFF8EC", strokeWidth: 1.4, ...NP }),
    T(0, 0, OV[z], c.aText, 13, "t0")
  );
}

export function MiniStar({
  zones,
  size = 30,
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
  const c = starTheme;
  const fill = locked ? c.lock : "#E2AE63";
  const stroke = locked ? c.lock : onDark ? "#E2AE63" : "#C78A3E";
  const el = [];
  zones.forEach((i) =>
    el.push(
      h("polygon", {
        key: "z" + i,
        points: joinPts([O[i], I[(i + 4) % 5], I[i]]),
        fill,
        opacity: locked ? 0.35 : 1
      })
    )
  );
  if (center) el.push(h("polygon", { key: "c", points: joinPts(I), fill, opacity: 0.45 }));
  for (let i = 0; i < 5; i++) {
    el.push(
      h("line", {
        key: "l" + i,
        x1: O[i][0],
        y1: O[i][1],
        x2: O[(i + 2) % 5][0],
        y2: O[(i + 2) % 5][1],
        stroke,
        strokeWidth: 9,
        strokeLinejoin: "round"
      })
    );
  }
  const svg = h(
    "svg",
    { viewBox: "-112 -112 224 210", width: size, height: (size * 210) / 224, style: { display: "block", overflow: "visible" }, dir: "ltr" },
    el
  );
  const bg = onDark ? "rgba(226,174,99,.14)" : locked ? "#F1EBE4" : "#F6E6CC";
  return h(
    "span",
    {
      style: {
        width: size + 14,
        height: size + 14,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    },
    svg
  );
}
