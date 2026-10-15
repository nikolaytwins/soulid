import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const t = await getTranslations("admin");
  const [users, purchases, profiles, paid, recent] = await Promise.all([
    prisma.user.count(),
    prisma.purchase.count(),
    prisma.birthProfile.count(),
    prisma.purchase.count({ where: { status: "paid" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { profiles: true } } }
    })
  ]);
  const cards = [
    [t("users"), users, "/admin/users"],
    [t("profiles"), profiles, "/admin/users"],
    [t("purchases"), purchases, "/admin/purchases"],
    [t("paid"), paid, "/admin/purchases"]
  ] as const;
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium">{t("title")}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{t("lead")}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([l, v, href]) => (
          <Link key={href + String(l)} href={href} className="rounded-2xl border border-line bg-card p-5 no-underline text-ink">
            <div className="text-sm text-faint">{l}</div>
            <div className="font-sans text-4xl font-semibold">{v}</div>
          </Link>
        ))}
      </div>
      <h2 className="mt-10 font-serif text-2xl">{t("recentPeople")}</h2>
      <div className="mt-3 flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        {recent.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 no-underline text-ink first:border-t-0 hover:bg-cream"
          >
            <span className="font-semibold">{u.email}</span>
            <span className="text-sm text-muted">{t("starsCount", { n: u._count.profiles })}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
