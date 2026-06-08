import Link from "next/link";

// ============================================================
// FOOTER — multi-column enterprise footer.
// Columns are data-driven (footerSections below) so adding a
// link or a whole column is a one-line edit. Styling pulls from
// the shared theme tokens in globals.css (bg-surface, text-muted,
// border-border, primary greens) so it stays on-brand.
// ============================================================

type FooterLink = { label: string; href: string };
type FooterSection = { heading: string; links: FooterLink[] };

// Every link points to something that actually exists — a landing-page
// section, a real route, or an email. During the pilot we'd rather show a
// short, honest footer than a tidy-looking one full of dead links.
const CONTACT_EMAIL = "info@learningwithbranch.com";

const footerSections: FooterSection[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "See a preview", href: "/#preview" },
      { label: "Your dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Trust & privacy",
    links: [
      { label: "Why Branch", href: "/#trust" },
      { label: "Privacy & data", href: "/privacy" },
      { label: "Contact us", href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create an account", href: "/signup" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      {/* Top: brand + link columns.
          One even grid (cols-5 on desktop): brand spans 2, each of the
          three link columns spans 1 — so everything fills edge-to-edge
          instead of the columns bunching to one side. The <nav> uses
          `contents` so its columns become direct cells of this grid. */}
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand + mission */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                B
              </span>
              <span className="text-xl font-bold tracking-tight">Branch</span>
            </Link>

            <p className="mt-5 max-w-xs text-base leading-relaxed text-muted">
              A dyslexia-friendly study companion — built to make learning
              calmer, clearer, and more accessible for every student.
            </p>

            <p className="mt-6 max-w-xs text-base leading-relaxed text-muted">
              Questions about the pilot?{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-bold text-primary hover:underline"
              >
                Get in touch
              </a>
              .
            </p>
          </div>

          {/* Link columns — `contents` lets each column sit directly in
              the parent grid so they spread evenly across the full width. */}
          <nav aria-label="Footer" className="contents">
            {footerSections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                  {section.heading}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-base text-muted transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar: copyright + social + region */}
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Branch AI. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="text-sm text-muted">
              Made with care for dyslexic learners 🌱
            </span>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
