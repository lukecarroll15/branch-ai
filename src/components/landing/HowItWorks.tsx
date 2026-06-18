import Reveal from "@/components/landing/Reveal";

// ============================================================
// HOW IT WORKS — three calm, concrete steps.
// Data-driven so a step can be added or reworded in one place.
// Icons are inline SVGs (no icon dependency) and inherit colour.
// Sits on a soft banded background to separate it from the hero.
// ============================================================

type Step = {
  title: string;
  body: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  {
    title: "Upload your document",
    body: "Add a PDF, a photo of your notes, or a Word file. No retyping — Branch reads it for you.",
    icon: (
      <path
        d="M12 16V4m0 0L8 8m4-4l4 4M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "We reformat it for clarity",
    body: "Dense text becomes clean sections with colour-coded key terms — each with a phonics breakdown and a plain-English meaning.",
    icon: (
      <path
        d="M4 6h16M4 12h10M4 18h7M17 15l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Read with confidence",
    body: "Adjust the font, size and spacing to suit you, and tap any highlighted word whenever you need a hand.",
    icon: (
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border bg-background-2"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-deep sm:text-4xl">
            From overwhelming to understandable in three steps
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            No retyping, no clutter. Branch does the reformatting so students
            can focus on reading.
          </p>
        </div>

        <ol className="mt-14 grid gap-7 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 110}>
              <div className="group relative flex h-full flex-col rounded-3xl border border-border bg-surface p-8 shadow-soft transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-soft-lg">
                {/* corner icon */}
                <span className="absolute right-7 top-7 text-gold" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    {step.icon}
                  </svg>
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-bold text-primary transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105">
                  {i + 1}
                </span>
                <h3 className="mt-6 text-xl font-bold text-primary-deep">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
