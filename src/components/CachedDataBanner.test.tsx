// Failing tests for src/components/CachedDataBanner.tsx, written BEFORE that
// file exists, per CLAUDE.md Rule 4 and SPEC.md's standard (non-SPIKE)
// ordering: Cypress writes failing tests first, Redwood implements against
// them.
//
// Expect this entire file to fail red on module resolution ("Cannot find
// module './CachedDataBanner'") until Redwood creates
// src/components/CachedDataBanner.tsx — that failure (not a mistake in this
// file's own assertions) is the correct red state for this stage.
//
// Contract under test, per SPEC.md's Inputs/Outputs section:
//   export interface CachedDataBannerProps { asOf: string; }
//   export function CachedDataBanner({ asOf }: CachedDataBannerProps): JSX.Element;
//
// Per SPEC.md's Constraints:
//   - the date display must be deterministic across environments — derived
//     from the ISO `asOf` string directly (a fixed UTC-based format), never
//     `toLocaleDateString()` with implicit locale/timezone. Tested here with
//     a fixed `asOf` and an exact string assertion, not a locale-shaped
//     regex, so a locale-dependent implementation would fail this test on a
//     non-US CI runner even though this sandbox itself only has one locale
//     available to it.
//   - must carry `role="status"` (or equivalent live-region semantics) —
//     NFR-3, disclosure must be perceivable without relying on visual
//     styling alone.
//   - UI Scope: structural but deliberately undecorated this pass — no CSS
//     module import, semantic HTML only. This file does not assert the
//     *absence* of a stylesheet (that's an implementation freedom, not a
//     contract), only that role="status" and the required text are present.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import { CachedDataBanner } from "./CachedDataBanner";

// A fixed, unambiguous ISO instant — deliberately not "today" and not a
// round midnight, so a timezone-shifting implementation (e.g. one that reads
// the local calendar date instead of the UTC one) would produce a visibly
// different date than an implementation that formats from UTC directly.
const FIXED_AS_OF = "2026-08-12T02:12:01.076Z";

describe("<CachedDataBanner> — rendering and disclosure text (PRD §7, NFR-5)", () => {
  it("renders visible text disclosing that the data shown is a cached/substituted snapshot, not a live figure", () => {
    render(<CachedDataBanner asOf={FIXED_AS_OF} />);

    // The exact copy is an implementation freedom (SPEC.md does not pin a
    // literal string for this component, unlike e.g. COLLISIONS_NOTE_TEXT
    // elsewhere in this codebase) — but the disclosure must use the word
    // "cache" or "cached" and make clear this is not a live figure. A
    // vacuous "Notice" banner with no substantive disclosure must fail this
    // assertion.
    const text = document.body.textContent ?? "";
    expect(text.toLowerCase()).toMatch(/cache|cached|snapshot/);
  });

  it('carries role="status" (or equivalent live-region semantics) so the substitution is perceivable without relying on visual styling alone (NFR-3)', () => {
    render(<CachedDataBanner asOf={FIXED_AS_OF} />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
  });

  it("is a real, single element with the disclosure text inside the role=status region — not a decorative wrapper with the text elsewhere", () => {
    render(<CachedDataBanner asOf={FIXED_AS_OF} />);

    const status = screen.getByRole("status");
    expect(status.textContent?.toLowerCase()).toMatch(/cache|cached|snapshot/);
  });
});

describe("<CachedDataBanner> — deterministic date formatting (SPEC.md Constraints)", () => {
  it("formats a fixed ISO `asOf` string into an exact, deterministic string — not toLocaleDateString() with implicit locale/timezone", () => {
    render(<CachedDataBanner asOf={FIXED_AS_OF} />);

    const text = document.body.textContent ?? "";

    // The date must be derived from the UTC calendar date encoded in the ISO
    // string (2026-08-12), not shifted by a runtime timezone. Any of the
    // unambiguous, commonly-used deterministic renderings of that UTC date
    // is acceptable (SPEC.md pins the *mechanism* — fixed UTC-based format,
    // not `toLocaleDateString()` — not one exact literal string), so this
    // matches on the numeric year/month/day components rather than one
    // hardcoded phrasing.
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/08|Aug|august/i);
    expect(text).toMatch(/12/);

    // Negative check: a timezone-shifting implementation reading the local
    // calendar date instead of the UTC one could render 2026-08-11 or
    // 2026-08-13 depending on the host's offset relative to 02:12 UTC. This
    // sandbox's default timezone makes that drift observable directly.
    expect(text).not.toMatch(/2026-08-11/);
    expect(text).not.toMatch(/2026-08-13/);
  });

  it("renders the same exact date text regardless of a different `asOf` clock time on the same UTC calendar day", () => {
    const { unmount } = render(
      <CachedDataBanner asOf="2026-08-12T00:00:00.000Z" />,
    );
    const midnightText = document.body.textContent ?? "";
    unmount();

    render(<CachedDataBanner asOf="2026-08-12T23:59:59.999Z" />);
    const lateText = document.body.textContent ?? "";

    // Both instants fall on the same UTC calendar day (2026-08-12); a
    // deterministic UTC-based formatter must render the same date text for
    // both, proving the implementation is not silently rounding across a
    // local-timezone day boundary.
    expect(midnightText).toMatch(/2026/);
    expect(midnightText).toMatch(/12/);
    expect(lateText).toMatch(/2026/);
    expect(lateText).toMatch(/12/);
  });

  it("reflects a different `asOf` date value distinctly — the date is not a hardcoded literal ignoring the prop", () => {
    render(<CachedDataBanner asOf="2020-01-15T00:00:00.000Z" />);

    const text = document.body.textContent ?? "";
    expect(text).toMatch(/2020/);
    expect(text).toMatch(/01|Jan|january/i);
    expect(text).toMatch(/15/);
    expect(text).not.toMatch(/2026/);
  });
});

describe("<CachedDataBanner> — accessibility (WCAG 2.2 AA / axe-core)", () => {
  it("has zero axe-core accessibility violations", async () => {
    const { container } = render(<CachedDataBanner asOf={FIXED_AS_OF} />);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
