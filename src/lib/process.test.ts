import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClient,
  extractPdfText,
  extractDocxText,
  formatStudyNotes,
  updates,
} = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  extractPdfText: vi.fn(),
  extractDocxText: vi.fn(),
  formatStudyNotes: vi.fn(),
  // Every .update() call made against the documents table, in order.
  updates: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/extract", () => ({ extractPdfText, extractDocxText }));
vi.mock("@/lib/gemini", () => ({ formatStudyNotes }));

const { processDocument } = await import("@/lib/process");

const CONTENT = { title: "Photosynthesis", sections: [] };

// Build an admin-client double for one document row plus its stored file.
function stubAdmin({
  row = { file_path: "user-1/notes.pdf", file_type: "pdf" },
  loadError = null,
  download = { data: null as Blob | null, error: null as unknown },
  saveError = null as unknown,
}: {
  row?: { file_path: string | null; file_type: string } | null;
  loadError?: unknown;
  download?: { data: Blob | null; error: unknown };
  saveError?: unknown;
} = {}) {
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: row, error: loadError }),
    update: (values: Record<string, unknown>) => {
      updates.push(values);
      return { eq: async () => ({ error: saveError }) };
    },
  };

  return {
    from: () => query,
    storage: { from: () => ({ download: async () => download }) },
  };
}

// A stand-in for the file Supabase storage hands back.
function blob(bytes: string, type = "") {
  return new Blob([bytes], { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  updates.length = 0;
  formatStudyNotes.mockResolvedValue(CONTENT);
});

describe("processDocument", () => {
  it("extracts a PDF's text and saves the formatted content", async () => {
    extractPdfText.mockResolvedValue("A long passage of real embedded text.");
    createAdminClient.mockReturnValue(
      stubAdmin({ download: { data: blob("%PDF-1.4"), error: null } }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith({
      kind: "text",
      text: "A long passage of real embedded text.",
    });
    expect(updates).toEqual([
      { processed_content: CONTENT, status: "complete" },
    ]);
  });

  it("falls back to vision for a scanned PDF with no embedded text", async () => {
    // Under MIN_TEXT_CHARS (20) — pdf-parse found nothing usable.
    extractPdfText.mockResolvedValue("  \n  ");
    createAdminClient.mockReturnValue(
      stubAdmin({ download: { data: blob("%PDF-1.4"), error: null } }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith({
      kind: "image",
      mimeType: "application/pdf",
      base64: Buffer.from("%PDF-1.4").toString("base64"),
    });
    expect(updates).toEqual([
      { processed_content: CONTENT, status: "complete" },
    ]);
  });

  it("treats text at exactly the minimum length as real text", async () => {
    // Boundary: MIN_TEXT_CHARS is 20 and the check is >=.
    extractPdfText.mockResolvedValue("12345678901234567890");
    createAdminClient.mockReturnValue(
      stubAdmin({ download: { data: blob("%PDF-1.4"), error: null } }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith({
      kind: "text",
      text: "12345678901234567890",
    });
  });

  it("formats a DOCX from its extracted text", async () => {
    extractDocxText.mockResolvedValue("Plenty of words in this document.");
    createAdminClient.mockReturnValue(
      stubAdmin({
        row: { file_path: "user-1/essay.docx", file_type: "docx" },
        download: { data: blob("PK"), error: null },
      }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith({
      kind: "text",
      text: "Plenty of words in this document.",
    });
  });

  it("fails an empty DOCX rather than sending nothing to the model", async () => {
    extractDocxText.mockResolvedValue("  ");
    createAdminClient.mockReturnValue(
      stubAdmin({
        row: { file_path: "user-1/essay.docx", file_type: "docx" },
        download: { data: blob("PK"), error: null },
      }),
    );

    await expect(processDocument("doc-1")).rejects.toThrow(
      "This document looks empty",
    );

    expect(formatStudyNotes).not.toHaveBeenCalled();
    expect(updates).toEqual([{ status: "error" }]);
  });

  it("sends an image straight to the model with its stored MIME type", async () => {
    createAdminClient.mockReturnValue(
      stubAdmin({
        row: { file_path: "user-1/photo.png", file_type: "image" },
        download: { data: blob("PNGDATA", "image/png"), error: null },
      }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith({
      kind: "image",
      mimeType: "image/png",
      base64: Buffer.from("PNGDATA").toString("base64"),
    });
  });

  it("defaults an image with no MIME type to jpeg", async () => {
    createAdminClient.mockReturnValue(
      stubAdmin({
        row: { file_path: "user-1/photo", file_type: "image" },
        download: { data: blob("JPEGDATA"), error: null },
      }),
    );

    await processDocument("doc-1");

    expect(formatStudyNotes).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "image/jpeg" }),
    );
  });

  it("marks the row errored when the document cannot be loaded", async () => {
    createAdminClient.mockReturnValue(stubAdmin({ row: null }));

    await expect(processDocument("doc-1")).rejects.toThrow(
      "Document not found.",
    );

    expect(updates).toEqual([{ status: "error" }]);
  });

  it("surfaces the load error itself when there is one", async () => {
    createAdminClient.mockReturnValue(
      stubAdmin({ row: null, loadError: new Error("connection lost") }),
    );

    await expect(processDocument("doc-1")).rejects.toThrow("connection lost");
  });

  it("marks the row errored when the document has no file", async () => {
    createAdminClient.mockReturnValue(
      stubAdmin({ row: { file_path: null, file_type: "pdf" } }),
    );

    await expect(processDocument("doc-1")).rejects.toThrow(
      "Document has no file.",
    );

    expect(updates).toEqual([{ status: "error" }]);
  });

  it("marks the row errored when the download fails", async () => {
    createAdminClient.mockReturnValue(
      stubAdmin({ download: { data: null, error: null } }),
    );

    await expect(processDocument("doc-1")).rejects.toThrow(
      "Could not download file.",
    );

    expect(updates).toEqual([{ status: "error" }]);
  });

  it("marks the row errored when the model call throws", async () => {
    extractPdfText.mockResolvedValue("A long passage of real embedded text.");
    formatStudyNotes.mockRejectedValue(new Error("Gemini is down"));
    createAdminClient.mockReturnValue(
      stubAdmin({ download: { data: blob("%PDF-1.4"), error: null } }),
    );

    await expect(processDocument("doc-1")).rejects.toThrow("Gemini is down");

    expect(updates).toEqual([{ status: "error" }]);
  });

  it("marks the row errored when the save fails", async () => {
    extractPdfText.mockResolvedValue("A long passage of real embedded text.");
    createAdminClient.mockReturnValue(
      stubAdmin({
        download: { data: blob("%PDF-1.4"), error: null },
        saveError: { message: "write conflict" },
      }),
    );

    await expect(processDocument("doc-1")).rejects.toEqual({
      message: "write conflict",
    });

    // The successful-save update is attempted first, then the error flag.
    expect(updates).toEqual([
      { processed_content: CONTENT, status: "complete" },
      { status: "error" },
    ]);
  });
});
