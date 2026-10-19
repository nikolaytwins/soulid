import { prisma } from "@/lib/db";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  userId?: string;
  purchaseId?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ ok: boolean; id?: string }>;
}

class MockEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.info("[email:mock]", payload.to, payload.subject);
    return { ok: true, id: `mock_${Date.now()}` };
  }
}

class ResendEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return new MockEmailProvider().send(payload);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Soul ID <noreply@localhost>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text
      })
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: res.ok, id: json.id };
  }
}

export function getEmailProvider(): EmailProvider {
  const kind = process.env.EMAIL_PROVIDER ?? "mock";
  if (kind === "resend") return new ResendEmailProvider();
  return new MockEmailProvider();
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  const provider = getEmailProvider();
  const result = await provider.send(payload);
  await prisma.emailLog.create({
    data: {
      userId: payload.userId,
      purchaseId: payload.purchaseId,
      toEmail: payload.to,
      template: payload.template,
      subject: payload.subject,
      body: payload.text,
      provider: process.env.EMAIL_PROVIDER ?? "mock",
      status: result.ok ? "sent" : "failed"
    }
  });
  return result;
}

export function sphereUnlockedEmail(locale: string, sphereName: string, url: string, setPasswordUrl?: string) {
  const passwordNote = setPasswordUrl
    ? locale === "en"
      ? `\n\nSet a password to keep this star on other devices: ${setPasswordUrl}`
      : locale === "ar"
        ? `\n\nعيّن كلمة مرور لتحتفظ بالنجمة على أجهزة أخرى: ${setPasswordUrl}`
        : `\n\nЗадайте пароль, чтобы открывать звезду с других устройств: ${setPasswordUrl}`
    : "";
  const passwordHtml = setPasswordUrl
    ? locale === "en"
      ? `<p>Set a password to keep this star on other devices: <a href="${setPasswordUrl}">create password</a></p>`
      : locale === "ar"
        ? `<p>عيّن كلمة مرور: <a href="${setPasswordUrl}">إنشاء كلمة المرور</a></p>`
        : `<p>Задайте пароль, чтобы открывать звезду с других устройств: <a href="${setPasswordUrl}">создать пароль</a></p>`
    : "";
  if (locale === "en") {
    return {
      subject: `Your next sphere is open: ${sphereName}`,
      text: `The sphere «${sphereName}» is now unlocked. Open your star: ${url}${passwordNote}`,
      html: `<p>The sphere <strong>${sphereName}</strong> is now unlocked.</p><p><a href="${url}">Open your star</a></p>${passwordHtml}`
    };
  }
  if (locale === "ar") {
    return {
      subject: `المجال التالي مفتوح: ${sphereName}`,
      text: `تم فتح مجال «${sphereName}». ${url}${passwordNote}`,
      html: `<p>تم فتح مجال <strong>${sphereName}</strong>.</p><p><a href="${url}">افتح نجمتك</a></p>${passwordHtml}`
    };
  }
  return {
    subject: `Ваша следующая сфера открыта: ${sphereName}`,
    text: `Сфера «${sphereName}» теперь открыта. Перейти к звезде: ${url}${passwordNote}`,
    html: `<p>Сфера <strong>${sphereName}</strong> теперь открыта.</p><p><a href="${url}">Открыть звезду</a></p>${passwordHtml}`
  };
}

export function recommendationOrderedEmail(locale: string, channel: string, contact: string) {
  if (locale === "en") {
    return {
      subject: "Your personal recommendation is in progress",
      text: `We started preparing your personal recommendation. It will arrive via ${channel} (${contact}) within 24 hours.`,
      html: `<p>We started preparing your personal recommendation.</p><p>It will arrive via <strong>${channel}</strong> (${contact}) within 24 hours.</p>`
    };
  }
  if (locale === "ar") {
    return {
      subject: "توصيتك الشخصية قيد الإعداد",
      text: `بدأنا إعداد توصيتك الشخصية. ستصل عبر ${channel} (${contact}) خلال 24 ساعة.`,
      html: `<p>بدأنا إعداد توصيتك الشخصية.</p><p>ستصل عبر <strong>${channel}</strong> (${contact}) خلال 24 ساعة.</p>`
    };
  }
  return {
    subject: "Персональная рекомендация в работе",
    text: `Мы начали готовить вашу персональную рекомендацию. Она придёт через ${channel} (${contact}) в течение 24 часов.`,
    html: `<p>Мы начали готовить вашу персональную рекомендацию.</p><p>Она придёт через <strong>${channel}</strong> (${contact}) в течение 24 часов.</p>`
  };
}

export function resetPasswordEmail(locale: string, url: string) {
  if (locale === "en") {
    return {
      subject: "Reset your Soul ID password",
      text: `Reset link (valid 1 hour): ${url}`,
      html: `<p><a href="${url}">Reset password</a> — valid for 1 hour.</p>`
    };
  }
  if (locale === "ar") {
    return {
      subject: "إعادة تعيين كلمة المرور",
      text: `رابط إعادة التعيين (صالح ساعة): ${url}`,
      html: `<p><a href="${url}">إعادة تعيين كلمة المرور</a> — صالح لمدة ساعة.</p>`
    };
  }
  return {
    subject: "Восстановление доступа Soul ID",
    text: `Ссылка для сброса пароля (действует 1 час): ${url}`,
    html: `<p><a href="${url}">Сбросить пароль</a> — ссылка действует 1 час.</p>`
  };
}
