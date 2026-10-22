"use client";

import { Link, usePathname } from "@/i18n/routing";
import { AdminModeSwitch } from "@/components/layout/AdminModeSwitch";
import { au } from "@/lib/admin-ui";

export function AdminNav({
  items
}: {
  items: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <div className={au.navBar}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={active ? au.pillOn : au.pillOff}>
              {item.label}
            </Link>
          );
        })}
      </div>
      <AdminModeSwitch mode="admin" />
    </div>
  );
}
