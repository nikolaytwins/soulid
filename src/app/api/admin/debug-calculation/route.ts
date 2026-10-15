import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { calculateStar, parseStarFormula } from "@/lib/engine";
import { loadStarFormula } from "@/lib/domain/formula";
import { z } from "zod";
import { isValidCalendarDate } from "@/lib/engine/reduce";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  day: z.number().int(),
  formula: z.unknown().optional()
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isValidCalendarDate(parsed.data.year, parsed.data.month, parsed.data.day)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  const formula =
    parsed.data.formula !== undefined
      ? (parseStarFormula(parsed.data.formula) ?? (await loadStarFormula()))
      : await loadStarFormula();
  return NextResponse.json(
    calculateStar(
      { year: parsed.data.year, month: parsed.data.month, day: parsed.data.day },
      { debug: true, formula }
    )
  );
}
