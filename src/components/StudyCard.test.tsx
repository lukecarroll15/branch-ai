// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudyCard from "@/components/StudyCard";

function renderCard(props: Partial<React.ComponentProps<typeof StudyCard>> = {}) {
  return render(
    <StudyCard heading="Photosynthesis" keyPoint="Plants make food." {...props}>
      <p>The full detail.</p>
    </StudyCard>,
  );
}

describe("StudyCard", () => {
  it("shows the heading and key point while collapsed", () => {
    renderCard();

    expect(screen.getByText("Photosynthesis")).toBeInTheDocument();
    expect(screen.getByText("Plants make food.")).toBeInTheDocument();
    // The detail is what stays hidden — that's the point of the card.
    expect(screen.queryByText("The full detail.")).not.toBeInTheDocument();
  });

  it("is collapsed by default", () => {
    renderCard();

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens by default when asked", () => {
    renderCard({ defaultOpen: true });

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The full detail.")).toBeInTheDocument();
  });

  it("expands and collapses on click", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The full detail.")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("The full detail.")).not.toBeInTheDocument();
  });

  it("omits the key point line when there isn't one", () => {
    renderCard({ keyPoint: "" });

    expect(screen.queryByText("Plants make food.")).not.toBeInTheDocument();
    expect(screen.getByText("Photosynthesis")).toBeInTheDocument();
  });
});
