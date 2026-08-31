// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { speak } = vi.hoisted(() => ({ speak: vi.fn() }));
vi.mock("@/components/SpeechContext", () => ({
  useSpeech: () => ({ speak }),
}));

const { default: KeywordTile } = await import("@/components/KeywordTile");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("KeywordTile", () => {
  it("renders a plain span when there are no reading aids", () => {
    render(<KeywordTile text="mitochondria" color="lavender" />);

    expect(screen.getByText("mitochondria")).toBeInTheDocument();
    // Nothing to say or show, so it must not be an interactive control.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("becomes a button once it has phonics", () => {
    render(
      <KeywordTile text="mitochondria" color="red" phonics="mi·to·chon·dri·a" />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("mi·to·chon·dri·a")).toBeInTheDocument();
  });

  it("becomes a button once it has an explanation", () => {
    render(
      <KeywordTile
        text="mitochondria"
        color="teal"
        explanation="The cell's power stations."
      />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("The cell's power stations.")).toBeInTheDocument();
  });

  it("speaks the word and its meaning when tapped", async () => {
    const user = userEvent.setup();
    render(
      <KeywordTile
        text="mitochondria"
        color="orange"
        explanation="The cell's power stations."
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(speak).toHaveBeenCalledWith(
      "mitochondria. The cell's power stations.",
    );
  });

  it("speaks just the word when there is no explanation", async () => {
    const user = userEvent.setup();
    render(<KeywordTile text="osmosis" color="lavender" phonics="os·mo·sis" />);

    await user.click(screen.getByRole("button"));

    expect(speak).toHaveBeenCalledWith("osmosis");
  });

  it("names the word and meaning in its accessible label", () => {
    render(
      <KeywordTile
        text="osmosis"
        color="lavender"
        explanation="Water moving through a membrane."
      />,
    );

    expect(
      screen.getByRole("button", {
        name: 'Hear "osmosis": Water moving through a membrane.',
      }),
    ).toBeInTheDocument();
  });

  it("labels a tile that only has phonics with the word alone", () => {
    render(<KeywordTile text="osmosis" color="lavender" phonics="os·mo·sis" />);

    expect(
      screen.getByRole("button", { name: 'Hear "osmosis"' }),
    ).toBeInTheDocument();
  });

  it("nudges the tooltip back inside the viewport when it would overflow", async () => {
    const user = userEvent.setup();
    render(
      <KeywordTile text="osmosis" color="lavender" explanation="Water moves." />,
    );

    const tooltip = screen.getByRole("tooltip");
    // jsdom reports a zero-size rect by default; stand in a card that starts
    // 100px off the left edge.
    vi.spyOn(tooltip, "getBoundingClientRect").mockReturnValue({
      left: -100,
      right: 140,
    } as DOMRect);

    await user.hover(screen.getByRole("button"));

    // 8px margin - (-100) = 108px of correction.
    expect(tooltip.style.transform).toBe("translateX(calc(-50% + 108px))");
  });

  it("pulls the tooltip left when it would overflow the right edge", async () => {
    const user = userEvent.setup();
    render(
      <KeywordTile text="osmosis" color="lavender" explanation="Water moves." />,
    );

    const tooltip = screen.getByRole("tooltip");
    vi.spyOn(tooltip, "getBoundingClientRect").mockReturnValue({
      left: window.innerWidth - 40,
      right: window.innerWidth + 60,
    } as DOMRect);

    await user.hover(screen.getByRole("button"));

    expect(tooltip.style.transform).toBe("translateX(calc(-50% + -68px))");
  });

  it("leaves a comfortably-placed tooltip centred", async () => {
    const user = userEvent.setup();
    render(
      <KeywordTile text="osmosis" color="lavender" explanation="Water moves." />,
    );

    const tooltip = screen.getByRole("tooltip");
    vi.spyOn(tooltip, "getBoundingClientRect").mockReturnValue({
      left: 200,
      right: 440,
    } as DOMRect);

    await user.hover(screen.getByRole("button"));

    expect(tooltip.style.transform).toBe("translateX(calc(-50% + 0px))");
  });
});
