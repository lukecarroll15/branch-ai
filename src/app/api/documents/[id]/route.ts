import { NextResponse, after } from "next/server";
import { apiError, requireOwnedDocument } from "@/lib/api";
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
  const ctx = await requireOwnedDocument(params);
  if ("error" in ctx) return ctx.error;
  const { id, supabase, user, doc } = ctx;

  if (!doc.file_path) {
    return apiError("This document has no file to process again.", 400);
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
    return apiError(updateError.message, 500);
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
  // The lookup also tells us which storage object to remove.
  const ctx = await requireOwnedDocument(params);
  if ("error" in ctx) return ctx.error;
  const { id, supabase, user, doc } = ctx;

  // Remove the stored file first. If this fails we stop, otherwise we'd be
  // left with an orphaned file and no row pointing at it.
  if (doc.file_path) {
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) {
      return apiError(storageError.message, 500);
    }
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return apiError(deleteError.message, 500);
  }

  return NextResponse.json({ ok: true });
}
