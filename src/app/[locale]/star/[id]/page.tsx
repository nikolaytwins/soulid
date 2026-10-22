import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadStarPage, loadSphereArcs } from "@/lib/domain/star-page";
import { loadPatternReadings } from "@/lib/domain/patterns";
import { SHOW_COMBINATIONS } from "@/lib/domain/features";
import { V3StarExperience } from "@/components/v3/StarExperience";
import { getInterpretation } from "@/lib/domain/content";
import { SPHERE_IDS, type SphereId } from "@/lib/engine";
import { getTranslations } from "next-intl/server";
import type { ArcReading } from "@/lib/domain/star-page";
import { listNavStars } from "@/lib/domain/nav-stars";

export const dynamic = "force-dynamic";

export default async function StarPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { locale, id } = await params;
  const { paid } = await searchParams;
  const session = await auth();
  const model = await loadStarPage(id, locale, session?.user?.id ?? null);
  if (!model) notFound();
  const t = await getTranslations("points");
  const terms = await getTranslations("terms");
  const arcana = terms("arcana");
  const labels = {
    ancestral: t("ancestral"),
    fatal: t("fatal"),
    apex: t("apex", { arcana }),
    inner: t("inner", { arcana })
  };
  const readings = {} as Record<SphereId, ArcReading[]>;
  for (const sphere of SPHERE_IDS) {
    readings[sphere] = model.unlocked.includes(sphere)
      ? await loadSphereArcs(model.star, sphere, locale, labels)
      : [];
  }
  const allOpen = model.unlocked.length >= 5;
  const missionContent = allOpen
    ? await getInterpretation({
        sphere: "soulMission",
        point: "apex",
        value: model.star.core.soulMission.value,
        locale
      })
    : null;
  const soulLabel = t("soul");
  const missionReading: ArcReading | null = allOpen
    ? {
        id: "mission",
        point: "apex",
        value: model.star.core.soulMission.value,
        role: soulLabel,
        roleUp: locale === "ar" ? soulLabel : soulLabel.toUpperCase(),
        content: missionContent
      }
    : null;
  const patterns = SHOW_COMBINATIONS ? await loadPatternReadings(model.star, locale, model.unlocked) : [];
  const stars = session?.user?.id ? await listNavStars(session.user.id, locale) : [];

  return (
    <V3StarExperience
      model={model}
      readings={readings}
      missionReading={missionReading}
      patterns={patterns}
      focusLatest={paid === "1"}
      stars={stars}
      user={
        session?.user
          ? {
              name: session.user.name,
              email: session.user.email,
              role: session.user.role
            }
          : null
      }
    />
  );
}
