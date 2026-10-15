"use client";

import { usePathname } from "@/i18n/routing";

export function HideOnAccount({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/account") return null;
  return <>{children}</>;
}
