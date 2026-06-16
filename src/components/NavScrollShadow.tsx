"use client";

import { useEffect } from "react";

// ============================================================
// NAV SCROLL SHADOW — tiny client enhancement.
// The sticky header always shows a hairline border so it reads as
// a bar on every page; once the page scrolls past the top this
// adds a soft shadow so the nav lifts gently off the content.
// Renders nothing itself.
// ============================================================
export default function NavScrollShadow({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const onScroll = () => {
      el.classList.toggle("shadow-soft", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);

  return null;
}
