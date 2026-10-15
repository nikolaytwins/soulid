import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SPHERE_IDS } from "@/lib/engine";
import { formatDob } from "@/lib/domain/star-page";
import { LtrText } from "@/components/ui/LtrText";
import { formatMoney, productName } from "@/lib/domain/catalog";
import { userHasPassword } from "@/lib/auth-ticket";
import { adminGrantSphereAction } from "../../actions";
import {
  sendUserPasswordLinkAction,
  setUserBlockedAction,
  updateUserEmailAction,
  updateUserNameAction,
  updateUserNoteAction
} from "../actions";
import { ConfirmForm } from "../../confirm-form";

export const dynamic = "force-dynamic";

function formatWhen(d: Date, locale: string) {
  return d.toLocaleString(locale === "en" ? "en-GB" : locale === "ar" ? "ar" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const NOTICES: Record<string, "ok" | "err"> = {
  ok_email: "ok",
  ok_name: "ok",
  ok_note: "ok",
  ok_block: "ok",
  ok_unblock: "ok",
  ok_password: "ok",
  err_email: "err",
  err_taken: "err",
  err_self: "err",
  err_last_admin: "err"
};

export default async function AdminUserCard({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale, id } = await params;
  const { notice } = await searchParams;
  const t = await getTranslations("admin");
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        include: { entitlements: true }
      },
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { product: { include: { translations: true } } }
      },
      emails: { orderBy: { createdAt: "desc" }, take: 8 }
    }
  });
  if (!user) notFound();

  const products = await prisma.product.findMany({ where: { kind: "sphere" }, include: { translations: true } });
  const sphereName = (sid: string) =>
    productName(products.find((p) => p.sphere === sid) ?? { translations: [] }, locale)?.name ?? sid;

  const blocked = Boolean(user.blockedAt);
  const soft = !userHasPassword(user.passwordHash);
  const field = "mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm";
  const saveBtn = "rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-card";
  const noticeKind = notice ? NOTICES[notice] : undefined;

  const sphereActions = SPHERE_IDS.map((sid) => ({ action: sid, label: t("unlockSphere", { name: sphereName(sid) }) }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/users" className="text-sm font-semibold no-underline text-gold-deep">
          ← {t("backUsers")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-3xl">{user.name || user.email}</h1>
          {user.role === "admin" ? (
            <span className="rounded-full bg-[#F1EBE4] px-2.5 py-1 text-xs font-semibold">{t("badgeAdmin")}</span>
          ) : null}
          {blocked ? (
            <span className="rounded-full bg-[#F4D6D0] px-2.5 py-1 text-xs font-semibold text-[#8A2F22]">{t("badgeBlocked")}</span>
          ) : null}
          {soft ? (
            <span className="rounded-full bg-[#F1EBE4] px-2.5 py-1 text-xs font-semibold text-muted">{t("badgeSoft")}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          {user.email} · {t("created")} {formatWhen(user.createdAt, locale)}
        </p>
      </div>

      {noticeKind ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            noticeKind === "ok" ? "bg-open-bg text-open-text" : "bg-[#F4D6D0] text-[#8A2F22]"
          }`}
        >
          {t(`notice_${notice}` as "notice_ok_email")}
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">{t("person")}</h2>
        <p className="mt-1 text-sm text-muted">{t("personLead")}</p>

        <form action={updateUserEmailAction} className="mt-5 grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="text-xs font-semibold tracking-wide text-faint">
            {t("changeEmail")}
            <input name="email" type="email" required defaultValue={user.email} className={field} />
          </label>
          <button className={saveBtn}>{t("save")}</button>
        </form>

        <form action={updateUserNameAction} className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="text-xs font-semibold tracking-wide text-faint">
            {t("name")}
            <input name="name" defaultValue={user.name ?? ""} className={field} />
          </label>
          <button className={saveBtn}>{t("save")}</button>
        </form>

        <form action={updateUserNoteAction} className="mt-4 grid gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="text-xs font-semibold tracking-wide text-faint">
            {t("note")}
            <textarea name="adminNote" defaultValue={user.adminNote} rows={3} className={field} placeholder={t("noteHint")} />
          </label>
          <button className={`${saveBtn} w-fit`}>{t("save")}</button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          <form action={sendUserPasswordLinkAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="locale" value={locale} />
            <button className="rounded-xl border border-line bg-cream px-4 py-2.5 text-sm font-semibold">
              {t("sendPassword")}
            </button>
          </form>
          <ConfirmForm
            action={setUserBlockedAction}
            message={blocked ? t("confirmUnblock") : t("confirmBlock")}
          >
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="block" value={blocked ? "0" : "1"} />
            <button
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                blocked ? "bg-ink text-card" : "border border-[#C98478] text-[#8A2F22]"
              }`}
            >
              {blocked ? t("unblock") : t("block")}
            </button>
          </ConfirmForm>
        </div>
        <p className="mt-3 text-xs text-faint">{t("blockHint")}</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("starsSection")}</h2>
        <p className="mt-1 text-sm text-muted">{t("starsLead")}</p>
        {user.profiles.length === 0 ? <p className="mt-4 text-sm text-muted">{t("noStars")}</p> : null}
        <div className="mt-4 flex flex-col gap-4">
          {user.profiles.map((profile) => {
            const open = new Set(profile.entitlements.map((e) => e.sphere));
            return (
              <article key={profile.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      <LtrText>{formatDob(profile.dateOfBirth, locale)}</LtrText>
                    </div>
                    <div className="text-xs text-faint">
                      {t("openCount", { n: open.size, total: SPHERE_IDS.length })}
                    </div>
                  </div>
                  <Link href={`/star/${profile.id}`} className="text-sm font-semibold text-gold-deep">
                    {t("openStar")} →
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SPHERE_IDS.map((sid) => (
                    <span
                      key={sid}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        open.has(sid) ? "bg-open-bg text-open-text" : "bg-[#F1EBE4] text-muted"
                      }`}
                    >
                      {open.has(sid) ? "✓ " : ""}
                      {sphereName(sid)}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sphereActions.map((a) => (
                    <form key={a.action} action={adminGrantSphereAction}>
                      <input type="hidden" name="profileId" value={profile.id} />
                      <input type="hidden" name="action" value={a.action} />
                      <button className="rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-card">{a.label}</button>
                    </form>
                  ))}
                  <form action={adminGrantSphereAction}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="action" value="all" />
                    <button className="rounded-xl bg-gold px-3 py-2 text-xs font-semibold text-ink">{t("unlockAll")}</button>
                  </form>
                  <form action={adminGrantSphereAction}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="action" value="reset" />
                    <button className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold">
                      {t("resetSpheres")}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("paymentsSection")}</h2>
        {user.purchases.length === 0 ? <p className="mt-3 text-sm text-muted">{t("noPayments")}</p> : null}
        {user.purchases.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="text-faint">
                <tr>
                  <th className="px-4 py-3">{t("colDate")}</th>
                  <th className="px-4 py-3">{t("colItem")}</th>
                  <th className="px-4 py-3">{t("colAmount")}</th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {user.purchases.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-3">{formatWhen(p.createdAt, locale)}</td>
                    <td className="px-4 py-3">{p.product.sku}</td>
                    <td className="px-4 py-3">{formatMoney(p.amount, p.currency, locale)}</td>
                    <td className="px-4 py-3">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("emailsSection")}</h2>
        {user.emails.length === 0 ? <p className="mt-3 text-sm text-muted">{t("noEmails")}</p> : null}
        <ul className="mt-3 flex flex-col gap-2">
          {user.emails.map((mail) => (
            <li key={mail.id} className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
              <div className="font-semibold">{mail.subject}</div>
              <div className="text-xs text-faint">
                {mail.template} · {mail.status} · {formatWhen(mail.createdAt, locale)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
