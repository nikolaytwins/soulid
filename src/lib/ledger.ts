import { prisma } from "@/lib/db";

export type LedgerKind =
  | "checkout.created"
  | "payment.paid"
  | "payment.failed"
  | "payment.canceled"
  | "entitlement.granted"
  | "entitlement.revoked"
  | "entitlement.admin_grant"
  | "privacy.export"
  | "privacy.delete"
  | "payment.method_saved";

export async function appendLedger(entry: {
  kind: LedgerKind;
  actorType: "user" | "admin" | "system" | "webhook";
  actorId?: string | null;
  userId?: string | null;
  profileId?: string | null;
  purchaseId?: string | null;
  sku?: string | null;
  amount?: number | null;
  currency?: string | null;
  provider?: string | null;
  providerPaymentId?: string | null;
  spheres?: string[];
  summary: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.ledgerEvent.create({
      data: {
        kind: entry.kind,
        actorType: entry.actorType,
        actorId: entry.actorId ?? undefined,
        userId: entry.userId ?? undefined,
        profileId: entry.profileId ?? undefined,
        purchaseId: entry.purchaseId ?? undefined,
        sku: entry.sku ?? undefined,
        amount: entry.amount ?? undefined,
        currency: entry.currency ?? undefined,
        provider: entry.provider ?? undefined,
        providerPaymentId: entry.providerPaymentId ?? undefined,
        spheresJson: JSON.stringify(entry.spheres ?? []),
        summary: entry.summary.slice(0, 500),
        payload: JSON.stringify(entry.payload ?? {})
      }
    });
  } catch (err) {
    console.error("ledger write failed", err);
  }
}
