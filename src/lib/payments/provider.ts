import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import type { CapturedMethod } from "@/lib/payments/saved";

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

export type ChargeResult = {
  id: string;
  status: "paid" | "pending" | "failed";
  checkoutUrl?: string;
  paymentMethod?: CapturedMethod;
};

export type WebhookParse = {
  eventKey: string;
  status: "paid" | "failed" | "canceled";
  providerPaymentId: string;
  metadata: Record<string, string>;
  amount?: number;
  currency?: string;
  paymentMethod?: CapturedMethod;
};

export type CheckoutInput = {
  item: CheckoutItem;
  metadata: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerId?: string;
  idempotencyKey: string;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  chargeSaved(input: {
    item: CheckoutItem;
    metadata: Record<string, string>;
    customerId: string;
    methodId: string;
    idempotencyKey: string;
    returnUrl: string;
  }): Promise<ChargeResult>;
  inspectPayment(providerPaymentId: string): Promise<CapturedMethod | null>;
  parseWebhook(rawBody: string, headers: Headers): Promise<WebhookParse | null>;
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

function mockCard(): CapturedMethod {
  return { methodId: "mock_card_default", customerId: "mock_cus", brand: "visa", last4: "4242", expMonth: 12, expYear: 2030 };
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
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

  async chargeSaved(input: Parameters<PaymentProvider["chargeSaved"]>[0]): Promise<ChargeResult> {
    return { id: `mock_${randomUUID()}`, status: "paid", paymentMethod: { ...mockCard(), methodId: input.methodId, customerId: input.customerId } };
  }

  async inspectPayment() {
    return mockCard();
  }

  async parseWebhook(rawBody: string) {
    const data = JSON.parse(rawBody) as WebhookParse;
    if (data.status === "paid" && !data.paymentMethod) data.paymentMethod = mockCard();
    return data;
  }
}

async function stripeForm(path: string, params: URLSearchParams, idempotencyKey?: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded"
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { method: "POST", headers, body: params });
  return (await res.json()) as Record<string, unknown>;
}

async function stripeGet(path: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  return (await res.json()) as Record<string, unknown>;
}

function stripeMethodFrom(obj: Record<string, unknown> | null | undefined, customerId?: string): CapturedMethod | null {
  if (!obj || typeof obj !== "object") return null;
  const card = (obj.card ?? obj) as Record<string, unknown>;
  const id = String(obj.id ?? "");
  const last4 = String(card.last4 ?? "");
  if (!id || last4.length !== 4) return null;
  return {
    methodId: id,
    customerId: customerId || String(obj.customer ?? ""),
    brand: String(card.brand ?? "card"),
    last4,
    expMonth: Number(card.exp_month) || undefined,
    expYear: Number(card.exp_year) || undefined
  };
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async ensureCustomer(email?: string, existingId?: string): Promise<string | undefined> {
    if (existingId) return existingId;
    if (!email || !process.env.STRIPE_SECRET_KEY) return undefined;
    const params = new URLSearchParams();
    params.set("email", email);
    const json = await stripeForm("customers", params);
    const id = json && typeof json.id === "string" ? json.id : undefined;
    return id;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new MockPaymentProvider().createCheckout(input);
    }
    const customer = await this.ensureCustomer(input.customerEmail, input.customerId);
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", input.cancelUrl);
    params.set("line_items[0][price_data][currency]", input.item.currency.toLowerCase());
    params.set("line_items[0][price_data][product_data][name]", input.item.name);
    params.set("line_items[0][price_data][unit_amount]", String(input.item.amount));
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", input.idempotencyKey);
    params.set("payment_intent_data[setup_future_usage]", "off_session");
    if (customer) params.set("customer", customer);
    else if (input.customerEmail) params.set("customer_email", input.customerEmail);
    Object.entries(input.metadata).forEach(([k, v]) => params.set(`metadata[${k}]`, v));
    const json = await stripeForm("checkout/sessions", params, input.idempotencyKey);
    const id = json && typeof json.id === "string" ? json.id : "";
    const url = json && typeof json.url === "string" ? json.url : "";
    if (!id || !url) {
      const err = json && typeof json.error === "object" && json.error ? (json.error as { message?: string }).message : undefined;
      throw new Error(err ?? "Stripe checkout failed");
    }
    return {
      id,
      provider: this.name,
      status: "pending",
      amount: input.item.amount,
      currency: input.item.currency,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
      checkoutUrl: url
    };
  }

  async chargeSaved(input: Parameters<PaymentProvider["chargeSaved"]>[0]): Promise<ChargeResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new MockPaymentProvider().chargeSaved(input);
    }
    const params = new URLSearchParams();
    params.set("amount", String(input.item.amount));
    params.set("currency", input.item.currency.toLowerCase());
    params.set("customer", input.customerId);
    params.set("payment_method", input.methodId);
    params.set("off_session", "true");
    params.set("confirm", "true");
    params.set("description", input.item.name);
    Object.entries(input.metadata).forEach(([k, v]) => params.set(`metadata[${k}]`, v));
    const json = await stripeForm("payment_intents", params, input.idempotencyKey);
    const id = json && typeof json.id === "string" ? json.id : "";
    const status = json && typeof json.status === "string" ? json.status : "";
    if (status === "succeeded") {
      const pm =
        json && typeof json.payment_method === "object"
          ? stripeMethodFrom(json.payment_method as Record<string, unknown>, input.customerId)
          : { methodId: input.methodId, customerId: input.customerId, brand: "card", last4: "0000" };
      return { id, status: "paid", paymentMethod: pm?.last4 === "0000" ? undefined : pm ?? undefined };
    }
    return { id: id || input.idempotencyKey, status: "failed" };
  }

  async inspectPayment(providerPaymentId: string): Promise<CapturedMethod | null> {
    if (!process.env.STRIPE_SECRET_KEY) return mockCard();
    if (providerPaymentId.startsWith("cs_")) {
      const session = await stripeGet(`checkout/sessions/${providerPaymentId}?expand[]=payment_intent.payment_method`);
      if (!session) return null;
      const customerId = String(session.customer ?? "");
      const intent = session.payment_intent;
      if (intent && typeof intent === "object") {
        const pm = (intent as { payment_method?: Record<string, unknown> | string }).payment_method;
        if (pm && typeof pm === "object") return stripeMethodFrom(pm, customerId);
        if (typeof pm === "string") {
          const fetched = await stripeGet(`payment_methods/${pm}`);
          return stripeMethodFrom(fetched ?? undefined, customerId);
        }
      }
      return null;
    }
    const intent = await stripeGet(`payment_intents/${providerPaymentId}?expand[]=payment_method`);
    if (!intent) return null;
    const customerId = String(intent.customer ?? "");
    const pm = intent.payment_method;
    if (pm && typeof pm === "object") return stripeMethodFrom(pm as Record<string, unknown>, customerId);
    return null;
  }

  async parseWebhook(rawBody: string, headers: Headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;
    const sig = headers.get("stripe-signature");
    if (!sig || !verifyStripeSignature(rawBody, sig, secret)) return null;
    const json = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: {
        object: {
          id: string;
          payment_status?: string;
          status?: string;
          metadata?: Record<string, string>;
          amount_total?: number;
          amount?: number;
          currency?: string;
          customer?: string;
          payment_method?: string | Record<string, unknown>;
        };
      };
    };
    const obj = json.data.object;
    const paid =
      json.type === "checkout.session.completed" ||
      json.type === "payment_intent.succeeded" ||
      obj.payment_status === "paid" ||
      obj.status === "succeeded";
    let paymentMethod: CapturedMethod | undefined;
    if (paid) {
      paymentMethod = (await this.inspectPayment(obj.id)) ?? undefined;
    }
    return {
      eventKey: json.id,
      status: paid ? ("paid" as const) : ("failed" as const),
      providerPaymentId: obj.id,
      metadata: obj.metadata ?? {},
      amount: obj.amount_total ?? obj.amount,
      currency: obj.currency?.toUpperCase(),
      paymentMethod
    };
  }
}

function yooAuth() {
  const shop = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shop || !secret) return null;
  return Buffer.from(`${shop}:${secret}`).toString("base64");
}

function yooMethodFrom(obj: Record<string, unknown> | undefined): CapturedMethod | null {
  if (!obj) return null;
  const id = String(obj.id ?? "");
  const card = (obj.card ?? {}) as Record<string, unknown>;
  const last4 = String(card.last4 ?? "");
  if (!id || last4.length !== 4) return null;
  const type = String(obj.type ?? card.card_type ?? "bank_card").toLowerCase();
  const brand = type.includes("master") ? "mastercard" : type.includes("mir") ? "mir" : type.includes("visa") ? "visa" : "card";
  return { methodId: id, brand, last4 };
}

export class YooKassaPaymentProvider implements PaymentProvider {
  readonly name = "yookassa";

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const auth = yooAuth();
    if (!auth) return new MockPaymentProvider().createCheckout(input);
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
        save_payment_method: true
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

  async chargeSaved(input: Parameters<PaymentProvider["chargeSaved"]>[0]): Promise<ChargeResult> {
    const auth = yooAuth();
    if (!auth) return new MockPaymentProvider().chargeSaved(input);
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
        payment_method_id: input.methodId,
        description: input.item.name,
        metadata: input.metadata
      })
    });
    const json = (await res.json()) as {
      id?: string;
      status?: string;
      confirmation?: { confirmation_url?: string };
      payment_method?: Record<string, unknown>;
    };
    const id = json.id ?? input.idempotencyKey;
    if (json.status === "succeeded") {
      return { id, status: "paid", paymentMethod: yooMethodFrom(json.payment_method) ?? undefined };
    }
    if (json.confirmation?.confirmation_url) {
      return { id, status: "pending", checkoutUrl: json.confirmation.confirmation_url };
    }
    return { id, status: "failed" };
  }

  async inspectPayment(providerPaymentId: string): Promise<CapturedMethod | null> {
    const auth = yooAuth();
    if (!auth) return mockCard();
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${providerPaymentId}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const json = (await res.json()) as { payment_method?: Record<string, unknown> };
    return yooMethodFrom(json.payment_method);
  }

  async parseWebhook(rawBody: string) {
    const json = JSON.parse(rawBody) as {
      event: string;
      object: {
        id: string;
        status: string;
        metadata?: Record<string, string>;
        amount?: { value: string; currency: string };
        payment_method?: Record<string, unknown>;
      };
    };
    const paid = json.event === "payment.succeeded" || json.object.status === "succeeded";
    return {
      eventKey: json.object.id + ":" + json.event,
      status: paid ? ("paid" as const) : json.event === "payment.canceled" ? ("canceled" as const) : ("failed" as const),
      providerPaymentId: json.object.id,
      metadata: json.object.metadata ?? {},
      amount: json.object.amount ? Math.round(Number(json.object.amount.value) * 100) : undefined,
      currency: json.object.amount?.currency,
      paymentMethod: yooMethodFrom(json.object.payment_method) ?? undefined
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
