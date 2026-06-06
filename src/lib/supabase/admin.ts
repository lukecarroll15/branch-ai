import { createClient } from "@supabase/supabase-js";

// Admin client — uses the SECRET service-role key, so it bypasses row-level
// security. Server-only: never import this into a Client Component. Used by
// the processing pipeline to update a document's status/content regardless of
// which user is logged in.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
