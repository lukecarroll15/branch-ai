// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SimplifyParagraph from "@/components/SimplifyParagraph";

const ORIGINAL = "A notably verbose original passage.";
const PLAIN = "A short, plain version.";

function renderParagraph() {
  return render(
    <SimplifyParagraph text={ORIGINAL}>
      <span>{ORIGINAL}</span>
    </SimplifyParagraph>,
  );
}

// A fetch double resolving to the given status and JSON body.
function respondWith(body: unknown, { ok = true, status = 200 } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

const simplifyButton = () =>
  screen.getByRole("button", { name: /simplify this/i });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", respondWith({ simplified: PLAIN }));
});

describe("SimplifyParagraph", () => {
  it("shows the original passage with a simplify control", () => {
    renderParagraph();

    expect(screen.getByText(ORIGINAL)).toBeInTheDocument();
    expect(simplifyButton()).toBeInTheDocument();
  });

  it("sends the paragraph text and swaps in the rewrite", async () => {
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());

    expect(fetch).toHaveBeenCalledWith("/api/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: ORIGINAL }),
    });
    expect(await screen.findByText(PLAIN)).toBeInTheDocument();
    expect(screen.queryByText(ORIGINAL)).not.toBeInTheDocument();
  });

  it("offers a way back to the original", async () => {
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());
    await user.click(await screen.findByRole("button", { name: /show original/i }));

    expect(screen.getByText(ORIGINAL)).toBeInTheDocument();
    expect(simplifyButton()).toBeInTheDocument();
  });

  it("reuses the rewrite instead of asking Gemini twice", async () => {
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());
    await user.click(await screen.findByRole("button", { name: /show original/i }));
    await user.click(simplifyButton());

    expect(await screen.findByText(PLAIN)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows the server's reason when the request is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      respondWith(
        { error: "That passage is too long to simplify." },
        { ok: false, status: 400 },
      ),
    );
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());

    expect(
      await screen.findByText("That passage is too long to simplify."),
    ).toBeInTheDocument();
    // The original stays on screen — the student loses nothing.
    expect(screen.getByText(ORIGINAL)).toBeInTheDocument();
  });

  it("falls back to a generic message when the error has no reason", async () => {
    vi.stubGlobal("fetch", respondWith({}, { ok: false, status: 500 }));
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());

    expect(await screen.findByText("Could not simplify.")).toBeInTheDocument();
  });

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());

    expect(await screen.findByText("offline")).toBeInTheDocument();
  });

  it("re-enables the control after a failure so it can be retried", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());
    await screen.findByText("offline");

    expect(simplifyButton()).toBeEnabled();
  });

  it("disables the control while the rewrite is in flight", async () => {
    let release: (value: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          release = resolve;
        }),
      ),
    );
    const user = userEvent.setup();
    renderParagraph();

    await user.click(simplifyButton());

    const pending = screen.getByRole("button", { name: /simplifying/i });
    expect(pending).toBeDisabled();

    release({ ok: true, json: async () => ({ simplified: PLAIN }) });
    expect(await screen.findByText(PLAIN)).toBeInTheDocument();
  });
});
