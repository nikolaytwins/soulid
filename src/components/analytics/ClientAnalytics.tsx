"use client";

import { usePathname } from "@/i18n/routing";
import { useEffect } from "react";
import { captureUtm, ensureClientIds, trackClient } from "./ids";

export function ClientAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    captureUtm();
    ensureClientIds();
  }, []);

  useEffect(() => {
    if (!pathname || pathname === "/admin" || pathname.startsWith("/admin/")) return;
    captureUtm();
    trackClient("page_view", { path: window.location.pathname });
  }, [pathname]);

  return null;
}
