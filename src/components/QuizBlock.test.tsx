// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizBlock from "@/components/QuizBlock";

const OPTIONS = ["Light", "Darkness", "Silence"];

function renderQuiz(
  props: Partial<React.ComponentProps<typeof QuizBlock>> = {},
) {
  return render(
    <QuizBlock
      header="What do plants need?"
      options={OPTIONS}
      correctIndex={0}
      explanation="Light powers the reaction."
      documentId="doc-1"
      questionIndex={2}
      {...props}
    />,
  );
}

const option = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
});

describe("QuizBlock with an answer key", () => {
  it("renders the question and its options", () => {
    renderQuiz();

    expect(screen.getByText("What do plants need?")).toBeInTheDocument();
    OPTIONS.forEach((text) => expect(option(text)).toBeInTheDocument());
  });

  it("keeps the explanation hidden until an answer is given", () => {
    renderQuiz();

    expect(
      screen.queryByText(/Light powers the reaction/),
    ).not.toBeInTheDocument();
  });

  it("confirms a correct answer and shows why", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Light"));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText(/Light powers the reaction/)).toBeInTheDocument();
  });

  it("marks a wrong answer without hiding the right one", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Darkness"));

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    // The correct option is still shown, so the student learns the answer.
    expect(option("Light")).toBeInTheDocument();
  });

  it("locks every option after the first answer", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Darkness"));

    screen
      .getAllByRole("button")
      .filter((b) => OPTIONS.some((o) => b.textContent?.includes(o)))
      .forEach((b) => expect(b).toBeDisabled());
  });

  it("ignores a second answer attempt", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Darkness"));
    await user.click(option("Light"));

    // Still showing the original wrong answer's verdict.
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
  });

  it("marks the answered option as pressed", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Darkness"));

    expect(option("Darkness")).toHaveAttribute("aria-pressed", "true");
    expect(option("Light")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("QuizBlock difficulty feedback", () => {
  it("asks how it went only after answering", async () => {
    const user = userEvent.setup();
    renderQuiz();

    expect(screen.queryByText("Was this easy or hard?")).not.toBeInTheDocument();

    await user.click(option("Light"));

    expect(screen.getByText("Was this easy or hard?")).toBeInTheDocument();
  });

  it.each([
    ["👍 Easy", "easy"],
    ["👎 Hard", "hard"],
  ])("posts the %s rating with the question's index", async (label, rating) => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(option("Light"));
    await user.click(option(label));

    expect(fetch).toHaveBeenCalledWith("/api/quiz-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: "doc-1",
        questionIndex: 2,
        rating,
      }),
    });
    expect(screen.getByText("Thanks for the feedback!")).toBeInTheDocument();
  });

  it("still thanks the student when the request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderQuiz();

    await user.click(option("Light"));
    await user.click(option("👍 Easy"));

    // Logging feedback is non-critical — a failure must not disrupt the student.
    expect(screen.getByText("Thanks for the feedback!")).toBeInTheDocument();
  });

  it("skips the feedback prompt when there is no document to attribute it to", async () => {
    const user = userEvent.setup();
    renderQuiz({ documentId: undefined });

    await user.click(option("Light"));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.queryByText("Was this easy or hard?")).not.toBeInTheDocument();
  });
});

describe("QuizBlock without an answer key", () => {
  it("acts as a self-check toggle", async () => {
    const user = userEvent.setup();
    renderQuiz({ correctIndex: null });

    await user.click(option("Darkness"));

    expect(option("Darkness")).toHaveAttribute("aria-pressed", "true");
    // No grading, so no verdict either way.
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
    expect(screen.queryByText("Not quite.")).not.toBeInTheDocument();
  });

  it("deselects when the same option is tapped again", async () => {
    const user = userEvent.setup();
    renderQuiz({ correctIndex: null });

    await user.click(option("Darkness"));
    await user.click(option("Darkness"));

    expect(option("Darkness")).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the selection to another option", async () => {
    const user = userEvent.setup();
    renderQuiz({ correctIndex: null });

    await user.click(option("Darkness"));
    await user.click(option("Silence"));

    expect(option("Silence")).toHaveAttribute("aria-pressed", "true");
    expect(option("Darkness")).toHaveAttribute("aria-pressed", "false");
  });

  it("never locks the options", async () => {
    const user = userEvent.setup();
    renderQuiz({ correctIndex: null });

    await user.click(option("Darkness"));

    expect(option("Silence")).toBeEnabled();
  });
});

describe("QuizBlock rendering", () => {
  it("renders without a header", () => {
    renderQuiz({ header: null });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(option("Light")).toBeInTheDocument();
  });

  it("renders with no options at all", () => {
    renderQuiz({ options: [], header: "An empty quiz" });

    expect(screen.getByText("An empty quiz")).toBeInTheDocument();
  });
});
