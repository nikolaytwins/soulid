import { getTranslations } from "next-intl/server";
import { loadStarFormula } from "@/lib/domain/formula";
import { FormulaEditor } from "./formula-editor";

export const dynamic = "force-dynamic";

export default async function AdminFormulaPage() {
  const t = await getTranslations("admin");
  const formula = await loadStarFormula();
  return (
    <div>
      <h1 className="font-[Forum,serif] text-3xl font-normal tracking-[0.02em]">{t("formula")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("formulaLead")}</p>
      <p className="mt-1 max-w-2xl text-sm text-faint">{t("formulaExisting")}</p>
      <div className="mt-8">
        <FormulaEditor initial={formula} />
      </div>
    </div>
  );
}
