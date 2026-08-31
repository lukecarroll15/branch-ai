import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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
const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createServerClient: vi.fn<
      (
        url: string,
        key: string,
        options: { cookies: CookieAdapter },
      ) => { auth: { getUser: typeof getUser } }
    >(() => ({ auth: { getUser } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));

const { updateSession } = await import("@/lib/supabase/middleware");

const request = (path: string, cookies: Record<string, string> = {}) => {
  const req = new NextRequest(`https://branch.test${path}`);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
};

// The cookie adapter the module hands to Supabase.
const cookieAdapter = () => createServerClient.mock.calls[0][2].cookies;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("updateSession routing", () => {
  it("lets a signed-in student through to a protected page", async () => {
    const res = await updateSession(request("/dashboard"));

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects an anonymous visitor away from a protected page", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request("/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://branch.test/login");
  });

  it("preserves the host and protocol when redirecting", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request("/document/abc-123"));

    expect(res.headers.get("location")).toBe("https://branch.test/login");
  });

  it.each(["/", "/login", "/login?error=bad", "/privacy"])(
    "leaves %s public",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: null } });

      const res = await updateSession(request(path));

      expect(res.status).toBe(200);
    },
  );

  it("still protects a path that merely contains a public segment", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request("/dashboard/login"));

    expect(res.status).toBe(307);
  });

  it("refreshes the session on every request", async () => {
    await updateSession(request("/dashboard"));

    // getUser() is what renews the cookie; skipping it drops sessions.
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});

describe("updateSession cookie handling", () => {
  it("hands the request's cookies to Supabase", async () => {
    await updateSession(request("/dashboard", { "sb-access-token": "abc" }));

    expect(cookieAdapter().getAll()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "sb-access-token", value: "abc" }),
      ]),
    );
  });

  it("writes refreshed cookies onto the response", async () => {
    const req = request("/dashboard");
    getUser.mockImplementation(async () => {
      cookieAdapter().setAll([
        { name: "sb-access-token", value: "fresh", options: {} },
      ]);
      return { data: { user: { id: "user-1" } } };
    });

    const res = await updateSession(req);

    expect(res.cookies.get("sb-access-token")?.value).toBe("fresh");
    // Also written back onto the request, so downstream handlers see it.
    expect(req.cookies.get("sb-access-token")?.value).toBe("fresh");
  });

  it("is configured with the public project credentials", async () => {
    await updateSession(request("/dashboard"));

    expect(createServerClient).toHaveBeenCalledWith(
      "https://project.supabase.test",
      "anon-key",
      expect.anything(),
    );
  });
});
