import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & data · Branch",
  description:
    "Plain-English answers to how Branch handles student data during the pilot.",
};

// A short, honest privacy page written in plain English. For a school pilot,
// being clear about data is one of the strongest trust signals we can offer.
// Content is data-driven so it's easy to keep accurate as the pilot evolves.
const sections: { heading: string; body: string }[] = [
  {
    heading: "What we collect",
    body: "Just what we need to run Branch: your account details (email and name) and the documents you choose to upload, along with the dyslexia-friendly version we create from them.",
  },
  {
    heading: "Who can see your documents",
    body: "Only you. Each student signs in to their own account, and uploaded documents are tied to that account. Other students can't see your work, and we don't make it public.",
  },
  {
    heading: "How we use your documents",
    body: "Your documents are used to create your study notes and nothing else. We use Google's Gemini AI to reformat the text, sent securely for processing. We don't use your work to train our own models, and we never sell it.",
  },
  {
    heading: "No ads, no tracking for sale",
    body: "Branch is a study tool, not an advertising business. We don't show ads and we don't sell your data to anyone.",
  },
  {
    heading: "Deleting your data",
    body: "You can ask us to delete your account and everything in it at any time, and we'll remove it. During the pilot, just email us and we'll take care of it.",
  },
  {
    heading: "This is a pilot",
    body: "Branch is currently a small school pilot, and we're refining how it works alongside teachers. If anything about how your data is handled changes, we'll explain it clearly here.",
  },
];

const CONTACT_EMAIL = "info@learningwithbranch.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="self-start text-base font-bold text-primary transition-opacity hover:opacity-80"
      >
        ← Back home
      </Link>

      <div className="animate-fade-up mt-8 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-12">
        <p className="text-sm font-bold uppercase tracking-wide text-primary-mid">
          Privacy &amp; data
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Your work stays yours
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          We keep this simple and honest. Here&apos;s exactly how Branch handles
          your information during the pilot.
        </p>

        <dl className="mt-10 flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.heading}>
              <dt className="text-xl font-bold">{section.heading}</dt>
              <dd className="mt-2 text-base leading-relaxed text-muted">
                {section.body}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-2xl bg-accent px-6 py-5">
          <p className="text-base leading-relaxed">
            Questions about your data? Email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-bold text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            and a real person will get back to you.
          </p>
        </div>
      </div>
    </main>
  );
}
