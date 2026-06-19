"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "Try again" for a document whose processing failed. It re-runs the pipeline
// on the already-uploaded file (no re-upload), then refreshes so the view
// reflects the new "processing" state.
export default function RetryButton({
  documentId,
  className,
  label = "Try again",
}: {
  documentId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not try again.");
      }
      // The row is now "processing" — refresh so the spinner/poller takes over.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not try again.");
      setRetrying(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className={
          className ??
          "rounded-xl border border-border px-4 py-2 text-base font-bold text-primary transition-colors hover:border-primary disabled:opacity-60"
        }
      >
        {retrying ? "Trying again…" : label}
      </button>
      {error && (
        <p className="mt-2 rounded-xl border border-tile-red-border bg-tile-red px-4 py-3 text-base">
          {error}
        </p>
      )}
    </>
  );
}
