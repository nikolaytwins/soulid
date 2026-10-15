import { prisma } from "@/lib/db";
import type { SphereId } from "@/lib/engine";
import { SPHERE_IDS } from "@/lib/engine";

export type AccessState = "open" | "next" | "locked";

export async function getUnlockOrder(): Promise<SphereId[]> {
  const rules = await prisma.unlockRule.findMany({ orderBy: { sortOrder: "asc" } });
  if (rules.length === 0) return [...SPHERE_IDS];
  return rules.map((r) => r.sphere as SphereId);
}

export async function getUnlockedSpheres(profileId: string): Promise<Set<SphereId>> {
  const rows = await prisma.entitlement.findMany({ where: { profileId } });
  return new Set(rows.map((r) => r.sphere as SphereId));
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
}

export async function revokeSpheres(params: { profileId: string; spheres?: SphereId[] }): Promise<void> {
  if (!params.spheres || params.spheres.length === 0) {
    await prisma.entitlement.deleteMany({ where: { profileId: params.profileId } });
    return;
  }
  await prisma.entitlement.deleteMany({
    where: { profileId: params.profileId, sphere: { in: params.spheres } }
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
