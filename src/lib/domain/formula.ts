import { prisma } from "@/lib/db";
import { BOOK_FORMULA, parseStarFormula, type StarFormula } from "@/lib/engine/formula";

export const STAR_FORMULA_KEY = "star_formula";

export async function loadStarFormula(): Promise<StarFormula> {
  const row = await prisma.siteSetting.findUnique({ where: { key: STAR_FORMULA_KEY } });
  if (!row?.value) return BOOK_FORMULA;
  try {
    return parseStarFormula(JSON.parse(row.value)) ?? BOOK_FORMULA;
  } catch {
    return BOOK_FORMULA;
  }
}

export async function saveStarFormula(formula: StarFormula): Promise<void> {
  const value = JSON.stringify(formula);
  await prisma.siteSetting.upsert({
    where: { key: STAR_FORMULA_KEY },
    update: { value },
    create: { key: STAR_FORMULA_KEY, value }
  });
}
