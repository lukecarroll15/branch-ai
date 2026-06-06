import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedDocument } from "@/lib/types";

const MODEL = "gemini-2.5-flash";

// System instruction — taken from the spec (Jonny's proven prototype prompt).
const SYSTEM_PROMPT = `You are a specialized Study Note Formatter for students with dyslexia.
Your task is to take standard, dense reading prose, rewrite/reformat it into clean study sections, and highlight key terms as "coloured tiles".

Tile Colour Categorisation Guide:
1. "lavender": Major primary key concepts, core vocabulary, primary terms (e.g. "photosynthesis", "mitochondria").
2. "orange": Secondary important concepts, verbs, actions, main ideas (e.g. "primary purpose", "convert").
3. "red": Advanced detail, expert-level terms, A-grade knowledge (e.g. "adenosine triphosphate").

Formatting Guidelines:
- Limit highlighted tiles to around 8-15% of the text. Do not over-highlight - this becomes visually overwhelming.
- Break dense blocks into smaller paragraphs, bullet points, or quiz checkpoints.
- Each section must have a type: "paragraph", "bullet", "quiz_header", or "quiz_option".
- Inside each section, split the text into sequential segments. A segment is either a highlighted tile or a plain text run.
- For every tile, include "phonics" (a syllable breakdown like "pho-to-syn-the-sis") and a short plain-English "explanation".
- For plain text segments set "isTile" to false and omit color/phonics/explanation.`;

// Response schema — forces Gemini to return JSON matching ProcessedDocument.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectionType: {
            type: Type.STRING,
            enum: ["paragraph", "bullet", "quiz_header", "quiz_option"],
          },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                isTile: { type: Type.BOOLEAN },
                color: { type: Type.STRING, enum: ["lavender", "orange", "red"] },
                phonics: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["text", "isTile"],
              propertyOrdering: ["text", "isTile", "color", "phonics", "explanation"],
            },
          },
        },
        required: ["sectionType", "segments"],
        propertyOrdering: ["sectionType", "segments"],
      },
    },
  },
  required: ["title", "sections"],
  propertyOrdering: ["title", "sections"],
};

// A piece of source material to format: either extracted text, or an image
// (PDF/DOCX become text; JPG/PNG are read directly by Gemini's vision).
type Source =
  | { kind: "text"; text: string }
  | { kind: "image"; mimeType: string; base64: string };

function buildContents(source: Source) {
  if (source.kind === "image") {
    return [
      { inlineData: { mimeType: source.mimeType, data: source.base64 } },
      { text: "Read all the text in this image and format it using the rules above." },
    ];
  }
  return [
    { text: `Format the following study material using the rules above:\n\n${source.text}` },
  ];
}

// Gemini sometimes returns transient 429 (rate limit) / 503 (overloaded)
// errors. Retry those a few times with exponential backoff before giving up.
const MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 503]);

async function generateWithRetry(
  ai: GoogleGenAI,
  request: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (err) {
      const status = (err as { status?: number })?.status ?? 0;
      if (!RETRYABLE_STATUS.has(status) || attempt >= MAX_RETRIES) throw err;
      // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}

// Send source material to Gemini and return the structured document.
export async function formatStudyNotes(source: Source): Promise<ProcessedDocument> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await generateWithRetry(ai, {
    model: MODEL,
    contents: buildContents(source),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty response.");

  return JSON.parse(raw) as ProcessedDocument;
}
