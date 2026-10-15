const LOCALES = new Set(["ru", "en", "ar"]);

export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("://") || raw.includes("\\")) return fallback;
  const decoded = raw.toLowerCase();
  if (decoded.includes("%5c") || decoded.includes("%2f%2f") || decoded.includes("%00")) return fallback;
  if (raw.includes("\n") || raw.includes("\r") || raw.includes("\t")) return fallback;
  return raw;
}

export function safeSameOriginUrl(raw: string, origin: string): string {
  try {
    const base = new URL(origin);
    const url = new URL(raw, base);
    if (url.origin !== base.origin) return `${base.origin}/`;
    return url.toString();
  } catch {
    return origin;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function localeFromPath(path: string, fallback = "ru"): string {
  const first = path.split("/").filter(Boolean)[0];
  return first && LOCALES.has(first) ? first : fallback;
}
