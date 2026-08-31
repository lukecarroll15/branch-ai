import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseStub, readResponse } from "@/test/supabase-stub";

const { mockCreateClient, processDocument, after } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  processDocument: vi.fn(),
  // next/server's `after` defers work until the response is sent. The stub runs
  // the callback immediately so tests can assert on it.
  after: vi.fn((fn: () => unknown) => fn()),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/process", () => ({ processDocument }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after,
}));

const { POST } = await import("./route");

const PDF = "application/pdf";
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function upload(file: File | string | null) {
  const form = new FormData();
  if (file !== null) form.append("file", file);
  return new Request("https://example.test/api/upload", {
    method: "POST",
    body: form,
  });
}

function file(name: string, type: string, size = 10) {
  return new File(["x".repeat(size)], name, { type });
}

function signedIn(overrides = {}) {
  return createSupabaseStub({
    user: { id: "user-1" },
    tables: {
      documents: { insert: { data: { id: "doc-1" }, error: null } },
    },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  processDocument.mockResolvedValue(undefined);
});

describe("POST /api/upload", () => {
  it("stores the file, inserts the row and kicks off processing", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    expect(res).toEqual({ status: 200, body: { documentId: "doc-1" } });

    const insert = supabase.calls.find((c) => c.op === "insert");
    expect(insert?.values).toMatchObject({
      user_id: "user-1",
      title: "notes",
      file_type: "pdf",
      status: "processing",
    });
    expect(processDocument).toHaveBeenCalledWith("doc-1");
  });

  it("stores the file under the caller's own folder", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    await POST(upload(file("notes.pdf", PDF)));

    const insert = supabase.calls.find((c) => c.op === "insert");
    const path = (insert?.values as { file_path: string }).file_path;
    // Storage RLS keys off this prefix.
    expect(path.startsWith("user-1/")).toBe(true);
    expect(path.endsWith("-notes.pdf")).toBe(true);
  });

  it("sanitises awkward characters out of the stored filename", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    await POST(upload(file("my essay (final)/v2.pdf", PDF)));

    const insert = supabase.calls.find((c) => c.op === "insert");
    const values = insert?.values as { file_path: string; title: string };
    expect(values.file_path).toMatch(/^user-1\/\d+-my_essay__final__v2\.pdf$/);
    // The title keeps the original name, minus the extension.
    expect(values.title).toBe("my essay (final)/v2");
  });

  it("keeps the whole name as the title when there is no extension", async () => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    await POST(upload(file("notes", PDF)));

    const insert = supabase.calls.find((c) => c.op === "insert");
    expect((insert?.values as { title: string }).title).toBe("notes");
  });

  it.each([
    ["a PDF", PDF, "pdf"],
    ["a JPEG", "image/jpeg", "image"],
    ["a PNG", "image/png", "image"],
    ["a Word document", DOCX, "docx"],
  ])("accepts %s", async (_label, mime, expected) => {
    const supabase = signedIn();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await POST(upload(file("doc", mime)));

    expect(res.status).toBe(200);
    const insert = supabase.calls.find((c) => c.op === "insert");
    expect((insert?.values as { file_type: string }).file_type).toBe(expected);
  });

  it("rejects an anonymous caller", async () => {
    mockCreateClient.mockResolvedValue(createSupabaseStub({ user: null }));

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    expect(res).toEqual({ status: 401, body: { error: "Not authenticated" } });
  });

  it("rejects a request with no file", async () => {
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(await POST(upload(null)));

    expect(res).toEqual({ status: 400, body: { error: "No file provided" } });
  });

  it("rejects a non-file form field", async () => {
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(await POST(upload("just a string")));

    expect(res).toEqual({ status: 400, body: { error: "No file provided" } });
  });

  it("rejects a file over the size cap", async () => {
    mockCreateClient.mockResolvedValue(signedIn());

    const oversized = file("big.pdf", PDF, 10 * 1024 * 1024 + 1);
    const res = await readResponse(await POST(upload(oversized)));

    expect(res).toEqual({
      status: 400,
      body: { error: "That file is too big. Please upload a file under 10 MB." },
    });
  });

  it("rejects an unsupported file type", async () => {
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(
      await POST(upload(file("sheet.csv", "text/csv"))),
    );

    expect(res).toEqual({
      status: 400,
      body: {
        error: "Unsupported file type. Use a PDF, image (JPG/PNG), or Word doc.",
      },
    });
  });

  it("surfaces a storage failure as a 500 without inserting a row", async () => {
    const supabase = signedIn({
      storage: { upload: { error: { message: "bucket full" } } },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    expect(res).toEqual({ status: 500, body: { error: "bucket full" } });
    expect(supabase.calls.some((c) => c.op === "insert")).toBe(false);
  });

  it("surfaces an insert failure as a 500 and does not start processing", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: {
          documents: {
            insert: { data: null, error: { message: "constraint violation" } },
          },
        },
      }),
    );

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    expect(res).toEqual({
      status: 500,
      body: { error: "constraint violation" },
    });
    expect(processDocument).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the insert reports no error", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: { documents: { insert: { data: null, error: null } } },
      }),
    );

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    expect(res).toEqual({
      status: 500,
      body: { error: "Could not create document record." },
    });
  });

  it("still returns the id when background processing throws", async () => {
    processDocument.mockRejectedValue(new Error("Gemini is down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateClient.mockResolvedValue(signedIn());

    const res = await readResponse(await POST(upload(file("notes.pdf", PDF))));

    // The row is already "processing"; the page polls for the outcome.
    expect(res).toEqual({ status: 200, body: { documentId: "doc-1" } });
  });
});
