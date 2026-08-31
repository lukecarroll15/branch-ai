import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, revalidatePath, redirect, signInWithPassword, signOut } =
  vi.hoisted(() => ({
    mockCreateClient: vi.fn(),
    revalidatePath: vi.fn(),
    // The real redirect() throws to unwind the request; the stub mirrors that
    // so code after a redirect is provably unreachable.
    redirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

const { login, logout } = await import("@/lib/actions/auth");

function credentials(email?: string, password?: string) {
  const form = new FormData();
  if (email !== undefined) form.append("email", email);
  if (password !== undefined) form.append("password", password);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({
    auth: { signInWithPassword, signOut },
  });
  signInWithPassword.mockResolvedValue({ error: null });
  signOut.mockResolvedValue({ error: null });
});

describe("login", () => {
  it("signs in and sends the student to their dashboard", async () => {
    await expect(
      login(credentials("student@example.test", "hunter2")),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "student@example.test",
      password: "hunter2",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns to /login with the reason when the credentials are wrong", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    await expect(
      login(credentials("student@example.test", "wrong")),
    ).rejects.toThrow("NEXT_REDIRECT:/login?error=Invalid%20login%20credentials");

    // No cache revalidation on a failed attempt.
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("treats missing fields as empty strings", async () => {
    await expect(login(credentials())).rejects.toThrow("NEXT_REDIRECT:");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "",
      password: "",
    });
  });
});

describe("logout", () => {
  it("signs out and returns to the login page", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(signOut).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
