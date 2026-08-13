// Behavioral / black-box tests for src/lib/percentChange.ts (SPEC.md —
// "Compute and display the 2018→2025 percentage change for each yearly
// metric currently rendered by MetricSection (FR-4)").
//
// Written BEFORE src/lib/percentChange.ts exists, per CLAUDE.md Rule 4 and
// this SPEC's standard (non-SPIKE) ordering: Cypress writes failing tests
// first, Redwood implements against them. Expect this entire file to fail
// red on module resolution ("Cannot find module './percentChange'") until
// Redwood creates that file — a single-cause failure, not evidence of a
// flawed test.
//
// Contract under test comes from SPEC.md's "[SPEC] — FR-4 percent-change"
// section, not from reading any implementation (there isn't one yet).
//
// IMPORTANT — per the dispatch instructions to Cypress: every fixture below
// is a deliberately synthetic "gadgets" figure, never any PRD Appendix A
// pinned deaths/injuries/collisions/casualty-filtered value (see the
// mvcc-data skill), and — per this task's core design principle — the
// generic fixture below deliberately does NOT use 2018/2025 as its
// start/end years. That is the mechanical proof that computeChange derives
// its window from whatever rows array it is given, never a second,
// driftable copy of the analysis window socrata.ts already owns exclusively
// (Rule 4). A passing test here must never be confusable with evidence that
// the live data is correct (NFR-4), and must never be confusable with
// evidence that 2018/2025 is baked into the implementation.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  computeChange,
  formatChangeSummary,
  formatPercentChange,
  type ChangeSummary,
} from "./percentChange";
import type { YearlyMetricRow } from "./socrata";

type GadgetRow = YearlyMetricRow<"gadgets">;

// Six rows, years 2010-2015 — deliberately NOT 2018/2025 (SPEC.md's
// Intellectual Control section: computeChange must use rows[0]/rows[last],
// never hardcoded window years). The middle rows rise and then fall
// non-monotonically, which is the point: if computeChange summed, averaged,
// or took a min/max instead of strictly rows[0]/rows[rows.length - 1], this
// fixture would expose it.
const GENERIC_ROWS: GadgetRow[] = [
  { year: 2010, gadgets: 40 },
  { year: 2011, gadgets: 44 },
  { year: 2012, gadgets: 48 },
  { year: 2013, gadgets: 52 },
  { year: 2014, gadgets: 56 },
  { year: 2015, gadgets: 20 },
];

// Minimal 2-row case, a second, distinct non-2018/2025 window.
const TWO_ROW_RISING: GadgetRow[] = [
  { year: 2030, gadgets: 10 },
  { year: 2031, gadgets: 15 },
];

// Produces a repeating-decimal percentChange (33.33...%), to prove the
// unrounded float survives in the returned object untouched.
const TWO_ROW_FRACTIONAL: GadgetRow[] = [
  { year: 2040, gadgets: 30 },
  { year: 2041, gadgets: 40 },
];

const ONE_ROW: GadgetRow[] = [{ year: 2050, gadgets: 5 }];
const NO_ROWS: GadgetRow[] = [];

const ZERO_START_ROWS: GadgetRow[] = [
  { year: 2060, gadgets: 0 },
  { year: 2061, gadgets: 15 },
];

describe("computeChange() — derives start/end from rows[0]/rows[last], never a hardcoded window", () => {
  it("computes startYear/endYear/startValue/endValue/percentChange from a multi-row fixture whose first/last years are NOT 2018/2025", () => {
    const change = computeChange(GENERIC_ROWS, "gadgets");

    expect(change).not.toBeNull();
    expect(change).toEqual<ChangeSummary>({
      startYear: 2010,
      endYear: 2015,
      startValue: 40,
      endValue: 20,
      percentChange: -50,
    });
  });

  it("ignores every row strictly between the first and last — a middle-row spike does not affect the result", () => {
    const spiked: GadgetRow[] = [
      GENERIC_ROWS[0],
      { year: 2011, gadgets: 999_999 },
      GENERIC_ROWS[GENERIC_ROWS.length - 1],
    ];

    const change = computeChange(spiked, "gadgets");

    expect(change?.startValue).toBe(40);
    expect(change?.endValue).toBe(20);
    expect(change?.percentChange).toBe(-50);
  });

  it("works identically off a distinct, second non-2018/2025 window (2030-2031), proving genericity rather than a single coincidence", () => {
    const change = computeChange(TWO_ROW_RISING, "gadgets");

    expect(change).toEqual<ChangeSummary>({
      startYear: 2030,
      endYear: 2031,
      startValue: 10,
      endValue: 15,
      percentChange: 50,
    });
  });

  it("preserves the unrounded float percentChange in the returned object — rounding is formatPercentChange's job, not computeChange's", () => {
    const change = computeChange(TWO_ROW_FRACTIONAL, "gadgets");

    const expectedUnrounded = ((40 - 30) / 30) * 100;
    expect(change?.percentChange).toBe(expectedUnrounded);
    // Sanity: this is genuinely a non-integer, so a naive Math.round inside
    // computeChange would be silently undetectable by a coarser assertion.
    expect(Number.isInteger(expectedUnrounded)).toBe(false);
  });

  it("returns null when rows has fewer than 2 elements (exactly one row)", () => {
    expect(computeChange(ONE_ROW, "gadgets")).toBeNull();
  });

  it("returns null when rows is empty", () => {
    expect(computeChange(NO_ROWS, "gadgets")).toBeNull();
  });

  it("returns null — never Infinity or NaN — when the start value is 0 (division undefined)", () => {
    const change = computeChange(ZERO_START_ROWS, "gadgets");

    expect(change).toBeNull();
  });
});

describe("formatPercentChange() — whole-percent precision, leading '+' only when strictly positive", () => {
  it("rounds to the nearest whole percent via Math.round", () => {
    expect(formatPercentChange(24.6)).toBe("+25%");
    expect(formatPercentChange(-63.4)).toBe("-63%");
  });

  it("prefixes a leading '+' for any rounded-positive value, using JS's native minus sign for negatives (no glyph substitution)", () => {
    expect(formatPercentChange(1)).toBe("+1%");
    expect(formatPercentChange(100)).toBe("+100%");
    expect(formatPercentChange(-1)).toBe("-1%");
    expect(formatPercentChange(-100)).toBe("-100%");
  });

  it("renders exactly 0 as '0%', with no leading '+' or '-' glyph", () => {
    expect(formatPercentChange(0)).toBe("0%");
  });

  it("renders -0 as '0%', never '-0%'", () => {
    expect(formatPercentChange(-0)).toBe("0%");
  });

  it("never renders '-0%' for an input that rounds to negative zero (e.g. -0.4)", () => {
    // Math.round(-0.4) is JS's -0, not 0 — this is the exact trap the
    // SPEC's Constraints section names explicitly.
    expect(Object.is(Math.round(-0.4), -0)).toBe(true);
    expect(formatPercentChange(-0.4)).toBe("0%");
  });

  it("rounds a small positive fraction down to 0 with no leading '+' (0.4 rounds to 0, not +0%)", () => {
    expect(formatPercentChange(0.4)).toBe("0%");
  });

  it("rounds 0.5 up to +1% (Math.round's round-half-up-toward-positive-infinity behavior)", () => {
    expect(formatPercentChange(0.5)).toBe("+1%");
  });
});

describe("formatChangeSummary() — exact template match", () => {
  it("matches the pinned template exactly for a synthetic negative-change example", () => {
    const change: ChangeSummary = {
      startYear: 2010,
      endYear: 2015,
      startValue: 40,
      endValue: 20,
      percentChange: -50,
    };

    expect(formatChangeSummary(change)).toBe(
      "2010–2015 change: -50% (40 → 20)",
    );
  });

  it("matches the pinned template exactly for a synthetic positive-change example, using an en dash between years and a right arrow between values", () => {
    const change: ChangeSummary = {
      startYear: 2030,
      endYear: 2031,
      startValue: 10,
      endValue: 15,
      percentChange: 50,
    };

    const result = formatChangeSummary(change);
    expect(result).toBe("2030–2031 change: +50% (10 → 15)");
    // Explicit character-level proof this is an en dash (U+2013), not a
    // hyphen-minus, and a right arrow (U+2192), matching the SPEC's literal
    // template string.
    expect(result).toContain("–");
    expect(result).toContain("→");
  });

  it("delegates rounding/sign formatting to formatPercentChange rather than re-implementing it — an unrounded fractional percentChange still renders whole-percent in the summary", () => {
    const change: ChangeSummary = {
      startYear: 2040,
      endYear: 2041,
      startValue: 30,
      endValue: 40,
      percentChange: ((40 - 30) / 30) * 100, // 33.33...
    };

    expect(formatChangeSummary(change)).toBe(
      "2040–2041 change: +33% (30 → 40)",
    );
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — generalizing the same infra pattern already used in
// src/lib/repairedCollisions.test.ts and src/components/YearlyLineChart.test.tsx.
// ---------------------------------------------------------------------------

const PERCENT_CHANGE_PATH = join(__dirname, "percentChange.ts");

describe("src/lib/percentChange.ts — source-level greps (the only net for these constraints)", () => {
  it("contains no PRD Appendix A pinned figure (deaths/injuries/collisions/casualty-filtered) as a literal (NFR-4, Constraint: no re-derivation of a real figure)", () => {
    if (!existsSync(PERCENT_CHANGE_PATH)) {
      throw new Error(
        `${PERCENT_CHANGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(PERCENT_CHANGE_PATH, "utf8");

    const pinnedNumbers = [
      // Deaths.
      231, 244, 269, 297, 290, 280, 268, 229,
      // Injuries.
      61940, 61391, 44615, 51785, 51933, 54252, 54030, 49634,
      // Collisions (raw, reporting-affected).
      231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546,
      // Casualty-filtered / repaired collisions.
      45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    expect(pinnedFigurePattern.test(source)).toBe(false);
  });

  it("does not read process.env — this is a pure-function module with no token access (NFR-2, Rule 3)", () => {
    if (!existsSync(PERCENT_CHANGE_PATH)) {
      throw new Error(
        `${PERCENT_CHANGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(PERCENT_CHANGE_PATH, "utf8");
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("does not hardcode 2018 or 2025 as the start/end year (Intellectual Control: the analysis window stays exclusively owned by socrata.ts)", () => {
    if (!existsSync(PERCENT_CHANGE_PATH)) {
      throw new Error(
        `${PERCENT_CHANGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(PERCENT_CHANGE_PATH, "utf8");
    expect(source).not.toMatch(/2018/);
    expect(source).not.toMatch(/2025/);
  });
});
