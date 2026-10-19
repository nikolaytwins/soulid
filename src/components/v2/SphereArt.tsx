import type { SphereId } from "@/lib/engine";
import { SPHERE_TINT, V2_GOLD } from "@/lib/v2";

export function SphereArt({
  sphere,
  mission
}: {
  sphere?: SphereId;
  mission?: boolean;
}) {
  const c = mission ? { a1: "#F8EACB", a2: V2_GOLD } : sphere ? SPHERE_TINT[sphere] : { a1: "#F3D9A0", a2: V2_GOLD };
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 26,
        overflow: "hidden",
        background: `linear-gradient(150deg, ${c.a1}, ${"a2" in c ? c.a2 : V2_GOLD})`
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(43,26,51,.10) 1.2px, transparent 1.7px)",
          backgroundSize: "16px 16px"
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -80,
          top: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "repeating-radial-gradient(circle, rgba(255,255,255,.35) 0 1px, transparent 1.5px 18px)"
        }}
      />
    </div>
  );
}
