export const CONTENT_LOCALES = ["ru", "en", "ar"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export function isContentLocale(value: string): value is ContentLocale {
  return value === "ru" || value === "en" || value === "ar";
}

export function canAutoOverwrite(origin: string): boolean {
  return origin !== "manual";
}

export function syncQuery(result: { auto: string[]; kept: string[]; fail: string[] }): string {
  const parts = ["saved=1"];
  if (result.auto.length) parts.push(`auto=${result.auto.join(",")}`);
  if (result.kept.length) parts.push(`kept=${result.kept.join(",")}`);
  if (result.fail.length) parts.push(`fail=${result.fail.join(",")}`);
  return parts.join("&");
}

export type PackedInterpretation = {
  keys: string[];
  values: string[];
  contentType: string;
  marks: string[];
};

export function packInterpretation(title: string, contentType: string, body: string): PackedInterpretation {
  const keys = ["title"];
  const values = [title];
  const marks: string[] = [];
  try {
    const parsed = JSON.parse(body) as {
      lead?: string;
      paragraphs?: string[];
      blocks?: { mark?: string; label?: string; text?: string }[];
    };
    if (contentType === "structured") {
      (parsed.blocks ?? []).forEach((block, i) => {
        marks.push(block.mark ?? "•");
        keys.push(`label${i}`, `text${i}`);
        values.push(block.label ?? "", block.text ?? "");
      });
      return { keys, values, contentType: "structured", marks };
    }
    keys.push("lead");
    values.push(parsed.lead ?? "");
    (parsed.paragraphs?.length ? parsed.paragraphs : [""]).forEach((paragraph, i) => {
      keys.push(`p${i}`);
      values.push(paragraph);
    });
    return { keys, values, contentType: "plain", marks };
  } catch {
    keys.push("raw");
    values.push(body);
    return { keys, values, contentType: "plain", marks };
  }
}

export function unpackInterpretation(packed: PackedInterpretation, translated: string[]): { title: string; body: string } {
  const map = new Map(packed.keys.map((key, i) => [key, translated[i] ?? packed.values[i] ?? ""]));
  const title = map.get("title") ?? "";
  if (packed.contentType === "structured") {
    const blocks: { mark: string; label: string; text: string }[] = [];
    for (let i = 0; map.has(`label${i}`) || map.has(`text${i}`); i++) {
      blocks.push({
        mark: packed.marks[i] ?? "•",
        label: map.get(`label${i}`) ?? "",
        text: map.get(`text${i}`) ?? ""
      });
    }
    return { title, body: JSON.stringify({ blocks }) };
  }
  if (map.has("raw") && !map.has("lead")) {
    return { title, body: map.get("raw") ?? "" };
  }
  const paragraphs: string[] = [];
  for (let i = 0; map.has(`p${i}`); i++) paragraphs.push(map.get(`p${i}`) ?? "");
  return { title, body: JSON.stringify({ lead: map.get("lead") ?? "", paragraphs }) };
}

export async function translateInterpretation(params: {
  title: string;
  contentType: string;
  body: string;
  from: ContentLocale;
  to: ContentLocale;
}): Promise<{ title: string; body: string }> {
  if (params.from === params.to) return { title: params.title, body: params.body };
  const packed = packInterpretation(params.title, params.contentType, params.body);
  const translated = await translateMany(packed.values, params.from, params.to);
  return unpackInterpretation(packed, translated);
}

async function translateMany(values: string[], from: ContentLocale, to: ContentLocale): Promise<string[]> {
  const index: number[] = [];
  const payload: string[] = [];
  values.forEach((value, i) => {
    if (value.trim()) {
      index.push(i);
      payload.push(value);
    }
  });
  if (payload.length === 0) return values;
  const translated = await translateWithProvider(payload, from, to);
  if (translated.length !== payload.length) {
    throw new Error(`Translator returned ${translated.length} strings, expected ${payload.length}`);
  }
  const out = [...values];
  index.forEach((i, k) => {
    out[i] = translated[k] ?? values[i];
  });
  return out;
}

async function translateWithProvider(texts: string[], from: ContentLocale, to: ContentLocale): Promise<string[]> {
  const provider = pickProvider();
  const errors: string[] = [];
  const order = provider === "google" ? (["google", "deepl", "openai"] as const) : ([provider, "google"] as const);
  const unique = [...new Set(order)];
  for (const name of unique) {
    try {
      if (name === "deepl" && process.env.DEEPL_API_KEY) return await translateDeepL(texts, from, to);
      if (name === "openai" && process.env.OPENAI_API_KEY) return await translateOpenAI(texts, from, to);
      if (name === "google") return await translateGoogle(texts, from, to);
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }
  throw new Error(errors.join("; ") || "No translator available");
}

function pickProvider(): "deepl" | "openai" | "google" {
  const raw = (process.env.TRANSLATE_PROVIDER ?? "").toLowerCase();
  if (raw === "deepl" || raw === "openai" || raw === "google") return raw;
  if (process.env.DEEPL_API_KEY) return "deepl";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "google";
}

async function translateGoogle(texts: string[], from: ContentLocale, to: ContentLocale): Promise<string[]> {
  const out: string[] = [];
  for (const text of texts) {
    try {
      out.push(await translateChromeEx(text, from, to));
    } catch {
      out.push(await translateMyMemory(text, from, to));
    }
  }
  return out;
}

const TRANSLATE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function translateChromeEx(text: string, from: ContentLocale, to: ContentLocale): Promise<string> {
  const url = new URL("https://clients5.google.com/translate_a/t");
  url.searchParams.set("client", "dict-chrome-ex");
  url.searchParams.set("sl", from);
  url.searchParams.set("tl", to);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": TRANSLATE_UA
    },
    body: new URLSearchParams({ q: text }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  return readGoogleChunks(await res.json());
}

async function translateMyMemory(text: string, from: ContentLocale, to: ContentLocale): Promise<string> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, 500));
  url.searchParams.set("langpair", `${from}|${to}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = (await res.json()) as { responseData?: { translatedText?: string } };
  const translated = data.responseData?.translatedText?.trim();
  if (!translated) throw new Error("MyMemory returned an empty string");
  return translated;
}

export function readGoogleChunks(data: unknown): string {
  if (typeof data === "string") return data;
  if (!Array.isArray(data) || data.length === 0) throw new Error("Unexpected Google Translate payload");
  if (typeof data[0] === "string") return data.filter((part): part is string => typeof part === "string").join("");
  if (Array.isArray(data[0])) {
    return (data[0] as unknown[])
      .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
      .join("");
  }
  throw new Error("Unexpected Google Translate payload");
}

async function translateDeepL(texts: string[], from: ContentLocale, to: ContentLocale): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY ?? "";
  const endpoint = process.env.DEEPL_API_URL ?? (key.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: texts,
      source_lang: from.toUpperCase(),
      target_lang: to === "en" ? "EN-US" : to.toUpperCase()
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
  const data = (await res.json()) as { translations?: { text?: string }[] };
  return (data.translations ?? []).map((row, i) => row.text ?? texts[i] ?? "");
}

async function translateOpenAI(texts: string[], from: ContentLocale, to: ContentLocale): Promise<string[]> {
  const names = { ru: "Russian", en: "English", ar: "Arabic" };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You translate Soul Star numerology readings. Return JSON {\"texts\":[...]} with the same number of strings, same order. Keep meaning, tone, and quoted role names. Do not add commentary."
        },
        {
          role: "user",
          content: `Translate from ${names[from]} to ${names[to]}:\n${JSON.stringify(texts)}`
        }
      ]
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as { texts?: string[] };
  if (!Array.isArray(parsed.texts) || parsed.texts.length !== texts.length) {
    throw new Error("OpenAI returned the wrong number of strings");
  }
  return parsed.texts;
}
