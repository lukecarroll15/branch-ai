import Link from "next/link";

// ============================================================
// HERO — the trust-building front door.
// Warm, calm headline + a clear primary action. The `loggedIn`
// flag swaps the CTA between "Go to dashboard" and "Get started"
// so the page works for both visitors and returning students.
// ============================================================

// Tiny check used in the reassurance row beneath the buttons.
function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-primary-light"
    >
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft radial glow — subtle depth without changing the palette. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, var(--accent) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-6 pb-12 pt-20 text-center sm:pt-28">
        {/* Reassurance badge */}
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-bold text-primary-mid shadow-soft">
          <span
            className="h-2 w-2 rounded-full bg-primary-light"
            aria-hidden="true"
          />
          Designed with teachers, for dyslexic students
        </span>

        <h1
          className="animate-fade-up mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Study notes that make sense — for the way you read.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-muted"
          style={{ animationDelay: "120ms" }}
        >
          Branch turns dense, intimidating documents into clean, colour-coded
          study notes built for dyslexic learners. Less overwhelm, more
          understanding.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="w-full rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 hover:opacity-95 sm:w-auto"
          >
            {loggedIn ? "Go to your dashboard" : "Get started"}
          </Link>
          <Link
            href="#how-it-works"
            className="w-full rounded-2xl border border-border bg-surface px-8 py-4 text-lg font-bold text-primary transition-colors hover:border-primary sm:w-auto"
          >
            See how it works
          </Link>
        </div>

        {/* Trust row */}
        <ul
          className="animate-fade-up mx-auto mt-10 flex max-w-xl flex-col items-center justify-center gap-3 text-base text-muted sm:flex-row sm:gap-6"
          style={{ animationDelay: "240ms" }}
        >
          <li className="flex items-center gap-2">
            <Check /> Dyslexia-friendly by design
          </li>
          <li className="flex items-center gap-2">
            <Check /> Private &amp; secure
          </li>
          <li className="flex items-center gap-2">
            <Check /> Built with educators
          </li>
        </ul>
      </div>
    </section>
  );
}
