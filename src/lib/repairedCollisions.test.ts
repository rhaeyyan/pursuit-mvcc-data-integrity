// Behavioral / black-box tests for src/lib/repairedCollisions.ts (SPEC.md —
// "Casualty-filtered 'repaired' collisions per year (FR-12), data half only —
// the corrected number").
//
// Written BEFORE src/lib/repairedCollisions.ts (and the widened, third
// `extraWhere` parameter on src/lib/socrata.ts's builders/fetchYearlyMetric
// it depends on) exist, per CLAUDE.md Rule 4 and this SPEC's standard
// (non-SPIKE) ordering: Cypress writes failing tests first, Redwood
// implements against them.
//
// Contract under test comes from SPEC.md's "[SPEC] — Casualty-filtered
// 'repaired' collisions per year" section, not from reading any
// implementation (there isn't one yet). This file mirrors
// src/lib/collisions.test.ts's structure exactly — the closest existing
// example (same aggregate expression, count(collision_id)) — substituting
// the repaired-collisions aggregate/alias/extra-$where, per the dispatch
// instructions.
//
// IMPORTANT — per the dispatch instructions to Cypress: fixture values are
// deliberately synthetic (150, 250, ... 850), never the pinned mvcc-data-
// skill "Casualty-filtered" column (45774, 45439, 33362, 38809, 39336,
// 40472, 40229, 37420). A passing test here must never be confusable with
// evidence that the live data is correct (NFR-4). The one-time diff of a
// live/stubbed response against those pinned figures is Redwood's Acceptance
// clause 6's job during Cypress's post-completion audit of the
// [COMPLETION-REPORT], not a unit-test fixture here.
//
// The pinned SoQL clause values below (including the new AND-ed casualty
// filter) are copied verbatim from SPEC.md's "Query" section (a Rule-4
// frozen contract, re-verified live per the mvcc-data skill) — they are
// query-shape strings, not data figures, so they are exactly what Rule 4
// says Cypress should test against.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOROUGHS, type BoroughCode } from "./boroughs";
import {
  REPAIRED_COLLISIONS_SOQL,
  buildRepairedCollisionsUrl,
  fetchRepairedCollisionsPerYear,
  type RepairedCollisionsResult,
  type RepairedCollisionsRow,
} from "./repairedCollisions";

const EXTRA_WHERE =
  "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)";

const PINNED_CLAUSES = {
  select: "date_extract_y(crash_date) AS year, count(collision_id) AS repaired",
  where:
    "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00' " +
    `AND ${EXTRA_WHERE}`,
  group: "date_extract_y(crash_date)",
  order: "year",
} as const;

const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// Obviously-synthetic fixture: three-digit round numbers ascending by 100,
// distinct in shape from the real mvcc-data-skill "Casualty-filtered" column
// (five-digit figures in the tens of thousands: 45774, 45439, 33362, 38809,
// 39336, 40472, 40229, 37420) and from the other three metrics' own synthetic
// fixtures (deaths 11..88, injuries 100..800, raw collisions 1000..8000).
const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const SYNTHETIC_REPAIRED_STRINGS = [
  "150",
  "250",
  "350",
  "450",
  "550",
  "650",
  "750",
  "850",
] as const;

type RawRow = { year: string | number; repaired: unknown };

function syntheticOkBody(): RawRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    repaired: SYNTHETIC_REPAIRED_STRINGS[i],
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: RepairedCollisionsResult,
): asserts result is Extract<RepairedCollisionsResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: RepairedCollisionsResult,
): asserts result is Extract<RepairedCollisionsResult, { status: "error" }> {
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

describe("fetchRepairedCollisionsPerYear() — the ok path", () => {
  it("returns exactly 8 ascending rows, 2018..2025, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchRepairedCollisionsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows.map((r: RepairedCollisionsRow) => r.year)).toEqual([
      ...SYNTHETIC_YEARS,
    ]);
    expect(result.rows.map((r: RepairedCollisionsRow) => r.repaired)).toEqual([
      150, 250, 350, 450, 550, 650, 750, 850,
    ]);
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].year).toBeGreaterThan(result.rows[i - 1].year);
    }
  });

  it("casts year and repaired to `number` explicitly — never relies on JS coercion of the string payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchRepairedCollisionsPerYear();

    assertOk(result);
    for (const row of result.rows) {
      expect(typeof row.year).toBe("number");
      expect(typeof row.repaired).toBe("number");
      expect(Number.isInteger(row.repaired)).toBe(true);
    }
  });

  it("accepts `year` as either a string or a JSON number (the schema's deliberate asymmetry) while still requiring `repaired` to be a string", async () => {
    const body = syntheticOkBody().map((row, i) =>
      i === 0 ? { ...row, year: SYNTHETIC_YEARS[0] } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchRepairedCollisionsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows[0].year).toBe(2018);
  });

  it("calls the Socrata endpoint exactly once (no retry loop on success)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchRepairedCollisionsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchRepairedCollisionsPerYear() — the empty path (FR-10)", () => {
  it("returns status: empty, distinct from an error, for a zero-row Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchRepairedCollisionsPerYear();

    expect(result.status).toBe("empty");
    expect(result.status).not.toBe("error");
  });
});

describe("fetchRepairedCollisionsPerYear() — window completeness / contract failures (FR-11, trap 1)", () => {
  it("fails loud with error/contract — never a zero-fill — when a year in 2018-2025 is absent", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
    // The absent year must be named, not swallowed.
    expect(result.reason).toMatch(/2021/);
  });

  it("fails loud with error/contract on a duplicate year that displaces a required year", async () => {
    const body = syntheticOkBody();
    // Duplicate 2018 in place of what would have been the 2019 row: 8 rows,
    // but 2019 is now missing and 2018 appears twice.
    body[1] = { ...body[0] };
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("fails loud with error/contract when more than 8 rows are returned (a year outside the window leaked in)", async () => {
    const body = [...syntheticOkBody(), { year: "2026", repaired: "99" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a non-numeric string", "N/A"],
    ["a JSON number instead of a string", 450],
    ["a negative numeric string", "-5"],
    ["a decimal numeric string", "5.5"],
  ])(
    "fails loud with error/contract when `repaired` is %s for one year — never coerced to zero",
    async (_label, badValue) => {
      const body = syntheticOkBody().map((row) =>
        row.year === "2022" ? { ...row, repaired: badValue } : row,
      );
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      const result = await fetchRepairedCollisionsPerYear();

      assertError(result);
      expect(result.kind).toBe("contract");
      expect(result.reason).toBeTruthy();
    },
  );

  it("fails loud with error/contract when a year's `repaired` key is entirely absent from the row — the same absent-key-as-zero shape trap 1 names for number_of_persons_killed", async () => {
    const body = syntheticOkBody().map((row) => {
      if (row.year !== "2023") return row;
      const { year } = row;
      return { year } as RawRow;
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
  });
});

describe("fetchRepairedCollisionsPerYear() — upstream failures", () => {
  it("returns error/upstream, never throwing, when the fetch itself rejects (network/DNS/timeout)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream and names the status code when Socrata responds 429", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 }),
    );

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toMatch(/429/);
  });

  it("returns error/upstream on a 5xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream, and never throws, when Socrata serves a non-JSON body on a 2xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>rate limited</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("does not retry in a loop on upstream failure — a single attempt, then fail loud", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await fetchRepairedCollisionsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the app token into the rendered `reason`", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "super-secret-token-value-should-not-leak");
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchRepairedCollisionsPerYear();

    assertError(result);
    expect(result.reason).not.toContain(
      "super-secret-token-value-should-not-leak",
    );
  });
});

describe("fetchRepairedCollisionsPerYear() — token is attribution-only (Edge Case 8)", () => {
  it("still succeeds when SOCRATA_APP_TOKEN is unset — absence degrades throughput, not correctness", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "");
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchRepairedCollisionsPerYear();

    expect(result.status).toBe("ok");
  });
});

describe("FR-8 invariant — REPAIRED_COLLISIONS_SOQL and buildRepairedCollisionsUrl() cannot drift apart", () => {
  it("REPAIRED_COLLISIONS_SOQL is built from the pinned, frozen clauses (Rule 4) — every clause value is present verbatim", () => {
    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(REPAIRED_COLLISIONS_SOQL).toContain(clause);
    }
  });

  it("buildRepairedCollisionsUrl() targets the pinned dataset with no $limit, and every clause is present in its query string, once decoded", () => {
    const url = buildRepairedCollisionsUrl();

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.has("$limit")).toBe(false);

    // URLSearchParams.get() decodes regardless of the encoding scheme chosen
    // (percent-encoding vs '+' for space), so this does not lock in *how*
    // buildRepairedCollisionsUrl() encodes — only that the decoded values
    // match.
    expect(url.searchParams.get("$select")).toBe(PINNED_CLAUSES.select);
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
    expect(url.searchParams.get("$group")).toBe(PINNED_CLAUSES.group);
    expect(url.searchParams.get("$order")).toBe(PINNED_CLAUSES.order);
  });

  it("keeps the displayed query (REPAIRED_COLLISIONS_SOQL) and the sent request (buildRepairedCollisionsUrl()) mechanically in sync", () => {
    const url = buildRepairedCollisionsUrl();
    const decodedParamText = [...url.searchParams.values()].join(" ");

    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(REPAIRED_COLLISIONS_SOQL).toContain(clause);
      expect(decodedParamText).toContain(clause);
    }
  });

  it("REPAIRED_COLLISIONS_SOQL's $select clause aggregates count(collision_id), same expression as raw collisions, but its $where is AND-ed with the casualty filter — the exact fragment this SPEC pins", () => {
    expect(REPAIRED_COLLISIONS_SOQL).toContain("count(collision_id)");
    expect(REPAIRED_COLLISIONS_SOQL).toContain(`AND ${EXTRA_WHERE}`);
    expect(REPAIRED_COLLISIONS_SOQL).not.toContain("number_of_persons_killed)");
  });

  it("$select's field alias is the plain lowercase word `repaired`, matching the deaths/injuries/collisions naming convention — never `repairedCollisions`", () => {
    expect(REPAIRED_COLLISIONS_SOQL).toContain("AS repaired");
    expect(REPAIRED_COLLISIONS_SOQL).not.toContain("repairedCollisions");
  });
});

// ===========================================================================
// FR-6 Phase 2 (SPEC.md) — widen buildRepairedCollisionsUrl()/
// fetchRepairedCollisionsPerYear() to accept an optional
// `borough?: BoroughCode`. `borough` becomes the fifth logical value flowing
// through the fourth positional parameter of buildYearlyUrl()/
// fetchYearlyMetric(), unchanged in position — the third (extraWhere)
// position stays occupied by this file's own frozen `EXTRA_WHERE` casualty
// filter (SPEC.md's Inputs/Outputs section). Written BEFORE
// repairedCollisions.ts accepts a borough argument, so the borough-supplied
// assertions below must fail red today (both functions currently take zero
// arguments, so a passed-in code is silently ignored at runtime, and the
// call is separately rejected by `tsc --noEmit`) — not because of a mistake
// in their own expectations. `BOROUGH_CODE`'s `crashesValue` is read from
// boroughs.ts rather than retyped, per the dispatch instructions. Unlike
// deaths.test.ts/injuries.test.ts/collisions.test.ts, this file does not
// carry a dedicated Edge Case 4 positional-argument-trap test — the SPEC's
// budget scopes that trap to the three wrappers whose extraWhere slot is
// normally empty; here it's already pinned to occupy the third slot, and
// Edge Case 2's ordering assertion below is this file's equivalent guard.
// ===========================================================================

describe("FR-6 Phase 2 — borough parameter propagation", () => {
  const BOROUGH_CODE: BoroughCode = "M"; // Manhattan
  const BOROUGH_WHERE = `borough = '${BOROUGHS[BOROUGH_CODE].crashesValue}'`;
  // PINNED_CLAUSES.where here is already "window AND casualty-filter"; the
  // borough fragment is AND-ed after it (Edge Case 2's pinned order).
  const FILTERED_WHERE = `${PINNED_CLAUSES.where} AND ${BOROUGH_WHERE}`;

  it("regression pin (b): buildRepairedCollisionsUrl() called with zero arguments is byte-identical to today's $where", () => {
    const url = buildRepairedCollisionsUrl();
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
  });

  it("regression pin (b): REPAIRED_COLLISIONS_SOQL's $where line stays byte-identical to today's, unaffected by the widened signature existing", () => {
    expect(REPAIRED_COLLISIONS_SOQL).toBe(
      [
        `$select=${PINNED_CLAUSES.select}`,
        `$where=${PINNED_CLAUSES.where}`,
        `$group=${PINNED_CLAUSES.group}`,
        `$order=${PINNED_CLAUSES.order}`,
      ].join("\n"),
    );
  });

  it("(a) buildRepairedCollisionsUrl(borough) composes window AND casualty-filter AND borough = '<crashesValue>' exactly, per SPEC.md's Query section", () => {
    // No @ts-expect-error here on purpose: repairedCollisions.ts does not
    // accept a borough argument yet, so this line is expected to be a
    // `tsc --noEmit` compile error today (per this phase's dispatch
    // instructions, "must fail now — TS errors or runtime failures") and to
    // compile cleanly only once Redwood widens
    // buildRepairedCollisionsUrl()'s signature. At runtime today the extra
    // argument is silently dropped, so the assertion below fails red for
    // the same reason: no borough fragment is forwarded.
    const url = buildRepairedCollisionsUrl(BOROUGH_CODE);
    expect(url.searchParams.get("$where")).toBe(FILTERED_WHERE);
  });

  it("(a) fetchRepairedCollisionsPerYear(borough) sends the same composed $where in its returned soql", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    // See the comment above: intentionally a `tsc --noEmit` error today,
    // valid once fetchRepairedCollisionsPerYear() is widened.
    const result = await fetchRepairedCollisionsPerYear(BOROUGH_CODE);

    expect(result.soql).toContain(`$where=${FILTERED_WHERE}`);
  });

  it("Edge Case 2: composition order is window AND casualty-filter AND borough — the casualty filter must never be pushed after the borough fragment", () => {
    const url = buildRepairedCollisionsUrl(BOROUGH_CODE);
    const where = url.searchParams.get("$where") ?? "";

    expect(where.indexOf(EXTRA_WHERE)).toBeGreaterThan(-1);
    expect(where.indexOf(BOROUGH_WHERE)).toBeGreaterThan(-1);
    expect(where.indexOf(EXTRA_WHERE)).toBeLessThan(
      where.indexOf(BOROUGH_WHERE),
    );
    expect(where.endsWith(BOROUGH_WHERE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — generalizing the same infra pattern already used in
// src/components/YearlyLineChart.test.tsx (the pinned-figure literal check)
// and (Constraint 1 there) the process.env-confinement check, extended here
// to this task's new file and its eight new pinned figures. Not duplicated:
// YearlyLineChart.test.tsx's own existing checks (deaths/collisions figures,
// process.env under src/components) are untouched, per Constraint 9 (that
// file is off-limits to this task).
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const REPAIRED_COLLISIONS_PATH = join(SRC_DIR, "lib", "repairedCollisions.ts");

function listFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isTestFile(path: string): boolean {
  return /\.(test|spec)\.[tj]sx?$/.test(path);
}

describe("src/lib/repairedCollisions.ts — source-level greps (the only net for these constraints)", () => {
  it("does not read process.env anywhere — the token stays confined to src/lib/socrata.ts (NFR-2, Rule 3, Constraint 1)", () => {
    if (!existsSync(REPAIRED_COLLISIONS_PATH)) {
      throw new Error(
        `${REPAIRED_COLLISIONS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(REPAIRED_COLLISIONS_PATH, "utf8");
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("no file under src/lib other than socrata.ts and arrests.ts references process.env — generalizes the confinement check to the whole lib directory, now with arrests.ts as a second, SPEC-accepted exception (FR-5 Constraint 3)", () => {
    const libDir = join(SRC_DIR, "lib");
    const offenders = listFilesRecursive(libDir)
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
      .filter((f) => !isTestFile(f))
      .filter((f) => !f.endsWith(`${join("lib", "socrata.ts")}`))
      .filter((f) => !f.endsWith(`${join("lib", "arrests.ts")}`))
      .filter((f) => readFileSync(f, "utf8").includes("process.env"));
    expect(offenders).toEqual([]);
  });

  it("Constraint 2: none of the eight pinned repaired-collision figures (45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420) appears as a literal anywhere in non-test src/**", () => {
    const pinnedNumbers = [
      45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    const offenders = listFilesRecursive(SRC_DIR)
      .filter((f) => /\.(ts|tsx|js|jsx|css)$/.test(f))
      .filter((f) => !isTestFile(f))
      .filter((f) => pinnedFigurePattern.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
