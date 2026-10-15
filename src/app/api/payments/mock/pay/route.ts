import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { safeSameOriginUrl } from "@/lib/safe-url";

export async function POST(req: Request) {
  const form = await req.formData();
  const result = String(form.get("result") ?? "paid");
  const metaRaw = String(form.get("meta") ?? "{}");
  let metadata: Record<string, string> = {};
  try {
    metadata = JSON.parse(metaRaw) as Record<string, string>;
  } catch {
    metadata = {};
  }
  const returnUrl = String(form.get("return") ?? "/");
  const cancelUrl = String(form.get("cancel") ?? "/");
  const session = String(form.get("session") ?? randomUUID());
  const amount = Number(form.get("amount") ?? 0);
  const currency = String(form.get("currency") ?? "RUB");

  const origin = process.env.APP_URL ?? new URL(req.url).origin;
  const safeReturn = safeSameOriginUrl(returnUrl, origin);
  const safeCancel = safeSameOriginUrl(cancelUrl, origin);
  await fetch(`${origin}/api/payments/webhooks/mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventKey: session,
      status: result === "paid" ? "paid" : "failed",
      providerPaymentId: session,
      metadata,
      amount,
      currency
    })
  });

  return NextResponse.redirect(result === "paid" ? safeReturn : safeCancel, { status: 303 });
}
