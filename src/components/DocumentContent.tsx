import type { ProcessedDocument, Section, Segment } from "@/lib/types";
import KeywordTile from "@/components/KeywordTile";
import ReadAloud from "@/components/ReadAloud";
import ReadingSettings from "@/components/ReadingSettings";
import QuizBlock from "@/components/QuizBlock";
import { SpeechProvider } from "@/components/SpeechContext";

// Strip a leading bullet/marker character ("• ", "- ", "* ") from a bullet's
// text — some processed content includes one, which doubled up with the CSS
// bullet we render ourselves.
function withoutLeadingBullet(segments: Segment[]): Segment[] {
  if (segments.length === 0) return segments;
  const [first, ...rest] = segments;
  const cleaned = first.text.replace(/^\s*[•‣◦·*-]\s+/, "");
  if (cleaned === first.text) return segments;
  return [{ ...first, text: cleaned }, ...rest];
}

// Render one section's segments: plain text runs interleaved with keyword tiles.
function renderSegments(segments: Segment[]) {
  return segments.map((seg, i) => {
    if (seg.isTile && seg.color) {
      return (
        <KeywordTile
          key={i}
          text={seg.text}
          color={seg.color}
          phonics={seg.phonics}
          explanation={seg.explanation}
        />
      );
    }
    return <span key={i}>{seg.text}</span>;
  });
}

// Render a single non-quiz section (quiz sections are grouped into QuizBlock).
function renderSection(section: Section, i: number) {
  if (section.sectionType === "bullet") {
    return (
      <div key={i} className="flex gap-3">
        <span aria-hidden className="mt-1 text-primary-light">
          •
        </span>
        <p className="flex-1">{renderSegments(withoutLeadingBullet(section.segments))}</p>
      </div>
    );
  }

  return (
    <p key={i}>{renderSegments(section.segments)}</p>
  );
}

// Group the flat section list into render blocks, folding a quiz_header and its
// following quiz_option sections into a single quiz block.
type Block =
  | { kind: "section"; section: Section }
  | { kind: "quiz"; header: Section | null; options: Section[] };

function buildBlocks(sections: Section[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < sections.length) {
    const section = sections[i];
    if (
      section.sectionType === "quiz_header" ||
      section.sectionType === "quiz_option"
    ) {
      let header: Section | null = null;
      if (section.sectionType === "quiz_header") {
        header = section;
        i++;
      }
      const options: Section[] = [];
      while (i < sections.length && sections[i].sectionType === "quiz_option") {
        options.push(sections[i]);
        i++;
      }
      blocks.push({ kind: "quiz", header, options });
    } else {
      blocks.push({ kind: "section", section });
      i++;
    }
  }
  return blocks;
}

function renderBlocks(doc: ProcessedDocument) {
  return buildBlocks(doc.sections).map((block, i) => {
    if (block.kind === "quiz") {
      return (
        <QuizBlock
          key={i}
          header={block.header ? renderSegments(block.header.segments) : null}
          // Options are plain answer text — flattened so we never nest a tile
          // <button> inside the option <button>.
          options={block.options.map((o) =>
            o.segments.map((s) => s.text).join(""),
          )}
        />
      );
    }
    return renderSection(block.section, i);
  });
}

// Typography is driven by the reading-settings CSS variables so students can
// tune size/font/spacing live.
const readingStyle: React.CSSProperties = {
  fontFamily: "var(--reading-font)",
  fontSize: "var(--reading-size)",
  lineHeight: "var(--reading-line)",
  letterSpacing: "var(--reading-letter)",
  wordSpacing: "var(--reading-word)",
};

export default function DocumentContent({
  doc,
  preview = false,
}: {
  doc: ProcessedDocument;
  // On the marketing preview we keep the layout clean (no toolbar), but tiles
  // stay tappable-to-hear so the sample is still a live demo.
  preview?: boolean;
}) {
  if (preview) {
    return (
      <SpeechProvider>
        <article className="flex flex-col gap-7">{renderBlocks(doc)}</article>
      </SpeechProvider>
    );
  }

  return (
    <SpeechProvider>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ReadingSettings />
          <ReadAloud doc={doc} />
        </div>
        <article style={readingStyle} className="flex flex-col gap-7">
          {renderBlocks(doc)}
        </article>
      </div>
    </SpeechProvider>
  );
}
