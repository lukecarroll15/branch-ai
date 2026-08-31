import { beforeEach, describe, expect, it, vi } from "vitest";

type AdminOptions = {
  auth: { persistSession: boolean; autoRefreshToken: boolean };
};

// Typed signature so the recorded call arguments stay inspectable under `tsc`.
const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn<(url: string, key: string, options: AdminOptions) => object>(
    () => ({ from: vi.fn() }),
  ),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

const { createAdminClient } = await import("@/lib/supabase/admin");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("createAdminClient", () => {
  it("uses the service-role key so the pipeline can bypass RLS", () => {
    createAdminClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.test",
      "service-role-key",
      expect.anything(),
    );
  });

  it("holds no session — it runs outside any user's request", () => {
    createAdminClient();

    const [, , options] = createClient.mock.calls[0];
    expect(options).toEqual({
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });
});
