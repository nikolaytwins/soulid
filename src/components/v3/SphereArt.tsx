import type { SphereId } from "@/lib/engine";

/** Illustrations from the v3 design HTML (not the v2 photo set). */
export const V3_ART = {
  hero: "/v3/spheres/hero.png",
  next: "/v3/spheres/next.png",
  expert: "/v3/spheres/expert.jpg"
} as const;

export function SphereArt({
  sphere: _sphere,
  mission: _mission,
  variant = "hero"
}: {
  sphere?: SphereId;
  mission?: boolean;
  /** `hero` — decode / mission card; `next` — unlock-next offer. */
  variant?: "hero" | "next";
}) {
  const src = variant === "next" ? V3_ART.next : V3_ART.hero;
  return (
    <div
      aria-hidden
      className="pointer-events-none flex h-full w-full items-center justify-center"
      style={{ position: "absolute", inset: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-full w-full max-w-[300px] object-contain object-center"
      />
    </div>
  );
}
