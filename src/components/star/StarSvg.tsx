import { createElement as h, type ReactNode } from "react";
import { diamond, INNER_ANGLES, LABEL_POS, lerp, polar, pts, starGeometry, starTheme, type Pt } from "./geometry";
import type { SphereId, StarResult } from "@/lib/engine";
import { BRIDGE_ZONE_INDEX, ZONE_TO_SPHERE } from "@/lib/engine";

export type ZoneState = "active" | "open" | "next" | "locked";

export type HoverTip =
  | { kind: "bridge"; j: number }
  | { kind: "apex"; zone: number }
  | { kind: "inner"; zone: number; slot: 0 | 1 | 2 }
  | { kind: "mission" };

type Props = {
  star: StarResult;
  mobile?: boolean;
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

export function StarSvg(props: Props) {
  const c = starTheme;
  const { O, I } = starGeometry();
  const mobile = !!props.mobile;
  const id = mobile ? "stm" : "std";
  const blur = (props.lockStyle ?? "redacted") === "blur";
  const fs = mobile ? 1.22 : 1;
  const NP = { style: { pointerEvents: "none" as const } };
  const unlocked = new Set(props.unlocked);
  const allOpen = unlocked.size >= 5;

  const outerValues = ZONE_TO_SPHERE.map((s) => props.star.core[s].value);
  const innerValues = (["p23", "p34", "p45", "p51", "p12"] as const).map((b) => props.star.bridges[b].value);
  const innerKindFatal = [false, false, true, false, false];

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
            fill: c.muted,
            fontFamily: "Manrope, sans-serif",
            fontWeight: 600,
            filter: `url(#${id}b)`,
            opacity: 0.55,
            ...NP
          },
          val
        )
      : h("rect", {
          key,
          x: x - size * 0.55,
          y: y - size * 0.22,
          width: size * 1.1,
          height: size * 0.44,
          rx: size * 0.22,
          fill: c.muted,
          opacity: 0.28,
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
        "linearGradient",
        { id: id + "g", x1: 0, y1: 0, x2: 1, y2: 1 },
        h("stop", { offset: 0, stopColor: c.a1 }),
        h("stop", { offset: 1, stopColor: c.a2 })
      ),
      h(
        "radialGradient",
        { id: id + "n" },
        h("stop", { offset: 0, stopColor: "#F7D9A4" }),
        h("stop", { offset: 1, stopColor: "#D9A055" })
      ),
      h(
        "filter",
        { id: id + "f", x: "-60%", y: "-60%", width: "220%", height: "220%" },
        h("feGaussianBlur", { stdDeviation: 7 })
      ),
      h(
        "filter",
        { id: id + "b", x: "-50%", y: "-50%", width: "200%", height: "200%" },
        h("feGaussianBlur", { stdDeviation: 1.5 })
      )
    )
  );

  el.push(h("circle", { key: K(), r: 124, fill: "none", stroke: c.guide, strokeWidth: 0.6, ...NP }));
  el.push(
    h("circle", {
      key: K(),
      r: 112,
      fill: "none",
      stroke: c.guide,
      strokeWidth: 0.4,
      strokeDasharray: "1 3",
      ...NP
    })
  );
  el.push(
    h("polygon", {
      key: K(),
      points: pts(I),
      fill: allOpen ? "rgba(226,174,99,.18)" : c.centerFill,
      ...NP
    })
  );

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

    if (st === "active") {
      el.push(
        h("polygon", {
          key: K(),
          points: pts([A, C1, C2]),
          fill: c.glow,
          opacity: 0.55,
          filter: `url(#${id}f)`,
          ...NP
        })
      );
    }
    const fill =
      st === "active"
        ? `url(#${id}g)`
        : st === "open"
          ? hov
            ? "rgba(226,174,99,.34)"
            : "rgba(226,174,99,.22)"
          : st === "next"
            ? hov
              ? "rgba(226,174,99,.18)"
              : "rgba(226,174,99,.07)"
            : hov
              ? "rgba(120,95,75,.13)"
              : c.lockedFill;
    el.push(h("polygon", { key: K(), points: pts([A, C1, C2]), fill, ...ev }));
    const ls = vis ? c.aStroke : c.line;
    const lo = vis ? 0.9 : 0.45;
    const lw = vis ? 0.7 : 0.5;
    (
      [
        [A, M],
        [S1, S2],
        [S1, M],
        [S2, M]
      ] as [Pt, Pt][]
    ).forEach(([p, q]) =>
      el.push(
        h("line", { key: K(), x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: ls, strokeWidth: lw, opacity: lo, ...NP })
      )
    );

    const tri = props.star.spheres[sphere];
    const sm = [tri.innerLeft.value, tri.innerRight.value, tri.innerBottom.value];
    [S1, S2, M].forEach((p, j) => {
      const dx = p[0] - cen[0];
      const dy = p[1] - cen[1];
      const L = Math.hypot(dx, dy) || 1;
      const off = j === 2 ? 7.5 : 8.5;
      const x = p[0] + (dx / L) * off;
      const y = p[1] + (dy / L) * off;
      const v = sm[j];
      const sz = 6.6 * fs;
      const slot = j as 0 | 1 | 2;
      const innerHov = props.hoverTip?.kind === "inner" && props.hoverTip.zone === i && props.hoverTip.slot === slot;
      top.push(
        h("circle", {
          key: K(),
          cx: p[0],
          cy: p[1],
          r: innerHov ? 3.2 : vis ? 1.9 : 1.4,
          fill: innerHov ? c.glow : vis ? c.aStroke : c.line,
          stroke: innerHov ? c.aStroke : "none",
          strokeWidth: 1.1,
          opacity: vis || innerHov ? 1 : 0.6,
          ...NP
        })
      );
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
                fill: innerHov ? c.aNum : c.ink,
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                ...NP
              },
              v
            )
          : hidden(x, y, v, sz, K())
      );
      const innerHit = {
        fill: "transparent",
        pointerEvents: "all" as const,
        style: { cursor: "pointer" as const, pointerEvents: "all" as const },
        onClick: () => props.onSphere(sphere),
        onPointerEnter: () => props.onHoverTip({ kind: "inner", zone: i, slot }),
        onPointerLeave: () => props.onHoverTip(null)
      };
      top.push(h("circle", { key: K(), cx: (p[0] + x) / 2, cy: (p[1] + y) / 2, r: mobile ? 13 : 11, ...innerHit }));
    });
  }

  for (let i = 0; i < 5; i++) {
    el.push(
      h("line", {
        key: K(),
        x1: O[i][0],
        y1: O[i][1],
        x2: O[(i + 2) % 5][0],
        y2: O[(i + 2) % 5][1],
        stroke: c.outline,
        strokeWidth: 0.9,
        opacity: 0.8,
        ...NP
      })
    );
  }

  for (let i = 0; i < 5; i++) {
    const sphere = ZONE_TO_SPHERE[i];
    const st = zoneState(sphere, props.activeSphere, unlocked, props.nextSphere);
    if (st === "active") {
      el.push(
        h("polygon", {
          key: K(),
          points: pts([O[i], I[(i + 4) % 5], I[i]]),
          fill: "none",
          stroke: c.aStroke,
          strokeWidth: 1.5,
          strokeLinejoin: "round",
          ...NP
        })
      );
    }
    if (st === "next") {
      el.push(
        h("polygon", {
          key: K(),
          points: pts([O[i], I[(i + 4) % 5], I[i]]),
          fill: "none",
          stroke: c.aStroke,
          strokeWidth: 0.9,
          strokeDasharray: "3 2.5",
          strokeLinejoin: "round",
          opacity: 0.85,
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
    const r = inA ? 4.4 : open ? 3.2 : 1.8;
    const fill = hl ? c.glow : inA ? c.card : open ? c.aStroke : c.line;
    const common = { fill, stroke: inA || hl ? c.aStroke : "none", strokeWidth: 1.3, ...NP };
    el.push(
      fatal
        ? h("polygon", { key: K(), ...common, points: diamond(p[0], p[1], r * 1.25) })
        : h("circle", { key: K(), ...common, cx: p[0], cy: p[1], r })
    );
    const q = polar(INNER_ANGLES[j], 50);
    const sz = 8.4 * (mobile ? 1.12 : 1);
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
              fill: c.aNum,
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              ...NP
            },
            innerValues[j]
          )
        : hidden(q[0], q[1], innerValues[j], sz, K())
    );
    const hit = {
      fill: "transparent",
      pointerEvents: "all" as const,
      style: { cursor: "pointer" as const, pointerEvents: "all" as const },
      onClick: () => props.onPoint(j),
      onPointerEnter: () => {
        props.onHoverPt(j);
        props.onHoverTip({ kind: "bridge", j });
      },
      onPointerLeave: () => {
        props.onHoverPt(null);
        props.onHoverTip(null);
      }
    };
    el.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: mobile ? 16 : 14, ...hit }));
    el.push(h("circle", { key: K(), cx: q[0], cy: q[1], r: mobile ? 12 : 10, ...hit }));
  });

  if (props.missionActive) {
    el.push(h("circle", { key: K(), r: 24, fill: c.glow, opacity: 0.55, filter: `url(#${id}f)`, ...NP }));
  }
  el.push(
    h("circle", {
      key: K(),
      r: 17,
      fill: c.card,
      stroke: props.missionActive || allOpen || props.hoverTip?.kind === "mission" ? c.aStroke : c.line,
      strokeWidth: props.missionActive || allOpen || props.hoverTip?.kind === "mission" ? 1 : 0.5,
      opacity: 0.95,
      style: { cursor: "pointer" },
      onClick: props.onMission,
      onPointerEnter: () => props.onHoverTip({ kind: "mission" }),
      onPointerLeave: () => props.onHoverTip(null)
    })
  );
  el.push(
    h(
      "text",
      {
        key: K(),
        y: -6,
        textAnchor: "middle",
        fontSize: 5.6 * fs,
        fill: c.ink,
        fontFamily: "Cormorant Garamond, serif",
        fontWeight: 600,
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
        y: 0.5,
        textAnchor: "middle",
        fontSize: 5.6 * fs,
        fill: c.ink,
        fontFamily: "Cormorant Garamond, serif",
        fontWeight: 600,
        ...NP
      },
      props.missionLabel[1]
    )
  );
  if (!allOpen) {
    el.push(h(Lock, { key: K(), x: 0, y: 7, s: 0.95, color: c.lock }));
  } else {
    el.push(h("circle", { key: K(), cy: 8.5, r: 2.2, fill: c.aStroke, ...NP }));
  }

  O.forEach((p, i) => {
    const sphere = ZONE_TO_SPHERE[i];
    const st = zoneState(sphere, props.activeSphere, unlocked, props.nextSphere);
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
    const apexHov = props.hoverTip?.kind === "apex" && props.hoverTip.zone === i;
    if (st === "active") {
      el.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: 19, fill: c.glow, opacity: apexHov ? 0.8 : 0.55, filter: `url(#${id}f)`, ...NP }));
      el.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: 16.5, fill: "none", stroke: c.aStroke, strokeWidth: 0.6, opacity: 0.6, ...NP }));
      el.push(
        h("circle", { key: K(), cx: p[0], cy: p[1], r: 12.5, fill: `url(#${id}n)`, stroke: "#FFF8EC", strokeWidth: 1.2, ...apexEv })
      );
      el.push(
        h(
          "text",
          {
            key: K(),
            x: p[0],
            y: p[1],
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: 12,
            fill: c.aText,
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            ...NP
          },
          outerValues[i]
        )
      );
    } else if (st === "open") {
      el.push(h("circle", { key: K(), cx: p[0], cy: p[1], r: apexHov ? 12 : 10.5, fill: "#F6E6CC", stroke: c.aStroke, strokeWidth: 1, ...apexEv }));
      el.push(
        h(
          "text",
          {
            key: K(),
            x: p[0],
            y: p[1],
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: 9.5,
            fill: c.aNum,
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            ...NP
          },
          outerValues[i]
        )
      );
    } else {
      el.push(
        h("circle", {
          key: K(),
          cx: p[0],
          cy: p[1],
          r: 9.5,
          fill: c.card,
          stroke: st === "next" ? c.aStroke : c.line,
          strokeWidth: st === "next" ? 1 : 0.6,
          ...apexEv
        })
      );
      el.push(h(Lock, { key: K(), x: p[0], y: p[1] - 0.6, s: 1, color: st === "next" ? c.aStroke : c.lock }));
    }
    const [lx, ly] = LABEL_POS[i];
    const ls = 6.8 * fs;
    const col = st === "active" || st === "next" ? c.aNum : c.ink;
    const op = st === "locked" ? 0.6 : 1;
    const fw = st === "active" ? 700 : st === "locked" ? 500 : 600;
    el.push(
      h(
        "text",
        {
          key: K(),
          x: lx,
          y: ly,
          textAnchor: "middle",
          fontSize: ls,
          fill: col,
          opacity: op,
          fontFamily: "Manrope, sans-serif",
          fontWeight: fw,
          ...ev
        },
        props.labels[sphere]
      )
    );
  });

  void BRIDGE_ZONE_INDEX;

  return h(
    "svg",
    {
      viewBox: mobile ? "-140 -132 280 248" : "-138 -134 276 250",
      style: { width: "100%", display: "block", overflow: "visible" },
      dir: "ltr"
    },
    el
  );
}
