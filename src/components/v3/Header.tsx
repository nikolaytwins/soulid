"use client";

import { Link, usePathname } from "@/i18n/routing";
import { V3Logo } from "./Logo";
import { V3UserCluster } from "./UserCluster";
import type { NavStar } from "@/lib/domain/nav-stars";
import { v3Href } from "@/lib/v3";

export function V3Header({
  locale,
  user,
  stars = []
}: {
  locale: string;
  user: { name?: string | null; email?: string | null; role?: string } | null;
  stars?: NavStar[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/v3/star/")) return null;

  return (
    <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-[clamp(20px,3vw,48px)] py-6 sm:gap-4">
      <Link href={v3Href("/")} className="flex min-w-0 flex-1 items-center no-underline">
        <V3Logo />
      </Link>
      <V3UserCluster locale={locale} user={user} stars={stars} />
    </div>
  );
}
