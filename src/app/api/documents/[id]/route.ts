import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/process";

// Give the reprocess work (download + extract + Gemini) room to run on Vercel
// before the function is frozen. Matches the upload route.
export const maxDuration = 60;

// POST /api/documents/[id] — retry processing a document that failed (or that
// the student wants regenerated). The original file is still in storage, so we
// just flip the row back to "processing" and re-run the pipeline on it — no
// re-upload needed.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS already scopes this to the current user; we filter explicitly too.
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.file_path) {
    return NextResponse.json(
      { error: "This document has no file to process again." },
      { status: 400 },
    );
  }

  // Flip back to "processing" so the page shows the spinner and polls. Then
  // re-run after the response is sent. processDocument records its own failure
  // on the row, so here we only log for diagnostics.
  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "processing" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  after(async () => {
    try {
      await processDocument(id);
    } catch (err) {
      console.error(`Reprocessing failed for document ${id}:`, err);
    }
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/documents/[id] — remove a document and its stored file.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Look up the row first so we know which storage object to remove. RLS
  // already scopes this to the current user, but we filter explicitly too.
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Remove the stored file first. If this fails we stop, otherwise we'd be
  // left with an orphaned file and no row pointing at it.
  if (doc.file_path) {
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
