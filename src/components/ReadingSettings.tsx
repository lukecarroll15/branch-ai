"use client";

import { useEffect, useState } from "react";

// Reading preferences live as CSS variables on :root so both the document page
// (the paper background) and DocumentContent (the text) pick them up. Defaults
// mirror globals.css so there's no flash before this runs.

type Bg = "cream" | "white" | "yellow";
type FontKey = "lexend" | "atkinson";
type Size = "s" | "m" | "l" | "xl";
type Spacing = "cozy" | "comfortable" | "spacious";

type Prefs = { bg: Bg; font: FontKey; size: Size; spacing: Spacing };

const STORAGE_KEY = "branch:reading";
const DEFAULTS: Prefs = {
  bg: "cream",
  font: "lexend",
  size: "m",
  spacing: "comfortable",
};

const BG_VALUES: Record<Bg, string> = {
  cream: "#f5f5dc",
  white: "#ffffff",
  yellow: "#fbf8c4",
};
const FONT_VALUES: Record<FontKey, string> = {
  lexend: "var(--font-lexend), ui-sans-serif, system-ui, sans-serif",
  atkinson: "var(--font-atkinson), ui-sans-serif, system-ui, sans-serif",
};
const SIZE_VALUES: Record<Size, string> = {
  s: "16px",
  m: "18px",
  l: "21px",
  xl: "24px",
};
const SPACING_VALUES: Record<
  Spacing,
  { line: string; word: string; letter: string }
> = {
  cozy: { line: "1.7", word: "0.12em", letter: "1px" },
  comfortable: { line: "1.95", word: "0.16em", letter: "2px" },
  spacious: { line: "2.3", word: "0.22em", letter: "3px" },
};

function apply(p: Prefs) {
  const r = document.documentElement.style;
  r.setProperty("--reading-bg", BG_VALUES[p.bg]);
  r.setProperty("--reading-font", FONT_VALUES[p.font]);
  r.setProperty("--reading-size", SIZE_VALUES[p.size]);
  const s = SPACING_VALUES[p.spacing];
  r.setProperty("--reading-line", s.line);
  r.setProperty("--reading-word", s.word);
  r.setProperty("--reading-letter", s.letter);
}

// A compact segmented control: one row of choices, the active one filled in.
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; style?: React.CSSProperties }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              style={opt.style}
              className={`min-h-11 rounded-xl border px-4 py-2 text-base font-bold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReadingSettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // Restore saved prefs on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = { ...DEFAULTS, ...JSON.parse(saved) } as Prefs;
        setPrefs(p);
        apply(p);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write failures (e.g. private mode)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-base font-bold text-muted transition-colors hover:border-primary hover:text-foreground"
      >
        ⚙ Reading settings
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <Segmented<Bg>
            label="Background"
            value={prefs.bg}
            onChange={(v) => update({ bg: v })}
            options={[
              {
                value: "cream",
                label: "Cream",
                style: { backgroundColor: prefs.bg === "cream" ? undefined : "#f5f5dc" },
              },
              { value: "white", label: "White" },
              {
                value: "yellow",
                label: "Soft yellow",
                style: { backgroundColor: prefs.bg === "yellow" ? undefined : "#fbf8c4" },
              },
            ]}
          />

          <Segmented<Size>
            label="Text size"
            value={prefs.size}
            onChange={(v) => update({ size: v })}
            options={[
              { value: "s", label: "A−" },
              { value: "m", label: "A" },
              { value: "l", label: "A+" },
              { value: "xl", label: "A++" },
            ]}
          />

          <Segmented<FontKey>
            label="Font"
            value={prefs.font}
            onChange={(v) => update({ font: v })}
            options={[
              { value: "lexend", label: "Lexend" },
              { value: "atkinson", label: "Atkinson" },
            ]}
          />

          <Segmented<Spacing>
            label="Spacing"
            value={prefs.spacing}
            onChange={(v) => update({ spacing: v })}
            options={[
              { value: "cozy", label: "Cozy" },
              { value: "comfortable", label: "Comfortable" },
              { value: "spacious", label: "Spacious" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
