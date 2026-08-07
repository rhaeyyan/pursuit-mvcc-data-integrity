// Behavioral / black-box tests for src/lib/arrests.ts (SPEC.md — FR-5,
// "traffic-enforcement arrest counts per year (2018-2025), filtered to the
// PRD §5.2 five-category offense list").
//
// Written BEFORE src/lib/arrests.ts exists, per CLAUDE.md Rule 4 and this
// SPEC's standard (non-SPIKE) ordering: Cypress writes failing tests first,
// Redwood implements against them.
//
// IMPORTANT — arrests.ts is a deliberately self-contained sibling module,
// NOT a thin wrapper over src/lib/socrata.ts (SPEC.md's Intellectual Control
// point 2: socrata.ts is scoped to h9gi-nx95/crash_date and widening it would
// couple every P0 metric to a droppable P1 feature). This file therefore
// does NOT mirror repairedCollisions.test.ts's/collisions.test.ts's import
// shape (no buildXUrl() export assumed, no fetchYearlyMetric() dependency).
// It imports only ARRESTS_SOQL and fetchArrestsPerYear() — the two names
// SPEC.md's Inputs/Outputs section actually pins — and exercises the sent
// request by inspecting the stubbed global fetch's own call arguments,
// treating however arrests.ts builds its URL internally as Redwood's to
// decide (black-box, per Rule 4: test the contract, not the implementation).
// `YearlyMetricResult<"arrests">`/`YearlyMetricRow<"arrests">` are imported
// as *types only* from socrata.ts, matching SPEC.md's "import type only,
// zero coupling, zero edit to that file" Inputs/Outputs bullet.
//
// IMPORTANT — per the dispatch instructions: fixture values are deliberately
// synthetic (12000, 12500, ..., 15500), never the pinned mvcc-data-skill
// arrests figures (29007 in 2018, 8330 in 2020, 21123 in 2025) or any of the
// other four metrics' own synthetic fixtures (deaths 11..88, injuries
// 100..800, raw collisions 1000..8000, repaired collisions 150..850). A
// passing test here must never be confusable with evidence that the live
// data is correct (NFR-4).
//
// The pinned SoQL clause values below are copied verbatim from SPEC.md's
// "Query" section (a Rule-4 frozen contract) — they are query-shape strings,
// not data figures, so they are exactly what Rule 4 says Cypress should test
// against.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ARRESTS_SOQL,
  fetchArrestsPerYear,
  type ArrestsResult,
  type ArrestsRow,
} from "./arrests";

// ---------------------------------------------------------------------------
// Pinned query fragments — SPEC.md's "Query" section, copied verbatim
// (collapsed to single-line strings; the SPEC's own multi-line indentation is
// documentation formatting, not a literal whitespace contract).
// ---------------------------------------------------------------------------

const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";

const PINNED_SELECT =
  "date_extract_y(arrest_date) AS year, count(*) AS arrests";

const OFNS_SPELLING_A = "ofns_desc = 'INTOXICATED & IMPAIRED DRIVING'";
const OFNS_SPELLING_B = "ofns_desc = 'INTOXICATED/IMPAIRED DRIVING'";

const PINNED_OFFENSE_CATEGORIES = [
  "ofns_desc = 'VEHICLE AND TRAFFIC LAWS'",
  "ofns_desc = 'OTHER TRAFFIC INFRACTION'",
  OFNS_SPELLING_A,
  OFNS_SPELLING_B,
  "ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE'",
] as const;

const PINNED_WHERE =
  "arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00' " +
  `AND (${PINNED_OFFENSE_CATEGORIES.join(" OR ")})`;

const PINNED_GROUP = "date_extract_y(arrest_date)";
const PINNED_ORDER = "year";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

// Obviously-synthetic, five-digit round numbers ascending by 500 — distinct
// in shape from the pinned mvcc-data-skill arrests figures (29007, 8330,
// 21123 — note those are non-monotonic, this fixture is strictly ascending)
// and from every other metric's own synthetic fixture range.
const SYNTHETIC_ARRESTS_STRINGS = [
  "12000",
  "12500",
  "13000",
  "13500",
  "14000",
  "14500",
  "15000",
  "15500",
] as const;

type RawRow = { year: string | number; arrests: unknown };

function syntheticOkBody(): RawRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    arrests: SYNTHETIC_ARRESTS_STRINGS[i],
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: ArrestsResult,
): asserts result is Extract<ArrestsResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: ArrestsResult,
): asserts result is Extract<ArrestsResult, { status: "error" }> {
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

describe("fetchArrestsPerYear() — the ok path", () => {
  it("returns exactly 8 ascending rows, 2018..2025, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchArrestsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows.map((r: ArrestsRow) => r.year)).toEqual([
      ...SYNTHETIC_YEARS,
    ]);
    expect(result.rows.map((r: ArrestsRow) => r.arrests)).toEqual([
      12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500,
    ]);
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].year).toBeGreaterThan(result.rows[i - 1].year);
    }
  });

  it("casts year and arrests to `number` explicitly — never relies on JS coercion of the string payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchArrestsPerYear();

    assertOk(result);
    for (const row of result.rows) {
      expect(typeof row.year).toBe("number");
      expect(typeof row.arrests).toBe("number");
      expect(Number.isInteger(row.arrests)).toBe(true);
    }
  });

  it("accepts `year` as either a string or a JSON number (the schema's deliberate asymmetry) while still requiring `arrests` to be a string", async () => {
    const body = syntheticOkBody().map((row, i) =>
      i === 0 ? { ...row, year: SYNTHETIC_YEARS[0] } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchArrestsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows[0].year).toBe(2018);
  });

  it("calls the Socrata endpoint exactly once (no retry loop on success)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchArrestsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchArrestsPerYear() — the empty path (FR-10)", () => {
  it("returns status: empty, distinct from an error, for a zero-row Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchArrestsPerYear();

    expect(result.status).toBe("empty");
    expect(result.status).not.toBe("error");
  });
});

describe("fetchArrestsPerYear() — window completeness / contract failures (FR-11, trap 1)", () => {
  it("fails loud with error/contract — never a zero-fill — when a year in 2018-2025 is absent", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchArrestsPerYear();

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

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("fails loud with error/contract when more than 8 rows are returned (a year outside the window leaked in)", async () => {
    const body = [...syntheticOkBody(), { year: "2026", arrests: "99" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("fails loud with error/contract when a year outside 2018-2025 appears in place of a required year (8 rows total, window still violated)", async () => {
    const body = syntheticOkBody();
    body[0] = { year: "2017", arrests: "12000" };
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a non-numeric string", "N/A"],
    ["a JSON number instead of a string", 13500],
    ["a negative numeric string", "-5"],
    ["a decimal numeric string", "5.5"],
  ])(
    "fails loud with error/contract when `arrests` is %s for one year — never coerced to zero",
    async (_label, badValue) => {
      const body = syntheticOkBody().map((row) =>
        row.year === "2022" ? { ...row, arrests: badValue } : row,
      );
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      const result = await fetchArrestsPerYear();

      assertError(result);
      expect(result.kind).toBe("contract");
      expect(result.reason).toBeTruthy();
    },
  );

  it("fails loud with error/contract when a year's `arrests` key is entirely absent from the row — the same absent-key-as-zero shape trap 1 names for number_of_persons_killed", async () => {
    const body = syntheticOkBody().map((row) => {
      if (row.year !== "2023") return row;
      const { year } = row;
      return { year } as RawRow;
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
  });

  it("fails loud with error/contract when Socrata's response body is not a JSON array at all", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "not an array", message: "malformed" }),
    );

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });
});

describe("fetchArrestsPerYear() — upstream failures", () => {
  it("returns error/upstream, never throwing, when the fetch itself rejects (network/DNS/timeout)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream and names the status code when Socrata responds 429", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 }),
    );

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toMatch(/429/);
  });

  it("returns error/upstream on a 5xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await fetchArrestsPerYear();

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

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("does not retry in a loop on upstream failure — a single attempt, then fail loud", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await fetchArrestsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the app token into the rendered `reason`", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "super-secret-token-value-should-not-leak");
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchArrestsPerYear();

    assertError(result);
    expect(result.reason).not.toContain(
      "super-secret-token-value-should-not-leak",
    );
  });
});

describe("fetchArrestsPerYear() — token is attribution-only (Edge Case 8)", () => {
  it("still succeeds when SOCRATA_APP_TOKEN is unset — absence degrades throughput, not correctness", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "");
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchArrestsPerYear();

    expect(result.status).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// FR-8 invariant: ARRESTS_SOQL (the displayed query) and the request
// fetchArrestsPerYear() actually sends cannot drift apart. Because arrests.ts
// is self-contained (no shared buildYearlyUrl() to call), this is proven by
// inspecting the stubbed fetch's own call arguments rather than a second,
// separately-exported URL builder — a black-box check of the public
// contract, not an assumption about an unpinned internal export name.
// ---------------------------------------------------------------------------

describe("FR-8 invariant — ARRESTS_SOQL and the sent request cannot drift apart", () => {
  it("ARRESTS_SOQL is built from the pinned, frozen clauses (Rule 4) — every clause value is present verbatim", () => {
    expect(ARRESTS_SOQL).toContain(PINNED_SELECT);
    expect(ARRESTS_SOQL).toContain(PINNED_WHERE);
    expect(ARRESTS_SOQL).toContain(PINNED_GROUP);
    expect(ARRESTS_SOQL).toContain(PINNED_ORDER);
  });

  it("Trap 4 / Edge Case 6: both ofns_desc spellings independently appear in ARRESTS_SOQL's $where — losing either loses ~10% of the series", () => {
    expect(ARRESTS_SOQL).toContain(OFNS_SPELLING_A);
    expect(ARRESTS_SOQL).toContain(OFNS_SPELLING_B);
  });

  it("all five pinned offense categories are present in ARRESTS_SOQL", () => {
    for (const category of PINNED_OFFENSE_CATEGORIES) {
      expect(ARRESTS_SOQL).toContain(category);
    }
  });

  it("never references the vehicle-theft categories (GRAND LARCENY OF MOTOR VEHICLE, UNAUTHORIZED USE OF A VEHICLE) — deliberately excluded, PRD §5.2", () => {
    expect(ARRESTS_SOQL).not.toContain("GRAND LARCENY OF MOTOR VEHICLE");
    expect(ARRESTS_SOQL).not.toContain("UNAUTHORIZED USE OF A VEHICLE");
  });

  it("FR-6 out-of-scope: arrest_boro never appears in ARRESTS_SOQL — FR-6 is explicitly not part of this task, not merely unused", () => {
    expect(ARRESTS_SOQL).not.toContain("arrest_boro");
  });

  it("the $select field alias is the plain lowercase word `arrests`, matching the deaths/injuries/collisions/repaired naming convention", () => {
    expect(ARRESTS_SOQL).toContain("AS arrests");
  });

  it("sends a request whose URL/query text (however it is built) contains every pinned clause value, keeping the displayed query and the sent request mechanically in sync", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchArrestsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0] as [string | URL, unknown];
    const url = new URL(calledUrl.toString());

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.has("$limit")).toBe(false);

    // URLSearchParams.get() decodes regardless of the encoding scheme chosen
    // (percent-encoding vs '+' for space), so this does not lock in *how*
    // arrests.ts encodes the URL — only that the decoded values match.
    expect(url.searchParams.get("$select")).toBe(PINNED_SELECT);
    expect(url.searchParams.get("$where")).toBe(PINNED_WHERE);
    expect(url.searchParams.get("$group")).toBe(PINNED_GROUP);
    expect(url.searchParams.get("$order")).toBe(PINNED_ORDER);
  });

  it("targets the arrests dataset 8h9b-rp9u, never the collisions dataset h9gi-nx95", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchArrestsPerYear();

    const [calledUrl] = fetchMock.mock.calls[0] as [string | URL, unknown];
    const url = new URL(calledUrl.toString());

    expect(url.hostname).toBe("data.cityofnewyork.us");
    expect(url.pathname).toContain("8h9b-rp9u");
    expect(url.pathname).not.toContain("h9gi-nx95");
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — SPEC.md Constraint 3 explicitly accepts that
// arrests.ts is a one-time exception to "socrata.ts is the only file that
// reads SOCRATA_APP_TOKEN": arrests.ts reads it directly, since it is a
// self-contained sibling module that does not call into socrata.ts's
// fetchYearlyMetric(). These greps therefore assert the *opposite* shape
// repairedCollisions.test.ts's own confinement check asserts for that
// (socrata.ts-calling) module — adjusted per the dispatch instructions, not
// copy-pasted unmodified.
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const ARRESTS_PATH = join(SRC_DIR, "lib", "arrests.ts");
const LIB_DIR = join(SRC_DIR, "lib");

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

describe("src/lib/arrests.ts — source-level greps (the only net for these constraints)", () => {
  it("reads process.env.SOCRATA_APP_TOKEN directly — the SPEC's accepted, one-time exception to socrata.ts's exclusivity (Constraint 3)", () => {
    if (!existsSync(ARRESTS_PATH)) {
      throw new Error(
        `${ARRESTS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(ARRESTS_PATH, "utf8");
    expect(source).toMatch(/process\.env/);
    expect(source).toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("does not import from ./socrata as a value — only `import type` is permitted (zero coupling to the fetch/transport it deliberately does not share)", () => {
    if (!existsSync(ARRESTS_PATH)) {
      throw new Error(
        `${ARRESTS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(ARRESTS_PATH, "utf8");
    const socrataImportLines = source
      .split("\n")
      .filter(
        (line) => line.includes("./socrata") || line.includes("lib/socrata"),
      );
    for (const line of socrataImportLines) {
      expect(line.trim()).toMatch(/^import type\b/);
    }
  });

  it("no lib file other than socrata.ts and arrests.ts references process.env — the confinement rule generalized to its one named exception (Constraint 3)", () => {
    const offenders = listFilesRecursive(LIB_DIR)
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
      .filter((f) => !isTestFile(f))
      .filter((f) => !f.endsWith(join("lib", "socrata.ts")))
      .filter((f) => !f.endsWith(join("lib", "arrests.ts")))
      .filter((f) => readFileSync(f, "utf8").includes("process.env"));
    expect(offenders).toEqual([]);
  });

  it("never references arrest_boro, perp_race, perp_sex, or age_group anywhere in its own source (PRD §6, Constraint 2 — permanent exclusion, not merely unused)", () => {
    if (!existsSync(ARRESTS_PATH)) {
      throw new Error(
        `${ARRESTS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
      );
    }
    const source = readFileSync(ARRESTS_PATH, "utf8");
    expect(source).not.toMatch(/arrest_boro/);
    expect(source).not.toMatch(/perp_race/);
    expect(source).not.toMatch(/perp_sex/);
    expect(source).not.toMatch(/age_group/);
  });

  it("Constraint 2 (mvcc-data skill): none of the three pinned arrest figures (29007, 8330, 21123) appears as a literal anywhere in non-test src/**", () => {
    const pinnedNumbers = [29007, 8330, 21123];
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
