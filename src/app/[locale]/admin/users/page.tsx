import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { userHasPassword } from "@/lib/auth-ticket";

export const dynamic = "force-dynamic";

function formatWhen(d: Date, locale: string) {
  return d.toLocaleDateString(locale === "en" ? "en-GB" : locale === "ar" ? "ar" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function AdminUsers({
  searchParams
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const t = await getTranslations("admin");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const filter = sp.filter ?? "all";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        filter === "blocked" ? { blockedAt: { not: null } } : {},
        filter === "soft" ? { passwordHash: "" } : {},
        filter === "admins" ? { role: "admin" } : {}
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      _count: {
        select: {
          profiles: true,
          purchases: { where: { status: "paid" } }
        }
      }
    }
  });

  const filters = [
    ["all", t("filterAll")],
    ["blocked", t("filterBlocked")],
    ["soft", t("filterSoft")],
    ["admins", t("filterAdmins")]
  ] as const;

  return (
    <div>
      <h1 className="font-serif text-3xl">{t("users")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("usersLead")}</p>

      <form className="mt-5 flex flex-wrap gap-2">
        {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder={t("userSearch")}
          className="min-w-[240px] flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-sm"
        />
        <button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-card">{t("find")}</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <Link
            key={id}
            href={q ? `/admin/users?filter=${id}&q=${encodeURIComponent(q)}` : id === "all" ? "/admin/users" : `/admin/users?filter=${id}`}
            className={`rounded-full px-3 py-1.5 text-sm no-underline ${
              filter === id ? "bg-ink text-card" : "border border-line bg-card text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        {users.length === 0 ? <p className="px-5 py-8 text-sm text-muted">{t("emptyUsers")}</p> : null}
        {users.map((u) => {
          const blocked = Boolean(u.blockedAt);
          const soft = !userHasPassword(u.passwordHash);
          return (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className="flex flex-col gap-1 border-t border-line px-5 py-4 no-underline text-ink first:border-t-0 hover:bg-cream"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{u.email}</span>
                <span className="text-sm text-muted">
                  {t("starsCount", { n: u._count.profiles })} · {t("paidCount", { n: u._count.purchases })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {u.name ? <span className="text-muted">{u.name}</span> : null}
                {u.role === "admin" ? (
                  <span className="rounded-full bg-[#F1EBE4] px-2 py-0.5 font-semibold">{t("badgeAdmin")}</span>
                ) : null}
                {blocked ? (
                  <span className="rounded-full bg-[#F4D6D0] px-2 py-0.5 font-semibold text-[#8A2F22]">{t("badgeBlocked")}</span>
                ) : null}
                {soft ? (
                  <span className="rounded-full bg-[#F1EBE4] px-2 py-0.5 font-semibold text-muted">{t("badgeSoft")}</span>
                ) : null}
                <span className="text-faint">{formatWhen(u.createdAt, u.locale)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
