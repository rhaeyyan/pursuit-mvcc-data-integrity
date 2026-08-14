// Behavioral tests for src/lib/derived.ts — the shared pure helpers the
// MVCC Workspace redesign uses so Timeline/Integrity audit/Series registry
// call one implementation instead of three copies. See that file's header
// for the Intellectual Control (percentChange.ts already owns window-based
// % change; this module adds only single-year lookup and the PDO
// derivation).
//
// Fixtures below are deliberately synthetic ("gadgets"/"widgets"), never a
// PRD Appendix A pinned deaths/injuries/collisions/casualty-filtered value —
// same discipline as percentChange.test.ts.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { pdo, valueAtYear } from "./derived";

type GadgetRow = { year: number; gadgets: number };

describe("valueAtYear() — single-year lookup, null (never 0) when missing", () => {
  const rows: GadgetRow[] = [
    { year: 2010, gadgets: 40 },
    { year: 2011, gadgets: 0 },
    { year: 2012, gadgets: 48 },
  ];

  it("returns the value for a year present in rows", () => {
    expect(valueAtYear(rows, 2010, "gadgets")).toBe(40);
    expect(valueAtYear(rows, 2012, "gadgets")).toBe(48);
  });

  it("returns a genuine 0 when the row's own value is 0 — distinct from a missing row", () => {
    expect(valueAtYear(rows, 2011, "gadgets")).toBe(0);
  });

  it("returns null (not 0, not undefined) when the year is absent from rows", () => {
    expect(valueAtYear(rows, 2099, "gadgets")).toBeNull();
  });

  it("returns null when rows itself is undefined", () => {
    expect(valueAtYear(undefined, 2010, "gadgets")).toBeNull();
  });

  it("returns null when rows is empty", () => {
    expect(valueAtYear([], 2010, "gadgets")).toBeNull();
  });

  it("tolerates a sparse array with holes/undefined entries without throwing", () => {
    const sparse: (GadgetRow | undefined)[] = [
      { year: 2020, gadgets: 5 },
      undefined,
    ];
    expect(valueAtYear(sparse, 2020, "gadgets")).toBe(5);
    expect(valueAtYear(sparse, 2021, "gadgets")).toBeNull();
  });
});

describe("pdo() — collisions minus repaired, null propagation over zero-coercion", () => {
  it("subtracts repaired from collisions for a normal pair", () => {
    expect(pdo(100, 40)).toBe(60);
  });

  it("returns 0 only when the two inputs are genuinely equal, not as a missing-value default", () => {
    expect(pdo(40, 40)).toBe(0);
  });

  it("returns null — never 0 — when collisions is null", () => {
    expect(pdo(null, 40)).toBeNull();
  });

  it("returns null — never 0 — when repaired is null", () => {
    expect(pdo(100, null)).toBeNull();
  });

  it("returns null when both inputs are null", () => {
    expect(pdo(null, null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — same infra pattern as percentChange.test.ts.
// ---------------------------------------------------------------------------

const DERIVED_PATH = join(__dirname, "derived.ts");

describe("src/lib/derived.ts — source-level greps", () => {
  it("contains no PRD Appendix A pinned figure as a literal (NFR-4)", () => {
    if (!existsSync(DERIVED_PATH)) {
      throw new Error(`${DERIVED_PATH} does not exist.`);
    }
    const source = readFileSync(DERIVED_PATH, "utf8");

    const pinnedNumbers = [
      231, 244, 269, 297, 290, 280, 268, 229, 61940, 61391, 44615, 51785, 51933,
      54252, 54030, 49634, 231564, 211486, 112918, 110558, 103887, 96607, 91316,
      85546, 45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    expect(pinnedFigurePattern.test(source)).toBe(false);
  });

  it("does not read process.env — pure-function module, no token access (NFR-2, Rule 3)", () => {
    const source = readFileSync(DERIVED_PATH, "utf8");
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("does not hardcode 2018 or 2025 — the analysis window stays exclusively owned by socrata.ts", () => {
    const source = readFileSync(DERIVED_PATH, "utf8");
    expect(source).not.toMatch(/2018/);
    expect(source).not.toMatch(/2025/);
  });
});
