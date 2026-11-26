// Icons. General-purpose icons come from Lucide (import them from 'lucide-react'
// and spread `iconProps` so every icon shares one size and stroke weight).
// This file holds the shared props, the icon for each page section, and the few
// icons Lucide does not provide.

import { Activity, BriefcaseBusiness, FolderOpen, House, Layers } from 'lucide-react';

// One size and stroke weight for every icon on the site.
export const iconProps = {
  size: 16,
  strokeWidth: 1.75,
  'aria-hidden': true,
  focusable: false,
};

// Each page section's icon: in the sidebar, the mobile menu, and beside each
// section's heading.
export const sectionIcons = {
  home: House,
  projects: FolderOpen,
  experience: BriefcaseBusiness,
  stack: Layers,
  github: Activity,
};

// Lucide no longer ships brand logos, so these two are drawn here to match it:
// the same 24-unit grid, round caps and joins, and the shared stroke weight.
function BrandIcon({ children }) {
  return (
    <svg
      width={iconProps.size}
      height={iconProps.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={iconProps.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <BrandIcon>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BrandIcon>
  );
}

export function GithubIcon() {
  return (
    <BrandIcon>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </BrandIcon>
  );
}

// The guide's pointer, drawn like a Figma multiplayer cursor: a solid, softly
// rounded arrowhead with a thin contrasting outline.
//
// Anchoring: the SVG's top-left corner (its origin) IS the cursor's visible tip, at
// any rendered size, so whatever positions this icon positions the tip. Two things
// make that true:
//   - the arrow's point is the path's first vertex, drawn from the origin with no
//     padding inside the viewBox;
//   - the outline's round join extends half the stroke width beyond that vertex
//     along the arrow's diagonal axis, so the path is shifted inward by exactly that
//     much (POINTER_TIP_INSET) to land the outline's outer edge on the origin.
const POINTER_STROKE_WIDTH = 1.6;
const POINTER_TIP_INSET = (POINTER_STROKE_WIDTH / 2) * Math.SQRT1_2;

export function PointerIcon({ size = 20 }) {
  return (
    <svg
      // No offset: the icon's own origin is the tip, so it sits exactly on the
      // guide's origin. A press (data-pressing on the guide) dips it slightly,
      // shrinking toward the tip.
      className="absolute top-0 left-0 max-w-none origin-top-left overflow-visible [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.25))] transition-transform duration-120 ease-out in-data-pressing:scale-86"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <path
        transform={`translate(${POINTER_TIP_INSET} ${POINTER_TIP_INSET})`}
        d="M0 0 17.2 6.6l-7.5 3.1-3.1 7.5L0 0Z"
        fill="var(--tour-bg)"
        stroke="var(--tour-fg)"
        strokeWidth={POINTER_STROKE_WIDTH}
        strokeLinejoin="round"
      />
    </svg>
  );
}
