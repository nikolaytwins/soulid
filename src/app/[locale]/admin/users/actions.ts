"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { issuePasswordLink } from "@/lib/auth-password";
import { revalidatePath } from "next/cache";

const LOCALES = ["ru", "en", "ar"] as const;
const emailSchema = z.string().email().transform((v) => v.toLowerCase().trim());

function noticePath(locale: string, userId: string, notice: string) {
  const safe = locale === "en" || locale === "ar" ? locale : "ru";
  return `/${safe}/admin/users/${userId}?notice=${notice}`;
}

function revalidateUser(userId: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/admin/users`);
    revalidatePath(`/${locale}/admin/users/${userId}`);
    revalidatePath(`/${locale}/admin/unlocks`);
  }
}

async function liveAdminCount(exceptId?: string) {
  return prisma.user.count({
    where: { role: "admin", blockedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) }
  });
}

export async function updateUserEmailAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(form.get("userId") ?? "");
  const locale = String(form.get("locale") ?? "ru");
  const parsed = emailSchema.safeParse(String(form.get("email") ?? ""));
  if (!parsed.success) redirect(noticePath(locale, userId, "err_email"));
  const taken = await prisma.user.findFirst({
    where: { email: parsed.data, id: { not: userId } },
    select: { id: true }
  });
  if (taken) redirect(noticePath(locale, userId, "err_taken"));
  await prisma.user.update({ where: { id: userId }, data: { email: parsed.data } });
  revalidateUser(userId);
  redirect(noticePath(locale, userId, "ok_email"));
}

export async function updateUserNameAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(form.get("userId") ?? "");
  const locale = String(form.get("locale") ?? "ru");
  const name = String(form.get("name") ?? "").trim().slice(0, 80) || null;
  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidateUser(userId);
  redirect(noticePath(locale, userId, "ok_name"));
}

export async function updateUserNoteAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(form.get("userId") ?? "");
  const locale = String(form.get("locale") ?? "ru");
  const adminNote = String(form.get("adminNote") ?? "").slice(0, 2000);
  await prisma.user.update({ where: { id: userId }, data: { adminNote } });
  revalidateUser(userId);
  redirect(noticePath(locale, userId, "ok_note"));
}

export async function setUserBlockedAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(form.get("userId") ?? "");
  const locale = String(form.get("locale") ?? "ru");
  const block = String(form.get("block") ?? "") === "1";
  if (userId === admin.id) redirect(noticePath(locale, userId, "err_self"));
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (block && target.role === "admin") {
    const others = await liveAdminCount(userId);
    if (others === 0) redirect(noticePath(locale, userId, "err_last_admin"));
  }
  await prisma.user.update({
    where: { id: userId },
    data: { blockedAt: block ? new Date() : null }
  });
  revalidateUser(userId);
  redirect(noticePath(locale, userId, block ? "ok_block" : "ok_unblock"));
}

export async function sendUserPasswordLinkAction(form: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(form.get("userId") ?? "");
  const locale = String(form.get("locale") ?? "ru");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await issuePasswordLink(user);
  revalidateUser(userId);
  redirect(noticePath(locale, userId, "ok_password"));
}
