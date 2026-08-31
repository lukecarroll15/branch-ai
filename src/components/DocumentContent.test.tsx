// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProcessedDocument, Section, Segment } from "@/lib/types";

// The toolbar and read-aloud controls drive the Web Speech API, which jsdom
// doesn't implement. They are covered separately; here they'd only add noise.
vi.mock("@/components/ReadingSettings", () => ({
  default: () => <div data-testid="reading-settings" />,
}));
vi.mock("@/components/ReadAloud", () => ({
  default: () => <div data-testid="read-aloud" />,
}));
vi.mock("@/components/SpeechContext", () => ({
  SpeechProvider: ({ children }: { children: React.ReactNode }) => children,
  useSpeech: () => ({ speak: vi.fn() }),
}));

const { default: DocumentContent } = await import(
  "@/components/DocumentContent"
);

const text = (value: string): Segment => ({ text: value, isTile: false });

const tile = (value: string): Segment => ({
  text: value,
  isTile: true,
  color: "lavender",
  phonics: "til·e",
  explanation: "A highlighted term.",
});

const section = (
  sectionType: Section["sectionType"],
  segments: Segment[],
  extra: Partial<Section> = {},
): Section => ({ sectionType, segments, ...extra });

function doc(sections: Section[]): ProcessedDocument {
  return { title: "Biology", sections };
}

// Preview mode renders cards open, with no toolbar — the simplest way to see
// the grouping logic's output.
const preview = (sections: Section[]) =>
  render(<DocumentContent doc={doc(sections)} preview />);

describe("DocumentContent grouping", () => {
  it("turns a heading and its key point into one card", () => {
    preview([
      section("heading", [text("Photosynthesis")]),
      section("key_point", [text("Plants make food from light.")]),
      section("paragraph", [text("The full explanation.")]),
    ]);

    const card = screen.getByRole("button", { name: /Photosynthesis/ });
    expect(card).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Plants make food from light.")).toBeInTheDocument();
    expect(screen.getByText("The full explanation.")).toBeInTheDocument();
  });

  it("starts a new card at each heading", () => {
    preview([
      section("heading", [text("Photosynthesis")]),
      section("paragraph", [text("First topic body.")]),
      section("heading", [text("Respiration")]),
      section("paragraph", [text("Second topic body.")]),
    ]);

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /Respiration/ }),
    ).toBeInTheDocument();
  });

  it("renders content before the first heading without card chrome", () => {
    preview([
      section("paragraph", [text("An intro before any heading.")]),
      section("heading", [text("Photosynthesis")]),
    ]);

    expect(screen.getByText("An intro before any heading.")).toBeInTheDocument();
    // Only the heading gets a toggle; the intro is never hidden behind one.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("keeps only the first key point after a heading as the summary", () => {
    preview([
      section("heading", [text("Photosynthesis")]),
      section("key_point", [text("The first summary.")]),
      section("key_point", [text("A stray second key point.")]),
    ]);

    // The second one opens its own headless card rather than overwriting.
    expect(screen.getByText("The first summary.")).toBeInTheDocument();
    expect(screen.getByText("A stray second key point.")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders a key point with no heading before it on its own", () => {
    preview([section("key_point", [text("An orphan key point.")])]);

    expect(screen.getByText("An orphan key point.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an empty document without crashing", () => {
    const { container } = preview([]);

    expect(container.querySelector("article")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("DocumentContent sections", () => {
  it("renders a tile segment as a keyword tile", () => {
    preview([
      section("heading", [text("Cells")]),
      section("paragraph", [text("The "), tile("mitochondria"), text(" work.")]),
    ]);

    expect(
      screen.getByRole("button", { name: /Hear "mitochondria"/ }),
    ).toBeInTheDocument();
  });

  it("strips a leading bullet marker so it isn't doubled", () => {
    preview([
      section("heading", [text("Cells")]),
      section("bullet", [text("• A first point")]),
    ]);

    expect(screen.getByText("A first point")).toBeInTheDocument();
    expect(screen.queryByText("• A first point")).not.toBeInTheDocument();
  });

  it.each(["‣ ", "◦ ", "· ", "* ", "- "])(
    "strips a '%s' marker too",
    (marker) => {
      preview([
        section("heading", [text("Cells")]),
        section("bullet", [text(`${marker}A point`)]),
      ]);

      expect(screen.getByText("A point")).toBeInTheDocument();
    },
  );

  it("leaves a bullet with no marker alone", () => {
    preview([
      section("heading", [text("Cells")]),
      section("bullet", [text("Already clean")]),
    ]);

    expect(screen.getByText("Already clean")).toBeInTheDocument();
  });

  it("renders an empty bullet without crashing", () => {
    preview([section("heading", [text("Cells")]), section("bullet", [])]);

    expect(screen.getByRole("button", { name: /Cells/ })).toBeInTheDocument();
  });
});

describe("DocumentContent quizzes", () => {
  const quiz = [
    section("heading", [text("Photosynthesis")]),
    section("quiz_header", [text("What do plants need?")], {
      explanation: "Light powers the reaction.",
    }),
    section("quiz_option", [text("Light")], { isCorrect: true }),
    section("quiz_option", [text("Darkness")], { isCorrect: false }),
  ];

  it("folds a quiz header and its options into one block", () => {
    preview(quiz);

    expect(screen.getByText("What do plants need?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Darkness" })).toBeInTheDocument();
  });

  it("handles options with no preceding header", () => {
    preview([
      section("heading", [text("Photosynthesis")]),
      section("quiz_option", [text("Light")], { isCorrect: true }),
    ]);

    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
  });

  it("flattens tiles inside an option to plain text", () => {
    preview([
      section("heading", [text("Cells")]),
      section("quiz_header", [text("Which one?")]),
      section("quiz_option", [tile("mitochondria")], { isCorrect: true }),
    ]);

    const option = screen.getByRole("button", { name: "mitochondria" });
    // A tile renders its own <button>; nesting one inside the option button
    // would be invalid HTML.
    expect(option.querySelector("button")).toBeNull();
  });
});

describe("DocumentContent modes", () => {
  it("shows the toolbar in the study view and collapses the cards", () => {
    render(
      <DocumentContent
        doc={doc([
          section("heading", [text("Photosynthesis")]),
          section("paragraph", [text("Hidden until opened.")]),
        ])}
        documentId="doc-1"
      />,
    );

    expect(screen.getByTestId("reading-settings")).toBeInTheDocument();
    expect(screen.getByTestId("read-aloud")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Photosynthesis/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("hides the toolbar in preview", () => {
    preview([section("heading", [text("Photosynthesis")])]);

    expect(screen.queryByTestId("reading-settings")).not.toBeInTheDocument();
  });

  it("offers Simplify on a long paragraph in the study view", async () => {
    const user = userEvent.setup();
    const long = "word ".repeat(40);

    render(
      <DocumentContent
        doc={doc([
          section("heading", [text("Photosynthesis")]),
          section("paragraph", [text(long)]),
        ])}
        documentId="doc-1"
      />,
    );

    // Study-view cards start collapsed, so open the topic first.
    await user.click(screen.getByRole("button", { name: /Photosynthesis/ }));

    expect(
      screen.getByRole("button", { name: /simplify this/i }),
    ).toBeInTheDocument();
  });

  it("keeps the preview clean of Simplify controls", () => {
    preview([
      section("heading", [text("Photosynthesis")]),
      section("paragraph", [text("word ".repeat(40))]),
    ]);

    expect(
      screen.queryByRole("button", { name: /simplify this/i }),
    ).not.toBeInTheDocument();
  });

  it("leaves a short paragraph without a Simplify control", async () => {
    const user = userEvent.setup();

    render(
      <DocumentContent
        doc={doc([
          section("heading", [text("Photosynthesis")]),
          section("paragraph", [text("Short enough already.")]),
        ])}
        documentId="doc-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Photosynthesis/ }));

    expect(screen.getByText("Short enough already.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /simplify this/i }),
    ).not.toBeInTheDocument();
  });
});
