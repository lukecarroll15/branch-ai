// ============================================================
// HOW IT WORKS — three calm, concrete steps.
// Data-driven so a step can be added or reworded in one place.
// Icons are inline SVGs (no icon dependency) and inherit colour.
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
        strokeWidth="2"
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
        strokeWidth="2"
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-primary-mid">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          From overwhelming to understandable in three steps
        </h2>
      </div>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="animate-fade-up flex flex-col rounded-3xl border border-border bg-surface p-8 shadow-soft"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
                  {step.icon}
                </svg>
              </span>
              <span className="text-sm font-bold text-muted">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
