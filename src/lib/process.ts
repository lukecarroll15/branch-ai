import { createAdminClient } from "@/lib/supabase/admin";
import { extractPdfText, extractDocxText } from "@/lib/extract";
import { formatStudyNotes } from "@/lib/gemini";
import type { ProcessedDocument } from "@/lib/types";

// Below this many characters we treat an extraction as "no real text". A
// scanned or photographed PDF has no embedded text, so pdf-parse returns almost
// nothing — without this guard we'd send an empty string to Gemini and get
// nonsense back, marked "complete".
const MIN_TEXT_CHARS = 20;

// Process an uploaded document into dyslexia-friendly structured content:
//   1. download the file from storage
//   2. extract text (PDF/DOCX) or hand the image to Gemini's vision
//   3. send to Gemini, which returns the structured JSON
//   4. save it and mark the document complete
// On any failure the document is marked "error" so the UI shows a clear
// failed state instead of spinning on "processing" forever.
export async function processDocument(documentId: string) {
  const admin = createAdminClient();

  try {
    const { data: doc, error: loadError } = await admin
      .from("documents")
      .select("file_path, file_type")
      .eq("id", documentId)
      .single();

    if (loadError || !doc) throw loadError ?? new Error("Document not found.");
    if (!doc.file_path) throw new Error("Document has no file.");

    // Download the uploaded file.
    const { data: blob, error: downloadError } = await admin.storage
      .from("documents")
      .download(doc.file_path);

    if (downloadError || !blob) {
      throw downloadError ?? new Error("Could not download file.");
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // Turn the file into something Gemini can format.
    let content: ProcessedDocument;
    if (doc.file_type === "pdf") {
      const text = await extractPdfText(buffer);
      if (text.trim().length >= MIN_TEXT_CHARS) {
        content = await formatStudyNotes({ kind: "text", text });
      } else {
        // Likely a scanned/photographed PDF with no embedded text — hand the
        // raw PDF to Gemini's vision so it can read the text off the page.
        content = await formatStudyNotes({
          kind: "image",
          mimeType: "application/pdf",
          base64: buffer.toString("base64"),
        });
      }
    } else if (doc.file_type === "docx") {
      const text = await extractDocxText(buffer);
      if (text.trim().length < MIN_TEXT_CHARS) {
        throw new Error(
          "This document looks empty — we couldn't find any text to work with.",
        );
      }
      content = await formatStudyNotes({ kind: "text", text });
    } else {
      // image — let Gemini read the text directly
      content = await formatStudyNotes({
        kind: "image",
        mimeType: blob.type || "image/jpeg",
        base64: buffer.toString("base64"),
      });
    }

    const { error: saveError } = await admin
      .from("documents")
      .update({ processed_content: content, status: "complete" })
      .eq("id", documentId);

    if (saveError) throw saveError;
  } catch (err) {
    await admin
      .from("documents")
      .update({ status: "error" })
      .eq("id", documentId);
    throw err;
  }
}
