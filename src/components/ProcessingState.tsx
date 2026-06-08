"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Cheerful, plain-language updates that rotate while we wait, so the page
// always feels alive and a young reader knows nothing is broken.
const MESSAGES = [
  "Reading your document…",
  "Finding the important words…",
  "Breaking the tricky words into sounds…",
  "Adding colours to help you read…",
  "Almost ready…",
];

export default function ProcessingState() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  // Re-fetch the server component on a timer. When the document's status flips
  // to "complete" or "error", the page re-renders and this component unmounts —
  // so the student never has to refresh by hand.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [router]);

  // Cycle the reassuring messages.
  useEffect(() => {
    const id = setInterval(
      () => setMessageIndex((i) => (i + 1) % MESSAGES.length),
      2500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-tile-orange-border bg-tile-orange px-6 py-12 text-center"
    >
      <div className="flex items-end gap-2.5" aria-hidden="true">
        <span
          className="h-5 w-5 animate-bounce-dot rounded-full bg-tile-lavender-border"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-5 w-5 animate-bounce-dot rounded-full bg-tile-orange-border"
          style={{ animationDelay: "160ms" }}
        />
        <span
          className="h-5 w-5 animate-bounce-dot rounded-full bg-tile-red-border"
          style={{ animationDelay: "320ms" }}
        />
      </div>

      <div>
        <p className="text-xl font-bold">{MESSAGES[messageIndex]}</p>
        <p className="mt-1 text-base text-muted">
          This usually takes a few seconds. The page will update on its own —
          you don&apos;t need to refresh.
        </p>
      </div>
    </div>
  );
}
