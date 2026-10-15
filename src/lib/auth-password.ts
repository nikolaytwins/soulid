import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { resetPasswordEmail, sendTransactionalEmail } from "./email";

export function isBlocked(user: { blockedAt: Date | null }): boolean {
  return Boolean(user.blockedAt);
}

export async function issuePasswordLink(user: { id: string; email: string; locale: string }) {
  const token = randomBytes(24).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
  });
  const locale = user.locale === "en" || user.locale === "ar" ? user.locale : "ru";
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/${locale}/reset-password?token=${token}`;
  const mail = resetPasswordEmail(locale, url);
  await sendTransactionalEmail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    template: "reset_password",
    userId: user.id
  });
  return url;
}
