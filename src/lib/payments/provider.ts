import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutItem = {
  sku: string;
  name: string;
  amount: number;
  currency: string;
  sphere?: string | null;
};

export type CheckoutSession = {
  id: string;
  provider: string;
  status: "pending" | "paid" | "failed" | "canceled";
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  checkoutUrl: string;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: {
    item: CheckoutItem;
    metadata: Record<string, string>;
    returnUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    idempotencyKey: string;
  }): Promise<CheckoutSession>;
  parseWebhook(rawBody: string, headers: Headers): Promise<{
    eventKey: string;
    status: "paid" | "failed" | "canceled";
    providerPaymentId: string;
    metadata: Record<string, string>;
    amount?: number;
    currency?: string;
  } | null>;
}

function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
  const items = Object.fromEntries(
    header.split(",").map((part) => {
      const i = part.indexOf("=");
      return [part.slice(0, i), part.slice(i + 1)];
    })
  );
  const timestamp = items.t;
  const v1 = items.v1;
  if (!timestamp || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(v1, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function appUrl() {
  return process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(input: Parameters<PaymentProvider["createCheckout"]>[0]): Promise<CheckoutSession> {
    const id = `mock_${randomUUID()}`;
    const checkoutUrl = `${appUrl()}/api/payments/mock/checkout?session=${encodeURIComponent(id)}&return=${encodeURIComponent(input.returnUrl)}&cancel=${encodeURIComponent(input.cancelUrl)}&amount=${input.item.amount}&currency=${input.item.currency}&name=${encodeURIComponent(input.item.name)}&meta=${encodeURIComponent(JSON.stringify(input.metadata))}`;
    return {
      id,
      provider: this.name,
      status: "pending",
      amount: input.item.amount,
      currency: input.item.currency,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
      checkoutUrl
    };
  }

  async parseWebhook(rawBody: string) {
    const data = JSON.parse(rawBody) as {
      eventKey: string;
      status: "paid" | "failed" | "canceled";
      providerPaymentId: string;
      metadata: Record<string, string>;
      amount?: number;
      currency?: string;
    };
    return data;
  }
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createCheckout(input: Parameters<PaymentProvider["createCheckout"]>[0]): Promise<CheckoutSession> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return new MockPaymentProvider().createCheckout(input);
    }
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", input.cancelUrl);
    params.set("line_items[0][price_data][currency]", input.item.currency.toLowerCase());
    params.set("line_items[0][price_data][product_data][name]", input.item.name);
    params.set("line_items[0][price_data][unit_amount]", String(input.item.amount));
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", input.idempotencyKey);
    if (input.customerEmail) params.set("customer_email", input.customerEmail);
    Object.entries(input.metadata).forEach(([k, v]) => params.set(`metadata[${k}]`, v));

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!res.ok || !json.id || !json.url) {
      throw new Error(json.error?.message ?? "Stripe checkout failed");
    }
    return {
      id: json.id,
      provider: this.name,
      status: "pending",
      amount: input.item.amount,
      currency: input.item.currency,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
      checkoutUrl: json.url
    };
  }

  async parseWebhook(rawBody: string, headers: Headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;
    const sig = headers.get("stripe-signature");
    if (!sig || !verifyStripeSignature(rawBody, sig, secret)) return null;
    const json = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: { id: string; payment_status?: string; metadata?: Record<string, string>; amount_total?: number; currency?: string } };
    };
    const obj = json.data.object;
    const paid = json.type === "checkout.session.completed" || obj.payment_status === "paid";
    return {
      eventKey: json.id,
      status: paid ? ("paid" as const) : ("failed" as const),
      providerPaymentId: obj.id,
      metadata: obj.metadata ?? {},
      amount: obj.amount_total,
      currency: obj.currency?.toUpperCase()
    };
  }
}

export class YooKassaPaymentProvider implements PaymentProvider {
  readonly name = "yookassa";

  async createCheckout(input: Parameters<PaymentProvider["createCheckout"]>[0]): Promise<CheckoutSession> {
    const shop = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET_KEY;
    if (!shop || !secret) {
      return new MockPaymentProvider().createCheckout(input);
    }
    const auth = Buffer.from(`${shop}:${secret}`).toString("base64");
    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Idempotence-Key": input.idempotencyKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: { value: (input.item.amount / 100).toFixed(2), currency: input.item.currency },
        capture: true,
        confirmation: { type: "redirect", return_url: input.returnUrl },
        description: input.item.name,
        metadata: input.metadata,
        payment_method_data: undefined
      })
    });
    const json = (await res.json()) as {
      id?: string;
      confirmation?: { confirmation_url?: string };
      error?: { description?: string };
    };
    if (!res.ok || !json.id || !json.confirmation?.confirmation_url) {
      throw new Error(json.error?.description ?? "YooKassa checkout failed");
    }
    return {
      id: json.id,
      provider: this.name,
      status: "pending",
      amount: input.item.amount,
      currency: input.item.currency,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
      checkoutUrl: json.confirmation.confirmation_url
    };
  }

  async parseWebhook(rawBody: string) {
    const json = JSON.parse(rawBody) as {
      event: string;
      object: { id: string; status: string; metadata?: Record<string, string>; amount?: { value: string; currency: string } };
    };
    const paid = json.event === "payment.succeeded" || json.object.status === "succeeded";
    return {
      eventKey: json.object.id + ":" + json.event,
      status: paid ? ("paid" as const) : json.event === "payment.canceled" ? ("canceled" as const) : ("failed" as const),
      providerPaymentId: json.object.id,
      metadata: json.object.metadata ?? {},
      amount: json.object.amount ? Math.round(Number(json.object.amount.value) * 100) : undefined,
      currency: json.object.amount?.currency
    };
  }
}

export function providerByName(name: string): PaymentProvider {
  if (name === "stripe") return new StripePaymentProvider();
  if (name === "yookassa") return new YooKassaPaymentProvider();
  return new MockPaymentProvider();
}

export function getPaymentProvider(): PaymentProvider {
  return providerByName(process.env.PAYMENT_PROVIDER ?? "mock");
}

export function getSecondaryPaymentProvider(): PaymentProvider | null {
  if (process.env.STRIPE_SECRET_KEY && (process.env.PAYMENT_PROVIDER ?? "mock") !== "stripe") {
    return new StripePaymentProvider();
  }
  if (process.env.YOOKASSA_SHOP_ID && (process.env.PAYMENT_PROVIDER ?? "mock") !== "yookassa") {
    return new YooKassaPaymentProvider();
  }
  return null;
}
