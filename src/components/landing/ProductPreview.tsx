"use client";

import { useEffect, useState } from "react";

// ============================================================
// PRODUCT PREVIEW — show, don't tell.
// An interactive miniature of a Branch note: a short paragraph
// with colour-coded key terms. Hover or tap a term and a popover
// shows how the word breaks down (phonics) plus a plain-English
// meaning — exactly the help students get inside the product.
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

// The terms highlighted in the sample note below.
const TERMS: Record<string, TermData> = {
  photosynthesis: {
    id: "photosynthesis",
    text: "Photosynthesis",
    tier: "core",
    syl: "pho·to·syn·the·sis",
    mean: "How green plants make their own food using sunlight.",
  },
  convert: {
    id: "convert",
    text: "convert",
    tier: "support",
    syl: "con·vert",
    mean: "To change something into a different form.",
  },
  chloroplasts: {
    id: "chloroplasts",
    text: "chloroplasts",
    tier: "core",
    syl: "chlo·ro·plasts",
    mean: "Tiny parts inside a plant cell where photosynthesis takes place.",
  },
  atp: {
    id: "atp",
    text: "adenosine triphosphate",
    tier: "adv",
    syl: "a·den·o·sine tri·phos·phate",
    mean: "The molecule (ATP) that cells use to store and carry energy.",
  },
};

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

export default function ProductPreview() {
  const [openId, setOpenId] = useState<string | null>(null);

  // Click anywhere else closes the open popover.
  useEffect(() => {
    const close = () => setOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const termProps = (id: string) => ({
    data: TERMS[id],
    open: openId === id,
    onOpen: () => setOpenId(id),
    onClose: () => setOpenId((cur) => (cur === id ? null : cur)),
    onToggle: () => setOpenId((cur) => (cur === id ? null : id)),
  });

  return (
    <div
      id="preview"
      className="relative scroll-mt-28 overflow-visible rounded-[26px] border border-border bg-surface shadow-soft-lg"
    >
      {/* Top gloss */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[26px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6), transparent 30%)",
        }}
      />

      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-clay/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary-light" aria-hidden="true" />
        <span className="ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-light opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-light" />
          </span>
          Live preview
        </span>
      </div>

      <div className="relative px-7 py-7 sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary-deep">
          Photosynthesis
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Tap a highlighted word to hear how it breaks down — and what it means.
        </p>

        <p className="mt-6 text-[1.05rem] leading-loose text-foreground">
          <Term {...termProps("photosynthesis")} /> is the process plants use to{" "}
          <Term {...termProps("convert")} /> light energy into chemical energy
          they can store and use later. It mostly happens in the{" "}
          <Term {...termProps("chloroplasts")} />, which capture sunlight. The
          energy is stored as <Term {...termProps("atp")} />.
        </p>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6">
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
        </div>
      </div>
    </div>
  );
}
