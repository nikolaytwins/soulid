import { prisma } from "@/lib/db";
import { appendLedger } from "@/lib/ledger";
import { cardLabel } from "@/lib/payments/card-label";

export type PublicSavedCard = {
  id: string;
  brand: string;
  last4: string;
};

export type CapturedMethod = {
  customerId?: string;
  methodId: string;
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
};

export { cardLabel };

export async function defaultSavedCard(userId: string, provider: string): Promise<PublicSavedCard | null> {
  const row =
    (await prisma.savedPaymentMethod.findFirst({
      where: { userId, provider, isDefault: true },
      orderBy: { updatedAt: "desc" }
    })) ??
    (await prisma.savedPaymentMethod.findFirst({
      where: { userId, provider },
      orderBy: { updatedAt: "desc" }
    }));
  if (!row || !row.last4) return null;
  return { id: row.id, brand: row.brand, last4: row.last4 };
}

export async function listSavedCards(userId: string): Promise<PublicSavedCard[]> {
  const rows = await prisma.savedPaymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });
  return rows.filter((r) => r.last4).map((r) => ({ id: r.id, brand: r.brand, last4: r.last4 }));
}

export async function upsertSavedMethod(input: {
  userId: string;
  provider: string;
  method: CapturedMethod;
}): Promise<void> {
  const last4 = input.method.last4.replace(/\D/g, "").slice(-4);
  if (!input.method.methodId || last4.length !== 4) return;
  const brand = input.method.brand.toLowerCase().replace(/[^a-z]/g, "").slice(0, 24);
  await prisma.$transaction(async (tx) => {
    await tx.savedPaymentMethod.updateMany({
      where: { userId: input.userId, provider: input.provider },
      data: { isDefault: false }
    });
    await tx.savedPaymentMethod.upsert({
      where: {
        userId_provider_providerMethodId: {
          userId: input.userId,
          provider: input.provider,
          providerMethodId: input.method.methodId
        }
      },
      update: {
        providerCustomerId: input.method.customerId ?? "",
        brand,
        last4,
        expMonth: input.method.expMonth ?? null,
        expYear: input.method.expYear ?? null,
        isDefault: true
      },
      create: {
        userId: input.userId,
        provider: input.provider,
        providerCustomerId: input.method.customerId ?? "",
        providerMethodId: input.method.methodId,
        brand,
        last4,
        expMonth: input.method.expMonth ?? null,
        expYear: input.method.expYear ?? null,
        isDefault: true
      }
    });
  });
  await appendLedger({
    kind: "payment.method_saved",
    actorType: "system",
    userId: input.userId,
    summary: `Saved ${cardLabel(brand, last4)}`,
    payload: { provider: input.provider, brand, last4 }
  });
}

export async function getSavedMethodRecord(userId: string, id: string) {
  return prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
}

export async function deleteSavedMethod(userId: string, id: string): Promise<boolean> {
  const row = await prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.savedPaymentMethod.delete({ where: { id: row.id } });
  if (row.isDefault) {
    const next = await prisma.savedPaymentMethod.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
    if (next) {
      await prisma.savedPaymentMethod.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  return true;
}
