import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand — links home */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            B
          </span>
          <span className="text-xl font-bold tracking-tight">Branch</span>
        </Link>

        <nav>
          {user ? (
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-lg font-bold text-primary transition-colors hover:bg-primary/10"
              >
                Log out
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-lg font-bold text-primary transition-colors hover:bg-primary/10"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-lg font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
