import Link from "next/link";
import { notFound } from "next/navigation";
import DocumentContent from "@/components/DocumentContent";
import ProcessingState from "@/components/ProcessingState";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/types";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures a student can only fetch their own documents; anyone else's
  // id simply returns no row.
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  const doc = data as DocumentRow | null;
  if (!doc) notFound();

  const isReady = doc.status === "complete" && doc.processed_content;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="self-start text-base font-bold text-primary transition-opacity hover:opacity-80"
      >
        ← Back to your documents
      </Link>

      <div className="animate-fade-up mt-8 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {doc.title}
        </h1>

        {isReady ? (
          <>
            <p className="mt-2 text-base text-muted">
              Hover or tap a highlighted word to hear how it breaks down and
              what it means.
            </p>
            <div className="mt-8">
              <DocumentContent doc={doc.processed_content!} />
            </div>
          </>
        ) : doc.status === "error" ? (
          <p className="mt-6 rounded-xl border border-tile-red-border bg-tile-red px-4 py-3 text-base">
            Something went wrong processing this document. Try uploading it
            again.
          </p>
        ) : (
          <ProcessingState />
        )}
      </div>
    </main>
  );
}
