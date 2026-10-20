import { NextResponse } from "next/server";
import { escapeHtml, localeFromPath } from "@/lib/safe-url";

const COPY = {
  ru: {
    eyebrow: "ОПЛАТА",
    lead: "Тестовый платёж. Карта сохранится для следующих покупок — номер в Soul ID не хранится.",
    amount: "Сумма",
    pay: "Оплатить",
    fail: "Отклонить платёж",
    disclaimer:
      "Soul ID носит ознакомительный характер: не ставит медицинских диагнозов, не заменяет врача и не гарантирует жизненных результатов."
  },
  en: {
    eyebrow: "CHECKOUT",
    lead: "Test payment. The card will be saved for later purchases — Soul ID never stores the number.",
    amount: "Amount",
    pay: "Pay",
    fail: "Decline payment",
    disclaimer:
      "Soul ID is informational: it does not give medical diagnoses, replace a doctor, or guarantee life results."
  },
  ar: {
    eyebrow: "الدفع",
    lead: "دفعة تجريبية. سنحفظ البطاقة للمشتريات التالية — Soul ID لا يخزن رقمها.",
    amount: "المبلغ",
    pay: "ادفع",
    fail: "رفض الدفع",
    disclaimer: "Soul ID للطّلاع: لا يضع تشخيصاً طبياً، ولا يغني عن الطبيب، ولا يضمن نتائج حياتية."
  }
} as const;

function formatAmount(amount: string, currency: string, locale: string): string {
  const major = Math.round(Number(amount) / 100) || 0;
  if (currency === "USD") return `$${major}`;
  if (currency === "RUB") {
    const n = new Intl.NumberFormat(locale === "en" ? "en-US" : locale === "ar" ? "ar" : "ru-RU", {
      maximumFractionDigits: 0
    }).format(major);
    return `${n} ₽`;
  }
  return `${major} ${currency}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session") ?? "";
  const ret = url.searchParams.get("return") ?? "/";
  const cancel = url.searchParams.get("cancel") ?? "/";
  const amount = url.searchParams.get("amount") ?? "0";
  const currency = url.searchParams.get("currency") ?? "RUB";
  const name = escapeHtml(url.searchParams.get("name") ?? "Soul ID");
  const meta = escapeHtml(url.searchParams.get("meta") ?? "{}");
  let path = "/";
  try {
    path = new URL(ret, url.origin).pathname;
  } catch {
    path = "/";
  }
  const locale = (["ru", "en", "ar"].includes(localeFromPath(path)) ? localeFromPath(path) : "ru") as keyof typeof COPY;
  const t = COPY[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const sum = escapeHtml(formatAmount(amount, currency, locale));
  const dots = ["#E8957A", "#B686D6", "#D9A957", "#DE85A3", "#78B5AC", "#2B1A33"]
    .map((c) => `<span style="width:8px;height:8px;border-radius:50%;background:${c}"></span>`)
    .join("");

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Soul ID</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Unbounded:wght@500;600&display=swap"/>
</head>
<body style="margin:0;background:#F8F1E9;font-family:Manrope,system-ui,sans-serif;color:#2B1A33;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;-webkit-font-smoothing:antialiased">
  <form method="post" action="/api/payments/mock/pay" style="background:#FFFFFF;border-radius:36px;padding:clamp(24px,4vw,40px);width:min(440px,92vw);display:flex;flex-direction:column;gap:20px;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="display:grid;grid-template-columns:repeat(3,8px);gap:3px">${dots}</span>
      <span style="font-family:Unbounded,sans-serif;font-size:18px;font-weight:600">Soul ID</span>
    </div>
    <div style="font-size:12px;letter-spacing:.16em;color:#B07A33;font-weight:700">${t.eyebrow}</div>
    <h1 style="font-family:Unbounded,sans-serif;font-size:clamp(28px,5vw,36px);margin:0;font-weight:500;line-height:1.1">${name}</h1>
    <p style="margin:0;color:#5B5566;line-height:1.6;font-size:15px">${t.lead}</p>
    <div style="display:flex;justify-content:space-between;align-items:baseline;background:#F8F1E9;border-radius:18px;padding:14px 16px">
      <span style="color:#6E6878;font-size:14px">${t.amount}</span>
      <b style="font-family:Unbounded,sans-serif;font-size:24px;font-weight:500">${sum}</b>
    </div>
    <input type="hidden" name="session" value="${escapeHtml(session)}"/>
    <input type="hidden" name="return" value="${escapeHtml(ret)}"/>
    <input type="hidden" name="cancel" value="${escapeHtml(cancel)}"/>
    <input type="hidden" name="meta" value="${meta}"/>
    <input type="hidden" name="amount" value="${escapeHtml(amount)}"/>
    <input type="hidden" name="currency" value="${escapeHtml(currency)}"/>
    <button name="result" value="paid" style="background:#2B1A33;color:#FFFFFF;border:none;border-radius:999px;padding:17px 22px;font-weight:700;font-size:15px;cursor:pointer;min-height:56px">${t.pay}</button>
    <p style="margin:0;font-size:11px;line-height:1.45;color:#8A8494;text-align:center">${t.disclaimer}</p>
    <button name="result" value="failed" style="background:transparent;border:none;color:#6E6878;padding:12px;cursor:pointer;font-size:14px">${t.fail}</button>
  </form>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
