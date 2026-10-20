import type { CSSProperties, ReactNode } from "react";
import { V3_RED } from "@/lib/v3";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Length of the L-arms as % of each side (default ~50). */
  arm?: number;
};

/** Sharp L-corner frame from the v3 design HTML. */
export function CornerFrame({ children, className = "", style, id, arm = 50 }: Props) {
  const line: CSSProperties = {
    position: "absolute",
    background: V3_RED,
    pointerEvents: "none"
  };
  return (
    <div id={id} className={`relative ${className}`} style={style}>
      <span style={{ ...line, left: -16, top: 0, width: `${arm}%`, height: 1 }} />
      <span style={{ ...line, left: 0, top: -16, width: 1, height: `${Math.min(arm + 22, 75)}%` }} />
      <span style={{ ...line, right: -16, bottom: 0, width: `${arm}%`, height: 1 }} />
      <span style={{ ...line, right: 0, bottom: -16, width: 1, height: `${Math.min(arm + 22, 75)}%` }} />
      {children}
    </div>
  );
}
