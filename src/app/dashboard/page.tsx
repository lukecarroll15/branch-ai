import { createClient } from "@/lib/supabase/server";
import UploadButton from "@/components/UploadButton";
import DocumentRow from "@/components/DocumentRow";

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
      <div className="animate-fade-up flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your documents</h1>
        <p className="text-lg text-muted">
          Upload a document to get a dyslexia-friendly version. Everything here
          is private to you.
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
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
