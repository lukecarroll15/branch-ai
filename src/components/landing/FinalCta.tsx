import Link from "next/link";
import BranchLogo from "@/components/BranchLogo";

// ============================================================
// FINAL CTA — one last calm invitation. A deep-green panel with
// a warm gold action, mirroring the hero's primary CTA so the
// page closes the loop wherever the visitor scrolled from.
// ============================================================

export default function FinalCta({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-4">
      <div className="animate-fade-up relative overflow-hidden rounded-[26px] bg-primary-deep px-8 py-16 text-center shadow-soft-lg sm:px-16 sm:py-20">
        {/* Faint tree watermark in the corner. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -right-8 w-80 opacity-10"
          style={{ filter: "brightness(0) invert(1)" }}
        >
          <BranchLogo className="h-auto w-full" />
        </div>

        <div className="relative">
          <h2 className="mx-auto max-w-[20ch] text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to make studying calmer?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
            Turn your next reading into clean, colour-coded notes you can
            actually get through.
          </p>
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 text-lg font-bold text-primary-deep shadow-soft transition-transform hover:-translate-y-0.5 hover:opacity-95"
          >
            {loggedIn ? "Go to your dashboard" : "Get started"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
