import DocumentContent from "@/components/DocumentContent";
import { sampleDocument } from "@/lib/sample-document";

// ============================================================
// PRODUCT PREVIEW — show, don't tell.
// Renders a real processed document (the shared sample) inside a
// document-style card, so visitors see exactly what Branch produces
// before they ever sign in. Uses the same DocumentContent +
// KeywordTile components students use, so the preview can never
// drift from the real thing.
// ============================================================

// Small legend explaining the three tile tiers.
const LEGEND: { label: string; className: string }[] = [
  { label: "Core concept", className: "bg-tile-lavender border-tile-lavender-border" },
  { label: "Supporting idea", className: "bg-tile-orange border-tile-orange-border" },
  { label: "Advanced detail", className: "bg-tile-red border-tile-red-border" },
];

export default function ProductPreview() {
  return (
    <section id="preview" className="mx-auto w-full max-w-4xl px-6 py-16">
      <div className="animate-fade-up rounded-[2rem] border border-border bg-accent/60 p-3 shadow-soft-lg sm:p-5">
        {/* Document card with a soft window chrome */}
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          {/* Chrome bar */}
          <div className="flex items-center gap-2 border-b border-border bg-background px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-tile-red-border" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-tile-orange-border" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-primary-light" aria-hidden="true" />
            <span className="ml-3 text-sm font-bold text-muted">
              Your study notes
            </span>
          </div>

          <div className="p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-wide text-primary-mid">
              A live preview
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {sampleDocument.title}
            </h2>
            <p className="mt-2 text-base text-muted">
              Hover or tap a highlighted word to hear how it breaks down and
              what it means.
            </p>

            <div className="mt-8">
              <DocumentContent doc={sampleDocument} preview />
            </div>

            {/* Legend */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6">
              {LEGEND.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-muted"
                >
                  <span
                    className={`h-4 w-4 rounded border ${item.className}`}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
