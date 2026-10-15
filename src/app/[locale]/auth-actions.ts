"use server";

import { signOut } from "@/lib/auth";

export async function signOutAction(formData?: FormData) {
  const locale = String(formData?.get("locale") || "ru");
  const safe = locale === "en" || locale === "ar" ? locale : "ru";
  await signOut({ redirectTo: `/${safe}` });
}
