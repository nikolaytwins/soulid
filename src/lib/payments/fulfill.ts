import { prisma } from "@/lib/db";
import { grantSpheres, remainingSpheres, getUnlockOrder } from "@/lib/domain/access";
import type { SphereId } from "@/lib/engine";
import { SPHERE_IDS } from "@/lib/engine";
import { sendTransactionalEmail, sphereUnlockedEmail } from "@/lib/email";
import { sendMetaCapi, trackEvent, visitorForUser } from "@/lib/analytics";
import { productName } from "@/lib/domain/catalog";
import { appendLedger } from "@/lib/ledger";

export async function fulfillPaidPurchase(purchaseId: string): Promise<void> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      product: { include: { translations: true } },
      user: true,
      profile: true
    }
  });
  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status === "paid") return;

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: "paid", paidAt: new Date() }
  });

  const order = await getUnlockOrder();
  const already = await prisma.entitlement.findMany({ where: { profileId: purchase.profileId } });
  const unlocked = new Set(already.map((e) => e.sphere as SphereId));

  let spheres: SphereId[] = [];
  if (purchase.product.kind === "bundle") {
    spheres = remainingSpheres(order, unlocked);
  } else if (purchase.product.sphere) {
    spheres = [purchase.product.sphere as SphereId];
  }

  await grantSpheres({
    userId: purchase.userId,
    profileId: purchase.profileId,
    spheres,
    purchaseId: purchase.id,
    source: purchase.product.kind === "bundle" ? "bundle" : "purchase"
  });
  await appendLedger({
    kind: "payment.paid",
    actorType: "system",
    userId: purchase.userId,
    profileId: purchase.profileId,
    purchaseId: purchase.id,
    sku: purchase.product.sku,
    amount: purchase.amount,
    currency: purchase.currency,
    provider: purchase.provider,
    providerPaymentId: purchase.providerPaymentId,
    spheres,
    summary: `Paid ${purchase.product.sku}`
  });

  const locale = purchase.user.locale || "ru";
  const name = productName(purchase.product, locale)?.name ?? purchase.product.sku;
  const origin = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${origin}/${locale}/star/${purchase.profileId}`;
  let setPasswordUrl: string | undefined;
  const { userHasPassword } = await import("@/lib/auth-ticket");
  if (!userHasPassword(purchase.user.passwordHash)) {
    const { randomBytes } = await import("node:crypto");
    const token = randomBytes(24).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: purchase.userId, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
    setPasswordUrl = `${origin}/${locale}/reset-password?token=${token}`;
  }
  const mail = sphereUnlockedEmail(locale, name, url, setPasswordUrl);
  try {
    await sendTransactionalEmail({
      to: purchase.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      template: "sphere_unlocked",
      userId: purchase.userId,
      purchaseId: purchase.id
    });
  } catch (err) {
    console.error("unlock email failed", err);
  }

  try {
    const visitor = await visitorForUser(purchase.userId);
    await trackEvent({
      name: "purchase",
      eventId: purchase.eventId,
      userId: purchase.userId,
      profileId: purchase.profileId,
      locale,
      ...visitor,
      payload: { sku: purchase.product.sku, amount: purchase.amount, spheres }
    });
    await trackEvent({
      name: "sphere_unlocked",
      userId: purchase.userId,
      profileId: purchase.profileId,
      locale,
      ...visitor,
      payload: { spheres }
    });
    await sendMetaCapi({
      eventName: "Purchase",
      eventId: purchase.eventId,
      email: purchase.user.email,
      value: purchase.amount,
      currency: purchase.currency,
      sourceUrl: url
    });
  } catch (err) {
    console.error("unlock analytics failed", err);
  }
}

export { SPHERE_IDS };
