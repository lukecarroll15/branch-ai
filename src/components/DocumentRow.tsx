"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DocumentRow as DocumentRowData } from "@/lib/types";

type Doc = Pick<DocumentRowData, "id" | "title" | "status" | "created_at">;

// Status pill shown on the right of each row.
function StatusBadge({ status }: { status: Doc["status"] }) {
  const styles = {
    processing: "bg-tile-orange border-tile-orange-border",
    complete: "bg-accent border-primary-light",
    error: "bg-tile-red border-tile-red-border",
  }[status];

  const label = {
    processing: "Processing…",
    complete: "Ready",
    error: "Failed",
  }[status];

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-bold ${styles}`}>
      {label}
    </span>
  );
}

export default function DocumentRow({ doc }: { doc: Doc }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not delete document.");
      }

      // Re-fetch the server component so the row disappears.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete document.");
      setDeleting(false);
    }
  }

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-5 shadow-soft transition-all hover:border-primary">
        <Link
          href={`/document/${doc.id}`}
          className="flex flex-1 items-center justify-between gap-4"
        >
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold">{doc.title}</span>
            <span className="text-sm text-muted">
              {new Date(doc.created_at).toLocaleDateString("en-IE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </span>
          <StatusBadge status={doc.status} />
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${doc.title}`}
          className="rounded-xl border border-border px-3 py-2 text-sm font-bold text-muted transition-colors hover:border-tile-red-border hover:bg-tile-red hover:text-foreground disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-tile-red-border bg-tile-red px-4 py-3 text-base">
          {error}
        </p>
      )}
    </li>
  );
}
