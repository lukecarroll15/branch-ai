"use client";

import { useState } from "react";

type Rating = "easy" | "hard";

// A quiz question with its answer options. Options are real buttons with clear
// hover / selected / correct / wrong states and a 44px-minimum tap target.
//
// When an answer key is available (correctIndex set), tapping an option reveals
// whether it's right, locks the question, shows the explanation, and asks the
// student whether it was easy or hard (stored for spaced-repetition data).
// Without an answer key it falls back to a simple self-check toggle.
export default function QuizBlock({
  header,
  options,
  correctIndex,
  explanation,
  documentId,
  questionIndex,
}: {
  header: React.ReactNode | null;
  options: string[];
  correctIndex: number | null;
  explanation: string | null;
  documentId?: string;
  questionIndex: number;
}) {
  const hasKey = correctIndex !== null;
  const [selected, setSelected] = useState<number | null>(null); // self-check mode
  const [answered, setAnswered] = useState<number | null>(null); // graded mode
  const [rating, setRating] = useState<Rating | null>(null);

  const locked = hasKey && answered !== null;

  function handlePick(i: number) {
    if (!hasKey) {
      setSelected((prev) => (prev === i ? null : i));
      return;
    }
    if (answered !== null) return; // locked after first answer
    setAnswered(i);
  }

  async function sendRating(value: Rating) {
    if (!documentId) return;
    setRating(value); // optimistic — feedback is non-critical for the pilot
    try {
      await fetch("/api/quiz-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, questionIndex, rating: value }),
      });
    } catch {
      // ignore — we don't want a failed log to disrupt the student
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {header && (
        <h2 className="rounded-2xl bg-accent px-5 py-3 text-xl font-bold">
          {header}
        </h2>
      )}

      <div className="flex flex-col gap-3">
        {options.map((option, i) => {
          // Work out this option's visual state.
          let stateClass = "border-border bg-surface hover:border-primary";
          let mark = "";
          let markClass = "border-border";

          if (locked) {
            if (i === correctIndex) {
              stateClass = "border-primary bg-accent font-bold";
              mark = "✓";
              markClass = "border-primary bg-primary text-primary-foreground";
            } else if (i === answered) {
              stateClass = "border-tile-red-border bg-tile-red";
              mark = "✗";
              markClass = "border-tile-red-border bg-tile-red";
            } else {
              stateClass = "border-border bg-surface opacity-60";
            }
          } else if (!hasKey && selected === i) {
            stateClass = "border-primary bg-accent font-bold";
            mark = "✓";
            markClass = "border-primary bg-primary text-primary-foreground";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              aria-pressed={hasKey ? i === answered : selected === i}
              onClick={() => handlePick(i)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-5 py-3 text-left text-lg transition-colors ${stateClass} ${
                locked ? "cursor-default" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${markClass}`}
              >
                {mark}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {locked && (
        <div className="rounded-2xl border border-border bg-surface px-5 py-3 text-base">
          <span className="font-bold">
            {answered === correctIndex ? "Correct! " : "Not quite. "}
          </span>
          {explanation}
        </div>
      )}

      {locked && documentId && (
        <div className="flex flex-wrap items-center gap-2">
          {rating ? (
            <span className="text-sm text-muted">Thanks for the feedback!</span>
          ) : (
            <>
              <span className="mr-1 text-sm font-bold text-muted">
                Was this easy or hard?
              </span>
              <button
                type="button"
                onClick={() => sendRating("easy")}
                className="min-h-11 rounded-xl border border-border bg-surface px-4 py-2 text-base font-bold transition-colors hover:border-primary"
              >
                👍 Easy
              </button>
              <button
                type="button"
                onClick={() => sendRating("hard")}
                className="min-h-11 rounded-xl border border-border bg-surface px-4 py-2 text-base font-bold transition-colors hover:border-primary"
              >
                👎 Hard
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
