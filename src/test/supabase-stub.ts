import { vi } from "vitest";

// A hand-rolled Supabase client double for the route tests. The real client is
// a long fluent chain (.from().select().eq().single()), so the stub returns
// itself from every builder method and resolves at the terminal call. Each
// table gets its own scripted result, and every call is recorded so tests can
// assert on what the route actually asked the database to do.

export type TableResult = {
  // Resolved by .single() after a .select() chain.
  single?: { data: unknown; error: unknown };
  // Resolved by .insert(...).select(...).single().
  insert?: { data: unknown; error: unknown };
  // Resolved by the terminal .eq() of an .update() chain.
  update?: { error: unknown };
  upsert?: { error: unknown };
  delete?: { error: unknown };
};

export type RecordedCall = {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  values?: unknown;
  filters: Record<string, unknown>;
};

export function createSupabaseStub({
  user = null,
  tables = {},
  storage = {},
}: {
  user?: { id: string } | null;
  tables?: Record<string, TableResult>;
  storage?: {
    upload?: { error: unknown };
    remove?: { error: unknown };
    download?: { data: Blob | null; error: unknown };
  };
} = {}) {
  const calls: RecordedCall[] = [];

  function table(name: string) {
    const result = tables[name] ?? {};
    const call: RecordedCall = { table: name, op: "select", filters: {} };

    const builder = {
      select() {
        return builder;
      },
      eq(column: string, value: unknown) {
        call.filters[column] = value;
        // An update/upsert/delete chain terminates on .eq(), so it has to be
        // awaitable as well as chainable.
        return Object.assign(
          Promise.resolve({
            error:
              call.op === "update"
                ? (result.update?.error ?? null)
                : call.op === "delete"
                  ? (result.delete?.error ?? null)
                  : null,
          }),
          builder,
        );
      },
      single: async () =>
        call.op === "insert"
          ? (result.insert ?? { data: null, error: null })
          : (result.single ?? { data: null, error: null }),
      insert(values: unknown) {
        call.op = "insert";
        call.values = values;
        return builder;
      },
      update(values: unknown) {
        call.op = "update";
        call.values = values;
        return builder;
      },
      async upsert(values: unknown, options?: unknown) {
        call.op = "upsert";
        call.values = { values, options };
        return result.upsert ?? { error: null };
      },
      delete() {
        call.op = "delete";
        return builder;
      },
    };

    // Recorded once here and mutated in place as the chain identifies itself,
    // so `calls` stays in the order the route touched the tables.
    calls.push(call);

    return builder;
  }

  return {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
    from: vi.fn((name: string) => table(name)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => storage.upload ?? { error: null }),
        remove: vi.fn(async () => storage.remove ?? { error: null }),
        download: vi.fn(
          async () => storage.download ?? { data: null, error: null },
        ),
      })),
    },
    // Test-only handle: every table operation the route performed.
    calls,
  };
}

// Read a route's JSON response as { status, body }.
export async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() };
}
