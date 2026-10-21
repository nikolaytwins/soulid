import { getTranslations } from "next-intl/server";
import { DobForm } from "@/components/landing/DobForm";
import { CornerFrame } from "@/components/v3/CornerFrame";
import { V2MiniStar } from "@/components/v3/TriangleSvg";
import { ZONE_TO_SPHERE } from "@/lib/engine";
import { V3_CARD, V3_FONT_DISPLAY, V3_GOLD, V3_MUTED, V3_RED } from "@/lib/v3";

export default async function V3LandingPage() {
  const t = await getTranslations();
  return (
    <main className="relative mx-auto max-w-[1320px] overflow-x-clip px-[clamp(20px,3vw,48px)] pb-24">
      <div className="relative flex flex-col items-stretch gap-8 pt-2 lg:flex-row-reverse lg:gap-10 lg:pt-4">
        <CornerFrame
          className="relative hidden min-h-[440px] min-w-0 overflow-visible p-[clamp(28px,4vw,48px)] lg:flex lg:flex-[1.2_1_480px] lg:flex-col"
          style={{ background: V3_CARD }}
          arm={52}
        >
          <div className="relative flex flex-1 flex-col items-center justify-center gap-8">
            <div className="relative w-full max-w-[320px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/v3/spheres/hero.png" alt="" className="mx-auto block w-full max-w-[280px]" />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {ZONE_TO_SPHERE.map((id, i) => (
                <span
                  key={id}
                  className="flex h-12 w-12 items-center justify-center"
                  style={{ background: "rgba(185,147,83,.22)" }}
                >
                  <V2MiniStar zones={[i]} size={26} locked={i !== 4} />
                </span>
              ))}
            </div>
            <p className="max-w-sm text-center text-sm leading-relaxed" style={{ color: V3_MUTED }}>
              {t("landing.hint")}
            </p>
          </div>
        </CornerFrame>

        <div className="flex min-w-0 flex-col justify-center gap-6 py-2 lg:flex-[1_1_380px] lg:py-6">
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: V3_RED }}>
            {t("landing.eyebrow")}
          </span>
          <h1
            className="text-balance text-[clamp(34px,4.2vw,54px)] uppercase leading-[1.05] tracking-[0.02em]"
            style={{ fontFamily: V3_FONT_DISPLAY }}
          >
            {t("landing.title")}
          </h1>
          <p className="max-w-[440px] text-pretty text-[16px] leading-[1.7] md:text-[17px]" style={{ color: "#2E2A28" }}>
            {t("landing.lead")}
          </p>

          <CornerFrame className="flex flex-col gap-4 p-6 md:p-8" style={{ background: V3_CARD }} arm={48}>
            <div className="text-xs uppercase tracking-[0.14em]" style={{ color: V3_GOLD }}>
              {t("landing.dob")}
            </div>
            <DobForm />
          </CornerFrame>

          <div className="flex flex-wrap justify-center gap-2 lg:hidden">
            {ZONE_TO_SPHERE.map((id, i) => (
              <span
                key={id}
                className="flex h-11 w-11 items-center justify-center"
                style={{ background: "rgba(185,147,83,.22)" }}
              >
                <V2MiniStar zones={[i]} size={22} locked={i !== 4} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
