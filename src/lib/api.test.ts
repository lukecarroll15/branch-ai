import { describe, expect, it, vi, beforeEach } from "vitest";

// The helpers build a Supabase client via createClient(); every test swaps in a
// stub. vi.mock is hoisted, so the stub is declared with `vi.hoisted`.
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

const {
  apiError,
  findOwnedDocument,
  readJson,
  requireOwnedDocument,
  requireUser,
} = await import("@/lib/api");

// A Supabase double: getUser returns `user`, and the documents query resolves
// to `single`. Records the filters applied so tests can assert on scoping.
function stubSupabase({
  user = null,
  single = { data: null, error: null },
}: {
  user?: { id: string } | null;
  single?: { data: unknown; error: unknown };
} = {}) {
  const filters: Record<string, unknown> = {};
  const selected: string[] = [];

  const query = {
    select: (cols: string) => {
      selected.push(cols);
      return query;
    },
    eq: (col: string, value: unknown) => {
      filters[col] = value;
      return query;
    },
    single: async () => single,
  };

  return {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: () => query,
    // Test-only handles.
    filters,
    selected,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiError", () => {
  it("returns the message and status as a JSON response", async () => {
    const res = apiError("Nope", 418);

    expect(res.status).toBe(418);
    await expect(res.json()).resolves.toEqual({ error: "Nope" });
  });
});

describe("requireUser", () => {
  it("returns the client and user when signed in", async () => {
    const supabase = stubSupabase({ user: { id: "user-1" } });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await requireUser();

    expect(result).toEqual({ supabase, user: { id: "user-1" } });
  });

  it("returns a 401 when there is no session", async () => {
    mockCreateClient.mockResolvedValue(stubSupabase({ user: null }));

    const result = await requireUser();

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(401);
    await expect(result.error.json()).resolves.toEqual({
      error: "Not authenticated",
    });
  });
});

describe("readJson", () => {
  it("returns the parsed body", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
    });

    const result = await readJson(request);

    expect(result).toEqual({ body: { text: "hello" } });
  });

  it("returns a 400 when the body is not valid JSON", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: "{not json",
    });

    const result = await readJson(request);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(400);
    await expect(result.error.json()).resolves.toEqual({
      error: "Invalid request",
    });
  });

  it("returns a 400 for an empty body", async () => {
    const request = new Request("https://example.test/api", { method: "POST" });

    const result = await readJson(request);

    expect("error" in result).toBe(true);
  });
});

describe("findOwnedDocument", () => {
  it("returns the row and scopes the query to the owner", async () => {
    const doc = { id: "doc-1", file_path: "user-1/notes.pdf" };
    const supabase = stubSupabase({ single: { data: doc, error: null } });

    const result = await findOwnedDocument(
      supabase as never,
      "doc-1",
      "user-1",
    );

    expect(result).toEqual({ doc });
    // Filtering on user_id as well as id is what stops one student reading
    // another's document if RLS is ever misconfigured.
    expect(supabase.filters).toEqual({ id: "doc-1", user_id: "user-1" });
    expect(supabase.selected).toEqual(["id, file_path"]);
  });

  it("returns a 404 when the row is missing", async () => {
    const supabase = stubSupabase({ single: { data: null, error: null } });

    const result = await findOwnedDocument(
      supabase as never,
      "doc-1",
      "user-1",
    );

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(404);
  });

  it("returns a 404 when the query errors", async () => {
    const supabase = stubSupabase({
      single: { data: { id: "doc-1" }, error: { message: "boom" } },
    });

    const result = await findOwnedDocument(
      supabase as never,
      "doc-1",
      "user-1",
    );

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(404);
  });
});

describe("requireOwnedDocument", () => {
  it("resolves params, user and document together", async () => {
    const doc = { id: "doc-1", file_path: "user-1/notes.pdf" };
    const supabase = stubSupabase({
      user: { id: "user-1" },
      single: { data: doc, error: null },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await requireOwnedDocument(Promise.resolve({ id: "doc-1" }));

    expect(result).toEqual({
      id: "doc-1",
      supabase,
      user: { id: "user-1" },
      doc,
    });
  });

  it("stops at the 401 without querying for the document", async () => {
    const supabase = stubSupabase({ user: null });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await requireOwnedDocument(Promise.resolve({ id: "doc-1" }));

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(401);
    // No lookup should have run — an anonymous caller learns nothing about
    // whether the id exists.
    expect(supabase.filters).toEqual({});
  });

  it("returns the 404 when the document is not the caller's", async () => {
    mockCreateClient.mockResolvedValue(
      stubSupabase({
        user: { id: "user-1" },
        single: { data: null, error: null },
      }),
    );

    const result = await requireOwnedDocument(Promise.resolve({ id: "doc-1" }));

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.status).toBe(404);
  });
});
