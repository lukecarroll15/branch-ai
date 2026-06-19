import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import NavScrollShadow from "@/components/NavScrollShadow";

// ============================================================
// HEADER — the sticky top nav.
// Visitors (logged out) get the marketing nav: brand, the
// section menu, and log in / sign up. Returning students
// (logged in) get a clean app nav: brand + log out. The blurred
// cream backdrop and on-scroll hairline keep it calm and flush.
// ============================================================

// Section links shown to visitors. Anchored to "/#…" so they work
// from any page, not just the homepage.
const MENU = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Live preview", href: "/#preview" },
  { label: "Why Branch", href: "/#trust" },
];

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md transition-shadow"
    >
      <NavScrollShadow targetId="site-header" />
      <div className="mx-auto flex h-[78px] w-full max-w-6xl items-center justify-between px-6">
        {/* Brand — links home */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Branch"
            width={5834}
            height={4500}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Centre menu — visitors only */}
        {!user && (
          <nav className="hidden items-center gap-8 md:flex">
            {MENU.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-base text-muted transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side — auth actions */}
        {user ? (
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-base font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-primary px-5 py-2.5 text-base font-bold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 hover:opacity-95"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
