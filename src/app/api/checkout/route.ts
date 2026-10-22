import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/provider";
import {
  ensureFreeEntitlements,
  getUnlockOrder,
  getUnlockedSpheres,
  nextPurchasable,
  remainingSpheres
} from "@/lib/domain/access";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isIndividuallySold, productName } from "@/lib/domain/catalog";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { analyticsFromCookies, trackEvent, newEventId } from "@/lib/analytics";
import { appendLedger } from "@/lib/ledger";
import { capturePaymentMethod } from "@/lib/payments/capture";

const schema = z.object({
  profileId: z.string().min(1),
  sku: z.string().min(1),
  returnTo: z.enum(["star", "account"]).optional(),
  useSavedMethod: z.boolean().optional(),
  recChannel: z.enum(["email", "tg"]).optional(),
  recContact: z.string().max(120).optional()
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers) + ":pay", 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const payer = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!payer || payer.blockedAt) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const profile = await prisma.birthProfile.findUnique({ where: { id: parsed.data.profileId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.userId && profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.userId) {
    await prisma.birthProfile.update({ where: { id: profile.id }, data: { userId: session.user.id, guestKey: null } });
  }
  await ensureFreeEntitlements({ userId: session.user.id, profileId: profile.id });

  const product = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
    include: { translations: true }
  });
  if (!product || !product.isActive) return NextResponse.json({ error: "Unknown product" }, { status: 404 });

  const order = await getUnlockOrder();
  const unlocked = await getUnlockedSpheres(profile.id);
  if (product.kind === "sphere" && product.sphere) {
    if (!isIndividuallySold(product)) {
      return NextResponse.json({ error: "Sphere is only available in the complete package" }, { status: 400 });
    }
    const next = nextPurchasable(order, unlocked);
    if (next !== product.sphere) {
      return NextResponse.json({ error: "Sphere is not the next available purchase" }, { status: 400 });
    }
  }
  if (product.kind === "bundle" && remainingSpheres(order, unlocked).length === 0) {
    return NextResponse.json({ error: "Nothing left to unlock" }, { status: 400 });
  }
  if (product.kind === "addon") {
    const already = await prisma.purchase.findFirst({
      where: { userId: session.user.id, profileId: profile.id, productId: product.id, status: "paid" }
    });
    if (already) {
      const originPaid = process.env.APP_URL ?? new URL(req.url).origin;
      return NextResponse.json({
        url: `${originPaid}/${session.user.locale ?? "ru"}/star/${profile.id}?paid=1&rec=1`,
        paid: true
      });
    }
  }

  const eventId = newEventId();
  const locale = session.user.locale ?? "ru";
  const name = productName(product, locale)?.name ?? product.sku;
  const origin = process.env.APP_URL ?? new URL(req.url).origin;
  const toAccount = parsed.data.returnTo === "account";
  const recQs = product.kind === "addon" ? "&rec=1" : "";
  const returnUrl = toAccount
    ? `${origin}/${locale}/account?paid=1&star=${profile.id}${recQs}`
    : `${origin}/${locale}/star/${profile.id}?paid=1${recQs}`;
  const cancelUrl = toAccount
    ? `${origin}/${locale}/account?canceled=1&star=${profile.id}`
    : `${origin}/${locale}/star/${profile.id}?canceled=1`;

  if (product.isFree || product.priceAmount <= 0) {
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        profileId: profile.id,
        productId: product.id,
        status: "pending",
        amount: 0,
        currency: product.currency,
        provider: "free",
        idempotencyKey: randomUUID(),
        eventId,
        metadataJson: JSON.stringify({
          sku: product.sku,
          sphere: product.sphere,
          recChannel: parsed.data.recChannel,
          recContact: parsed.data.recContact
        })
      }
    });
    await appendLedger({
      kind: "checkout.created",
      actorType: "user",
      actorId: session.user.id,
      userId: session.user.id,
      profileId: profile.id,
      purchaseId: purchase.id,
      sku: product.sku,
      amount: 0,
      currency: product.currency,
      provider: "free",
      summary: `Checkout ${product.sku}`
    });
    const { fulfillPaidPurchase } = await import("@/lib/payments/fulfill");
    await fulfillPaidPurchase(purchase.id);
    return NextResponse.json({ url: returnUrl, eventId, purchaseId: purchase.id });
  }

  const idempotencyKey = randomUUID();

  const purchase = await prisma.purchase.create({
    data: {
      userId: session.user.id,
      profileId: profile.id,
      productId: product.id,
      status: "pending",
      amount: product.priceAmount,
      currency: product.currency,
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      idempotencyKey,
      eventId,
      metadataJson: JSON.stringify({
        sku: product.sku,
        sphere: product.sphere,
        recChannel: parsed.data.recChannel,
        recContact: parsed.data.recContact
      })
    }
  });

  const provider = getPaymentProvider();
  const saved =
    parsed.data.useSavedMethod === false
      ? null
      : await prisma.savedPaymentMethod.findFirst({
          where: { userId: session.user.id, provider: provider.name },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
        });
  const item = {
    sku: product.sku,
    name,
    amount: product.priceAmount,
    currency: product.currency,
    sphere: product.sphere
  };
  const metadata = {
    purchaseId: purchase.id,
    userId: session.user.id,
    profileId: profile.id,
    sku: product.sku
  };

  const analytics = await analyticsFromCookies();
  const started = async (providerName: string) => {
    await trackEvent({
      name: "checkout_started",
      eventId,
      userId: session.user.id,
      profileId: profile.id,
      ...analytics,
      payload: { sku: product.sku, provider: providerName }
    });
  };

  if (saved?.providerMethodId) {
    const charged = await provider.chargeSaved({
      item,
      metadata,
      customerId: saved.providerCustomerId || saved.userId,
      methodId: saved.providerMethodId,
      idempotencyKey,
      returnUrl
    });
    if (charged.status === "paid") {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { providerPaymentId: charged.id, provider: provider.name }
      });
      const { fulfillPaidPurchase } = await import("@/lib/payments/fulfill");
      await fulfillPaidPurchase(purchase.id);
      await capturePaymentMethod({
        userId: session.user.id,
        provider: provider.name,
        providerPaymentId: charged.id,
        method: charged.paymentMethod
      });
      await appendLedger({
        kind: "checkout.created",
        actorType: "user",
        actorId: session.user.id,
        userId: session.user.id,
        profileId: profile.id,
        purchaseId: purchase.id,
        sku: product.sku,
        amount: product.priceAmount,
        currency: product.currency,
        provider: provider.name,
        providerPaymentId: charged.id,
        summary: `Saved-card checkout ${product.sku}`
      });
      await started(provider.name);
      return NextResponse.json({ url: returnUrl, eventId, purchaseId: purchase.id, paid: true });
    }
    if (charged.checkoutUrl) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { providerPaymentId: charged.id, provider: provider.name }
      });
      await appendLedger({
        kind: "checkout.created",
        actorType: "user",
        actorId: session.user.id,
        userId: session.user.id,
        profileId: profile.id,
        purchaseId: purchase.id,
        sku: product.sku,
        amount: product.priceAmount,
        currency: product.currency,
        provider: provider.name,
        providerPaymentId: charged.id,
        summary: `Checkout ${product.sku}`
      });
      await started(provider.name);
      return NextResponse.json({ url: charged.checkoutUrl, eventId, purchaseId: purchase.id });
    }
  }

  const reuseCustomer = await prisma.savedPaymentMethod.findFirst({
    where: { userId: session.user.id, provider: provider.name },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });

  const checkout = await provider.createCheckout({
    item,
    metadata,
    returnUrl,
    cancelUrl,
    customerEmail: session.user.email ?? undefined,
    customerId: reuseCustomer?.providerCustomerId || undefined,
    idempotencyKey
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { providerPaymentId: checkout.id, provider: checkout.provider }
  });
  await appendLedger({
    kind: "checkout.created",
    actorType: "user",
    actorId: session.user.id,
    userId: session.user.id,
    profileId: profile.id,
    purchaseId: purchase.id,
    sku: product.sku,
    amount: product.priceAmount,
    currency: product.currency,
    provider: checkout.provider,
    providerPaymentId: checkout.id,
    summary: `Checkout ${product.sku}`
  });

  await started(checkout.provider);

  return NextResponse.json({ url: checkout.checkoutUrl, eventId, purchaseId: purchase.id });
}
