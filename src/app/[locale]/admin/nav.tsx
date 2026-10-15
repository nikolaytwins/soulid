"use client";

import { Link, usePathname } from "@/i18n/routing";

export function AdminNav({
  items
}: {
  items: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2 border-b border-line pb-3">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin" || pathname === "/admin/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1.5 text-sm no-underline ${
              active ? "bg-ink text-card" : "bg-card text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
