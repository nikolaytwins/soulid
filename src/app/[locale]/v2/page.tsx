import { getTranslations } from "next-intl/server";
import { DobForm } from "@/components/landing/DobForm";
import { V2MiniStar } from "@/components/v2/TriangleSvg";
import { ZONE_TO_SPHERE } from "@/lib/engine";

export default async function V2LandingPage() {
  const t = await getTranslations();
  return (
    <main className="relative mx-auto max-w-[1360px] overflow-x-clip px-[clamp(16px,3vw,40px)] pb-24">
      <div className="relative flex flex-row-reverse flex-wrap items-stretch gap-4 pt-2">
        <div className="relative min-h-[420px] min-w-0 flex-[1.2_1_480px] overflow-hidden rounded-[36px] bg-white p-[clamp(24px,4vw,48px)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(43,26,51,.11) 1.2px, transparent 1.7px)",
              backgroundSize: "20px 20px",
              WebkitMaskImage: "radial-gradient(circle at 50% 45%, #000 25%, transparent 78%)",
              maskImage: "radial-gradient(circle at 50% 45%, #000 25%, transparent 78%)"
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side,rgba(242,205,150,.55),rgba(255,255,255,0))" }}
          />
          <div className="relative flex h-full flex-col items-center justify-center gap-8">
            <div className="flex flex-wrap justify-center gap-2">
              {ZONE_TO_SPHERE.map((id, i) => (
                <span key={id} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8EACB]">
                  <V2MiniStar zones={[i]} size={28} locked={i !== 4} />
                </span>
              ))}
            </div>
            <p className="max-w-sm text-center text-sm leading-relaxed text-[#6E6878]">{t("landing.hint")}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-6 py-4">
          <span className="text-xs font-bold tracking-[0.16em] text-[#8A8494]">{t("landing.eyebrow")}</span>
          <h1 className="text-balance font-display text-[clamp(32px,4vw,52px)] font-medium leading-[1.08]">{t("landing.title")}</h1>
          <p className="text-pretty text-[16px] leading-relaxed text-[#5B5566] md:text-[18px]">{t("landing.lead")}</p>
          <div className="rounded-[36px] bg-white p-6 md:p-8">
            <div className="mb-4 text-xs font-bold tracking-[0.16em] text-[#B07A33]">{t("landing.dob")}</div>
            <DobForm />
          </div>
        </div>
      </div>
    </main>
  );
}
