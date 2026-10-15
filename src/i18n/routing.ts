import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = ["ru", "en", "ar"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ru",
  localePrefix: "always"
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export function isRtl(locale: string): boolean {
  return locale === "ar";
}
