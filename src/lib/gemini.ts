import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedDocument } from "@/lib/types";

// Models to try, in order. "gemini-flash-latest" tracks the current stable
// Flash model so it won't go stale; if it's ever overloaded we fall back to
// the lite model. (The older pinned "gemini-2.5-flash" was chronically
// returning 503 on the free tier, which is why we don't use it.)
const MODELS = ["gemini-flash-latest", "gemini-2.5-flash-lite"];

// Cap on the structured JSON Gemini can return. The Flash models support up to
// ~65k output tokens, but the SDK default is only ~8k when unset — which was
// truncating longer documents into short summaries. This gives long documents
// real room while staying well within the model limit.
const MAX_OUTPUT_TOKENS = 32768;

// System instruction — taken from the spec (Jonny's proven prototype prompt).
const SYSTEM_PROMPT = `You are a specialized Study Note Formatter for students with dyslexia.
Your task is to take standard, dense reading prose, rewrite/reformat it into clean study sections, and highlight key terms as "coloured tiles".

Tile Colour Categorisation Guide:
1. "lavender": Major primary key concepts, core vocabulary, primary terms (e.g. "photosynthesis", "mitochondria").
2. "orange": Secondary important concepts, verbs, actions, main ideas (e.g. "primary purpose", "convert").
3. "red": Advanced detail, expert-level terms, A-grade knowledge (e.g. "adenosine triphosphate").
4. "teal": List sub-point labels and ordered markers (e.g. "A", "B", "C", "Step 1", "i", "ii"). Use this to make the structure of lists easy to scan.

Formatting Guidelines:
- Cover the ENTIRE document from beginning to end. Reformat all of the source material - do not summarise, shorten, or skip parts. Nothing from the source should be left out.
- Only include a quiz checkpoint where it genuinely fits the material, and never use a quiz as a way to stop early. If there is more source text after a quiz, keep formatting it.
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
                color: {
                  type: Type.STRING,
                  enum: ["lavender", "orange", "red", "teal"],
                },
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
// errors. We retry those with exponential backoff, and if a model stays
// overloaded after its retries we fall back to the next model in MODELS.
const MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([429, 503]);

async function generateWithRetry(
  ai: GoogleGenAI,
  request: Omit<
    Parameters<GoogleGenAI["models"]["generateContent"]>[0],
    "model"
  >,
) {
  let lastErr: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await ai.models.generateContent({ ...request, model });
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number })?.status ?? 0;
        // Not a transient error → no point retrying or failing over.
        if (!RETRYABLE_STATUS.has(status)) throw err;
        // More attempts left for this model → back off (1s, 2s) and retry.
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
        // Otherwise the inner loop ends and we fall over to the next model.
      }
    }
  }

  throw lastErr;
}

// Send source material to Gemini and return the structured document.
export async function formatStudyNotes(source: Source): Promise<ProcessedDocument> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await generateWithRetry(ai, {
    contents: buildContents(source),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty response.");

  return JSON.parse(raw) as ProcessedDocument;
}
