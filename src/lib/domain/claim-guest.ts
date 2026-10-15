import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ensureFreeEntitlements } from "@/lib/domain/access";

export async function claimGuestProfiles(userId: string) {
  const jar = await cookies();
  const guest = jar.get("ss_guest")?.value;
  if (!guest) return;
  const profiles = await prisma.birthProfile.findMany({ where: { guestKey: guest, userId: null } });
  for (const p of profiles) {
    await prisma.birthProfile.update({ where: { id: p.id }, data: { userId, guestKey: null } });
    await ensureFreeEntitlements({ userId, profileId: p.id });
  }
}
