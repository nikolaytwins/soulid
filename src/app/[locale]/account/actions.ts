"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateStar } from "@/lib/engine";
import { isValidCalendarDate } from "@/lib/engine/reduce";
import { loadStarFormula } from "@/lib/domain/formula";
import { ensureFreeEntitlements } from "@/lib/domain/access";
import { parseRelation, STAR_RELATIONS } from "@/lib/domain/relations";

const LOCALES = ["ru", "en", "ar"] as const;

function touch() {
  for (const locale of LOCALES) revalidatePath(`/${locale}/account`);
  revalidatePath("/account");
}

function parseDob(raw: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  const dt = new Date(year, month - 1, day);
  if (dt > new Date()) return null;
  if (year < 1900) return null;
  return { year, month, day };
}

export async function createStarAction(form: FormData) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const name = String(form.get("name") ?? "").trim();
  const date = String(form.get("date") ?? "");
  const relation = parseRelation(String(form.get("relation") ?? "partner"));
  if (!name) return { ok: false as const, error: "name" };
  const dob = parseDob(date);
  if (!dob) return { ok: false as const, error: "date" };
  const result = calculateStar(dob, { formula: await loadStarFormula() });
  const profile = await prisma.birthProfile.create({
    data: {
      userId: user.id,
      dateOfBirth: result.isoDate,
      displayName: name.slice(0, 80),
      relation,
      calculationJson: JSON.stringify(result),
      locale: user.locale ?? "ru"
    }
  });
  await ensureFreeEntitlements({ userId: user.id, profileId: profile.id });
  touch();
  return { ok: true as const, id: profile.id };
}

export async function updateStarAction(form: FormData) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const date = String(form.get("date") ?? "");
  const relation = parseRelation(String(form.get("relation") ?? "self"));
  if (!name) return { ok: false as const, error: "name" };
  const dob = parseDob(date);
  if (!dob) return { ok: false as const, error: "date" };
  const profile = await prisma.birthProfile.findFirst({ where: { id, userId: user.id } });
  if (!profile) return { ok: false as const, error: "missing" };
  const iso = `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`;
  const dateChanged = profile.dateOfBirth !== iso;
  const data: {
    displayName: string;
    relation: (typeof STAR_RELATIONS)[number];
    dateOfBirth?: string;
    calculationJson?: string;
  } = { displayName: name.slice(0, 80), relation };
  if (dateChanged) {
    const result = calculateStar(dob, { formula: await loadStarFormula() });
    data.dateOfBirth = result.isoDate;
    data.calculationJson = JSON.stringify(result);
  }
  await prisma.birthProfile.update({ where: { id: profile.id }, data });
  touch();
  return { ok: true as const, dateChanged };
}

export async function deleteStarAction(form: FormData) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const id = String(form.get("id") ?? "");
  const profiles = await prisma.birthProfile.findMany({ where: { userId: user.id } });
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return { ok: false as const, error: "missing" };
  if (profiles.length < 2) return { ok: false as const, error: "last" };
  if (parseRelation(profile.relation) === "self") return { ok: false as const, error: "self" };
  await prisma.birthProfile.delete({ where: { id: profile.id } });
  touch();
  return { ok: true as const };
}

export async function deleteAccountAction(form: FormData) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const confirm = String(form.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== user.email.toLowerCase()) return { ok: false as const, error: "confirm" };
  const { deleteUserData } = await import("@/lib/privacy");
  const res = await deleteUserData(user.id);
  if (!res.ok) return { ok: false as const, error: res.error };
  try {
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirect: false });
  } catch {
    /* session cookie may already be invalid */
  }
  return { ok: true as const };
}

export async function saveProfileNameAction(form: FormData) {
  const user = await requireUser();
  if (!user) return { ok: false as const, error: "auth" };
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (!name) return { ok: false as const, error: "name" };
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  touch();
  return { ok: true as const };
}
