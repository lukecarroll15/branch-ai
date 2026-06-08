// Import the implementation file directly. pdf-parse v1's index.js runs debug
// code at import time that reads a sample PDF off disk — that file isn't
// deployed, so it crashes on the server. Importing lib/pdf-parse.js skips it.
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

// Extract plain text from a PDF buffer.
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

// Extract plain text from a .docx buffer.
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}
