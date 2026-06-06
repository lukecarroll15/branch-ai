import Link from "next/link";

// ============================================================
// FINAL CTA — one last calm invitation. Mirrors the hero's
// primary action so the page closes the loop wherever the
// visitor scrolled from.
// ============================================================

export default function FinalCta({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24 pt-4">
      <div className="animate-fade-up relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-center shadow-soft-lg sm:px-16">
        {/* Soft highlight in the top corner for a little warmth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 70% at 85% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to make studying calmer?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
            Turn your next reading into clean, colour-coded notes you can
            actually get through.
          </p>
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="mt-9 inline-block rounded-2xl bg-surface px-8 py-4 text-lg font-bold text-primary shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {loggedIn ? "Go to your dashboard" : "Get started"}
          </Link>
        </div>
      </div>
    </section>
  );
}
