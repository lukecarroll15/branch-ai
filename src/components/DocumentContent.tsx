import type { ProcessedDocument, Section, Segment } from "@/lib/types";
import KeywordTile from "@/components/KeywordTile";
import ReadAloud from "@/components/ReadAloud";
import ReadingSettings from "@/components/ReadingSettings";
import QuizBlock from "@/components/QuizBlock";
import StudyCard from "@/components/StudyCard";
import SimplifyParagraph from "@/components/SimplifyParagraph";
import { SpeechProvider } from "@/components/SpeechContext";

// Paragraphs shorter than this don't get a "Simplify this" control — they're
// already easy to read, and a button on every line would add clutter.
const SIMPLIFY_MIN_CHARS = 120;

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
// `simplify` enables the per-paragraph "Simplify this" control (off in preview).
function renderSection(section: Section, i: number, simplify: boolean) {
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

  const content = renderSegments(section.segments);
  const text = section.segments.map((s) => s.text).join("");

  if (simplify && text.trim().length > SIMPLIFY_MIN_CHARS) {
    return (
      <SimplifyParagraph key={i} text={text}>
        {content}
      </SimplifyParagraph>
    );
  }

  return <p key={i}>{content}</p>;
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

// Flatten a section's segments to plain text. Used for heading/key_point,
// which are plain text only (no tiles).
function plainText(section: Section): string {
  return section.segments.map((s) => s.text).join("");
}

// Render one block (a section or a folded quiz) from a card body. The shared
// `counter` keeps quiz questionIndex stable and unique across the whole
// document so quiz feedback stays correctly attributed.
function renderBodyBlock(
  block: Block,
  key: number,
  counter: { n: number },
  simplify: boolean,
  documentId?: string,
) {
  if (block.kind === "quiz") {
    const questionIndex = counter.n++;
    const correctIndex = block.options.findIndex((o) => o.isCorrect === true);
    return (
      <QuizBlock
        key={key}
        header={block.header ? renderSegments(block.header.segments) : null}
        // Options are plain answer text — flattened so we never nest a tile
        // <button> inside the option <button>.
        options={block.options.map((o) =>
          o.segments.map((s) => s.text).join(""),
        )}
        correctIndex={correctIndex >= 0 ? correctIndex : null}
        explanation={block.header?.explanation ?? null}
        documentId={documentId}
        questionIndex={questionIndex}
      />
    );
  }
  return renderSection(block.section, key, simplify);
}

// A topic card: a heading + its one-line key point + the full detail under it.
type Card = {
  heading: Section | null;
  keyPoint: Section | null;
  body: Block[];
};

// Group the block stream into topic cards. A "heading" block opens a new card;
// the "key_point" right after it becomes that card's summary; everything else
// is the card's body. Content before the first heading (or any stray block)
// falls into a headless card that renders without a collapse toggle.
function buildCards(blocks: Block[]): Card[] {
  const cards: Card[] = [];
  let current: Card | null = null;

  for (const block of blocks) {
    if (block.kind === "section" && block.section.sectionType === "heading") {
      current = { heading: block.section, keyPoint: null, body: [] };
      cards.push(current);
      continue;
    }
    if (block.kind === "section" && block.section.sectionType === "key_point") {
      if (current && current.heading && !current.keyPoint) {
        current.keyPoint = block.section;
        continue;
      }
      current = { heading: null, keyPoint: block.section, body: [] };
      cards.push(current);
      continue;
    }
    if (!current) {
      current = { heading: null, keyPoint: null, body: [] };
      cards.push(current);
    }
    current.body.push(block);
  }

  return cards;
}

function renderCards(
  doc: ProcessedDocument,
  simplify: boolean,
  defaultOpen: boolean,
  documentId?: string,
) {
  const cards = buildCards(buildBlocks(doc.sections));
  const counter = { n: 0 };

  return cards.map((card, i) => {
    const body = card.body.map((block, j) =>
      renderBodyBlock(block, j, counter, simplify, documentId),
    );

    // Headless card (intro text before the first heading): no card chrome,
    // just render the content so nothing is hidden behind a toggle.
    if (!card.heading) {
      return (
        <div key={i} className="flex flex-col gap-6">
          {card.keyPoint && (
            <p className="text-base text-muted">{plainText(card.keyPoint)}</p>
          )}
          {body}
        </div>
      );
    }

    return (
      <StudyCard
        key={i}
        heading={plainText(card.heading)}
        keyPoint={card.keyPoint ? plainText(card.keyPoint) : null}
        defaultOpen={defaultOpen}
      >
        {body}
      </StudyCard>
    );
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
  documentId,
  preview = false,
}: {
  doc: ProcessedDocument;
  // The documents table row id — used to log quiz feedback. Absent in preview.
  documentId?: string;
  // On the marketing preview we keep the layout clean (no toolbar), but tiles
  // stay tappable-to-hear so the sample is still a live demo.
  preview?: boolean;
}) {
  if (preview) {
    return (
      <SpeechProvider>
        <article className="flex flex-col gap-5">
          {/* Preview cards open by default so the marketing sample shows real
              content at a glance. */}
          {renderCards(doc, false, true)}
        </article>
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
        <article style={readingStyle} className="flex flex-col gap-5">
          {/* Study view: cards collapsed by default — only headings + key
              points show until the student opens a topic. */}
          {renderCards(doc, true, false, documentId)}
        </article>
      </div>
    </SpeechProvider>
  );
}
