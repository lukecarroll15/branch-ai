"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// PRODUCT PREVIEW — show, don't tell.
// A small "deck" of Branch notes that flips through subjects
// (Biology → History → Chemistry) like a stack of flashcards.
// Each face is a real miniature note: a short paragraph with
// colour-coded key terms. Hover or tap a term and a popover shows
// how the word breaks down (phonics) plus a plain-English meaning.
//
// The deck auto-advances slowly, pauses while the visitor is
// hovering or reading a term, can be driven with the dots, and
// fully respects `prefers-reduced-motion` (no auto-flip, no spin).
// Self-contained and client-side so it works on the marketing
// page without any backend.
// ============================================================

type Tier = "core" | "support" | "adv";

type TermData = {
  id: string;
  text: string;
  tier: Tier;
  syl: string; // phonics breakdown
  mean: string; // plain-English meaning
};

// A note's body is a sequence of plain-text runs and highlighted terms.
type Segment = string | TermData;

type Note = {
  subject: string;
  title: string;
  body: Segment[];
};

// Small helper so the note bodies below read almost like a sentence.
const t = (
  id: string,
  text: string,
  tier: Tier,
  syl: string,
  mean: string,
): TermData => ({ id, text, tier, syl, mean });

// The deck. Bodies are kept a similar length so every face sits
// comfortably in the same card height as it flips.
const NOTES: Note[] = [
  {
    subject: "Biology",
    title: "Photosynthesis",
    body: [
      t(
        "bio-photosynthesis",
        "Photosynthesis",
        "core",
        "pho·to·syn·the·sis",
        "How green plants make their own food using sunlight.",
      ),
      " is the process plants use to ",
      t(
        "bio-convert",
        "convert",
        "support",
        "con·vert",
        "To change something into a different form.",
      ),
      " light energy into chemical energy they can store and use later. It mostly happens in the ",
      t(
        "bio-chloroplasts",
        "chloroplasts",
        "core",
        "chlo·ro·plasts",
        "Tiny parts inside a plant cell where photosynthesis takes place.",
      ),
      ", which capture sunlight. The energy is stored as ",
      t(
        "bio-atp",
        "adenosine triphosphate",
        "adv",
        "a·den·o·sine tri·phos·phate",
        "The molecule (ATP) that cells use to store and carry energy.",
      ),
      ".",
    ],
  },
  {
    subject: "History",
    title: "The Cold War",
    body: [
      "After 1945, the United States and the ",
      t(
        "his-soviet",
        "Soviet Union",
        "support",
        "So·vi·et U·nion",
        "The former communist country led by Russia.",
      ),
      " entered a long ",
      t(
        "his-ideological",
        "ideological",
        "core",
        "i·de·o·log·i·cal",
        "Based on a strong set of political beliefs.",
      ),
      " standoff. There was no direct fighting — instead a tense ",
      t(
        "his-armsrace",
        "arms race",
        "adv",
        "arms race",
        "A race between rivals to build more and bigger weapons.",
      ),
      " led each side to ",
      t(
        "his-stockpile",
        "stockpile",
        "support",
        "stock·pile",
        "To build up a large store of something.",
      ),
      " nuclear weapons.",
    ],
  },
  {
    subject: "Chemistry",
    title: "Acids & Bases",
    body: [
      "An acid is a substance that releases ",
      t(
        "chem-hydrogen",
        "hydrogen ions",
        "core",
        "hy·dro·gen i·ons",
        "Tiny charged particles an acid gives off.",
      ),
      " when ",
      t(
        "chem-dissolved",
        "dissolved",
        "support",
        "dis·solved",
        "Mixed evenly into a liquid until it seems to vanish.",
      ),
      " in water. A base does the opposite, taking those ions in. We measure how acidic something is on the ",
      t(
        "chem-ph",
        "pH scale",
        "core",
        "pH scale",
        "A 0–14 scale of how acidic or basic something is.",
      ),
      ", from 0 to 14. When an acid and a base meet, they ",
      t(
        "chem-neutralise",
        "neutralise",
        "adv",
        "neu·tral·ise",
        "To cancel out — leaving something neither acid nor base.",
      ),
      " each other.",
    ],
  },
];

const FLIP_MS = 5500; // dwell time on each card before auto-advancing

// Tier → term styling (text, underline, fill). `open` is the slightly
// stronger fill applied while the popover is showing.
const TIER: Record<Tier, { term: string; open: string }> = {
  core: {
    term: "text-primary decoration-primary/40 bg-primary/[0.06] hover:bg-primary/[0.13]",
    open: "bg-primary/[0.13]",
  },
  support: {
    term: "text-gold-ink decoration-gold/60 bg-gold/10 hover:bg-gold/20",
    open: "bg-gold/20",
  },
  adv: {
    term: "text-clay decoration-clay/50 bg-clay/[0.09] hover:bg-clay/[0.18]",
    open: "bg-clay/[0.18]",
  },
};

const LEGEND: { label: string; className: string }[] = [
  { label: "Core concept", className: "bg-primary/55" },
  { label: "Supporting idea", className: "bg-gold/60" },
  { label: "Advanced detail", className: "bg-clay/55" },
  { label: "List sub-point", className: "bg-muted/40" },
];

function SpeakerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

function Term({
  data,
  open,
  onToggle,
  onOpen,
  onClose,
}: {
  data: TermData;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  const tier = TIER[data.tier];
  return (
    <span
      className={`relative inline cursor-pointer whitespace-nowrap rounded px-1 font-medium underline decoration-2 underline-offset-[3px] transition-colors ${tier.term} ${
        open ? tier.open : ""
      }`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {data.text}
      <span
        className={`absolute bottom-[calc(100%+12px)] left-1/2 z-20 w-60 -translate-x-1/2 rounded-2xl bg-primary-deep p-4 text-left shadow-soft-lg transition-all ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-1.5 opacity-0"
        }`}
      >
        <span className="block text-base font-bold tracking-wide text-gold-soft">
          {data.syl}
        </span>
        <span className="mt-1.5 block text-sm font-normal leading-snug text-white/90">
          {data.mean}
        </span>
        <span className="mt-3 flex items-center gap-2 border-t border-white/15 pt-3 text-sm text-white/85">
          <SpeakerIcon />
          Tap to hear it
        </span>
        {/* arrow */}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[7px] border-transparent border-t-primary-deep" />
      </span>
    </span>
  );
}

// One face of the flip card: a full miniature note for a subject.
//
// All faces share a single CSS grid cell ([grid-area:1/1]) so the card
// auto-sizes to the tallest note — no fixed height to overflow. `ghost`
// faces are an invisible copy of every note used purely to reserve that
// height; the two real faces (front/back) overlay them and do the flipping.
function NoteFace({
  note,
  rotation = 0,
  ghost = false,
  termProps,
}: {
  note: Note;
  rotation?: number; // 0 for the front face, 180 for the back
  ghost?: boolean;
  termProps: (data: TermData) => React.ComponentProps<typeof Term>;
}) {
  return (
    <div
      aria-hidden={ghost || undefined}
      className={`px-7 py-7 [grid-area:1/1] sm:px-8 ${
        ghost
          ? "invisible pointer-events-none"
          : "[backface-visibility:hidden]"
      }`}
      style={ghost ? undefined : { transform: `rotateY(${rotation}deg)` }}
    >
      <h2 className="text-2xl font-bold tracking-tight text-primary-deep">
        {note.title}
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        Tap a highlighted word to hear how it breaks down — and what it means.
      </p>

      <p className="mt-6 text-[1.05rem] leading-loose text-foreground">
        {note.body.map((seg, i) =>
          typeof seg === "string" ? (
            <span key={i}>{seg}</span>
          ) : (
            <Term key={seg.id} {...termProps(seg)} />
          ),
        )}
      </p>
    </div>
  );
}

export default function ProductPreview() {
  const [openId, setOpenId] = useState<string | null>(null);

  // Flip state. The inner card accumulates rotation (0 → 180 → 360 …); whichever
  // face is pointing at the viewer shows the current note. We keep the two faces'
  // note indices separately so the hidden face can be re-pointed to the next
  // subject *before* it rotates into view (no visible content pop).
  const [rotation, setRotation] = useState(0);
  const [frontNote, setFrontNote] = useState(0);
  const [backNote, setBackNote] = useState(1);
  const [index, setIndex] = useState(0); // current logical note
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Mirror the live values into refs so the auto-advance timer reads the latest
  // without needing them in its dependency list.
  const rotationRef = useRef(0);
  const indexRef = useRef(0);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Detect reduced-motion after mount (async via rAF so we never call setState
  // synchronously inside the effect body).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    const raf = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", apply);
    };
  }, []);

  // Flip to a specific note. Points the currently-hidden face at the target,
  // then turns the card a half-rotation so that face comes forward.
  const flipTo = useCallback((target: number) => {
    const frontShowing = (rotationRef.current / 180) % 2 === 0;
    if (frontShowing) setBackNote(target);
    else setFrontNote(target);
    setRotation((r) => r + 180);
    setIndex(target);
    setOpenId(null);
  }, []);

  const flipNext = useCallback(() => {
    flipTo((indexRef.current + 1) % NOTES.length);
  }, [flipTo]);

  // Auto-advance — paused while hovering, while a term popover is open, or under
  // reduced-motion. Re-arms after every flip because `index` is a dependency.
  useEffect(() => {
    if (reduced || paused || openId !== null) return;
    const id = setTimeout(flipNext, FLIP_MS);
    return () => clearTimeout(id);
  }, [reduced, paused, openId, index, flipNext]);

  // Click anywhere else closes the open popover.
  useEffect(() => {
    const close = () => setOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const termProps = (data: TermData) => ({
    data,
    open: openId === data.id,
    onOpen: () => setOpenId(data.id),
    onClose: () => setOpenId((cur) => (cur === data.id ? null : cur)),
    onToggle: () => setOpenId((cur) => (cur === data.id ? null : data.id)),
  });

  return (
    <div
      id="preview"
      className="relative scroll-mt-28 overflow-visible rounded-[26px] border border-border bg-surface shadow-soft-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top gloss */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[26px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6), transparent 30%)",
        }}
      />

      {/* Window chrome */}
      <div className="relative z-10 flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-clay/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary-light" aria-hidden="true" />
        <span className="ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-light opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-light" />
          </span>
          {NOTES[index].subject}
        </span>
      </div>

      {/* Flip viewport — auto-sizes to the tallest note (no fixed height). */}
      <div className="relative" style={{ perspective: "1400px" }}>
        <div
          className="grid [transform-style:preserve-3d]"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transition: reduced
              ? "none"
              : "transform 0.85s cubic-bezier(0.4, 0.1, 0.2, 1)",
          }}
        >
          {/* Invisible sizers — reserve height for the tallest subject. */}
          {NOTES.map((note) => (
            <NoteFace key={note.subject} note={note} ghost termProps={termProps} />
          ))}

          <NoteFace note={NOTES[frontNote]} rotation={0} termProps={termProps} />
          <NoteFace note={NOTES[backNote]} rotation={180} termProps={termProps} />
        </div>
      </div>

      {/* Footer: legend + deck dots */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border px-7 py-6 sm:px-8">
        {LEGEND.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-2 text-sm text-muted"
          >
            <span
              className={`h-3.5 w-3.5 rounded ${item.className}`}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}

        {/* Deck dots — jump to any subject. */}
        <div className="ml-auto flex items-center gap-2">
          {NOTES.map((note, i) => (
            <button
              key={note.subject}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (i !== index) flipTo(i);
              }}
              aria-label={`Show ${note.subject} example`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-primary"
                  : "w-2.5 bg-border hover:bg-primary-light"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
