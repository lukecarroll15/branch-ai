// ============================================================
// BRANCH LOGO — the tree mark, as a single inline SVG.
// A green canopy with a few gold leaves on a short trunk: the
// "branching" idea behind Branch. Inline (not a raster) so it
// stays crisp at any size and recolours with the theme.
// Share it via <BranchLogo /> wherever the brand appears.
// ============================================================

export default function BranchLogo({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="-150 -172 300 372"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* trunk */}
      <rect x="-26" y="40" width="52" height="150" rx="14" fill="var(--primary)" />
      {/* canopy */}
      <circle cx="0" cy="-40" r="70" fill="var(--primary)" />
      <circle cx="-95" cy="-10" r="46" fill="var(--primary)" />
      <circle cx="95" cy="-10" r="46" fill="var(--primary)" />
      {/* gold leaves */}
      <circle cx="-70" cy="-90" r="30" fill="var(--gold)" />
      <circle cx="0" cy="-130" r="34" fill="var(--gold)" />
      <circle cx="70" cy="-90" r="26" fill="var(--gold)" />
      <circle cx="-118" cy="-50" r="20" fill="var(--gold)" />
      <circle cx="118" cy="-45" r="22" fill="var(--gold)" />
    </svg>
  );
}
