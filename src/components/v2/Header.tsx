"use client";

import { Link, usePathname } from "@/i18n/routing";
import { V2Logo } from "./Logo";
import { V2UserCluster } from "./UserCluster";
import type { NavStar } from "@/lib/domain/nav-stars";
import { v2Href } from "@/lib/v2";

export function V2Header({
  locale,
  user,
  stars = []
}: {
  locale: string;
  user: { name?: string | null; email?: string | null; role?: string } | null;
  stars?: NavStar[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/v2/star/")) return null;

  return (
    <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-[clamp(16px,3vw,40px)] py-5">
      <Link href={v2Href("/")} className="flex flex-1 items-center no-underline">
        <V2Logo />
      </Link>
      <V2UserCluster locale={locale} user={user} stars={stars} />
    </div>
  );
}
