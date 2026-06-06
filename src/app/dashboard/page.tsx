import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/types";
import UploadButton from "@/components/UploadButton";

// Small status pill shown on each document row.
function StatusBadge({ status }: { status: DocumentRow["status"] }) {
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

export default async function DashboardPage() {
  const supabase = await createClient();

  // Middleware guarantees a session here, but fetch the user to scope the query.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const docs = documents ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your documents</h1>
        <p className="text-lg text-muted">
          Upload a document to get a dyslexia-friendly version.
        </p>
      </div>

      <UploadButton />

      <div className="mt-10">
        {docs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="text-lg text-muted">
              You haven&apos;t uploaded anything yet.
            </p>
            <p className="mt-1 text-lg text-muted">
              Your processed documents will appear here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/document/${doc.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-5 shadow-sm transition-colors hover:border-primary"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
