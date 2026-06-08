import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/process";

// Give the post-response processing work (download + extract + Gemini) room to
// run on Vercel before the function is frozen.
export const maxDuration = 60;

// Map browser MIME types to our `file_type` enum (pdf | image | docx).
const TYPE_MAP: Record<string, "pdf" | "image" | "docx"> = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileType = TYPE_MAP[file.type];
  if (!fileType) {
    return NextResponse.json(
      { error: "Unsupported file type. Use a PDF, image (JPG/PNG), or Word doc." },
      { status: 400 },
    );
  }

  // Store under the user's own folder so the storage RLS policy allows it.
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Title defaults to the filename without its extension.
  const title = file.name.replace(/\.[^.]+$/, "") || file.name;

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title,
      file_path: path,
      file_type: fileType,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not create document record." },
      { status: 500 },
    );
  }

  // Process after the response is sent so the upload returns immediately. The
  // row is already "processing", and the document page polls until it flips to
  // "complete"/"error". processDocument records its own failure in the row, so
  // here we only log for diagnostics.
  after(async () => {
    try {
      await processDocument(doc.id);
    } catch (err) {
      console.error(`Processing failed for document ${doc.id}:`, err);
    }
  });

  return NextResponse.json({ documentId: doc.id });
}
