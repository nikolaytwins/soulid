import { prisma } from "@/lib/db";
import { formatDob } from "@/lib/domain/dob";

export type NavStar = {
  id: string;
  label: string;
  date: string;
};

export async function listNavStars(userId: string, locale: string): Promise<NavStar[]> {
  const rows = await prisma.birthProfile.findMany({
    where: { userId },
    select: { id: true, dateOfBirth: true, displayName: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return rows.map((r) => {
    const date = formatDob(r.dateOfBirth, locale);
    const name = (r.displayName ?? "").trim();
    return { id: r.id, label: name || date, date };
  });
}
