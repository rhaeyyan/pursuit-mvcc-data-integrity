// Behavioral / black-box tests for src/lib/fallback.ts and the committed
// fixture src/lib/fixtures/deaths-fallback.json (SPEC.md — "Build the
// deterministic mechanism for the PRD §7 risk mitigation").
//
// Written BEFORE src/lib/fallback.ts and src/lib/fixtures/deaths-fallback.json
// exist, per CLAUDE.md Rule 4 and this SPEC's standard (non-SPIKE) ordering:
// Cypress writes failing tests first, Redwood implements against them. Both
// imports below are expected to fail module resolution today — that failure
// (not a mistake in this file's own assertions) is the correct red state.
//
// `withFallback()` is a pure function over plain objects (SPEC's own
// Constraints: "must not mutate its inputs and must not perform I/O"), so
// every test here is synchronous, stubs nothing, and touches no fetch/fs.
//
// Types (`YearlyMetricResult<K>`, `YearlyMetricRow<K>`) are imported from the
// real, already-existing ./socrata module rather than hand-rolled, so these
// fixtures are checked against the live contract and cannot silently drift
// from it (per the dispatch instructions).
//
// Fixture values used to exercise `withFallback()` itself are deliberately
// synthetic and small (never PRD Appendix A's real deaths column: 231, 244,
// 269, 297, 290, 280, 268, 229) — a passing test here must never be
// confusable with evidence that the live data is correct (NFR-4). The
// committed-fixture sanity test at the bottom asserts SHAPE only, for the
// same reason: even though SPEC.md notes the guard hook wouldn't technically
// block asserting the pinned literals here, doing so anyway would still be
// exactly the "re-derive/hardcode a figure" pattern NFR-4 exists to prevent.

import { describe, expect, it } from "vitest";

import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";
import { withFallback, type YearlyMetricResultWithSource } from "./fallback";

// ---------------------------------------------------------------------------
// Synthetic fixtures — deliberately distinct value sets for the "live" path
// vs the "cache" path, so a test that mixed them up would be visibly wrong.
// ---------------------------------------------------------------------------

type DeathsRow = YearlyMetricRow<"deaths">;
type DeathsResult = YearlyMetricResult<"deaths">;
type DeathsResultWithSource = YearlyMetricResultWithSource<"deaths">;

const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

// Live-path synthetic values: small round numbers, never reused by the
// fixture-path values below.
const LIVE_DEATHS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
// Fixture/cache-path synthetic values: a disjoint range, so a test asserting
// "came from the fixture" cannot pass by accident if the live rows leaked
// through instead.
const FIXTURE_DEATHS = [101, 102, 103, 104, 105, 106, 107, 108] as const;

function makeRows(values: readonly number[]): DeathsRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({ year, deaths: values[i] }));
}

const LIVE_SOQL =
  "$select=date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths";

const LIVE_OK: DeathsResult = {
  status: "ok",
  soql: LIVE_SOQL,
  rows: makeRows(LIVE_DEATHS),
};

const LIVE_UPSTREAM_ERROR: DeathsResult = {
  status: "error",
  soql: LIVE_SOQL,
  kind: "upstream",
  reason: "the request to Socrata failed (network error or timeout)",
};

const LIVE_CONTRACT_ERROR: DeathsResult = {
  status: "error",
  soql: LIVE_SOQL,
  kind: "contract",
  reason: "no aggregate returned for 2021",
};

const LIVE_EMPTY: DeathsResult = {
  status: "empty",
  soql: LIVE_SOQL,
};

const FIXTURE_AS_OF = "2026-08-01T12:00:00.000Z";
const FIXTURE = {
  asOf: FIXTURE_AS_OF,
  rows: makeRows(FIXTURE_DEATHS),
};

function assertOk(
  result: DeathsResultWithSource,
): asserts result is Extract<DeathsResultWithSource, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

// ---------------------------------------------------------------------------
// Edge Case 1 — live succeeds: returned verbatim, tagged source: "live".
// ---------------------------------------------------------------------------

describe("withFallback() — Edge Case 1: live ok", () => {
  it("returns the live ok result unchanged except tagged source: 'live', and never reads the fixture even when one is provided", () => {
    const resultNoFixture = withFallback(LIVE_OK, undefined);
    const resultWithFixture = withFallback(LIVE_OK, FIXTURE);

    for (const result of [resultNoFixture, resultWithFixture]) {
      assertOk(result);
      expect(result.source).toBe("live");
      expect(result.soql).toBe(LIVE_OK.soql);
      expect(result.rows).toEqual(LIVE_OK.rows);
      // The "live" variant of YearlyMetricResultWithSource carries no asOf.
      expect("asOf" in result).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge Case 2 — live fails upstream, fixture provided: synthesize a cache ok.
// ---------------------------------------------------------------------------

describe("withFallback() — Edge Case 2: live upstream error + fixture provided", () => {
  it("returns a synthesized ok result built from the fixture's rows, tagged source: 'cache' with the fixture's own asOf", () => {
    const result = withFallback(LIVE_UPSTREAM_ERROR, FIXTURE);

    assertOk(result);
    expect(result.source).toBe("cache");
    expect(result.rows).toEqual(FIXTURE.rows);
    expect(result.rows).not.toEqual(LIVE_OK.rows);
    if (result.source === "cache") {
      expect(result.asOf).toBe(FIXTURE_AS_OF);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge Case 3 — live fails upstream, no fixture: pass the error through.
// ---------------------------------------------------------------------------

describe("withFallback() — Edge Case 3: live upstream error, no fixture available", () => {
  it("returns the original upstream error object unchanged when fixture is undefined — never fabricates a fixture that doesn't exist", () => {
    const result = withFallback(LIVE_UPSTREAM_ERROR, undefined);

    expect(result).toEqual(LIVE_UPSTREAM_ERROR);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.kind).toBe("upstream");
    }
    // No "source" property should have been added to an error result — the
    // type only carries "source" on the "ok" variants.
    expect("source" in result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge Case 4 — the most important test in the file per the SPEC's own
// Intellectual Control point 3: a contract violation must NEVER be
// substituted, even when a fixture is available. Papering over an absent
// key/broken query with a stale cache is exactly the failure mode this
// product exists to surface, not hide.
// ---------------------------------------------------------------------------

describe("withFallback() — Edge Case 4: live CONTRACT error + fixture provided — must NOT substitute", () => {
  it("returns the original contract-error object unchanged, even though a fixture was available — substitution is reserved for kind: 'upstream' only", () => {
    const result = withFallback(LIVE_CONTRACT_ERROR, FIXTURE);

    expect(result.status).toBe("error");
    if (result.status !== "error") {
      throw new Error(
        "expected status: error, contract violations must never be masked",
      );
    }
    expect(result.kind).toBe("contract");
    expect(result.reason).toBe(LIVE_CONTRACT_ERROR.reason);
    expect(result).toEqual(LIVE_CONTRACT_ERROR);

    // Unambiguous negative assertions: this must not look anything like the
    // synthesized cache-ok shape from Edge Case 2.
    expect(result.status).not.toBe("ok");
    expect("source" in result).toBe(false);
    expect("rows" in result).toBe(false);
    expect("asOf" in result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge Case 5 — live returns empty, fixture provided: pass through unchanged.
// ---------------------------------------------------------------------------

describe("withFallback() — Edge Case 5: live empty + fixture provided — must NOT substitute", () => {
  it("returns the original empty result unchanged, even though a fixture was available", () => {
    const result = withFallback(LIVE_EMPTY, FIXTURE);

    expect(result).toEqual(LIVE_EMPTY);
    expect(result.status).toBe("empty");
    expect("source" in result).toBe(false);
    expect("rows" in result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Purity: no mutation of inputs, no I/O (synchronous, not a Promise).
// ---------------------------------------------------------------------------

describe("withFallback() — purity constraints (no mutation, no I/O)", () => {
  it("does not mutate the live result argument", () => {
    const live: DeathsResult = {
      status: "ok",
      soql: LIVE_SOQL,
      rows: makeRows(LIVE_DEATHS),
    };
    const liveSnapshot = structuredClone(live);
    Object.freeze(live);
    Object.freeze(live.rows);
    for (const row of live.rows) Object.freeze(row);

    // A frozen input being mutated in strict mode throws — calling
    // withFallback() must not throw here, and the live object must be
    // structurally identical to its pre-call snapshot afterward.
    expect(() => withFallback(live, FIXTURE)).not.toThrow();
    expect(live).toEqual(liveSnapshot);
  });

  it("does not mutate the fixture argument", () => {
    const fixtureSnapshot = structuredClone(FIXTURE);
    const fixtureCopy = {
      asOf: FIXTURE.asOf,
      rows: FIXTURE.rows.map((r) => ({ ...r })),
    };
    Object.freeze(fixtureCopy);
    Object.freeze(fixtureCopy.rows);
    for (const row of fixtureCopy.rows) Object.freeze(row);

    expect(() => withFallback(LIVE_UPSTREAM_ERROR, fixtureCopy)).not.toThrow();
    expect(fixtureCopy).toEqual(fixtureSnapshot);
  });

  it("does not mutate the rows array/objects returned in a synthesized cache result if the caller mutates them later — i.e. it must not return the SAME row objects as the frozen fixture without at least being safe to freeze", () => {
    // This is a defense-in-depth check on Edge Case 2's contract: the
    // fixture's own rows are frozen going in, so if withFallback() tried to
    // attach extra properties to those exact row objects it would throw.
    const frozenFixture = {
      asOf: FIXTURE_AS_OF,
      rows: Object.freeze(
        makeRows(FIXTURE_DEATHS).map((r) => Object.freeze(r)),
      ),
    };

    expect(() =>
      withFallback(LIVE_UPSTREAM_ERROR, frozenFixture),
    ).not.toThrow();
  });

  it("is synchronous — the return value is a plain object, never a Promise (no I/O)", () => {
    const okResult = withFallback(LIVE_OK, undefined);
    const cacheResult = withFallback(LIVE_UPSTREAM_ERROR, FIXTURE);
    const passthroughResult = withFallback(LIVE_UPSTREAM_ERROR, undefined);

    for (const result of [okResult, cacheResult, passthroughResult]) {
      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as { then?: unknown }).then).not.toBe("function");
    }
  });
});

// ---------------------------------------------------------------------------
// Sanity test on the committed fixture itself — SHAPE only, never the pinned
// literal figures (231, 244, 269, 297, 290, 280, 268, 229). This test must
// fail with a module-not-found error until Redwood runs the generator and
// commits src/lib/fixtures/deaths-fallback.json — that is the correct red
// state, not a mistake in this test's own expectations.
//
// tsconfig.json has "resolveJsonModule": true and Vite (vitest's transform
// layer) resolves .json imports natively, so a default import is the
// standard mechanism here; no other .json fixture import exists elsewhere in
// this repo's tests to cross-check against, so this follows the tsconfig
// setting directly.
// ---------------------------------------------------------------------------

import deathsFallbackFixture from "./fixtures/deaths-fallback.json";
import { DEATHS_SOQL } from "./deaths";

describe("src/lib/fixtures/deaths-fallback.json — committed fixture shape (not values)", () => {
  it("has exactly 8 rows, one per year 2018-2025, no duplicates and no gaps", () => {
    const fixture = deathsFallbackFixture as {
      asOf: string;
      soql: string;
      rows: { year: number; deaths: number }[];
    };

    expect(fixture.rows).toHaveLength(8);

    const years = fixture.rows.map((r) => r.year);
    const uniqueYears = new Set(years);
    expect(uniqueYears.size).toBe(8);

    const sortedYears = [...uniqueYears].sort((a, b) => a - b);
    expect(sortedYears).toEqual([
      2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
    ]);
  });

  it("has a positive integer `deaths` value for every row — never zero, never fractional, never negative", () => {
    const fixture = deathsFallbackFixture as {
      rows: { year: number; deaths: number }[];
    };

    for (const row of fixture.rows) {
      expect(typeof row.deaths).toBe("number");
      expect(Number.isInteger(row.deaths)).toBe(true);
      expect(row.deaths).toBeGreaterThan(0);
    }
  });

  it("has an `asOf` field that is present and parses as a valid ISO date", () => {
    const fixture = deathsFallbackFixture as { asOf: string };

    expect(typeof fixture.asOf).toBe("string");
    expect(fixture.asOf.length).toBeGreaterThan(0);
    const parsed = new Date(fixture.asOf);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  it("carries the byte-identical DEATHS_SOQL it was generated from — the SPEC's own 'not re-derived' invariant, checked as a string equality against the real query constant, not a pinned figure", () => {
    const fixture = deathsFallbackFixture as { soql: string };

    expect(fixture.soql).toBe(DEATHS_SOQL);
  });
});
