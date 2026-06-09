"use client";

import { useState } from "react";

// Wraps a paragraph with an on-demand "Simplify this" control. Tapping it asks
// Gemini to rewrite the passage in plainer language; the student can flip back
// to the original at any time. Kept deliberately quiet to stay distraction-free.
export default function SimplifyParagraph({
  text,
  children,
}: {
  text: string; // plain text of the paragraph, sent to Gemini
  children: React.ReactNode; // the original rendered paragraph (with tiles)
}) {
  const [simplified, setSimplified] = useState<string | null>(null);
  const [showing, setShowing] = useState<"original" | "simplified">("original");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSimplify() {
    // Already fetched once — just flip back to it, no extra Gemini call.
    if (simplified) {
      setShowing("simplified");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not simplify.");
      setSimplified(json.simplified);
      setShowing("simplified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not simplify.");
    } finally {
      setLoading(false);
    }
  }

  const showingSimplified = showing === "simplified" && simplified;

  return (
    <div className="flex flex-col gap-1.5">
      <p>{showingSimplified ? simplified : children}</p>

      <div className="flex flex-wrap items-center gap-3">
        {showing === "original" ? (
          <button
            type="button"
            onClick={handleSimplify}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-bold text-primary transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {loading ? "Simplifying…" : "✨ Simplify this"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowing("original")}
            className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-bold text-muted transition-colors hover:text-foreground"
          >
            ↩ Show original
          </button>
        )}

        {error && (
          <span className="rounded-lg border border-tile-red-border bg-tile-red px-3 py-1 text-sm">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
