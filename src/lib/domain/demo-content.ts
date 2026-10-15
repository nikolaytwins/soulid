import {
  SPHERE_IDS,
  SPHERE_POINT_IDS,
  sphereSlotKind,
  type PointKind,
  type SphereId,
  type SpherePointId
} from "@/lib/engine";
import { samplePlain, sampleStructured } from "@/lib/domain/sample-readings";

const KIND_LABEL: Record<PointKind, { ru: string; en: string; ar: string }> = {
  apex: { ru: "Основной аркан сферы", en: "Primary arcana of the sphere", ar: "أركان المجال الأساسي" },
  ancestral_program: { ru: "Родовая программа", en: "Ancestral program", ar: "برنامج الأسلاف" },
  fatal_error: { ru: "Роковая ошибка", en: "Fatal error", ar: "الخطأ القدري" },
  past_life: { ru: "Аркан сферы", en: "Sphere arcana", ar: "أركان المجال" },
  soul_mission: { ru: "Миссия души", en: "Soul mission", ar: "مهمة الروح" }
};

const SPHERE_NAME: Record<string, { ru: string; en: string; ar: string }> = {
  personality: { ru: "Личность", en: "Personality", ar: "الشخصية" },
  spirituality: { ru: "Духовность", en: "Spirituality", ar: "الروحانية" },
  money: { ru: "Реализация", en: "Realization", ar: "المال وتحقيق الذات" },
  relationships: { ru: "Отношения", en: "Relationships", ar: "العلاقات" },
  health: { ru: "Здоровье", en: "Health", ar: "الصحة" },
  soulMission: { ru: "Миссия души", en: "Soul mission", ar: "مهمة الروح" }
};

function loc(pack: { ru: string; en: string; ar: string }, locale: string): string {
  if (locale === "en") return pack.en;
  if (locale === "ar") return pack.ar;
  return pack.ru;
}

export function demoPointKind(sphere: string, point: string): PointKind {
  if (sphere === "soulMission") return "soul_mission";
  if ((SPHERE_IDS as readonly string[]).includes(sphere) && (SPHERE_POINT_IDS as readonly string[]).includes(point)) {
    return sphereSlotKind(sphere as SphereId, point as SpherePointId);
  }
  return "apex";
}

export function demoPointLabel(sphere: string, point: string, locale: string): string {
  return loc(KIND_LABEL[demoPointKind(sphere, point)], locale);
}

export function demoSphereName(sphere: string, locale: string): string {
  return loc(SPHERE_NAME[sphere] ?? SPHERE_NAME.personality, locale);
}

export function buildDemoInterpretation(params: {
  sphere: string;
  point: string;
  value: number;
  locale: string;
}): { title: string; body: string; contentType: "plain" | "structured" } {
  const locale = params.locale === "en" || params.locale === "ar" ? params.locale : "ru";
  const role = demoPointLabel(params.sphere, params.point, locale);
  const sphereName = demoSphereName(params.sphere, locale);
  const kind = demoPointKind(params.sphere, params.point);

  if (params.sphere === "money") {
    const content = sampleStructured({ role, value: params.value, locale });
    return { title: content.title, body: JSON.stringify({ blocks: content.blocks }), contentType: "structured" };
  }

  const content = samplePlain({
    sphere: params.sphere,
    role,
    sphereName,
    value: params.value,
    locale,
    kind
  });
  return {
    title: content.title,
    body: JSON.stringify({ lead: content.lead, paragraphs: content.paragraphs }),
    contentType: "plain"
  };
}
