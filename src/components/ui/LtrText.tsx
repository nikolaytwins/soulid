import type { ReactNode } from "react";

/** Keep digits in written order inside RTL — do not let bidi reshuffle dates or fractions. */
export function LtrText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={className} style={{ unicodeBidi: "isolate" }}>
      {children}
    </span>
  );
}
