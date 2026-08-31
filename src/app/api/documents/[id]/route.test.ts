import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseStub, readResponse } from "@/test/supabase-stub";

const { mockCreateClient, processDocument, after } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  processDocument: vi.fn(),
  after: vi.fn((fn: () => unknown) => fn()),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/process", () => ({ processDocument }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after,
}));

const { POST, DELETE } = await import("./route");

const DOC = { id: "doc-1", file_path: "user-1/notes.pdf" };
const params = Promise.resolve({ id: "doc-1" });
const request = () => new Request("https://example.test/api/documents/doc-1");

function owner(tables = {}, storage = {}) {
  return createSupabaseStub({
    user: { id: "user-1" },
    tables: { documents: { single: { data: DOC, error: null } }, ...tables },
    storage,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  processDocument.mockResolvedValue(undefined);
});

describe("POST /api/documents/[id]", () => {
  it("flips the row back to processing and re-runs the pipeline", async () => {
    const supabase = owner();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(
      await POST(request(), { params: Promise.resolve({ id: "doc-1" }) }),
    );

    expect(res).toEqual({ status: 200, body: { ok: true } });
    const update = supabase.calls.find((c) => c.op === "update");
    expect(update?.values).toEqual({ status: "processing" });
    expect(update?.filters).toEqual({ id: "doc-1", user_id: "user-1" });
    expect(processDocument).toHaveBeenCalledWith("doc-1");
  });

  it("rejects an anonymous caller", async () => {
    mockCreateClient.mockResolvedValue(createSupabaseStub({ user: null }));

    const res = await readResponse(await POST(request(), { params }));

    expect(res).toEqual({ status: 401, body: { error: "Not authenticated" } });
    expect(processDocument).not.toHaveBeenCalled();
  });

  it("404s a document belonging to someone else", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: { documents: { single: { data: null, error: null } } },
      }),
    );

    const res = await readResponse(await POST(request(), { params }));

    expect(res).toEqual({ status: 404, body: { error: "Document not found" } });
  });

  it("400s a row whose file is gone", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: {
          documents: {
            single: { data: { id: "doc-1", file_path: null }, error: null },
          },
        },
      }),
    );

    const res = await readResponse(await POST(request(), { params }));

    expect(res).toEqual({
      status: 400,
      body: { error: "This document has no file to process again." },
    });
    expect(processDocument).not.toHaveBeenCalled();
  });

  it("surfaces an update failure as a 500", async () => {
    mockCreateClient.mockResolvedValue(
      owner({ documents: { single: { data: DOC, error: null }, update: { error: { message: "locked" } } } }),
    );

    const res = await readResponse(await POST(request(), { params }));

    expect(res).toEqual({ status: 500, body: { error: "locked" } });
    expect(processDocument).not.toHaveBeenCalled();
  });

  it("still succeeds when the background re-run throws", async () => {
    processDocument.mockRejectedValue(new Error("Gemini is down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateClient.mockResolvedValue(owner());

    const res = await readResponse(await POST(request(), { params }));

    expect(res).toEqual({ status: 200, body: { ok: true } });
  });
});

describe("DELETE /api/documents/[id]", () => {
  it("removes the stored file and then the row", async () => {
    const supabase = owner();
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await DELETE(request(), { params }));

    expect(res).toEqual({ status: 200, body: { ok: true } });
    const remove = supabase.calls.find((c) => c.op === "delete");
    expect(remove?.filters).toEqual({ id: "doc-1", user_id: "user-1" });
  });

  it("deletes a row that has no stored file", async () => {
    const supabase = createSupabaseStub({
      user: { id: "user-1" },
      tables: {
        documents: {
          single: { data: { id: "doc-1", file_path: null }, error: null },
        },
      },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await DELETE(request(), { params }));

    expect(res).toEqual({ status: 200, body: { ok: true } });
  });

  it("rejects an anonymous caller", async () => {
    mockCreateClient.mockResolvedValue(createSupabaseStub({ user: null }));

    const res = await readResponse(await DELETE(request(), { params }));

    expect(res).toEqual({ status: 401, body: { error: "Not authenticated" } });
  });

  it("404s a document belonging to someone else", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: "user-1" },
        tables: { documents: { single: { data: null, error: null } } },
      }),
    );

    const res = await readResponse(await DELETE(request(), { params }));

    expect(res).toEqual({ status: 404, body: { error: "Document not found" } });
  });

  it("keeps the row when the file cannot be removed", async () => {
    const supabase = owner({}, { remove: { error: { message: "storage down" } } });
    mockCreateClient.mockResolvedValue(supabase);

    const res = await readResponse(await DELETE(request(), { params }));

    // Deleting the row first would orphan the file in storage.
    expect(res).toEqual({ status: 500, body: { error: "storage down" } });
    expect(supabase.calls.some((c) => c.op === "delete")).toBe(false);
  });

  it("surfaces a row-delete failure as a 500", async () => {
    mockCreateClient.mockResolvedValue(
      owner({
        documents: {
          single: { data: DOC, error: null },
          delete: { error: { message: "constraint" } },
        },
      }),
    );

    const res = await readResponse(await DELETE(request(), { params }));

    expect(res).toEqual({ status: 500, body: { error: "constraint" } });
  });
});
