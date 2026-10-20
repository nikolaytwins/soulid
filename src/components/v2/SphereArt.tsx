import type { SphereId } from "@/lib/engine";
import { SPHERE_TINT, V2_GOLD, V2_MISSION } from "@/lib/v2";

export const SPHERE_ART: Record<SphereId | "soulMission", string> = {
  relationships: "/v2/spheres/relationships.jpg",
  spirituality: "/v2/spheres/spirituality.jpg",
  personality: "/v2/spheres/personality.jpg",
  health: "/v2/spheres/health.jpg",
  money: "/v2/spheres/realization.jpg",
  soulMission: "/v2/spheres/soul-mission.jpg"
};

export function SphereArt({
  sphere,
  mission
}: {
  sphere?: SphereId;
  mission?: boolean;
}) {
  const src = mission ? SPHERE_ART.soulMission : sphere ? SPHERE_ART[sphere] : null;
  const c = mission ? V2_MISSION : sphere ? SPHERE_TINT[sphere] : { a1: "#F3D9A0", a2: V2_GOLD };
  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 26,
        overflow: "hidden",
        background: `linear-gradient(150deg, ${c.a1}, ${c.a2})`
      }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (
        <>
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
        </>
      )}
    </div>
  );
}
