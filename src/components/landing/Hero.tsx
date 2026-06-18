import Link from "next/link";
import ProductPreview from "@/components/landing/ProductPreview";

// ============================================================
// HERO — the trust-building front door.
// Two columns on desktop: a calm headline + clear primary action
// on the left, and a live, interactive preview of a Branch note
// on the right (so visitors see the product before signing up).
// Stacks to a single column on mobile. The `loggedIn` flag swaps
// the CTA between "Go to your dashboard" and "Get started".
// ============================================================

// Tiny check used in the reassurance row beneath the buttons.
function Check() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent">
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="h-3 w-3">
        <path
          d="M2.5 6.2l2.2 2.3 4.8-5"
          stroke="var(--primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Soft radial glow — subtle depth without changing the palette. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 0%, var(--accent) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-10 pt-8 lg:grid-cols-[1fr_1.02fr] lg:gap-12 lg:pt-8">
        {/* ---- Left: copy ---- */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-4 py-1.5 text-sm font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            Designed with teachers, for dyslexic students
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-primary-deep sm:text-5xl lg:text-5xl">
            Study notes that make sense —{" "}
            <span className="text-primary">for the way you read.</span>
          </h1>

          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            Branch turns dense, intimidating documents into clean, colour-coded
            notes built for dyslexic learners. Less overwhelm, more
            understanding.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-lg font-bold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 hover:opacity-95"
            >
              {loggedIn ? "Go to your dashboard" : "Get started"}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-7 py-4 text-lg font-bold text-primary transition-colors hover:border-primary"
            >
              See how it works
            </Link>
          </div>

          {/* Trust row */}
          <ul className="mt-8 flex flex-col gap-3 text-base text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
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

        {/* ---- Right: live preview card ---- */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
