import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SPHERE_IDS, SPHERE_POINT_IDS } from "@/lib/engine";
import { productName } from "@/lib/domain/catalog";
import { parseEditableBody } from "@/lib/domain/content";
import { demoPointLabel } from "@/lib/domain/demo-content";
import { InterpretationForm } from "./interpretation-form";

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
  searchParams: Promise<{ sphere?: string; point?: string; locale?: string }>;
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

  const pointLabel =
    point === "leftBase" || point === "rightBase"
      ? demoPointLabel(sphere, point, uiLocale)
      : t(POINT_KEYS[point as keyof typeof POINT_KEYS], { arcana });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[Forum,serif] text-3xl font-normal tracking-[0.02em]">{t("content")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("contentLead", { arcana })}</p>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("contentAutoNote")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_SPHERES.map((id) => (
          <Link
            key={id}
            href={href({
              sphere: id,
              point: id === "soulMission" ? "apex" : (SPHERE_POINT_IDS as readonly string[]).includes(point) ? point : "apex"
            })}
            className={`rounded-none px-3.5 py-1.5 text-sm no-underline ${sphere === id ? "admin-pill-on" : "admin-pill-off"}`}
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
            className={`rounded-none px-3.5 py-1.5 text-sm no-underline ${point === id ? "admin-pill-on" : "admin-pill-off"}`}
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
          {sphereName(sphere)} · {pointLabel} · {t("contentArcanaCount", { n: rows.length })}
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
        {rows.map((r) => (
          <InterpretationForm
            key={r.id}
            id={r.id}
            arcanaValue={r.arcanaValue}
            contentType={r.contentType}
            initialOrigin={r.origin}
            title={r.title}
            edit={parseEditableBody(r.contentType, r.body)}
            sphereName={sphereName(sphere)}
            arcanaWord={arcana}
            pointLabel={pointLabel}
          />
        ))}
      </div>
    </div>
  );
}
