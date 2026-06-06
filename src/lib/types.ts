// Shape of the AI-processed document. This mirrors the JSON the Gemini
// processing prompt returns (see docs/branch-ai.md), so the same types are
// reused when we wire up real processing later.

export type TileColor = "lavender" | "orange" | "red";

export type SectionType = "paragraph" | "bullet" | "quiz_header" | "quiz_option";

// A segment is one run of text inside a section: either plain text, or a
// highlighted keyword "tile" with extra reading aids (phonics + explanation).
export interface Segment {
  text: string;
  isTile: boolean;
  color?: TileColor;
  phonics?: string;
  explanation?: string;
}

export interface Section {
  sectionType: SectionType;
  segments: Segment[];
}

export interface ProcessedDocument {
  title: string;
  sections: Section[];
}

export type DocumentStatus = "processing" | "complete" | "error";

// A row from the `documents` table (see supabase/schema.sql).
export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  file_path: string | null;
  file_type: "pdf" | "image" | "docx" | null;
  status: DocumentStatus;
  processed_content: ProcessedDocument | null;
  created_at: string;
}
