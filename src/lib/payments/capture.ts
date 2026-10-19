import { getPaymentProvider, providerByName } from "@/lib/payments/provider";
import { upsertSavedMethod, type CapturedMethod } from "@/lib/payments/saved";

export async function capturePaymentMethod(input: {
  userId: string;
  provider?: string;
  providerPaymentId?: string | null;
  method?: CapturedMethod | null;
}): Promise<void> {
  const providerName = input.provider || getPaymentProvider().name;
  let method = input.method ?? null;
  if (!method && input.providerPaymentId) {
    method = await providerByName(providerName).inspectPayment(input.providerPaymentId);
  }
  if (!method) return;
  try {
    await upsertSavedMethod({ userId: input.userId, provider: providerName, method });
  } catch (err) {
    console.error("save payment method failed", err);
  }
}
