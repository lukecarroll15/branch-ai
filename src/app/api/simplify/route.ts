import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { simplifyText } from "@/lib/gemini";

// Bound the work (and the Gemini spend) per request.
export const maxDuration = 30;
const MAX_CHARS = 4000;

// POST /api/simplify — rewrite a passage in plainer language on demand.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth-gate so the Gemini credits can't be spent anonymously.
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const text =
    body && typeof (body as { text?: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: "That passage is too long to simplify." },
      { status: 400 },
    );
  }

  try {
    const simplified = await simplifyText(text);
    return NextResponse.json({ simplified });
  } catch (err) {
    console.error("Simplify failed:", err);
    return NextResponse.json(
      { error: "Could not simplify right now. Please try again." },
      { status: 502 },
    );
  }
}
