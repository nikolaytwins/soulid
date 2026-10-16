import { prisma } from "@/lib/db";
import type { SphereId } from "@/lib/engine";
import { SPHERE_IDS } from "@/lib/engine";
import { entitlementIsReadable } from "@/lib/domain/access-gate";
import { appendLedger } from "@/lib/ledger";

export { entitlementIsReadable } from "@/lib/domain/access-gate";

export type AccessState = "open" | "next" | "locked";

export async function getUnlockOrder(): Promise<SphereId[]> {
  const rules = await prisma.unlockRule.findMany({ orderBy: { sortOrder: "asc" } });
  if (rules.length === 0) return [...SPHERE_IDS];
  return rules.map((r) => r.sphere as SphereId);
}

export async function getUnlockedSpheres(profileId: string): Promise<Set<SphereId>> {
  const [rows, free] = await Promise.all([
    prisma.entitlement.findMany({
      where: { profileId },
      include: { purchase: { select: { status: true, paidAt: true } } }
    }),
    prisma.product.findMany({
      where: { isFree: true, kind: "sphere", isActive: true, sphere: { not: null } },
      select: { sphere: true }
    })
  ]);
  const freeSpheres = new Set(free.map((p) => p.sphere).filter((s): s is string => Boolean(s)));
  return new Set(
    rows.filter((row) => entitlementIsReadable(row, freeSpheres)).map((row) => row.sphere as SphereId)
  );
}

export async function ensureFreeEntitlements(params: {
  userId: string | null;
  profileId: string;
}): Promise<void> {
  const free = await prisma.product.findMany({ where: { isFree: true, kind: "sphere", isActive: true } });
  if (!params.userId) {
    return;
  }
  for (const p of free) {
    if (!p.sphere) continue;
    await prisma.entitlement.upsert({
      where: { profileId_sphere: { profileId: params.profileId, sphere: p.sphere } },
      update: {},
      create: {
        userId: params.userId,
        profileId: params.profileId,
        sphere: p.sphere,
        source: "free"
      }
    });
  }
}

export function sphereAccess(order: SphereId[], unlocked: Set<SphereId>, sphere: SphereId): AccessState {
  const i = order.indexOf(sphere);
  if (unlocked.has(sphere)) return "open";
  const firstLocked = order.find((s) => !unlocked.has(s));
  if (firstLocked === sphere) return "next";
  if (i >= 0 && order.slice(0, i).every((s) => unlocked.has(s))) return "next";
  return "locked";
}

export function nextPurchasable(order: SphereId[], unlocked: Set<SphereId>): SphereId | null {
  return order.find((s) => !unlocked.has(s)) ?? null;
}

export const ADMIN_ENTITLEMENT_SOURCE = "admin";

export async function grantSpheres(params: {
  userId: string;
  profileId: string;
  spheres: SphereId[];
  purchaseId: string | null;
  source: string;
}): Promise<void> {
  for (const sphere of params.spheres) {
    await prisma.entitlement.upsert({
      where: { profileId_sphere: { profileId: params.profileId, sphere } },
      update: { purchaseId: params.purchaseId ?? undefined, source: params.source },
      create: {
        userId: params.userId,
        profileId: params.profileId,
        sphere,
        purchaseId: params.purchaseId,
        source: params.source
      }
    });
  }
  if (params.spheres.length) {
    await appendLedger({
      kind: params.source === ADMIN_ENTITLEMENT_SOURCE ? "entitlement.admin_grant" : "entitlement.granted",
      actorType: params.source === ADMIN_ENTITLEMENT_SOURCE ? "admin" : "system",
      userId: params.userId,
      profileId: params.profileId,
      purchaseId: params.purchaseId,
      spheres: params.spheres,
      summary:
        params.source === ADMIN_ENTITLEMENT_SOURCE
          ? `Admin granted ${params.spheres.join(", ")}`
          : `Granted ${params.spheres.join(", ")} via ${params.source}`
    });
  }
}

export async function revokeSpheres(params: { profileId: string; spheres?: SphereId[] }): Promise<void> {
  const profile = await prisma.birthProfile.findUnique({
    where: { id: params.profileId },
    select: { userId: true }
  });
  if (!params.spheres || params.spheres.length === 0) {
    await prisma.entitlement.deleteMany({ where: { profileId: params.profileId } });
    await appendLedger({
      kind: "entitlement.revoked",
      actorType: "admin",
      userId: profile?.userId,
      profileId: params.profileId,
      summary: "All spheres reset"
    });
    return;
  }
  await prisma.entitlement.deleteMany({
    where: { profileId: params.profileId, sphere: { in: params.spheres } }
  });
  await appendLedger({
    kind: "entitlement.revoked",
    actorType: "admin",
    userId: profile?.userId,
    profileId: params.profileId,
    spheres: params.spheres,
    summary: `Revoked ${params.spheres.join(", ")}`
  });
}

export async function resetProfileEntitlements(params: { userId: string; profileId: string }): Promise<void> {
  await revokeSpheres({ profileId: params.profileId });
  await ensureFreeEntitlements(params);
}

export function remainingSpheres(order: SphereId[], unlocked: Set<SphereId>): SphereId[] {
  return order.filter((s) => !unlocked.has(s));
}

export function allCommercialOpen(unlocked: Set<SphereId>, order: SphereId[]): boolean {
  return order.every((s) => unlocked.has(s));
}
