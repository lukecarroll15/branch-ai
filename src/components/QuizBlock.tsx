"use client";

import { useState } from "react";

// A quiz question with its answer options. Options are real buttons with clear
// hover + selected states and a 44px-minimum tap target, so they feel tappable
// rather than static. Single-select: tapping the chosen one marks it; tapping
// again clears it. (There's no answer key yet, so this is a self-check.)
export default function QuizBlock({
  header,
  options,
}: {
  header: React.ReactNode | null;
  options: string[];
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {header && (
        <h2 className="rounded-2xl bg-accent px-5 py-3 text-xl font-bold">
          {header}
        </h2>
      )}

      <div className="flex flex-col gap-3">
        {options.map((option, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(isSelected ? null : i)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-5 py-3 text-left text-lg transition-colors ${
                isSelected
                  ? "border-primary bg-accent font-bold"
                  : "border-border bg-surface hover:border-primary"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
