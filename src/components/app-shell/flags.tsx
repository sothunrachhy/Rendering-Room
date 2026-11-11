import { useId } from "react";

// Inline SVG flags: emoji flags don't render on Windows (they show as "KH"/"GB").
// Both use a 3:2 frame so they line up side by side.

export function CambodiaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#032ea1" />
      <rect y="5" width="30" height="10" fill="#e00025" />
      {/* Simplified Angkor Wat: platform, gallery and five towers */}
      <g fill="#fff">
        <rect x="8" y="12.6" width="14" height="1.2" />
        <rect x="9" y="11" width="12" height="1.6" />
        <polygon points="13.8,11 15,6.2 16.2,11" />
        <polygon points="10.9,11 11.8,7.8 12.7,11" />
        <polygon points="17.3,11 18.2,7.8 19.1,11" />
        <polygon points="9.2,11 9.9,9 10.6,11" />
        <polygon points="19.4,11 20.1,9 20.8,11" />
      </g>
    </svg>
  );
}

export function UnitedKingdomFlag({ className }: { className?: string }) {
  // Unique clip-path ids, in case the flag appears more than once on a page
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <clipPath id={`${id}-diagonals`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${id}-diagonals)`}
        stroke="#c8102e"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}
