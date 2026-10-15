import { prisma } from "@/lib/db";
import {
  canonicalMatchKey,
  matchPatternRules,
  patternIsVisible,
  type PatternKind,
  type PatternScope
} from "@/lib/engine/patterns";
import type { SphereId, StarResult } from "@/lib/engine";
import type { ContentBlock } from "@/lib/domain/content";

export type PatternReading = {
  id: string;
  kind: PatternKind;
  matchKey: string;
  title: string;
  values: number[];
  count: number;
  locked: boolean;
  content: ContentBlock | null;
};

function parseBody(title: string, body: string, contentType: string, isDemo: boolean): ContentBlock {
  try {
    const parsed = JSON.parse(body) as { paragraphs?: string[]; blocks?: { mark: string; label: string; text: string }[] };
    if (contentType === "structured" && parsed.blocks) {
      return { type: "structured", title, blocks: parsed.blocks, isDemo };
    }
    return { type: "plain", title, paragraphs: parsed.paragraphs ?? [body], isDemo };
  } catch {
    return { type: "plain", title, paragraphs: [body], isDemo };
  }
}

export function buildMatchKey(kind: PatternKind, values: number[], sphere?: string | null): string {
  return canonicalMatchKey(kind, values, sphere);
}

export async function loadPatternReadings(
  star: StarResult,
  locale: string,
  unlocked: SphereId[]
): Promise<PatternReading[]> {
  const rows = await prisma.patternRule.findMany({
    where: { isActive: true, locale: { in: [locale, "en", "ru"] } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  if (rows.length === 0) return [];

  const preferred = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.kind}:${row.matchKey}`;
    const current = preferred.get(key);
    const rank = (loc: string) => (loc === locale ? 0 : loc === "en" ? 1 : 2);
    if (!current || rank(row.locale) < rank(current.locale)) preferred.set(key, row);
  }

  const selected = [...preferred.values()];
  const rules = selected.map((row) => ({
    id: row.id,
    kind: row.kind as PatternKind,
    values: JSON.parse(row.valuesJson) as number[],
    minCount: row.minCount,
    scope: row.scope as PatternScope,
    sphere: row.sphere
  }));

  const unlockedSet = new Set(unlocked);
  const byId = new Map(selected.map((row) => [row.id, row]));

  return matchPatternRules(star, rules).map((match) => {
    const row = byId.get(match.ruleId)!;
    const visible = patternIsVisible(match, unlockedSet);
    return {
      id: row.id,
      kind: match.kind,
      matchKey: row.matchKey,
      title: row.title,
      values: match.values,
      count: match.count,
      locked: !visible,
      content: visible ? parseBody(row.title, row.body, row.contentType, row.isDemo) : null
    };
  });
}
