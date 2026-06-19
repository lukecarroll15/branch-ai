import { redirect } from "next/navigation";

// Public sign-up is disabled for the pilot — accounts are provisioned by an
// admin in Supabase. Anyone landing on /signup (e.g. an old link) is sent to
// the login page.
export default function SignupPage() {
  redirect("/login");
}
