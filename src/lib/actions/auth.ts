"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Log in with email + password. On failure we redirect back to /login with
// the error message in the query string so the page can show it.
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// NOTE: Public sign-up is intentionally disabled for the pilot. Pilot students
// are provisioned by an admin in Supabase (create the user with "Auto Confirm"
// so there's no email step). /signup redirects to /login. If self-serve signup
// is ever needed again, re-add a `signup` action here that calls
// supabase.auth.signUp.

// Sign out and return to the login page.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
