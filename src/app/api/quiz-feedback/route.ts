import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/quiz-feedback — record whether a quiz question felt easy or hard.
// One row per (student, document, question); re-submitting updates the rating.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { documentId, questionIndex, rating } = (body ?? {}) as {
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Confirm the document belongs to this student (RLS scopes the select).
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
