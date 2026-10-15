import { describe, expect, it } from "vitest";
import {
  canAutoOverwrite,
  packInterpretation,
  readGoogleChunks,
  syncQuery,
  unpackInterpretation
} from "./translate";

describe("auto-translate packing", () => {
  it("round-trips a plain reading", () => {
    const body = JSON.stringify({ lead: "Короткий лид", paragraphs: ["Первый абзац.", "Второй абзац."] });
    const packed = packInterpretation("9. Отшельник", "plain", body);
    expect(packed.values).toEqual(["9. Отшельник", "Короткий лид", "Первый абзац.", "Второй абзац."]);
    const out = unpackInterpretation(packed, ["9. The Hermit", "A short lead", "First paragraph.", "Second paragraph."]);
    expect(out.title).toBe("9. The Hermit");
    expect(JSON.parse(out.body)).toEqual({
      lead: "A short lead",
      paragraphs: ["First paragraph.", "Second paragraph."]
    });
  });

  it("keeps structured marks and translates labels and texts", () => {
    const body = JSON.stringify({
      blocks: [
        { mark: "✦", label: "Талант", text: "Сила в мягкости." },
        { mark: "+", label: "Плюс", text: "Терпение." },
        { mark: "−", label: "Минус", text: "Давление." },
        { mark: "→", label: "Рекомендации", text: "Не повышайте голос." }
      ]
    });
    const packed = packInterpretation("8. Сила", "structured", body);
    expect(packed.marks).toEqual(["✦", "+", "−", "→"]);
    const translated = packed.values.map((v) => (v === "8. Сила" ? "8. Strength" : `EN:${v}`));
    const out = unpackInterpretation(packed, translated);
    const parsed = JSON.parse(out.body) as { blocks: { mark: string; label: string; text: string }[] };
    expect(out.title).toBe("8. Strength");
    expect(parsed.blocks.map((b) => b.mark)).toEqual(["✦", "+", "−", "→"]);
    expect(parsed.blocks[0].label).toBe("EN:Талант");
    expect(parsed.blocks[0].text).toBe("EN:Сила в мягкости.");
  });

  it("overwrites demo and auto rows, never manual", () => {
    expect(canAutoOverwrite("demo")).toBe(true);
    expect(canAutoOverwrite("auto")).toBe(true);
    expect(canAutoOverwrite("manual")).toBe(false);
  });

  it("reads Google Translate chunks", () => {
    expect(readGoogleChunks(["Hello world"])).toBe("Hello world");
    expect(readGoogleChunks([[["Hello ", "Привет "], ["world", "мир"]], null, "ru"])).toBe("Hello world");
  });

  it("builds the save redirect query", () => {
    expect(syncQuery({ auto: ["en", "ar"], kept: [], fail: [] })).toBe("saved=1&auto=en,ar");
    expect(syncQuery({ auto: ["ar"], kept: ["en"], fail: [] })).toBe("saved=1&auto=ar&kept=en");
  });
});
