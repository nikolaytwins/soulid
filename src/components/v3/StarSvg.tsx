import { createElement as h, type ReactNode } from "react";
import { diamond, INNER_ANGLES, OUTER_ANGLES, lerp, polar, pts, starGeometry, type Pt } from "@/components/star/geometry";
import type { SphereId, StarResult } from "@/lib/engine";
import { ZONE_TO_SPHERE } from "@/lib/engine";
import { V3_GOLD, V3_INK, V3_RED } from "@/lib/v3";

export type ZoneState = "active" | "open" | "next" | "locked";

export type HoverTip =
  | { kind: "bridge"; j: number }
  | { kind: "apex"; zone: number }
  | { kind: "inner"; zone: number; slot: 0 | 1 | 2 }
  | { kind: "mission" };

type Props = {
  star: StarResult;
  mobile?: boolean;
  svgId?: string;
  activeSphere: SphereId | null;
  missionActive?: boolean;
  unlocked: SphereId[];
  nextSphere: SphereId | null;
  lockStyle?: "blur" | "redacted";
  hoverPt: number | null;
  hoverZone: number | null;
  hoverTip: HoverTip | null;
  selectedPt: number | null;
  onSphere: (sphere: SphereId) => void;
  onPoint: (zoneIndex: number) => void;
  onMission: () => void;
  onHoverPt: (i: number | null) => void;
  onHoverZone: (i: number | null) => void;
  onHoverTip: (tip: HoverTip | null) => void;
  labels: Record<SphereId, string>;
  missionLabel: [string, string];
};

const G = V3_GOLD;
const R = V3_RED;
const INK = V3_INK;
const F = "Forum, serif";

function Lock({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return h(
    "g",
    { transform: `translate(${x},${y}) scale(${s})`, style: { pointerEvents: "none" } },
    h("rect", { x: -3.6, y: -0.8, width: 7.2, height: 5.6, rx: 1.3, fill: color }),
    h("path", {
      d: "M-2.1,-0.8 V-2.6 A2.1,2.1 0 0 1 2.1,-2.6 V-0.8",
      stroke: color,
      strokeWidth: 1.15,
      fill: "none"
    })
  );
}

function zoneState(sphere: SphereId, active: SphereId | null, unlocked: Set<SphereId>, next: SphereId | null): ZoneState {
  if (active && sphere === active && unlocked.has(sphere)) return "active";
  if (unlocked.has(sphere)) return "open";
  if (sphere === next) return "next";
  return "locked";
}

/** v3 star — matches Soul Star Расшифровка v5 HTML (thin gold mesh, red active outline, numbers outside tips). */
export function V2StarSvg(props: Props) {
  const { O, I } = starGeometry();
  const mobile = !!props.mobile;
  const id = props.svgId ?? (mobile ? "stm" : "std");
  const blur = (props.lockStyle ?? "blur") === "blur";
  const fs = mobile ? 1.18 : 1;
  const NP = { style: { pointerEvents: "none" as const } };
  const unlocked = new Set(props.unlocked);
  const allOpen = unlocked.size >= 5;
  const nOpen = unlocked.size;

  const outerValues = ZONE_TO_SPHERE.map((s) => props.star.core[s].value);
  const innerValues = (["p23", "p34", "p45", "p51", "p12"] as const).map((b) => props.star.bridges[b].value);
  // Outer bridges are ancestral; fatal error lives on each triangle's inner bottom.
  const innerKindFatal = [false, false, false, false, false];

  const hidden = (x: number, y: number, val: number, size: number, key: string) =>
    blur
      ? h(
          "text",
          {
            key,
            x,
            y,
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: size,
            fill: G,
            fontFamily: F,
            filter: `url(#${id}b)`,
            opacity: 0.6,
            ...NP
          },
          val
        )
      : h("rect", {
          key,
          x: x - size * 0.5,
          y: y - size * 0.2,
          width: size,
          height: size * 0.4,
          fill: G,
          opacity: 0.3,
          ...NP
        });

  const el: ReactNode[] = [];
  const top: ReactNode[] = [];
  let n = 0;
  const K = () => `k${n++}`;

  el.push(
    h(
      "defs",
      { key: "d" },
      h(
        "filter",
        { key: "b", id: id + "b", x: "-50%", y: "-50%", width: "200%", height: "200%" },
        h("feGaussianBlur", { stdDeviation: 1.6 })
      ),
      h(
        "filter",
        { key: "s", id: id + "s", x: "-20%", y: "-20%", width: "140%", height: "140%" },
        h("feDropShadow", { dx: 0, dy: 0.6, stdDeviation: 0.9, floodColor: "#7A5A2A", floodOpacity: 0.25 })
      )
    )
  );

  if (nOpen >= 5) {
    el.push(h("polygon", { key: K(), points: pts(I), fill: "rgba(185,147,83,.16)", ...NP }));
  }

  for (let i = 0; i < 5; i++) {
    const sphere = ZONE_TO_SPHERE[i];
    const A = O[i];
    const C1 = I[(i + 4) % 5];
    const C2 = I[i];
    const st = zoneState(sphere, props.activeSphere, unlocked, props.nextSphere);
    const vis = st === "active" || st === "open";
    const hov = props.hoverZone === i;
    const S1 = lerp(A, C1, 0.7);
    const S2 = lerp(A, C2, 0.7);
    const M = lerp(C1, C2, 0.5);
    const cen: Pt = [(A[0] + C1[0] + C2[0]) / 3, (A[1] + C1[1] + C2[1]) / 3];
    const ev = {
      onClick: () => props.onSphere(sphere),
      onMouseEnter: () => props.onHoverZone(i),
      onMouseLeave: () => props.onHoverZone(null),
      style: { cursor: "pointer" as const }
    };

    const fill =
      st === "active"
        ? hov
          ? "rgba(225,32,32,.10)"
          : "rgba(225,32,32,.05)"
        : st === "open"
          ? hov
            ? "rgba(185,147,83,.32)"
            : "rgba(185,147,83,.18)"
          : st === "next"
            ? hov
              ? "rgba(225,32,32,.07)"
              : "rgba(255,255,255,.3)"
            : hov
              ? "rgba(185,147,83,.10)"
              : "rgba(255,255,255,0.01)";

    el.push(h("polygon", { key: K(), points: pts([A, C1, C2]), fill, ...ev }));

    const lo = vis ? 1 : 0.55;
    (
      [
        [A, M],
        [S1, S2],
        [S1, M],
        [S2, M]
      ] as [Pt, Pt][]
    ).forEach(([p, q]) =>
      el.push(h("line", { key: K(), x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: G, strokeWidth: 0.5, opacity: lo, ...NP }))
    );

    const tri = props.star.spheres[sphere];
    const sm = [tri.innerLeft.value, tri.innerRight.value, tri.innerBottom.value];
    [S1, S2, M].forEach((p, j) => {
      const dx = p[0] - cen[0];
      const dy = p[1] - cen[1];
      const L = Math.hypot(dx, dy) || 1;
      const off = j === 2 ? 7 : 8;
      const x = p[0] + (dx / L) * off;
      const y = p[1] + (dy / L) * off;
      const v = sm[j];
      const sz = 7 * fs;
      const slot = j as 0 | 1 | 2;
      top.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: 1.5, fill: G, opacity: lo, ...NP }));
      top.push(
        vis
          ? h(
              "text",
              {
                key: K(),
                x,
                y,
                textAnchor: "middle",
                dominantBaseline: "central",
                fontSize: sz,
                fill: INK,
                fontFamily: F,
                ...NP
              },
              v
            )
          : hidden(x, y, v, sz, K())
      );
      top.push(
        h("circle", {
          key: K(),
          cx: (p[0] + x) / 2,
          cy: (p[1] + y) / 2,
          r: mobile ? 12 : 10,
          fill: "transparent",
          style: { cursor: "pointer" },
          onClick: () => props.onSphere(sphere),
          onPointerEnter: () => props.onHoverTip({ kind: "inner", zone: i, slot }),
          onPointerLeave: () => props.onHoverTip(null)
        })
      );
    });
  }

  el.push(
    h("polygon", {
      key: K(),
      points: pts([O[0], O[2], O[4], O[1], O[3]]),
      fill: "none",
      stroke: G,
      strokeWidth: 1.1,
      strokeLinejoin: "round",
      filter: `url(#${id}s)`,
      ...NP
    })
  );

  for (let i = 0; i < 5; i++) {
    const sphere = ZONE_TO_SPHERE[i];
    const st = zoneState(sphere, props.activeSphere, unlocked, props.nextSphere);
    const tri = pts([O[i], I[(i + 4) % 5], I[i]]);
    if (st === "active") {
      el.push(
        h("polygon", {
          key: K(),
          points: tri,
          fill: "none",
          stroke: R,
          strokeWidth: 1.7,
          strokeLinejoin: "round",
          ...NP
        })
      );
    }
    if (st === "next") {
      el.push(
        h("polygon", {
          key: K(),
          points: tri,
          fill: "none",
          stroke: R,
          strokeWidth: 0.8,
          strokeDasharray: "2.6 2",
          strokeLinejoin: "round",
          opacity: 0.8,
          ...NP
        })
      );
    }
  }

  el.push(...top);

  I.forEach((p, j) => {
    const bridge = (["p23", "p34", "p45", "p51", "p12"] as const)[j];
    const spheres = props.star.bridges[bridge].spheres;
    const inA = props.activeSphere ? spheres.includes(props.activeSphere) : false;
    const open = spheres.some((s) => unlocked.has(s));
    const hl = props.hoverPt === j || props.selectedPt === j;
    const fatal = innerKindFatal[j];
    const r = hl ? 3.2 : inA ? 2.8 : 2.2;
    const fill = hl ? R : G;
    const common = { fill, stroke: hl ? "#FFFFFF" : "none", strokeWidth: 0.8, ...NP };
    el.push(
      fatal
        ? h("polygon", { key: K(), ...common, points: diamond(p[0], p[1], r * 1.35) })
        : h("circle", { key: K(), ...common, cx: p[0], cy: p[1], r })
    );
    const q = polar(INNER_ANGLES[j], 51);
    const sz = 11 * (mobile ? 1.1 : 1);
    el.push(
      open
        ? h(
            "text",
            {
              key: K(),
              x: q[0],
              y: q[1],
              textAnchor: "middle",
              dominantBaseline: "central",
              fontSize: sz,
              fill: R,
              fontFamily: F,
              ...NP
            },
            innerValues[j]
          )
        : hidden(q[0], q[1], innerValues[j], sz, K())
    );
    el.push(
      h("circle", {
        key: K(),
        cx: p[0],
        cy: p[1],
        r: mobile ? 12 : 10,
        fill: "transparent",
        style: { cursor: "pointer" },
        onClick: () => props.onPoint(j),
        onMouseEnter: () => {
          props.onHoverPt(j);
          props.onHoverTip({ kind: "bridge", j });
        },
        onMouseLeave: () => {
          props.onHoverPt(null);
          props.onHoverTip(null);
        }
      })
    );
  });

  el.push(
    h("circle", {
      key: K(),
      r: 18,
      fill: "transparent",
      style: { cursor: "pointer" },
      onClick: props.onMission,
      onPointerEnter: () => props.onHoverTip({ kind: "mission" }),
      onPointerLeave: () => props.onHoverTip(null)
    })
  );

  if (allOpen) {
    el.push(
      h(
        "text",
        {
          key: K(),
          y: 1,
          textAnchor: "middle",
          dominantBaseline: "central",
          fontSize: 24,
          fill: R,
          fontFamily: F,
          ...NP
        },
        props.star.core.soulMission.value
      )
    );
  } else {
    el.push(
      h(
        "text",
        {
          key: K(),
          y: -4,
          textAnchor: "middle",
          fontSize: 5 * fs,
          letterSpacing: 0.6,
          fill: INK,
          opacity: 0.7,
          fontFamily: F,
          ...NP
        },
        props.missionLabel[0]
      )
    );
    el.push(
      h(
        "text",
        {
          key: K(),
          y: 2,
          textAnchor: "middle",
          fontSize: 5 * fs,
          letterSpacing: 0.6,
          fill: INK,
          opacity: 0.7,
          fontFamily: F,
          ...NP
        },
        props.missionLabel[1]
      )
    );
    el.push(h(Lock, { key: K(), x: 0, y: 7.5, s: 0.9, color: G }));
  }

  O.forEach((p, i) => {
    const sphere = ZONE_TO_SPHERE[i];
    const st = zoneState(sphere, props.activeSphere, unlocked, props.nextSphere);
    const vis = st === "active" || st === "open";
    const ev = {
      onClick: () => props.onSphere(sphere),
      onMouseEnter: () => props.onHoverZone(i),
      onMouseLeave: () => props.onHoverZone(null),
      style: { cursor: "pointer" as const }
    };
    const apexEv = {
      onClick: () => props.onSphere(sphere),
      onPointerEnter: () => {
        props.onHoverZone(i);
        props.onHoverTip({ kind: "apex", zone: i });
      },
      onPointerLeave: () => {
        props.onHoverZone(null);
        props.onHoverTip(null);
      },
      style: { cursor: "pointer" as const }
    };

    el.push(
      h("circle", {
        key: K(),
        cx: p[0],
        cy: p[1],
        r: st === "active" ? 3.8 : 3.3,
        fill: st === "active" ? R : G,
        ...NP
      })
    );
    el.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: 14, fill: "transparent", ...apexEv }));

    const q = polar(OUTER_ANGLES[i], 121);
    const nsz = 20 * (mobile ? 1.08 : 1);
    if (vis) {
      el.push(
        h(
          "text",
          {
            key: K(),
            x: q[0],
            y: q[1],
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: nsz,
            fill: R,
            fontFamily: F,
            ...ev
          },
          outerValues[i]
        )
      );
    } else {
      el.push(h(Lock, { key: K(), x: q[0], y: q[1] - 0.8, s: 1.35, color: st === "next" ? R : G }));
    }

    const ly = i === 0 ? q[1] - 16 : q[1] + 15;
    el.push(
      h(
        "text",
        {
          key: K(),
          x: q[0],
          y: ly,
          textAnchor: "middle",
          dominantBaseline: "central",
          fontSize: 6.4 * fs,
          letterSpacing: 0.9,
          fill: st === "active" ? R : INK,
          opacity: st === "locked" ? 0.45 : 1,
          fontFamily: F,
          ...ev
        },
        (props.labels[sphere] || "").toUpperCase()
      )
    );
  });

  return h(
    "svg",
    {
      viewBox: "-155 -152 310 276",
      style: { width: "100%", display: "block", overflow: "visible" },
      dir: "ltr"
    },
    el
  );
}
