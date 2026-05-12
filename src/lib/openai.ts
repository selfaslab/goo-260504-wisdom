export type WisdomPayload = {
  quoteKorean: string;
  quoteOriginal: string;
  author: string;
  summary: string;
  birthYear: string;
  deathYear: string;
  localeNote?: string;
  imagePrompt: string;
  imageUrl?: string;
};

const SYSTEM = `You output only valid JSON for a philosophy / thinker quote card.
Required keys:
- quoteKorean: the same quote expressed in natural Korean (not literal awkward translation when a well-known Korean version exists).
- quoteOriginal: the quote in its authentic original language (Greek, Latin, German, English, etc.) as usually cited.
- author: thinker's name (can be conventional English or original script).
- summary: one short line of role or main achievement in Korean (e.g. "그리스의 철학자").
- birthYear, deathYear: strings; use "-" or "현재" when unknown or still living.
- imagePrompt: ONE concise English phrase for DALL-E 3: symbolic or atmospheric fine-art style illustration matching the quote's mood and era. No readable text, no letters, no numbers, no logos, no photorealistic recognizable face of a real person.
Optional: localeNote (e.g. "고전 그리스어").
No markdown, no code fences, no extra keys beyond those listed.`;

export function getApiKey(): string {
  return (import.meta.env.VITE_OPENAI_API_KEY ?? "").trim();
}

export function getModel(): string {
  return (import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o-mini").trim();
}

function buildImagePromptFallback(w: Omit<WisdomPayload, "imageUrl">): string {
  const snippet = w.quoteKorean.slice(0, 120);
  return `Symbolic fine art painting, philosophical atmosphere, inspired by themes from ${w.author}: ${snippet}. No text, no typography, no faces, soft painterly light.`;
}

export async function generateQuoteImage(
  imagePrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("MISSING_KEY");

  const safe =
    imagePrompt.trim().slice(0, 3500) ||
    "Abstract philosophical landscape, warm muted colors, oil painting style, no text.";

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: safe,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`IMAGE_API_${res.status}:${text.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string }>;
  };
  const url = data.data?.[0]?.url;
  if (!url) throw new Error("NO_IMAGE_URL");
  return url;
}

function parseWisdomJson(parsed: unknown): Omit<WisdomPayload, "imageUrl"> {
  const o = parsed as Record<string, unknown>;
  const quoteOriginal = String(
    o.quoteOriginal ?? o.quote ?? ""
  ).trim();
  const quoteKorean = String(o.quoteKorean ?? "").trim();
  const author = String(o.author ?? "").trim();
  const summary = String(o.summary ?? "").trim();
  const birthYear = String(o.birthYear ?? "").trim() || "-";
  const deathYear = String(o.deathYear ?? "").trim() || "-";
  const localeNote =
    o.localeNote !== undefined ? String(o.localeNote).trim() : undefined;
  const imagePrompt = String(o.imagePrompt ?? "").trim();

  if (!quoteOriginal || !author) {
    throw new Error("INCOMPLETE_PAYLOAD");
  }

  const qKo = quoteKorean || quoteOriginal;

  return {
    quoteKorean: qKo,
    quoteOriginal,
    author,
    summary,
    birthYear,
    deathYear,
    localeNote,
    imagePrompt: imagePrompt || buildImagePromptFallback({
      quoteKorean: qKo,
      quoteOriginal,
      author,
      summary,
      birthYear,
      deathYear,
      localeNote,
      imagePrompt: "",
    }),
  };
}

export async function fetchWisdom(signal?: AbortSignal): Promise<WisdomPayload> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Pick ONE different philosopher or thinker than typical repeats. Request id: ${nonce}
Return a notable authentic quote with both Korean and original wording as specified in the system message.`,
        },
      ],
      temperature: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`API_${res.status}:${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("EMPTY_RESPONSE");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }

  const base = parseWisdomJson(parsed);

  let imageUrl: string | undefined;
  try {
    const promptForImage =
      base.imagePrompt || buildImagePromptFallback(base);
    imageUrl = await generateQuoteImage(promptForImage, signal);
  } catch {
    imageUrl = undefined;
  }

  return { ...base, imageUrl };
}

export function formatWisdomLine(w: WisdomPayload): string {
  return `${w.author} / ${w.summary} / ${w.birthYear}~${w.deathYear}`;
}

export function formatCopyText(w: WisdomPayload): string {
  const lines = [
    `[한국어]`,
    `"${w.quoteKorean}"`,
    "",
    `[원문]`,
    `"${w.quoteOriginal}"`,
    "",
    formatWisdomLine(w),
  ];
  if (w.localeNote) lines.push("", `(${w.localeNote})`);
  return lines.join("\n");
}

export function initialsFromAuthor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const p = parts[0];
    return p.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
