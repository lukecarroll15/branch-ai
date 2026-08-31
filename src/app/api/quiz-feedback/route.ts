import { NextResponse } from "next/server";
import { apiError, findOwnedDocument, readJson, requireUser } from "@/lib/api";

// POST /api/quiz-feedback — record whether a quiz question felt easy or hard.
// One row per (student, document, question); re-submitting updates the rating.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson(request);
  if ("error" in parsed) return parsed.error;

  const { documentId, questionIndex, rating } = (parsed.body ?? {}) as {
    documentId?: unknown;
    questionIndex?: unknown;
    rating?: unknown;
  };

  if (
    typeof documentId !== "string" ||
    typeof questionIndex !== "number" ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    (rating !== "easy" && rating !== "hard")
  ) {
    return apiError("Invalid request", 400);
  }

  // Confirm the document belongs to this student.
  const found = await findOwnedDocument(supabase, documentId, user.id);
  if ("error" in found) return found.error;

  const { error } = await supabase.from("quiz_feedback").upsert(
    {
      user_id: user.id,
      document_id: documentId,
      question_index: questionIndex,
      rating,
    },
    { onConflict: "user_id,document_id,question_index" },
  );

  if (error) {
    return apiError(error.message, 500);
  }

  return NextResponse.json({ ok: true });
}
