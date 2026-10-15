import { PrismaClient } from "@prisma/client";
import { SPHERE_IDS, sphereSlotKind, type SphereId, type StarResult } from "../src/lib/engine";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.birthProfile.findMany({ select: { id: true, dateOfBirth: true, calculationJson: true } });
  const mismatches: unknown[] = [];
  for (const p of profiles) {
    let star: StarResult;
    try {
      star = JSON.parse(p.calculationJson) as StarResult;
    } catch {
      continue;
    }
    for (const id of SPHERE_IDS) {
      const t = star.spheres?.[id];
      if (!t) continue;
      const leftWant = sphereSlotKind(id as SphereId, "leftBase");
      const rightWant = sphereSlotKind(id as SphereId, "rightBase");
      if (t.leftBase?.kind !== leftWant) {
        mismatches.push({ id: p.id, dob: p.dateOfBirth, sphere: id, slot: "leftBase", stored: t.leftBase?.kind, want: leftWant });
      }
      if (t.rightBase?.kind !== rightWant) {
        mismatches.push({ id: p.id, dob: p.dateOfBirth, sphere: id, slot: "rightBase", stored: t.rightBase?.kind, want: rightWant });
      }
    }
  }
  console.log(JSON.stringify({ profiles: profiles.length, mismatches }, null, 2));
}

main().finally(() => prisma.$disconnect());
