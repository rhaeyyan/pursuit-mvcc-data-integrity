// Behavioral / black-box tests for src/lib/arrestsCoverage.ts (SPEC.md — FR-7
// Phase 5b: Coverage Data Fetching & Derivation).
//
// Written BEFORE src/lib/arrestsCoverage.ts exists, per Rule 4: Cypress writes
// failing tests first, Redwood implements against them.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCoverageData,
  type CoverageResult,
  type YearlyCoverageRow,
} from "./arrestsCoverage";

// ---------------------------------------------------------------------------
// Fixtures
// Deliberately synthetic figures — distinct from pinned mvcc-data-skill figures
// (arrests unpopulated 32.9%) so passing tests prove dynamic derivation (NFR-4).
// ---------------------------------------------------------------------------

const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

// Collisions: 7 years at total 10000 / pop 9000, 1 year (2025) at total 20000 / pop 10000.
// totalWindow = 90000, populatedWindow = 73000, unpopulatedWindow = 17000.
// Row-weighted windowUnpopulatedSharePercent = (17000 / 90000) * 100 = 18.8888...% (18.89%).
// Mean of yearly unpopulated percentages = (7 * 10% + 50%) / 8 = 15.0%.
const SYNTHETIC_COLLISIONS_TOTAL = [
  10000, 10000, 10000, 10000, 10000, 10000, 10000, 20000,
] as const;
const SYNTHETIC_COLLISIONS_POPULATED = [
  9000, 9000, 9000, 9000, 9000, 9000, 9000, 10000,
] as const;

// Arrests: 7 years at total 5000 / pop 4000, 1 year (2025) at total 15000 / pop 3000.
// totalWindow = 50000, populatedWindow = 31000, unpopulatedWindow = 19000.
// Row-weighted windowUnpopulatedSharePercent = (19000 / 50000) * 100 = 38.0%.
// Mean of yearly unpopulated percentages = (7 * 20% + 80%) / 8 = 27.5%.
const SYNTHETIC_ARRESTS_TOTAL = [
  5000, 5000, 5000, 5000, 5000, 5000, 5000, 15000,
] as const;
const SYNTHETIC_ARRESTS_POPULATED = [
  4000, 4000, 4000, 4000, 4000, 4000, 4000, 3000,
] as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: CoverageResult,
): asserts result is Extract<CoverageResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertPartial(
  result: CoverageResult,
): asserts result is Extract<CoverageResult, { status: "partial" }> {
  if (result.status !== "partial") {
    throw new Error(`expected status "partial", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: CoverageResult,
): asserts result is Extract<CoverageResult, { status: "error" }> {
  if (result.status !== "error") {
    throw new Error(`expected status "error", got ${JSON.stringify(result)}`);
  }
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function mockSocrataFetch(options: {
  collisionsFail?: boolean;
  collisionsMalformed?: boolean;
  arrestsFail?: boolean;
  arrestsMalformed?: boolean;
} = {}) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const urlStr = input.toString();
    const url = new URL(urlStr);

    if (url.pathname.includes("h9gi-nx95")) {
      if (options.collisionsFail) {
        return new Response("Internal Server Error", { status: 500 });
      }
      if (options.collisionsMalformed) {
        return jsonResponse({ error: "malformed" });
      }

      const select = url.searchParams.get("$select") ?? "";
      const where = url.searchParams.get("$where") ?? "";

      // If querying populated specifically
      if (
        select.includes("populated") ||
        where.includes("borough") ||
        where.includes("BRONX")
      ) {
        return jsonResponse(
          SYNTHETIC_YEARS.map((yr, idx) => ({
            year: String(yr),
            populated: String(SYNTHETIC_COLLISIONS_POPULATED[idx]),
            count: String(SYNTHETIC_COLLISIONS_POPULATED[idx]),
          })),
        );
      }

      // Default: total query
      return jsonResponse(
        SYNTHETIC_YEARS.map((yr, idx) => ({
          year: String(yr),
          total: String(SYNTHETIC_COLLISIONS_TOTAL[idx]),
          count: String(SYNTHETIC_COLLISIONS_TOTAL[idx]),
        })),
      );
    }

    if (url.pathname.includes("8h9b-rp9u")) {
      if (options.arrestsFail) {
        return new Response("Internal Server Error", { status: 500 });
      }
      if (options.arrestsMalformed) {
        return jsonResponse({ error: "malformed" });
      }

      const select = url.searchParams.get("$select") ?? "";
      const where = url.searchParams.get("$where") ?? "";

      // If querying populated specifically
      if (
        select.includes("populated") ||
        where.includes("arrest_boro") ||
        where.includes("'B'")
      ) {
        return jsonResponse(
          SYNTHETIC_YEARS.map((yr, idx) => ({
            year: String(yr),
            populated: String(SYNTHETIC_ARRESTS_POPULATED[idx]),
            arrests: String(SYNTHETIC_ARRESTS_POPULATED[idx]),
            count: String(SYNTHETIC_ARRESTS_POPULATED[idx]),
          })),
        );
      }

      // Default: total query
      return jsonResponse(
        SYNTHETIC_YEARS.map((yr, idx) => ({
          year: String(yr),
          total: String(SYNTHETIC_ARRESTS_TOTAL[idx]),
          arrests: String(SYNTHETIC_ARRESTS_TOTAL[idx]),
          count: String(SYNTHETIC_ARRESTS_TOTAL[idx]),
        })),
      );
    }

    return new Response("Not Found", { status: 404 });
  });
}

// ---------------------------------------------------------------------------
// Happy Path & Row-Weighted Calculation Tests
// ---------------------------------------------------------------------------

describe("fetchCoverageData() — Happy Path (status: ok)", () => {
  it("returns status ok with complete CoverageResult containing collisions and arrests metrics", async () => {
    mockSocrataFetch();

    const result = await fetchCoverageData();

    assertOk(result);
    expect(result.collisions).toBeDefined();
    expect(result.arrests).toBeDefined();
  });

  it("returns exactly 8 yearly rows (2018..2025) for both datasets", async () => {
    mockSocrataFetch();

    const result = await fetchCoverageData();

    assertOk(result);
    expect(result.collisions.yearly).toHaveLength(8);
    expect(result.arrests.yearly).toHaveLength(8);

    expect(result.collisions.yearly.map((r: YearlyCoverageRow) => r.year)).toEqual(
      [...SYNTHETIC_YEARS],
    );
    expect(result.arrests.yearly.map((r: YearlyCoverageRow) => r.year)).toEqual(
      [...SYNTHETIC_YEARS],
    );
  });

  it("calculates per-year coverageRatePercent as (populated / total) * 100", async () => {
    mockSocrataFetch();

    const result = await fetchCoverageData();

    assertOk(result);
    for (let i = 0; i < 8; i++) {
      const colRow = result.collisions.yearly[i];
      const expectedColRate =
        (SYNTHETIC_COLLISIONS_POPULATED[i] / SYNTHETIC_COLLISIONS_TOTAL[i]) * 100;
      expect(colRow.coverageRatePercent).toBeCloseTo(expectedColRate, 4);

      const arrRow = result.arrests.yearly[i];
      const expectedArrRate =
        (SYNTHETIC_ARRESTS_POPULATED[i] / SYNTHETIC_ARRESTS_TOTAL[i]) * 100;
      expect(arrRow.coverageRatePercent).toBeCloseTo(expectedArrRate, 4);
    }
  });

  it("calculates totalWindow and populatedWindow as exact sums of yearly total and populated counts", async () => {
    mockSocrataFetch();

    const result = await fetchCoverageData();

    assertOk(result);
    const expectedColTotal = SYNTHETIC_COLLISIONS_TOTAL.reduce((a, b) => a + b, 0);
    const expectedColPop = SYNTHETIC_COLLISIONS_POPULATED.reduce((a, b) => a + b, 0);
    expect(result.collisions.totalWindow).toBe(expectedColTotal);
    expect(result.collisions.populatedWindow).toBe(expectedColPop);

    const expectedArrTotal = SYNTHETIC_ARRESTS_TOTAL.reduce((a, b) => a + b, 0);
    const expectedArrPop = SYNTHETIC_ARRESTS_POPULATED.reduce((a, b) => a + b, 0);
    expect(result.arrests.totalWindow).toBe(expectedArrTotal);
    expect(result.arrests.populatedWindow).toBe(expectedArrPop);
  });

  it("PROOFS ROW-WEIGHTED CALCULATION: windowUnpopulatedSharePercent evaluates to ((totalWindow - populatedWindow) / totalWindow) * 100, NOT simple mean of yearly percentages", async () => {
    mockSocrataFetch();

    const result = await fetchCoverageData();

    assertOk(result);

    // Collisions window unpopulated share: (90000 - 73000) / 90000 * 100 = 18.8888...%
    const expectedColRowWeighted =
      ((result.collisions.totalWindow - result.collisions.populatedWindow) /
        result.collisions.totalWindow) *
      100;
    expect(result.collisions.windowUnpopulatedSharePercent).toBeCloseTo(
      expectedColRowWeighted,
      4,
    );

    // Mean of yearly unpopulated rates for collisions: (7 * 10% + 50%) / 8 = 15.0%
    const colYearlyUnpopShares = result.collisions.yearly.map(
      (r: YearlyCoverageRow) => 100 - r.coverageRatePercent,
    );
    const colSimpleMean =
      colYearlyUnpopShares.reduce((a: number, b: number) => a + b, 0) / colYearlyUnpopShares.length;
    expect(result.collisions.windowUnpopulatedSharePercent).not.toBeCloseTo(
      colSimpleMean,
      2,
    );

    // Arrests window unpopulated share: (50000 - 31000) / 50000 * 100 = 38.0%
    const expectedArrRowWeighted =
      ((result.arrests.totalWindow - result.arrests.populatedWindow) /
        result.arrests.totalWindow) *
      100;
    expect(result.arrests.windowUnpopulatedSharePercent).toBeCloseTo(
      expectedArrRowWeighted,
      4,
    );

    // Mean of yearly unpopulated rates for arrests: (7 * 20% + 80%) / 8 = 27.5%
    const arrYearlyUnpopShares = result.arrests.yearly.map(
      (r: YearlyCoverageRow) => 100 - r.coverageRatePercent,
    );
    const arrSimpleMean =
      arrYearlyUnpopShares.reduce((a: number, b: number) => a + b, 0) / arrYearlyUnpopShares.length;
    expect(result.arrests.windowUnpopulatedSharePercent).not.toBeCloseTo(
      arrSimpleMean,
      2,
    );
  });

  it("handles zero total count safely (coverageRatePercent = 0, no NaN)", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const urlStr = input.toString();
      if (urlStr.includes("h9gi-nx95")) {
        return jsonResponse(
          SYNTHETIC_YEARS.map((yr) => ({
            year: String(yr),
            total: "0",
            populated: "0",
            count: "0",
          })),
        );
      }
      if (urlStr.includes("8h9b-rp9u")) {
        return jsonResponse(
          SYNTHETIC_YEARS.map((yr) => ({
            year: String(yr),
            total: "0",
            populated: "0",
            arrests: "0",
            count: "0",
          })),
        );
      }
      return new Response("Not Found", { status: 404 });
    });

    const result = await fetchCoverageData();

    assertOk(result);
    for (const row of result.collisions.yearly) {
      expect(row.coverageRatePercent).toBe(0);
      expect(Number.isNaN(row.coverageRatePercent)).toBe(false);
    }
    expect(Number.isNaN(result.collisions.windowUnpopulatedSharePercent)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Partial Failure Tests (status: partial)
// ---------------------------------------------------------------------------

describe("fetchCoverageData() — Partial Failures (status: partial)", () => {
  it("returns status partial with valid collisions metrics when arrests fetch fails (500 error)", async () => {
    mockSocrataFetch({ arrestsFail: true });

    const result = await fetchCoverageData();

    assertPartial(result);
    expect(result.collisions).toBeDefined();
    expect(result.collisions?.yearly).toHaveLength(8);
    expect(result.arrests).toBeUndefined();
    expect(result.reason).toBeTruthy();
  });

  it("returns status partial with valid arrests metrics when collisions fetch fails (500 error)", async () => {
    mockSocrataFetch({ collisionsFail: true });

    const result = await fetchCoverageData();

    assertPartial(result);
    expect(result.arrests).toBeDefined();
    expect(result.arrests?.yearly).toHaveLength(8);
    expect(result.collisions).toBeUndefined();
    expect(result.reason).toBeTruthy();
  });

  it("never lets one dataset's failure throw an unhandled exception or silence the other", async () => {
    mockSocrataFetch({ arrestsFail: true });

    await expect(fetchCoverageData()).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Complete Failure Tests (status: error)
// ---------------------------------------------------------------------------

describe("fetchCoverageData() — Complete Failures (status: error)", () => {
  it("returns status error with kind upstream when both dataset fetches fail", async () => {
    mockSocrataFetch({ collisionsFail: true, arrestsFail: true });

    const result = await fetchCoverageData();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toBeTruthy();
  });

  it("returns status error with kind contract when response payloads are malformed for both datasets", async () => {
    mockSocrataFetch({ collisionsMalformed: true, arrestsMalformed: true });

    const result = await fetchCoverageData();

    assertError(result);
    expect(result.reason).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Source-Level Grep Constraints
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const COVERAGE_PATH = join(SRC_DIR, "lib", "arrestsCoverage.ts");

describe("src/lib/arrestsCoverage.ts — source-level greps", () => {
  it("file src/lib/arrestsCoverage.ts exists", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    expect(existsSync(COVERAGE_PATH)).toBe(true);
  });

  it("imports fetchArrestsQuery from ./arrestsSocrata and ARRESTS_OFFENSE_WHERE from ./arrests", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(COVERAGE_PATH, "utf8");
    expect(source).toMatch(/from\s+["']\.\/arrestsSocrata["']/);
    expect(source).toMatch(/fetchArrestsQuery/);
    expect(source).toMatch(/from\s+["']\.\/arrests["']/);
    expect(source).toMatch(/ARRESTS_OFFENSE_WHERE/);
  });

  it("imports from ./socrata for collisions dataset queries", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(COVERAGE_PATH, "utf8");
    expect(source).toMatch(/from\s+["']\.\/socrata["']/);
  });

  it("Rule 1 / NFR-4: contains NO hardcoded figure literals (e.g. 32.9, 31.8, or pinned live figures)", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(COVERAGE_PATH, "utf8");
    const forbiddenLiterals = ["32.9", "31.8", "29007", "8330", "21123"];
    for (const lit of forbiddenLiterals) {
      expect(source).not.toContain(lit);
    }
  });

  it("Rule 4 / PRD honesty rules: performs ZERO comparative math between collisions and arrests (no diff or ratio calculation)", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(COVERAGE_PATH, "utf8");
    // Check for difference/ratio math between collisions and arrests variables
    expect(source).not.toMatch(/collisions.*-.*arrests/i);
    expect(source).not.toMatch(/arrests.*-.*collisions/i);
    expect(source).not.toMatch(/collisions.*\/.*arrests/i);
    expect(source).not.toMatch(/arrests.*\/.*collisions/i);
    expect(source).not.toMatch(/collisionsShare/);
    expect(source).not.toMatch(/arrestsShare/);
  });

  it("Rule 4 / PRD honesty rules: contains NO forbidden comparative vocabulary", () => {
    if (!existsSync(COVERAGE_PATH)) {
      throw new Error(
        `${COVERAGE_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(COVERAGE_PATH, "utf8");
    const forbiddenWords = [
      "better",
      "worse",
      "higher",
      "lower",
      "compared to",
      "unlike",
      "whereas",
    ];
    for (const word of forbiddenWords) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      expect(source).not.toMatch(regex);
    }
  });
});
