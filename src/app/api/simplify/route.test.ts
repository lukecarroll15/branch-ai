import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseStub, readResponse } from "@/test/supabase-stub";

const { mockCreateClient, simplifyText } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  simplifyText: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/gemini", () => ({ simplifyText }));

const { POST, maxDuration } = await import("./route");

function post(body: unknown) {
  return new Request("https://example.test/api/simplify", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue(createSupabaseStub({ user: { id: "u1" } }));
  simplifyText.mockResolvedValue("Short words.");
});

describe("POST /api/simplify", () => {
  it("returns the simplified passage", async () => {
    const res = await readResponse(await POST(post({ text: "Verbose prose." })));

    expect(res).toEqual({ status: 200, body: { simplified: "Short words." } });
    expect(simplifyText).toHaveBeenCalledWith("Verbose prose.");
  });

  it("trims the incoming passage", async () => {
    await POST(post({ text: "  padded  " }));

    expect(simplifyText).toHaveBeenCalledWith("padded");
  });

  it("rejects an anonymous caller before spending any Gemini credit", async () => {
    mockCreateClient.mockResolvedValue(createSupabaseStub({ user: null }));

    const res = await readResponse(await POST(post({ text: "Verbose." })));

    expect(res).toEqual({ status: 401, body: { error: "Not authenticated" } });
    expect(simplifyText).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const res = await readResponse(await POST(post("{not json")));

    expect(res).toEqual({ status: 400, body: { error: "Invalid request" } });
  });

  it.each([
    ["no text field", {}],
    ["a non-string text field", { text: 42 }],
    ["whitespace only", { text: "   " }],
    ["an empty string", { text: "" }],
    ["a null body", null],
  ])("rejects %s", async (_label, body) => {
    const res = await readResponse(await POST(post(body)));

    expect(res).toEqual({ status: 400, body: { error: "No text provided" } });
    expect(simplifyText).not.toHaveBeenCalled();
  });

  it("rejects a passage over the character cap", async () => {
    const res = await readResponse(await POST(post({ text: "x".repeat(4001) })));

    expect(res).toEqual({
      status: 400,
      body: { error: "That passage is too long to simplify." },
    });
    expect(simplifyText).not.toHaveBeenCalled();
  });

  it("accepts a passage exactly at the cap", async () => {
    const res = await POST(post({ text: "x".repeat(4000) }));

    expect(res.status).toBe(200);
  });

  it("returns a 502 when the model call fails", async () => {
    simplifyText.mockRejectedValue(new Error("Gemini is down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await readResponse(await POST(post({ text: "Verbose." })));

    expect(res).toEqual({
      status: 502,
      body: { error: "Could not simplify right now. Please try again." },
    });
  });

  it("caps the function's run time", () => {
    expect(maxDuration).toBe(30);
  });
});
