import { prisma } from "@/lib/db";
import { appendLedger } from "@/lib/ledger";

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profiles: { include: { entitlements: true } },
      purchases: { include: { product: { select: { sku: true } } } },
      entitlements: true,
      paymentMethods: true
    }
  });
  if (!user) return null;
  await appendLedger({
    kind: "privacy.export",
    actorType: "user",
    actorId: userId,
    userId,
    summary: "User exported personal data"
  });
  return {
    exportedAt: new Date().toISOString(),
    person: {
      email: user.email,
      name: user.name,
      locale: user.locale,
      createdAt: user.createdAt
    },
    stars: user.profiles.map((p) => ({
      id: p.id,
      dateOfBirth: p.dateOfBirth,
      displayName: p.displayName,
      relation: p.relation,
      locale: p.locale,
      createdAt: p.createdAt,
      openSpheres: p.entitlements.map((e) => e.sphere)
    })),
    purchases: user.purchases.map((p) => ({
      id: p.id,
      sku: p.product.sku,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      paidAt: p.paidAt,
      createdAt: p.createdAt
    })),
    paymentMethods: user.paymentMethods.map((m) => ({
      brand: m.brand,
      last4: m.last4,
      expMonth: m.expMonth,
      expYear: m.expYear,
      provider: m.provider,
      createdAt: m.createdAt
    }))
  };
}

export async function deleteUserData(userId: string): Promise<{ ok: true } | { ok: false; error: "admin" | "missing" }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "missing" };
  if (user.role === "admin") {
    const others = await prisma.user.count({ where: { role: "admin", blockedAt: null, id: { not: userId } } });
    if (others === 0) return { ok: false, error: "admin" };
  }

  await prisma.savedPaymentMethod.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.analyticsEvent.updateMany({ where: { userId }, data: { userId: null, payload: "{}" } });
  await prisma.emailLog.updateMany({
    where: { userId },
    data: { toEmail: "redacted", body: "", subject: "redacted", userId: null }
  });
  await prisma.birthProfile.updateMany({
    where: { userId },
    data: { displayName: "", dateOfBirth: "1900-01-01", calculationJson: "{}", guestKey: null }
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@invalid.local`,
      name: null,
      passwordHash: "",
      blockedAt: new Date(),
      adminNote: "personal data deleted",
      role: "user"
    }
  });
  await appendLedger({
    kind: "privacy.delete",
    actorType: "user",
    actorId: userId,
    userId,
    summary: "User deleted personal data; payment journal kept"
  });
  return { ok: true };
}
