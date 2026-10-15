import { createElement as h } from "react";
import type { SphereId } from "@/lib/engine";
import { ZONE_TO_SPHERE } from "@/lib/engine";

export type CabinetStarLabels = Record<SphereId, string> & { missionTop: string; missionBottom: string };

const UNLOCK_ZONES = [4, 0, 1, 2, 3];
const LABEL_POS: [number, number][] = [
  [0, -118],
  [106, -4],
  [58.8, 101],
  [-58.8, 101],
  [-106, -4]
];

function polar(a: number, r: number): [number, number] {
  return [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
}

function pts(arr: [number, number][]) {
  return arr.map((p) => p.join(",")).join(" ");
}

function zoneState(zone: number, openCount: number): "open" | "next" | "locked" {
  const k = UNLOCK_ZONES.indexOf(zone);
  if (k < openCount) return "open";
  if (k === openCount) return "next";
  return "locked";
}

export function CabinetStar({
  id,
  big,
  openCount,
  values,
  labels
}: {
  id: string;
  big?: boolean;
  openCount: number;
  values: Record<SphereId, number>;
  labels: CabinetStarLabels;
}) {
  const O = [-90, -18, 54, 126, 198].map((a) => polar(a, 100));
  const I = [-54, 18, 90, 162, 234].map((a) => polar(a, 38.2));
  const gid = `cg${id}${big ? "b" : "s"}`;
  const n = Math.min(5, Math.max(0, openCount));
  const NP = { style: { pointerEvents: "none" as const } };
  const el = [
    h(
      "defs",
      { key: "d" },
      h(
        "linearGradient",
        { id: `${gid}g`, x1: 0, y1: 0, x2: 1, y2: 1 },
        h("stop", { offset: 0, stopColor: "#F7DDB0" }),
        h("stop", { offset: 1, stopColor: "#E2A95E" })
      ),
      h(
        "filter",
        { id: `${gid}f`, x: "-60%", y: "-60%", width: "220%", height: "220%" },
        h("feGaussianBlur", { stdDeviation: 7 })
      )
    )
  ];
  if (big) {
    el.push(h("circle", { key: "r1", r: 124, fill: "none", stroke: "rgba(120,95,75,.14)", strokeWidth: 0.6, ...NP }));
  }
  el.push(
    h("polygon", {
      key: "c",
      points: pts(I),
      fill: n === 5 ? "rgba(226,174,99,.35)" : "rgba(120,95,75,.05)",
      ...NP
    })
  );
  for (let i = 0; i < 5; i++) {
    const t = zoneState(i, n);
    const tri = pts([O[i], I[(i + 4) % 5], I[i]]);
    if (t === "open" && big) {
      el.push(
        h("polygon", {
          key: "gl" + i,
          points: tri,
          fill: "#F0B865",
          opacity: 0.35,
          filter: `url(#${gid}f)`,
          ...NP
        })
      );
    }
    el.push(
      h("polygon", {
        key: "z" + i,
        points: tri,
        fill: t === "open" ? `url(#${gid}g)` : t === "next" ? "rgba(226,174,99,.10)" : "rgba(120,95,75,.07)",
        ...NP
      })
    );
    if (t === "next") {
      el.push(
        h("polygon", {
          key: "n" + i,
          points: tri,
          fill: "none",
          stroke: "#C78A3E",
          strokeWidth: big ? 0.9 : 1.6,
          strokeDasharray: big ? "3 2.5" : "5 4",
          strokeLinejoin: "round",
          ...NP
        })
      );
    }
  }
  for (let i = 0; i < 5; i++) {
    el.push(
      h("line", {
        key: "l" + i,
        x1: O[i][0],
        y1: O[i][1],
        x2: O[(i + 2) % 5][0],
        y2: O[(i + 2) % 5][1],
        stroke: "#A8968A",
        strokeWidth: big ? 0.9 : 2,
        opacity: 0.8,
        ...NP
      })
    );
  }
  if (big) {
    O.forEach((p, i) => {
      const t = zoneState(i, n);
      const sphere = ZONE_TO_SPHERE[i];
      if (t === "open") {
        el.push(h("circle", { key: "oc" + i, cx: p[0], cy: p[1], r: 11, fill: "#F6E6CC", stroke: "#C78A3E", strokeWidth: 1, ...NP }));
        el.push(
          h(
            "text",
            {
              key: "ot" + i,
              x: p[0],
              y: p[1],
              textAnchor: "middle",
              dominantBaseline: "central",
              fontSize: 10,
              fill: "#8E5F2A",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              ...NP
            },
            values[sphere]
          )
        );
      } else {
        const col = t === "next" ? "#C78A3E" : "#A89A8F";
        el.push(
          h("circle", {
            key: "oc" + i,
            cx: p[0],
            cy: p[1],
            r: 9.5,
            fill: "#FBF8F4",
            stroke: col,
            strokeWidth: t === "next" ? 1 : 0.6,
            ...NP
          })
        );
        el.push(
          h(
            "g",
            { key: "lk" + i, transform: `translate(${p[0]},${p[1] - 0.6})`, ...NP },
            h("rect", { x: -3.6, y: -0.8, width: 7.2, height: 5.6, rx: 1.3, fill: col }),
            h("path", {
              d: "M-2.1,-0.8 V-2.6 A2.1,2.1 0 0 1 2.1,-2.6 V-0.8",
              stroke: col,
              strokeWidth: 1.15,
              fill: "none"
            })
          )
        );
      }
      el.push(
        h(
          "text",
          {
            key: "lb" + i,
            x: LABEL_POS[i][0],
            y: LABEL_POS[i][1],
            textAnchor: "middle",
            fontSize: 7,
            fill: t === "locked" ? "#8E8178" : t === "next" ? "#8E5F2A" : "#2A211D",
            fontFamily: "Manrope, sans-serif",
            fontWeight: t === "locked" ? 500 : 600,
            ...NP
          },
          labels[sphere]
        )
      );
    });
    el.push(
      h("circle", {
        key: "mc",
        r: 17,
        fill: "#FBF8F4",
        stroke: n === 5 ? "#C78A3E" : "#9C8B7E",
        strokeWidth: n === 5 ? 1 : 0.5,
        ...NP
      })
    );
    el.push(
      h(
        "text",
        {
          key: "m1",
          y: -3,
          textAnchor: "middle",
          fontSize: 5.6,
          fill: "#2A211D",
          fontFamily: "Cormorant Garamond, serif",
          fontWeight: 600,
          ...NP
        },
        labels.missionTop
      )
    );
    el.push(
      h(
        "text",
        {
          key: "m2",
          y: 3.5,
          textAnchor: "middle",
          fontSize: 5.6,
          fill: "#2A211D",
          fontFamily: "Cormorant Garamond, serif",
          fontWeight: 600,
          ...NP
        },
        labels.missionBottom
      )
    );
  }

  return h(
    "svg",
    big
      ? { viewBox: "-138 -134 276 250", style: { width: "100%", display: "block", overflow: "visible" }, dir: "ltr" }
      : { viewBox: "-110 -108 220 200", width: 150, height: 136, style: { display: "block" }, dir: "ltr" },
    el
  );
}
