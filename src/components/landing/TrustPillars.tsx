// ============================================================
// TRUST PILLARS — the reasons a student, parent or teacher can
// feel safe relying on Branch. This is the section that does the
// heavy lifting on trust: privacy, accessibility, evidence-led
// design, and a real human/educator story.
// ============================================================

type Pillar = {
  title: string;
  body: string;
  icon: React.ReactNode;
};

const pillars: Pillar[] = [
  {
    title: "Designed for dyslexia",
    body: "The Lexend typeface, generous line spacing and a calm cream background follow established dyslexia-friendly reading practice — chosen to reduce glare and visual stress.",
    icon: (
      <path
        d="M4 19.5V6a2 2 0 012-2h7v16H6a2 2 0 00-2 1.5zM13 4h5a2 2 0 012 2v13.5A2 2 0 0018 18h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Private & secure",
    body: "Each student signs in to their own account, and uploaded documents are only ever visible to them. We don't sell data or show ads — Branch is a study tool, nothing else.",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Built with educators",
    body: "Branch is being shaped through a real secondary-school pilot, with teacher feedback guiding every decision. It's made for the classroom, not in spite of it.",
    icon: (
      <path
        d="M3 9l9-5 9 5-9 5-9-5z M7 11.5V16c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5M21 9v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Accessible & adjustable",
    body: "Reading isn't one-size-fits-all. Change the font, size and spacing to read the way that works for you, and lean on phonics and plain-English meanings whenever a word gets tricky.",
    icon: (
      <path
        d="M12 4v16M6 8v8M18 8v8M3 11v2M21 11v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function TrustPillars() {
  return (
    <section id="trust" className="bg-accent/40">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary-mid">
            Why you can trust Branch
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Calm, careful, and built for real students
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Every choice in Branch — from the colours to the way your data is
            handled — is made to help students learn without anxiety.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="animate-fade-up flex gap-5 rounded-3xl border border-border bg-surface p-7 shadow-soft"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
                  {pillar.icon}
                </svg>
              </span>
              <div>
                <h3 className="text-xl font-bold">{pillar.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
