import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfillPaidPurchase } from "@/lib/payments/fulfill";
import { providerByName } from "@/lib/payments/provider";

async function handle(providerName: string, req: Request) {
  const raw = await req.text();
  const provider = providerByName(providerName);
  const parsed = await provider.parseWebhook(raw, req.headers);
  if (!parsed) return NextResponse.json({ ok: false }, { status: 400 });

  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventKey: { provider: providerName, eventKey: parsed.eventKey } }
  });
  if (existing?.processed) return NextResponse.json({ ok: true, idempotent: true });

  await prisma.webhookEvent.upsert({
    where: { provider_eventKey: { provider: providerName, eventKey: parsed.eventKey } },
    update: { payload: raw },
    create: { provider: providerName, eventKey: parsed.eventKey, payload: raw }
  });

  const purchaseId = parsed.metadata.purchaseId;
  if (!purchaseId) return NextResponse.json({ ok: false, error: "no purchase" }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return NextResponse.json({ ok: false, error: "purchase missing" }, { status: 404 });

  if (parsed.status === "paid") {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { providerPaymentId: parsed.providerPaymentId }
    });
    await fulfillPaidPurchase(purchaseId);
  } else {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: parsed.status, providerPaymentId: parsed.providerPaymentId }
    });
  }

  await prisma.webhookEvent.update({
    where: { provider_eventKey: { provider: providerName, eventKey: parsed.eventKey } },
    data: { processed: true }
  });

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const name = url.pathname.split("/").pop() ?? "mock";
  try {
    return await handle(name, req);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
