// Content and styling tables for <ProductPreview>. Split out from the component
// so the deck can be edited (new subjects, new terms) without scrolling past
// the flip/popover logic — and to keep either file well under 500 lines.

type Tier = "core" | "support" | "adv";

export type TermData = {
  id: string;
  text: string;
  tier: Tier;
  syl: string; // phonics breakdown
  mean: string; // plain-English meaning
};

// A note's body is a sequence of plain-text runs and highlighted terms.
type Segment = string | TermData;

export type Note = {
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
export const NOTES: Note[] = [
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

export const FLIP_MS = 5500; // dwell time on each card before auto-advancing

// Tier → term styling (text, underline, fill). `open` is the slightly
// stronger fill applied while the popover is showing.
export const TIER: Record<Tier, { term: string; open: string }> = {
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

export const LEGEND: { label: string; className: string }[] = [
  { label: "Core concept", className: "bg-primary/55" },
  { label: "Supporting idea", className: "bg-gold/60" },
  { label: "Advanced detail", className: "bg-clay/55" },
  { label: "List sub-point", className: "bg-muted/40" },
];
