import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseStub, readResponse } from "@/test/supabase-stub";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

const { POST } = await import("./route");

const DOC = { id: "doc-1", file_path: "user-1/notes.pdf" };

function post(body: unknown) {
  return new Request("https://example.test/api/quiz-feedback", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  documentId: "doc-1",
  questionIndex: 0,
  rating: "easy",
};

function signedIn(overrides = {}) {
  return createSupabaseStub({
    user: { id: "user-1" },
    tables: { documents: { single: { data: DOC, error: null } } },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/quiz-feedback", () => {
  it("records the rating for the signed-in student", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await POST(post(validBody)));

    expect(res).toEqual({ status: 200, body: { ok: true } });

    const upsert = supabase.calls.find((c) => c.op === "upsert");
    expect(upsert?.table).toBe("quiz_feedback");
    expect(upsert?.values).toEqual({
      values: {
        user_id: "user-1",
        document_id: "doc-1",
        question_index: 0,
        rating: "easy",
      },
      // Re-rating the same question updates the row rather than adding one.
      options: { onConflict: "user_id,document_id,question_index" },
    });
  });

  it("rejects an anonymous caller", async () => {
    mockCreateClient.mockResolvedValue(createSupabaseStub({ user: null }));

    const res = await readResponse(await POST(post(validBody)));

    expect(res).toEqual({
      status: 401,
      body: { error: "Not authenticated" },
    });
  });

  it("rejects a malformed body", async () => {
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(await POST(post("{not json")));

    expect(res).toEqual({ status: 400, body: { error: "Invalid request" } });
  });

  it.each([
    ["a missing documentId", { ...validBody, documentId: undefined }],
    ["a non-string documentId", { ...validBody, documentId: 7 }],
    ["a non-numeric questionIndex", { ...validBody, questionIndex: "0" }],
    ["a fractional questionIndex", { ...validBody, questionIndex: 1.5 }],
    ["a negative questionIndex", { ...validBody, questionIndex: -1 }],
    ["an unknown rating", { ...validBody, rating: "medium" }],
    ["a missing rating", { ...validBody, rating: undefined }],
  ])("rejects %s", async (_label, body) => {
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(await POST(post(body)));

    expect(res).toEqual({ status: 400, body: { error: "Invalid request" } });
  });

  it("accepts 'hard' as well as 'easy'", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await POST(post({ ...validBody, rating: "hard" }));

    expect(res.status).toBe(200);
  });

  it("404s when the document is not the caller's", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: { documents: { single: { data: null, error: null } } },
      }),
    );

    const res = await readResponse(await POST(post(validBody)));

    expect(res).toEqual({ status: 404, body: { error: "Document not found" } });
  });

  it("surfaces a write failure as a 500", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: {
          documents: { single: { data: DOC, error: null } },
          quiz_feedback: { upsert: { error: { message: "write conflict" } } },
        },
      }),
    );

    const res = await readResponse(await POST(post(validBody)));

    expect(res).toEqual({ status: 500, body: { error: "write conflict" } });
  });
});
