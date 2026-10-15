import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/safe-url";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session") ?? "";
  const ret = url.searchParams.get("return") ?? "/";
  const cancel = url.searchParams.get("cancel") ?? "/";
  const amount = url.searchParams.get("amount") ?? "0";
  const currency = url.searchParams.get("currency") ?? "RUB";
  const name = escapeHtml(url.searchParams.get("name") ?? "Soul Star");
  const meta = escapeHtml(url.searchParams.get("meta") ?? "{}");

  const html = `<!doctype html>
<html lang="ru">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Mock payment</title>
<body style="margin:0;background:#F5F0EA;font-family:Manrope,system-ui,sans-serif;color:#2A211D;display:flex;min-height:100vh;align-items:center;justify-content:center">
  <form method="post" action="/api/payments/mock/pay" style="background:#FBF8F4;border:1px solid rgba(80,60,45,.1);border-radius:24px;padding:32px;width:min(420px,92vw);display:flex;flex-direction:column;gap:16px">
    <div style="font-size:11px;letter-spacing:.2em;color:#B9813F;font-weight:700">MOCK CHECKOUT</div>
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;margin:0;font-weight:500">${name}</h1>
    <p style="color:#5E534C;line-height:1.5">Тестовый платёж. В production здесь Stripe или ЮKassa / СБП.</p>
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(80,60,45,.1);padding-top:12px">
      <span>Сумма</span><b>${escapeHtml(String(Math.round(Number(amount) / 100)))} ${escapeHtml(currency)}</b>
    </div>
    <input type="hidden" name="session" value="${escapeHtml(session)}"/>
    <input type="hidden" name="return" value="${escapeHtml(ret)}"/>
    <input type="hidden" name="cancel" value="${escapeHtml(cancel)}"/>
    <input type="hidden" name="meta" value="${meta}"/>
    <input type="hidden" name="amount" value="${escapeHtml(amount)}"/>
    <input type="hidden" name="currency" value="${escapeHtml(currency)}"/>
    <button name="result" value="paid" style="background:#2A211D;color:#FBF8F4;border:none;border-radius:14px;padding:16px;font-weight:600;cursor:pointer">Оплатить</button>
    <button name="result" value="failed" style="background:transparent;border:none;color:#5E534C;padding:12px;cursor:pointer">Отклонить платёж</button>
  </form>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
