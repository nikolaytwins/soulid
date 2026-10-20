"use client";

import { usePathname } from "@/i18n/routing";
import { isV2Path } from "@/lib/v2";
import { isV3Path } from "@/lib/v3";

/** Hide classic chrome on alternate design skins (v2 / v3). */
export function HideOnV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isV2Path(pathname) || isV3Path(pathname)) return null;
  return <>{children}</>;
}
