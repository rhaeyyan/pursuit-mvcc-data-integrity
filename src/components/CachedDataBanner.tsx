// Discloses that the deaths card is showing a substituted cached snapshot
// rather than a live Socrata figure (PRD §7 risk mitigation, NFR-5). Mounted
// by src/app/[[...borough]]/page.tsx as a sibling before the deaths chart,
// gated on withFallback()'s `source === "cache"` — see that file and
// src/lib/fallback.ts for the substitution rule this banner is disclosing.
//
// UI Scope: structural but deliberately undecorated this pass (SPEC.md) — no
// CSS module, semantic HTML only. `role="status"` is a floor, not
// decoration: NFR-3 requires the substitution be perceivable without relying
// on visual styling alone, which this pass doesn't have yet.
//
// Date formatting is a fixed UTC-based rendering, never
// `toLocaleDateString()` — that would render a different string depending on
// the runtime's locale/timezone (SPEC.md Constraints), which is exactly the
// kind of non-determinism this product's own honesty-of-presentation rule
// forbids for a disclosure banner.

import type { JSX } from "react";

export interface CachedDataBannerProps {
  asOf: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatAsOfUTC(asOf: string): string {
  const date = new Date(asOf);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function CachedDataBanner({ asOf }: CachedDataBannerProps): JSX.Element {
  // A <p role="status">, matching this codebase's existing disclosure-banner
  // precedent (CoverageWarning's and MetricSection's own status paragraphs):
  // an <aside role="status"> fails axe-core's aria-allowed-role check, since
  // "status" is not among the ARIA-in-HTML roles permitted on <aside>.
  return (
    <p role="status">
      Showing a saved snapshot from {formatAsOfUTC(asOf)} — we couldn&apos;t
      reach NYC Open Data, so these numbers aren&apos;t live.
    </p>
  );
}
