import { NextResponse } from "next/server";
import { apiError, readJson, requireUser } from "@/lib/api";
import { simplifyText } from "@/lib/gemini";

// Bound the work (and the Gemini spend) per request.
export const maxDuration = 30;
const MAX_CHARS = 4000;

// POST /api/simplify — rewrite a passage in plainer language on demand.
export async function POST(request: Request) {
  // Auth-gate so the Gemini credits can't be spent anonymously.
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const parsed = await readJson(request);
  if ("error" in parsed) return parsed.error;

  const { body } = parsed;
  const text =
    body && typeof (body as { text?: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text) {
    return apiError("No text provided", 400);
  }
  if (text.length > MAX_CHARS) {
    return apiError("That passage is too long to simplify.", 400);
  }

  try {
    const simplified = await simplifyText(text);
    return NextResponse.json({ simplified });
  } catch (err) {
    console.error("Simplify failed:", err);
    return apiError("Could not simplify right now. Please try again.", 502);
  }
}
