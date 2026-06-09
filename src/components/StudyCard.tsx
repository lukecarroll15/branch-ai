"use client";

import { useState } from "react";

// A collapsible topic card. The heading and one-line key point are always
// visible so the whole document stays scannable; the full detail expands on
// tap. Collapsed by default in the study view (less on screen at once — the
// top pre-pilot ask from dyslexic students), open by default in the preview.
export default function StudyCard({
  heading,
  keyPoint,
  defaultOpen = false,
  children,
}: {
  heading: React.ReactNode;
  keyPoint: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-[var(--reading-bg)] shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-start gap-3 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-7 sm:py-5"
      >
        <span
          aria-hidden
          className={`mt-1 shrink-0 text-primary transition-transform duration-150 ${
            open ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
        <span className="flex-1">
          <span className="block text-xl font-bold tracking-tight sm:text-2xl">
            {heading}
          </span>
          {keyPoint && (
            <span className="mt-1 block text-base text-muted">{keyPoint}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 border-t border-border px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          {children}
        </div>
      )}
    </section>
  );
}
