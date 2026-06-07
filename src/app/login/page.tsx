import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-10">
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h1>
        <p className="mt-3 text-center text-lg text-muted">
          Log in to your Branch account.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-tile-red-border bg-tile-red px-4 py-3 text-center text-base">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-6 rounded-xl border border-border bg-background px-4 py-3 text-center text-base">
            {message}
          </p>
        )}

        <form action={login} className="mt-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-lg font-bold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="rounded-xl border border-border bg-background px-4 py-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-lg font-bold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="rounded-xl border border-border bg-background px-4 py-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-2xl bg-primary px-8 py-4 text-center text-lg font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-base text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-primary hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-6 text-sm text-muted">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-primary-light">
            <path
              d="M6 10V8a6 6 0 1112 0v2m-9 0h6a3 3 0 013 3v5a3 3 0 01-3 3H9a3 3 0 01-3-3v-5a3 3 0 013-3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Private &amp; secure — your documents are only ever visible to you.
        </p>
      </div>
    </main>
  );
}
