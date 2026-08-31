import { beforeEach, describe, expect, it, vi } from "vitest";

const { pdf, extractRawText } = vi.hoisted(() => ({
  pdf: vi.fn(),
  extractRawText: vi.fn(),
}));

// The module imports pdf-parse's implementation file directly — v1's index.js
// reads a sample PDF off disk at import time, which isn't deployed.
vi.mock("pdf-parse/lib/pdf-parse.js", () => ({ default: pdf }));
vi.mock("mammoth", () => ({ default: { extractRawText } }));

const { extractDocxText, extractPdfText } = await import("@/lib/extract");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractPdfText", () => {
  it("returns the parsed text", async () => {
    pdf.mockResolvedValue({ text: "Chapter one." });

    await expect(extractPdfText(Buffer.from("%PDF"))).resolves.toBe(
      "Chapter one.",
    );
    expect(pdf).toHaveBeenCalledWith(Buffer.from("%PDF"));
  });

  it("returns empty text for a PDF with no embedded text layer", async () => {
    pdf.mockResolvedValue({ text: "" });

    await expect(extractPdfText(Buffer.from("%PDF"))).resolves.toBe("");
  });

  it("propagates a parse failure", async () => {
    pdf.mockRejectedValue(new Error("corrupt file"));

    await expect(extractPdfText(Buffer.from("%PDF"))).rejects.toThrow(
      "corrupt file",
    );
  });
});

describe("extractDocxText", () => {
  it("returns the raw text", async () => {
    extractRawText.mockResolvedValue({ value: "An essay." });

    await expect(extractDocxText(Buffer.from("PK"))).resolves.toBe("An essay.");
    expect(extractRawText).toHaveBeenCalledWith({ buffer: Buffer.from("PK") });
  });

  it("propagates a parse failure", async () => {
    extractRawText.mockRejectedValue(new Error("not a docx"));

    await expect(extractDocxText(Buffer.from("PK"))).rejects.toThrow(
      "not a docx",
    );
  });
});
