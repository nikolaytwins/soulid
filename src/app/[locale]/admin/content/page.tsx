import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SPHERE_IDS, SPHERE_POINT_IDS } from "@/lib/engine";
import { productName } from "@/lib/domain/catalog";
import { parseEditableBody } from "@/lib/domain/content";
import { demoPointLabel } from "@/lib/domain/demo-content";
import { saveInterpretationAction } from "../actions";
import { ClearReadingButton } from "./clear-reading";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONTENT_SPHERES = [...SPHERE_IDS, "soulMission"] as const;
const POINT_KEYS = {
  apex: "contentPointApex",
  leftBase: "contentPointLeft",
  rightBase: "contentPointRight",
  innerLeft: "contentPointInnerL",
  innerRight: "contentPointInnerR",
  innerBottom: "contentPointInnerB"
} as const;

export default async function AdminContent({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sphere?: string; point?: string; locale?: string; saved?: string; auto?: string; kept?: string; fail?: string }>;
}) {
  const { locale: uiLocale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin");
  const terms = await getTranslations("terms");
  const arcana = terms("arcana");
  const products = await prisma.product.findMany({ where: { kind: "sphere" }, include: { translations: true } });
  const sphereName = (id: string) =>
    id === "soulMission"
      ? t("soulMissionName")
      : (productName(products.find((p) => p.sphere === id) ?? { translations: [] }, uiLocale)?.name ?? id);

  const sphere = CONTENT_SPHERES.includes(sp.sphere as (typeof CONTENT_SPHERES)[number])
    ? (sp.sphere as (typeof CONTENT_SPHERES)[number])
    : "personality";
  const points = sphere === "soulMission" ? (["apex"] as const) : SPHERE_POINT_IDS;
  const point = (points as readonly string[]).includes(sp.point ?? "") ? (sp.point as (typeof points)[number]) : "apex";
  const contentLocale = sp.locale === "en" || sp.locale === "ar" ? sp.locale : "ru";

  const rows = await prisma.interpretation.findMany({
    where: { sphere, point, locale: contentLocale },
    orderBy: { arcanaValue: "asc" }
  });

  const href = (next: { sphere?: string; point?: string; locale?: string }) => {
    const qs = new URLSearchParams({
      sphere: next.sphere ?? sphere,
      point: next.point ?? point,
      locale: next.locale ?? contentLocale
    });
    return `/admin/content?${qs.toString()}`;
  };

  const field =
    "mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.72)] px-3 py-2.5 text-sm text-[#1A1A1A]";
  const saveBtn = "v3-btn-red rounded-none px-4 py-2.5 text-sm font-semibold";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[Forum,serif] text-3xl font-normal tracking-[0.02em]">{t("content")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("contentLead", { arcana })}</p>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("contentAutoNote")}</p>
      </div>

      {sp.saved ? (
        <p className="rounded-none bg-[#E3EBDD] px-4 py-3 text-sm text-open-text">
          {t("contentSaved")}
          {sp.auto ? ` ${t("contentSavedAuto", { locales: sp.auto.toUpperCase() })}` : ""}
          {sp.kept ? ` ${t("contentSavedKept", { locales: sp.kept.toUpperCase() })}` : ""}
          {sp.fail ? ` ${t("contentSavedFail", { locales: sp.fail.toUpperCase() })}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {CONTENT_SPHERES.map((id) => (
          <Link
            key={id}
            href={href({
              sphere: id,
              point: id === "soulMission" ? "apex" : (SPHERE_POINT_IDS as readonly string[]).includes(point) ? point : "apex"
            })}
            className={`rounded-none px-3.5 py-1.5 text-sm no-underline ${
              sphere === id ? "admin-pill-on" : "admin-pill-off"
            }`}
          >
            {sphereName(id)}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {points.map((id) => (
          <Link
            key={id}
            href={href({ point: id })}
            className={`rounded-none px-3.5 py-1.5 text-sm no-underline ${
              point === id ? "admin-pill-on" : "admin-pill-off"
            }`}
          >
            {id === "leftBase" || id === "rightBase"
              ? demoPointLabel(sphere, id, uiLocale)
              : t(POINT_KEYS[id as keyof typeof POINT_KEYS], { arcana })}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["ru", "en", "ar"] as const).map((l) => (
          <Link
            key={l}
            href={href({ locale: l })}
            className={`rounded-none px-3 py-1 text-xs font-semibold no-underline ${
              contentLocale === l ? "admin-pill-on" : "admin-pill-off"
            }`}
          >
            {l.toUpperCase()}
          </Link>
        ))}
        <span className="text-sm text-muted">
          {sphereName(sphere)} ·{" "}
          {point === "leftBase" || point === "rightBase"
            ? demoPointLabel(sphere, point, uiLocale)
            : t(POINT_KEYS[point as keyof typeof POINT_KEYS], { arcana })}{" "}
          · {t("contentArcanaCount", { n: rows.length })}
        </span>
      </div>

      {rows.length > 0 ? (
        <nav className="flex flex-wrap gap-1">
          {rows.map((r) => (
            <a
              key={r.id}
              href={`#arc-${r.arcanaValue}`}
              className="flex h-8 w-8 items-center justify-center rounded-none border border-[rgba(26,26,26,.15)] bg-card text-xs font-semibold no-underline text-ink"
            >
              {r.arcanaValue}
            </a>
          ))}
        </nav>
      ) : (
        <p className="text-sm text-muted">{t("contentEmpty")}</p>
      )}

      <div className="flex flex-col gap-4">
        {rows.map((r) => {
          const edit = parseEditableBody(r.contentType, r.body);
          const structured = r.contentType === "structured";
          return (
            <form
              key={r.id}
              id={`arc-${r.arcanaValue}`}
              action={saveInterpretationAction}
              className="scroll-mt-24 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-5"
            >
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="contentType" value={r.contentType} />
              <input type="hidden" name="uiLocale" value={uiLocale} />
              <input type="hidden" name="returnSphere" value={sphere} />
              <input type="hidden" name="returnPoint" value={point} />
              <input type="hidden" name="returnLocale" value={contentLocale} />
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-none bg-[#B99353] text-sm font-bold text-white">
                  {r.arcanaValue}
                </span>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.16em] text-[#B99353]">{t("contentArcana", { n: r.arcanaValue, arcana })}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span>{sphereName(sphere)}</span>
                    <span
                      className={`rounded-none px-2 py-0.5 text-[11px] font-semibold ${
                        r.origin === "manual"
                          ? "bg-open-bg text-open-text"
                          : r.origin === "auto"
                            ? "bg-sand text-gold-text"
                            : "bg-[#F1EBE4] text-faint"
                      }`}
                    >
                      {r.origin === "manual" ? t("contentOriginManual") : r.origin === "auto" ? t("contentOriginAuto") : t("contentOriginDemo")}
                    </span>
                  </div>
                </div>
              </div>
              <label className="text-xs font-semibold tracking-wide text-faint">
                {t("contentTitle")}
                <input name="title" defaultValue={r.title} className={field} />
              </label>
              {structured ? (
                <div className="mt-4 grid gap-3">
                  {edit.blocks.map((b, i) => (
                    <div key={i} className="rounded-none border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.72)] p-3">
                      <input type="hidden" name={`blockMark${i}`} value={b.mark} />
                      <label className="text-xs font-semibold tracking-wide text-faint">
                        {t("contentBlockLabel")}
                        <input name={`blockLabel${i}`} defaultValue={b.label} className={field} />
                      </label>
                      <label className="mt-2 block text-xs font-semibold tracking-wide text-faint">
                        {t("contentBlockText")}
                        <textarea name={`blockText${i}`} defaultValue={b.text} rows={3} className={field} />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <label className="mt-3 block text-xs font-semibold tracking-wide text-faint">
                  {t("contentText")}
                  <textarea name="text" defaultValue={edit.text} rows={12} className={field} />
                </label>
              )}
              <div className="mt-4 flex items-center gap-4">
                <button className={saveBtn}>{t("save")}</button>
                <ClearReadingButton label={t("contentClear")} />
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
