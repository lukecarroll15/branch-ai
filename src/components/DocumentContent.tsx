import type { ProcessedDocument, Section, Segment } from "@/lib/types";
import KeywordTile from "@/components/KeywordTile";

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

// Render a single section according to its type.
function renderSection(section: Section, i: number) {
  const content = renderSegments(section.segments);

  switch (section.sectionType) {
    case "bullet":
      return (
        <div key={i} className="flex gap-3">
          <span aria-hidden className="mt-1 text-primary-light">
            •
          </span>
          <p className="flex-1">{content}</p>
        </div>
      );

    case "quiz_header":
      return (
        <h2
          key={i}
          className="mt-4 rounded-2xl bg-accent px-5 py-3 text-xl font-bold"
        >
          {content}
        </h2>
      );

    case "quiz_option":
      return (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface px-5 py-3"
        >
          {content}
        </div>
      );

    case "paragraph":
    default:
      return (
        <p key={i} className="text-lg">
          {content}
        </p>
      );
  }
}

export default function DocumentContent({ doc }: { doc: ProcessedDocument }) {
  return (
    <article className="flex flex-col gap-5">
      {doc.sections.map((section, i) => renderSection(section, i))}
    </article>
  );
}
