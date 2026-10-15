import { PrismaClient } from "@prisma/client";
import { buildDemoInterpretation } from "../src/lib/domain/demo-content";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.interpretation.findMany({ where: { isDemo: true } });
  let updated = 0;
  for (const row of rows) {
    const next = buildDemoInterpretation({
      sphere: row.sphere,
      point: row.point,
      value: row.arcanaValue,
      locale: row.locale
    });
    if (next.body === row.body && next.title === row.title && next.contentType === row.contentType) continue;
    await prisma.interpretation.update({
      where: { id: row.id },
      data: { title: next.title, body: next.body, contentType: next.contentType, origin: "demo", isDemo: true }
    });
    updated += 1;
  }
  console.log(`Refreshed ${updated} of ${rows.length} demo interpretations.`);
}

main()
  .finally(() => prisma.$disconnect());
