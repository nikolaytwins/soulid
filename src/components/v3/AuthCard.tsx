import type { ReactNode } from "react";
import { CornerFrame } from "./CornerFrame";
import { V3_CARD } from "@/lib/v3";

export function V3AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-[clamp(20px,3vw,48px)] py-12">
      <CornerFrame className="flex flex-col gap-6 p-8" style={{ background: V3_CARD }} arm={45}>
        {children}
      </CornerFrame>
    </main>
  );
}
