import { PrismaClient } from "@prisma/client";
import { SPHERE_IDS, sphereSlotKind, type SphereId, type SpherePointId } from "../src/lib/engine";

const prisma = new PrismaClient();
const FATAL: Record<string, string> = { ru: "Роковая ошибка", en: "Fatal error", ar: "الخطأ القدري" };
const ANC: Record<string, string> = { ru: "Родовая программа", en: "Ancestral program", ar: "برنامج الأسلاف" };

async function main() {
  const rows = await prisma.interpretation.findMany();
  const bad: unknown[] = [];
  for (const row of rows) {
    if (!(SPHERE_IDS as readonly string[]).includes(row.sphere)) continue;
    if (row.point !== "leftBase" && row.point !== "rightBase") continue;
    const kind = sphereSlotKind(row.sphere as SphereId, row.point as SpherePointId);
    const loc = row.locale === "en" || row.locale === "ar" ? row.locale : "ru";
    const want = kind === "fatal_error" ? FATAL[loc] : ANC[loc];
    const other = kind === "fatal_error" ? ANC[loc] : FATAL[loc];
    const blob = `${row.title}\n${row.body}`;
    if (!blob.includes(want) || blob.includes(other)) {
      bad.push({
        sphere: row.sphere,
        point: row.point,
        locale: row.locale,
        arcana: row.arcanaValue,
        kind,
        hasWant: blob.includes(want),
        hasOther: blob.includes(other),
        title: row.title
      });
    }
  }
  const kinds = Object.fromEntries(
    SPHERE_IDS.map((s) => [s, { left: sphereSlotKind(s, "leftBase"), right: sphereSlotKind(s, "rightBase") }])
  );
  console.log(JSON.stringify({ mismatches: bad.length, sample: bad.slice(0, 15), kinds }, null, 2));
}

main().finally(() => prisma.$disconnect());
