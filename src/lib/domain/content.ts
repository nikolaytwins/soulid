import { prisma } from "@/lib/db";
import type { SphereId } from "@/lib/engine";
import { buildDemoInterpretation } from "@/lib/domain/demo-content";

export type ContentBlock =
  | { type: "plain"; title: string; lead?: string; paragraphs: string[]; isDemo: boolean }
  | { type: "structured"; title: string; blocks: { mark: string; label: string; text: string }[]; isDemo: boolean };

export async function getInterpretation(params: {
  sphere: string;
  point: string;
  value: number;
  locale: string;
}): Promise<ContentBlock | null> {
  const row =
    (await prisma.interpretation.findUnique({
      where: {
        sphere_point_arcanaValue_locale: {
          sphere: params.sphere,
          point: params.point,
          arcanaValue: params.value,
          locale: params.locale
        }
      }
    })) ??
    (await prisma.interpretation.findUnique({
      where: {
        sphere_point_arcanaValue_locale: {
          sphere: params.sphere,
          point: params.point,
          arcanaValue: params.value,
          locale: "en"
        }
      }
    }));

  const source = row ?? {
    ...buildDemoInterpretation(params),
    isDemo: true
  };

  try {
    const parsed = JSON.parse(source.body) as {
      paragraphs?: string[];
      lead?: string;
      blocks?: { mark: string; label: string; text: string }[];
    };
    if (source.contentType === "structured" && parsed.blocks) {
      return { type: "structured", title: source.title, blocks: parsed.blocks, isDemo: source.isDemo };
    }
    return {
      type: "plain",
      title: source.title,
      lead: parsed.lead,
      paragraphs: parsed.paragraphs ?? [source.body],
      isDemo: source.isDemo
    };
  } catch {
    return { type: "plain", title: source.title, paragraphs: [source.body], isDemo: source.isDemo };
  }
}

export type EditableBlock = { mark: string; label: string; text: string };

export type EditableInterpretation = {
  lead: string;
  text: string;
  blocks: EditableBlock[];
};

const DEFAULT_STRUCTURED: EditableBlock[] = [
  { mark: "✦", label: "Талант", text: "" },
  { mark: "+", label: "Проявление в плюсе", text: "" },
  { mark: "−", label: "Проявление в минусе", text: "" },
  { mark: "→", label: "Рекомендации", text: "" }
];

export function parseEditableBody(contentType: string, body: string): EditableInterpretation {
  try {
    const parsed = JSON.parse(body) as {
      paragraphs?: string[];
      lead?: string;
      blocks?: EditableBlock[];
    };
    if (contentType === "structured") {
      const incoming = Array.isArray(parsed.blocks) ? parsed.blocks : [];
      const blocks = DEFAULT_STRUCTURED.map((fallback, i) => ({
        mark: incoming[i]?.mark || fallback.mark,
        label: incoming[i]?.label || fallback.label,
        text: incoming[i]?.text ?? ""
      }));
      return { lead: "", text: "", blocks };
    }
    const paragraphs = parsed.paragraphs?.length ? parsed.paragraphs : [typeof body === "string" ? body : ""];
    return { lead: parsed.lead ?? "", text: paragraphs.join("\n\n"), blocks: [] };
  } catch {
    return { lead: "", text: body, blocks: contentType === "structured" ? DEFAULT_STRUCTURED : [] };
  }
}

export function serializePlainBody(lead: string, text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return JSON.stringify({ lead: lead.trim(), paragraphs: paragraphs.length ? paragraphs : [""] });
}

export function serializeStructuredBody(blocks: EditableBlock[]): string {
  return JSON.stringify({
    blocks: blocks.map((b) => ({ mark: b.mark.trim() || "•", label: b.label.trim(), text: b.text }))
  });
}

export function pointKeyForBridge(sphere: SphereId, bridgeId: string, triangle: { leftBase: { id: string }; rightBase: { id: string } }): "leftBase" | "rightBase" {
  if (triangle.leftBase.id === bridgeId) return "leftBase";
  if (triangle.rightBase.id === bridgeId) return "rightBase";
  return "leftBase";
}
