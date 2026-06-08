"use client";

import type { TileColor } from "@/lib/types";
import { useSpeech } from "@/components/SpeechContext";

// Fill + border classes per priority tier. The colour utilities come from the
// theme tokens in globals.css (bg-tile-*, border-tile-*-border).
const TILE_STYLES: Record<TileColor, string> = {
  lavender: "bg-tile-lavender border-tile-lavender-border",
  orange: "bg-tile-orange border-tile-orange-border",
  red: "bg-tile-red border-tile-red-border",
};

interface KeywordTileProps {
  text: string;
  color: TileColor;
  phonics?: string;
  explanation?: string;
}

// An inline, colour-coded keyword. On hover or keyboard focus it reveals a card
// with the phonics breakdown and a simple explanation; tapping it reads the word
// and its meaning aloud — the core reading aid for dyslexic students.
export default function KeywordTile({
  text,
  color,
  phonics,
  explanation,
}: KeywordTileProps) {
  const { speak } = useSpeech();
  const hasAids = Boolean(phonics || explanation);

  function handleSpeak() {
    speak(explanation ? `${text}. ${explanation}` : text);
  }

  return (
    <span className="group relative inline-block">
      {hasAids ? (
        <button
          type="button"
          onClick={handleSpeak}
          aria-label={`Hear "${text}"${explanation ? `: ${explanation}` : ""}`}
          className={`cursor-pointer rounded-md border px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-primary/40 ${TILE_STYLES[color]}`}
        >
          {text}
        </button>
      ) : (
        <span
          className={`rounded-md border px-1.5 py-0.5 font-bold ${TILE_STYLES[color]}`}
        >
          {text}
        </span>
      )}

      {hasAids && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-2xl border border-border bg-surface p-4 text-left text-base leading-relaxed opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {phonics && (
            <span className="block font-bold text-primary">{phonics}</span>
          )}
          {explanation && (
            <span className="mt-1 block text-foreground">{explanation}</span>
          )}
          <span className="mt-2 block text-sm text-muted">🔊 Tap to hear it</span>
        </span>
      )}
    </span>
  );
}
