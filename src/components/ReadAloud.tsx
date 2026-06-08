"use client";

import { useEffect, useRef, useState } from "react";
import type { ProcessedDocument } from "@/lib/types";
import { useSpeech } from "@/components/SpeechContext";

type Status = "idle" | "playing" | "paused";

// Flatten the document into short, speakable chunks. We split on sentences so
// each utterance stays short — some browsers (Chrome) cut off a single long
// utterance after ~15s, and short chunks sidestep that entirely.
function collectChunks(doc: ProcessedDocument): string[] {
  const chunks: string[] = [];
  for (const section of doc.sections) {
    const text = section.segments
      .map((s) => s.text)
      .join("")
      .trim();
    if (!text) continue;
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    chunks.push(...(sentences.length ? sentences : [text]));
  }
  return chunks;
}

export default function ReadAloud({ doc }: { doc: ProcessedDocument }) {
  const { supported, voices, voiceURI, setVoiceURI, makeUtterance } =
    useSpeech();
  const [status, setStatus] = useState<Status>("idle");
  // Tracks the utterances we queued so we can ignore stray events after a stop.
  const sessionRef = useRef(0);

  // Make sure speech stops if the reader leaves the page.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function play() {
    const synth = window.speechSynthesis;
    synth.cancel();

    const chunks = collectChunks(doc);
    if (chunks.length === 0) return;

    const session = sessionRef.current + 1;
    sessionRef.current = session;

    chunks.forEach((chunk, idx) => {
      const utterance = makeUtterance(chunk);
      if (idx === chunks.length - 1) {
        utterance.onend = () => {
          if (sessionRef.current === session) setStatus("idle");
        };
      }
      synth.speak(utterance);
    });

    setStatus("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setStatus("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setStatus("playing");
  }

  function stop() {
    sessionRef.current += 1; // invalidate pending onend handlers
    window.speechSynthesis.cancel();
    setStatus("idle");
  }

  if (!supported) return null;

  const btn =
    "rounded-2xl px-5 py-2.5 text-base font-bold shadow-sm transition-opacity hover:opacity-90";
  const primaryBtn = `bg-primary text-primary-foreground ${btn}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "idle" ? (
        <button type="button" onClick={play} className={primaryBtn}>
          ▶ Read aloud
        </button>
      ) : (
        <>
          {status === "playing" ? (
            <button type="button" onClick={pause} className={primaryBtn}>
              ⏸ Pause
            </button>
          ) : (
            <button type="button" onClick={resume} className={primaryBtn}>
              ▶ Resume
            </button>
          )}
          <button
            type="button"
            onClick={stop}
            className="rounded-2xl border border-border px-5 py-2.5 text-base font-bold text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            ⏹ Stop
          </button>
        </>
      )}

      {voices.length > 1 && (
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span className="sr-only sm:not-sr-only">Voice</span>
          <select
            value={voiceURI ?? ""}
            onChange={(e) => setVoiceURI(e.target.value)}
            aria-label="Choose a reading voice"
            className="max-w-[12rem] rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground"
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
