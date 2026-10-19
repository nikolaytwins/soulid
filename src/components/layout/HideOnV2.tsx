"use client";

import { usePathname } from "@/i18n/routing";
import { isV2Path } from "@/lib/v2";

export function HideOnV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isV2Path(pathname)) return null;
  return <>{children}</>;
}
