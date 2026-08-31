import { beforeEach, describe, expect, it, vi } from "vitest";

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options: Record<string, unknown>;
    }[],
  ) => void;
};

// Typed signature so the recorded call arguments stay inspectable under `tsc`.
const { createServerClient, cookies, cookieStore } = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => [{ name: "sb-access-token", value: "abc" }]),
    set: vi.fn(),
  };
  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    createServerClient: vi.fn<
      (url: string, key: string, options: { cookies: CookieAdapter }) => object
    >(() => ({ auth: {} })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({ cookies }));

const { createClient } = await import("@/lib/supabase/server");

// The cookie adapter the module hands to Supabase.
const cookieAdapter = () => createServerClient.mock.calls[0][2].cookies;

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.getAll.mockReturnValue([
    { name: "sb-access-token", value: "abc" },
  ]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

describe("createClient", () => {
  it("uses the anon key — RLS is what scopes the data", async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://project.supabase.test",
      "anon-key",
      expect.anything(),
    );
  });

  it("reads the session from the request's cookies", async () => {
    await createClient();

    expect(cookieAdapter().getAll()).toEqual([
      { name: "sb-access-token", value: "abc" },
    ]);
  });

  it("writes refreshed cookies back to the store", async () => {
    await createClient();

    cookieAdapter().setAll([
      { name: "sb-access-token", value: "fresh", options: { path: "/" } },
      { name: "sb-refresh-token", value: "also-fresh", options: {} },
    ]);

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenCalledWith("sb-access-token", "fresh", {
      path: "/",
    });
  });

  it("ignores a write attempted from a Server Component", async () => {
    await createClient();
    // Next throws here outside a Route Handler / Server Action; the middleware
    // refreshes the session instead, so this must not bubble up.
    cookieStore.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });

    expect(() =>
      cookieAdapter().setAll([
        { name: "sb-access-token", value: "fresh", options: {} },
      ]),
    ).not.toThrow();
  });
});
