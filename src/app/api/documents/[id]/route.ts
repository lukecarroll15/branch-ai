import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
