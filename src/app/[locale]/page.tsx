import { getTranslations } from "next-intl/server";
import { DobForm } from "@/components/landing/DobForm";
import { MiniStar } from "@/components/star/TriangleSvg";

export default async function LandingPage() {
  const t = await getTranslations();
  return (
    <main className="relative mx-auto max-w-page px-5 pb-24 md:px-14">
      <div
        className="pointer-events-none absolute left-1/2 top-4 h-[520px] w-[720px] -translate-x-1/2"
        style={{ background: "radial-gradient(closest-side,rgba(242,205,150,.45),rgba(245,240,234,0))" }}
      />
      <div className="relative grid items-center gap-12 pt-6 md:grid-cols-[minmax(0,1fr)_420px] md:pt-10">
        <div className="flex max-w-xl flex-col gap-6">
          <span className="text-[11px] font-semibold tracking-[0.22em] text-faint">{t("landing.eyebrow")}</span>
          <h1 className="text-balance font-serif text-5xl font-medium leading-none md:text-[64px]">{t("landing.title")}</h1>
          <p className="text-pretty text-[16px] leading-relaxed text-muted md:text-[18px]">{t("landing.lead")}</p>
          <p className="text-sm text-faint">{t("landing.hint")}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <MiniStar zones={[4]} size={28} />
            <MiniStar zones={[0]} size={28} locked />
            <MiniStar zones={[1]} size={28} locked />
            <MiniStar zones={[2]} size={28} locked />
            <MiniStar zones={[3]} size={28} locked />
          </div>
        </div>
        <div className="relative rounded-3xl border border-line bg-card p-6 shadow-panel md:p-8">
          <div className="mb-4 text-[11px] font-bold tracking-[0.22em] text-gold-deep">{t("landing.dob")}</div>
          <DobForm />
        </div>
      </div>
    </main>
  );
}
