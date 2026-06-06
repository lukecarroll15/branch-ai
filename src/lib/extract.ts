import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Extract plain text from a PDF buffer (pdf-parse v2 API).
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

// Extract plain text from a .docx buffer.
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}
