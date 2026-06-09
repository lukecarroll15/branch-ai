import type { ProcessedDocument } from "@/lib/types";

// Stand-in for a real AI-processed document. Used by the document view until
// upload + Gemini processing are wired up. Shows all three tile tiers and
// every section type so we can see the full reading experience.
export const sampleDocument: ProcessedDocument = {
  title: "Photosynthesis",
  sections: [
    {
      sectionType: "heading",
      segments: [{ text: "What photosynthesis is", isTile: false }],
    },
    {
      sectionType: "key_point",
      segments: [
        {
          text: "Plants turn sunlight into food they can store for later.",
          isTile: false,
        },
      ],
    },
    {
      sectionType: "paragraph",
      segments: [
        { text: "", isTile: false },
        {
          text: "Photosynthesis",
          isTile: true,
          color: "lavender",
          phonics: "pho-to-syn-the-sis",
          explanation:
            "How green plants make their own food using sunlight.",
        },
        {
          text: " is the process that plants use to ",
          isTile: false,
        },
        {
          text: "convert",
          isTile: true,
          color: "orange",
          phonics: "con-vert",
          explanation: "To change something into a different form.",
        },
        {
          text: " light energy into chemical energy that they can store and use later.",
          isTile: false,
        },
      ],
    },
    {
      sectionType: "paragraph",
      segments: [
        { text: "It mostly happens in the ", isTile: false },
        {
          text: "chloroplasts",
          isTile: true,
          color: "lavender",
          phonics: "chlo-ro-plasts",
          explanation:
            "Tiny parts inside a plant cell where photosynthesis takes place.",
        },
        {
          text: ", which contain a green pigment that captures sunlight.",
          isTile: false,
        },
      ],
    },
    {
      sectionType: "heading",
      segments: [{ text: "What goes in and out", isTile: false }],
    },
    {
      sectionType: "key_point",
      segments: [
        {
          text: "Plants take in carbon dioxide and water, and give off oxygen.",
          isTile: false,
        },
      ],
    },
    {
      sectionType: "bullet",
      segments: [
        { text: "Plants take in carbon dioxide and ", isTile: false },
        {
          text: "water",
          isTile: true,
          color: "orange",
          phonics: "wa-ter",
          explanation: "One of the two raw ingredients plants need.",
        },
        { text: ".", isTile: false },
      ],
    },
    {
      sectionType: "bullet",
      segments: [
        { text: "They release ", isTile: false },
        {
          text: "oxygen",
          isTile: true,
          color: "lavender",
          phonics: "ox-y-gen",
          explanation: "The gas we breathe, given off as a by-product.",
        },
        { text: " as a by-product.", isTile: false },
      ],
    },
    {
      sectionType: "bullet",
      segments: [
        { text: "The energy is stored as ", isTile: false },
        {
          text: "adenosine triphosphate",
          isTile: true,
          color: "red",
          phonics: "a-den-o-sine tri-phos-phate",
          explanation:
            "The molecule (ATP) that cells use to store and carry energy.",
        },
        { text: ".", isTile: false },
      ],
    },
    {
      sectionType: "heading",
      segments: [{ text: "The steps in order", isTile: false }],
    },
    {
      sectionType: "key_point",
      segments: [
        {
          text: "Capture light, split water, then make sugar — and check what you remember.",
          isTile: false,
        },
      ],
    },
    {
      sectionType: "paragraph",
      segments: [
        { text: "The steps happen in order: ", isTile: false },
        {
          text: "A",
          isTile: true,
          color: "teal",
          phonics: "ay",
          explanation: "A sub-point label — the first step in a list.",
        },
        { text: ") capture light, B) split water, C) make sugar.", isTile: false },
      ],
    },
    {
      sectionType: "quiz_header",
      segments: [
        { text: "Quick check: where does photosynthesis happen?", isTile: false },
      ],
      explanation:
        "Photosynthesis takes place in the chloroplasts, which hold the green pigment that captures sunlight.",
    },
    {
      sectionType: "quiz_option",
      segments: [{ text: "A) In the roots", isTile: false }],
      isCorrect: false,
    },
    {
      sectionType: "quiz_option",
      segments: [{ text: "B) In the chloroplasts", isTile: false }],
      isCorrect: true,
    },
    {
      sectionType: "quiz_option",
      segments: [{ text: "C) In the soil", isTile: false }],
      isCorrect: false,
    },
  ],
};
