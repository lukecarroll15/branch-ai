import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture every generateContent call so the tests can assert which model was
// tried, in what order, and with what request.
const { generateContent, GoogleGenAI } = vi.hoisted(() => {
  const generateContent = vi.fn();
  // A plain function, not an arrow — the module under test calls it with `new`.
  return {
    generateContent,
    GoogleGenAI: vi.fn(function () {
      return { models: { generateContent } };
    }),
  };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI,
  // The real Type enum is only used to build the response schema; string values
  // are enough for the module to load.
  Type: {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
  },
}));

const { formatStudyNotes, simplifyText } = await import("@/lib/gemini");

// A transient failure Gemini raises when a model is rate-limited or overloaded.
function apiError(status: number) {
  return Object.assign(new Error(`status ${status}`), { status });
}

const modelsTried = () =>
  generateContent.mock.calls.map(([request]) => request.model);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
  // The retry path sleeps 1s then 2s between attempts; fake timers keep the
  // suite instant.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Run `work` with the backoff timers auto-advanced, so awaiting it never hangs.
async function runWithTimers<T>(work: Promise<T>): Promise<T> {
  const settled = work.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  const result = await settled;
  if (!result.ok) throw result.error;
  return result.value;
}

describe("simplifyText", () => {
  it("returns the trimmed model output", async () => {
    generateContent.mockResolvedValue({ text: "  Plain words.  " });

    const result = await runWithTimers(simplifyText("Verbose prose."));

    expect(result).toBe("Plain words.");
  });

  it("sends the passage on the first model with a bounded output", async () => {
    generateContent.mockResolvedValue({ text: "ok" });

    await runWithTimers(simplifyText("Verbose prose."));

    const [request] = generateContent.mock.calls[0];
    expect(request.model).toBe("gemini-flash-latest");
    expect(request.contents[0].text).toContain("Verbose prose.");
    expect(request.config.maxOutputTokens).toBe(2048);
  });

  it("throws when the model returns nothing", async () => {
    generateContent.mockResolvedValue({ text: "" });

    await expect(runWithTimers(simplifyText("hi"))).rejects.toThrow(
      "Gemini returned an empty response.",
    );
  });
});

describe("generateWithRetry (via simplifyText)", () => {
  it("retries the same model on a 429 and succeeds", async () => {
    generateContent
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce({ text: "recovered" });

    const result = await runWithTimers(simplifyText("hi"));

    expect(result).toBe("recovered");
    expect(modelsTried()).toEqual([
      "gemini-flash-latest",
      "gemini-flash-latest",
    ]);
  });

  it("falls back to the lite model once the first is exhausted", async () => {
    // 3 attempts (initial + 2 retries) on the first model, then the fallback.
    generateContent
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce({ text: "from lite" });

    const result = await runWithTimers(simplifyText("hi"));

    expect(result).toBe("from lite");
    expect(modelsTried()).toEqual([
      "gemini-flash-latest",
      "gemini-flash-latest",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
    ]);
  });

  it("gives up after every model is exhausted", async () => {
    generateContent.mockRejectedValue(apiError(503));

    await expect(runWithTimers(simplifyText("hi"))).rejects.toThrow(
      "status 503",
    );
    // 3 attempts per model, 2 models.
    expect(generateContent).toHaveBeenCalledTimes(6);
  });

  it("does not retry a non-transient error", async () => {
    generateContent.mockRejectedValue(apiError(400));

    await expect(runWithTimers(simplifyText("hi"))).rejects.toThrow(
      "status 400",
    );
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("treats an error with no status as non-transient", async () => {
    generateContent.mockRejectedValue(new Error("network down"));

    await expect(runWithTimers(simplifyText("hi"))).rejects.toThrow(
      "network down",
    );
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});

describe("formatStudyNotes", () => {
  const document = { title: "Photosynthesis", sections: [] };

  it("parses the structured JSON the model returns", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(document) });

    const result = await runWithTimers(
      formatStudyNotes({ kind: "text", text: "Some prose." }),
    );

    expect(result).toEqual(document);
  });

  it("sends text sources as a single prompt part", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(document) });

    await runWithTimers(formatStudyNotes({ kind: "text", text: "Some prose." }));

    const [request] = generateContent.mock.calls[0];
    expect(request.contents).toHaveLength(1);
    expect(request.contents[0].text).toContain("Some prose.");
    expect(request.config.responseMimeType).toBe("application/json");
  });

  it("sends image sources as inline data plus a read instruction", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(document) });

    await runWithTimers(
      formatStudyNotes({
        kind: "image",
        mimeType: "image/png",
        base64: "AAAA",
      }),
    );

    const [request] = generateContent.mock.calls[0];
    expect(request.contents[0]).toEqual({
      inlineData: { mimeType: "image/png", data: "AAAA" },
    });
    expect(request.contents[1].text).toContain("Read all the text");
  });

  it("throws when the model returns nothing", async () => {
    generateContent.mockResolvedValue({ text: "" });

    await expect(
      runWithTimers(formatStudyNotes({ kind: "text", text: "hi" })),
    ).rejects.toThrow("Gemini returned an empty response.");
  });

  it("propagates malformed JSON rather than returning a partial document", async () => {
    generateContent.mockResolvedValue({ text: "{ truncated" });

    await expect(
      runWithTimers(formatStudyNotes({ kind: "text", text: "hi" })),
    ).rejects.toThrow(SyntaxError);
  });
});
