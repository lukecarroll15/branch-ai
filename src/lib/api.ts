import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Shared plumbing for the route handlers under src/app/api. Every route needs
// the same three things — a signed-in user, a parsed body, and a document the
// caller actually owns — and each of them can fail with a canned response. The
// helpers return either the value or the response to hand straight back, so a
// route reads as a list of guards instead of repeating the same blocks.

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// A failed guard, carrying the response the route should return.
type Failed = { error: NextResponse };

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Resolve the signed-in user plus a client scoped to their session.
export async function requireUser(): Promise<
  { supabase: SupabaseClient; user: User } | Failed
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: apiError("Not authenticated", 401) };
  }

  return { supabase, user };
}

// Parse a JSON request body. Stays `unknown` — callers narrow it themselves.
export async function readJson(
  request: Request,
): Promise<{ body: unknown } | Failed> {
  try {
    return { body: await request.json() };
  } catch {
    return { error: apiError("Invalid request", 400) };
  }
}

// Look up a document the caller owns. RLS already scopes this to the current
// user; we filter on user_id explicitly too.
export async function findOwnedDocument(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<{ doc: { id: string; file_path: string | null } } | Failed> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { error: apiError("Document not found", 404) };
  }

  return { doc: data };
}

// The whole preamble for a /api/documents/[id] handler: await the route params,
// require a signed-in user, and load the document they own.
export async function requireOwnedDocument(
  params: Promise<{ id: string }>,
): Promise<
  {
    id: string;
    supabase: SupabaseClient;
    user: User;
    doc: { id: string; file_path: string | null };
  } | Failed
> {
  const { id } = await params;

  const auth = await requireUser();
  if ("error" in auth) return auth;

  const found = await findOwnedDocument(auth.supabase, id, auth.user.id);
  if ("error" in found) return found;

  return { id, supabase: auth.supabase, user: auth.user, doc: found.doc };
}
