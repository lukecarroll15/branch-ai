"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// REVEAL — scroll-triggered entrance.
// Wraps any block and fades/lifts it into place the first time it
// enters the viewport (not on page load), so sections below the
// fold animate when the visitor actually reaches them. Honours
// `prefers-reduced-motion`: those users get the content instantly,
// fully visible, with no transform.
//
// `delay` staggers siblings (ms). `as` lets a caller keep correct
// semantics (e.g. render as <li> inside a list).
// ============================================================

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
};

export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // Always start hidden so server and client render identically (no hydration
  // mismatch). Reduced-motion users still see content immediately because the
  // hide classes below are all `motion-safe:`-gated.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Vanishingly rare, but never strand content hidden if the browser lacks
    // IntersectionObserver — reveal on the next frame (async, so no cascading
    // render).
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect(); // reveal once, then stop observing
            break;
          }
        }
      },
      // Trigger a touch before the element is fully on screen.
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-shown={shown}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`motion-safe:transition-all motion-safe:duration-[700ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown
          ? "opacity-100 translate-y-0"
          : "motion-safe:opacity-0 motion-safe:translate-y-4"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
