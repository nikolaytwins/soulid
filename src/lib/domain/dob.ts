export function formatDob(iso: string, locale = "ru"): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  if (locale === "ar") return `${d}/${m}/${y}`;
  return `${d}.${m}.${y}`;
}
