import { describe, expect, it } from "vitest";
import { SPHERE_IDS, SPHERE_POINT_IDS } from "@/lib/engine";
import { buildDemoInterpretation, demoPointKind, demoPointLabel } from "./demo-content";

const ROLE = {
  ancestral_program: { ru: "Родовая программа", en: "Ancestral program", ar: "برنامج الأسلاف" },
  fatal_error: { ru: "Роковая ошибка", en: "Fatal error", ar: "الخطأ القدري" },
  apex: { ru: "Основной аркан сферы", en: "Primary arcana of the sphere", ar: "أركان المجال الأساسي" },
  past_life: { ru: "Аркан сферы", en: "Sphere arcana", ar: "أركان المجال" },
  soul_mission: { ru: "Миссия души", en: "Soul mission", ar: "مهمة الروح" }
} as const;

describe("demo placeholders follow the actual point type", () => {
  it("names every slot in all five spheres by its kind", () => {
    for (const sphere of SPHERE_IDS) {
      for (const point of SPHERE_POINT_IDS) {
        const kind = demoPointKind(sphere, point);
        for (const locale of ["ru", "en", "ar"] as const) {
          const label = demoPointLabel(sphere, point, locale);
          const expected = ROLE[kind][locale];
          expect(label, `${sphere}.${point} ${locale}`).toBe(expected);
          const demo = buildDemoInterpretation({ sphere, point, value: 9, locale });
          expect(demo.body).toContain(`«${label}»`);
          expect(demo.title).toMatch(/Отшельник|The Hermit|الناسك/);
          if (kind === "fatal_error") expect(demo.body).not.toContain(ROLE.ancestral_program[locale]);
          if (kind === "ancestral_program") expect(demo.body).not.toContain(ROLE.fatal_error[locale]);
        }
      }
    }
  });

  it("writes a different reading for the same arcana in different spheres", () => {
    const a = buildDemoInterpretation({ sphere: "personality", point: "apex", value: 1, locale: "ru" });
    const b = buildDemoInterpretation({ sphere: "spirituality", point: "apex", value: 1, locale: "ru" });
    expect(a.title).toContain("Маг");
    expect(JSON.parse(a.body).paragraphs[0]).not.toBe(JSON.parse(b.body).paragraphs[0]);
    const money = buildDemoInterpretation({ sphere: "money", point: "apex", value: 1, locale: "ru" });
    expect(money.contentType).toBe("structured");
    expect(JSON.parse(money.body).blocks).toHaveLength(4);
  });

  it("marks left base ancestral and right base fatal in every sphere; bottom inner stays ordinary", () => {
    for (const sphere of SPHERE_IDS) {
      expect(demoPointKind(sphere, "leftBase")).toBe("ancestral_program");
      expect(demoPointKind(sphere, "rightBase")).toBe("fatal_error");
      expect(demoPointKind(sphere, "innerBottom")).toBe("past_life");
    }

    for (const locale of ["ru", "en", "ar"] as const) {
      for (const sphere of SPHERE_IDS) {
        expect(demoPointLabel(sphere, "leftBase", locale)).toBe(ROLE.ancestral_program[locale]);
        expect(demoPointLabel(sphere, "rightBase", locale)).toBe(ROLE.fatal_error[locale]);
        expect(demoPointLabel(sphere, "innerBottom", locale)).toBe(ROLE.past_life[locale]);

        const left = buildDemoInterpretation({ sphere, point: "leftBase", value: 9, locale });
        expect(left.body).toContain(ROLE.ancestral_program[locale]);
        expect(left.body).not.toContain(ROLE.fatal_error[locale]);

        const right = buildDemoInterpretation({ sphere, point: "rightBase", value: 9, locale });
        expect(right.body).toContain(ROLE.fatal_error[locale]);
        expect(right.body).not.toContain(ROLE.ancestral_program[locale]);
      }
    }
  });
});
