// Behavioral / black-box tests for src/lib/collisions.ts (SPEC.md —
// "Collisions per year: the raw reporting-affected series, data half only
// (FR-3)").
//
// Written BEFORE src/lib/collisions.ts (and the src/lib/socrata.ts transport
// it is built on top of, unmodified) exist, per CLAUDE.md Rule 4 and this
// SPEC's standard (non-SPIKE) ordering: Cypress writes failing tests first,
// Redwood implements against them.
//
// Contract under test comes from SPEC.md's "[SPEC] — Collisions per year"
// section, not from reading any implementation (there isn't one yet). This
// file mirrors src/lib/injuries.test.ts's structure exactly — the most
// recent generation of this exact pattern — substituting the collisions
// aggregate/alias, per the dispatch instructions.
//
// IMPORTANT — per the dispatch instructions to Cypress: fixture values are
// deliberately synthetic (1000, 2000, ... 8000), never the pinned Appendix A
// / mvcc-data-skill collisions column (231564, 211486, 112918, 110558,
// 103887, 96607, 91316, 85546). A passing test here must never be confusable
// with evidence that the live data is correct (NFR-4). The one-time diff of
// a live/stubbed response against those pinned figures is acceptance clause
// 6's job during Cypress's post-completion audit of Redwood's
// [COMPLETION-REPORT], not a unit-test fixture here — stubbing the pinned
// values into a mocked fetch and then asserting the parser echoes them back
// would be circular and would prove nothing about whether the *live* figures
// are correct.
//
// The four pinned SoQL clause values below are copied verbatim from
// SPEC.md's "Query" section (a Rule-4 frozen contract, re-verified live per
// the mvcc-data skill) — they are query-shape strings, not data figures, so
// they are exactly what Rule 4 says Cypress should test against.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOROUGHS, type BoroughCode } from "./boroughs";
import {
  COLLISIONS_SOQL,
  buildCollisionsUrl,
  fetchCollisionsPerYear,
  type CollisionsResult,
  type CollisionsRow,
} from "./collisions";

const PINNED_CLAUSES = {
  select:
    "date_extract_y(crash_date) AS year, count(collision_id) AS collisions",
  where:
    "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'",
  group: "date_extract_y(crash_date)",
  order: "year",
} as const;

const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// Obviously-synthetic fixture: round four-digit numbers, never the real
// Appendix A / mvcc-data-skill collisions column (six- and five-digit
// figures in the hundred-thousands).
const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const SYNTHETIC_COLLISIONS_STRINGS = [
  "1000",
  "2000",
  "3000",
  "4000",
  "5000",
  "6000",
  "7000",
  "8000",
] as const;

type RawRow = { year: string | number; collisions: unknown };

function syntheticOkBody(): RawRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    collisions: SYNTHETIC_COLLISIONS_STRINGS[i],
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: CollisionsResult,
): asserts result is Extract<CollisionsResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: CollisionsResult,
): asserts result is Extract<CollisionsResult, { status: "error" }> {
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

describe("fetchCollisionsPerYear() — the ok path", () => {
  it("returns exactly 8 ascending rows, 2018..2025, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchCollisionsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows.map((r: CollisionsRow) => r.year)).toEqual([
      ...SYNTHETIC_YEARS,
    ]);
    expect(result.rows.map((r: CollisionsRow) => r.collisions)).toEqual([
      1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000,
    ]);
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].year).toBeGreaterThan(result.rows[i - 1].year);
    }
  });

  it("casts year and collisions to `number` explicitly — never relies on JS coercion of the string payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchCollisionsPerYear();

    assertOk(result);
    for (const row of result.rows) {
      expect(typeof row.year).toBe("number");
      expect(typeof row.collisions).toBe("number");
      expect(Number.isInteger(row.collisions)).toBe(true);
    }
  });

  it("accepts `year` as either a string or a JSON number (the schema's deliberate asymmetry) while still requiring `collisions` to be a string", async () => {
    const body = syntheticOkBody().map((row, i) =>
      i === 0 ? { ...row, year: SYNTHETIC_YEARS[0] } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchCollisionsPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows[0].year).toBe(2018);
  });

  it("calls the Socrata endpoint exactly once (no retry loop on success)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchCollisionsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchCollisionsPerYear() — the empty path (FR-10)", () => {
  it("returns status: empty, distinct from an error, for a zero-row Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchCollisionsPerYear();

    expect(result.status).toBe("empty");
    expect(result.status).not.toBe("error");
  });
});

describe("fetchCollisionsPerYear() — window completeness / contract failures (FR-11, trap 1)", () => {
  it("fails loud with error/contract — never a zero-fill — when a year in 2018-2025 is absent", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchCollisionsPerYear();

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

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("fails loud with error/contract when more than 8 rows are returned (a year outside the window leaked in)", async () => {
    const body = [...syntheticOkBody(), { year: "2026", collisions: "99" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a non-numeric string", "N/A"],
    ["a JSON number instead of a string", 4000],
    ["a negative numeric string", "-5"],
    ["a decimal numeric string", "5.5"],
  ])(
    "fails loud with error/contract when `collisions` is %s for one year — never coerced to zero",
    async (_label, badValue) => {
      const body = syntheticOkBody().map((row) =>
        row.year === "2022" ? { ...row, collisions: badValue } : row,
      );
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      const result = await fetchCollisionsPerYear();

      assertError(result);
      expect(result.kind).toBe("contract");
      expect(result.reason).toBeTruthy();
    },
  );

  it("fails loud with error/contract when a year's `collisions` key is entirely absent from the row — the same absent-key-as-zero shape trap 1 names for number_of_persons_killed", async () => {
    const body = syntheticOkBody().map((row) => {
      if (row.year !== "2023") return row;
      const { year } = row;
      return { year } as RawRow;
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
  });
});

describe("fetchCollisionsPerYear() — upstream failures", () => {
  it("returns error/upstream, never throwing, when the fetch itself rejects (network/DNS/timeout)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream and names the status code when Socrata responds 429", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 }),
    );

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toMatch(/429/);
  });

  it("returns error/upstream on a 5xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await fetchCollisionsPerYear();

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

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("does not retry in a loop on upstream failure — a single attempt, then fail loud", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await fetchCollisionsPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the app token into the rendered `reason`", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "super-secret-token-value-should-not-leak");
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchCollisionsPerYear();

    assertError(result);
    expect(result.reason).not.toContain(
      "super-secret-token-value-should-not-leak",
    );
  });
});

describe("fetchCollisionsPerYear() — token is attribution-only (Edge Case 8)", () => {
  it("still succeeds when SOCRATA_APP_TOKEN is unset — absence degrades throughput, not correctness", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "");
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchCollisionsPerYear();

    expect(result.status).toBe("ok");
  });
});

describe("FR-8 invariant — COLLISIONS_SOQL and buildCollisionsUrl() cannot drift apart", () => {
  it("COLLISIONS_SOQL is built from the pinned, frozen clauses (Rule 4) — every clause value is present verbatim", () => {
    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(COLLISIONS_SOQL).toContain(clause);
    }
  });

  it("buildCollisionsUrl() targets the pinned dataset with no $limit, and every clause is present in its query string, once decoded", () => {
    const url = buildCollisionsUrl();

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.has("$limit")).toBe(false);

    // URLSearchParams.get() decodes regardless of the encoding scheme chosen
    // (percent-encoding vs '+' for space), so this does not lock in *how*
    // buildCollisionsUrl() encodes — only that the decoded values match.
    expect(url.searchParams.get("$select")).toBe(PINNED_CLAUSES.select);
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
    expect(url.searchParams.get("$group")).toBe(PINNED_CLAUSES.group);
    expect(url.searchParams.get("$order")).toBe(PINNED_CLAUSES.order);
  });

  it("keeps the displayed query (COLLISIONS_SOQL) and the sent request (buildCollisionsUrl()) mechanically in sync", () => {
    const url = buildCollisionsUrl();
    const decodedParamText = [...url.searchParams.values()].join(" ");

    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(COLLISIONS_SOQL).toContain(clause);
      expect(decodedParamText).toContain(clause);
    }
  });

  it("COLLISIONS_SOQL's $select clause aggregates count(collision_id), and never reuses the deaths or injuries aggregate expressions (does not silently reuse sum(number_of_persons_killed) or sum(number_of_persons_injured))", () => {
    expect(COLLISIONS_SOQL).toContain("count(collision_id)");
    expect(COLLISIONS_SOQL).not.toContain("number_of_persons_killed");
    expect(COLLISIONS_SOQL).not.toContain("number_of_persons_injured");
  });
});

// ===========================================================================
// FR-6 Phase 2 (SPEC.md) — widen buildCollisionsUrl()/fetchCollisionsPerYear()
// to accept an optional `borough?: BoroughCode`, forwarded unchanged to
// socrata.ts's already-widened transport. Written BEFORE collisions.ts
// accepts a borough argument, so the borough-supplied assertions below must
// fail red today (buildCollisionsUrl()/fetchCollisionsPerYear() currently
// take zero arguments, so a passed-in code is silently ignored at runtime,
// and the call is separately rejected by `tsc --noEmit`) — not because of a
// mistake in their own expectations. `BOROUGH_CODE`'s `crashesValue` is read
// from boroughs.ts rather than retyped, per the dispatch instructions.
// ===========================================================================

describe("FR-6 Phase 2 — borough parameter propagation", () => {
  const BOROUGH_CODE: BoroughCode = "Q"; // Queens
  const BOROUGH_WHERE = `borough = '${BOROUGHS[BOROUGH_CODE].crashesValue}'`;
  const FILTERED_WHERE = `${PINNED_CLAUSES.where} AND ${BOROUGH_WHERE}`;

  it("regression pin (b): buildCollisionsUrl() called with zero arguments is byte-identical to today's $where", () => {
    const url = buildCollisionsUrl();
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
  });

  it("regression pin (b): COLLISIONS_SOQL's $where line stays byte-identical to today's, unaffected by the widened signature existing", () => {
    expect(COLLISIONS_SOQL).toBe(
      [
        `$select=${PINNED_CLAUSES.select}`,
        `$where=${PINNED_CLAUSES.where}`,
        `$group=${PINNED_CLAUSES.group}`,
        `$order=${PINNED_CLAUSES.order}`,
      ].join("\n"),
    );
  });

  it("(a) buildCollisionsUrl(borough) composes window AND borough = '<crashesValue>' exactly, per SPEC.md's Query section", () => {
    // No @ts-expect-error here on purpose: collisions.ts does not accept a
    // borough argument yet, so this line is expected to be a
    // `tsc --noEmit` compile error today (per this phase's dispatch
    // instructions, "must fail now — TS errors or runtime failures") and to
    // compile cleanly only once Redwood widens buildCollisionsUrl()'s
    // signature. At runtime today the extra argument is silently dropped,
    // so the assertion below fails red for the same reason: no borough
    // fragment is forwarded.
    const url = buildCollisionsUrl(BOROUGH_CODE);
    expect(url.searchParams.get("$where")).toBe(FILTERED_WHERE);
  });

  it("(a) fetchCollisionsPerYear(borough) sends the same composed $where in its returned soql", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    // See the comment above: intentionally a `tsc --noEmit` error today,
    // valid once fetchCollisionsPerYear() is widened.
    const result = await fetchCollisionsPerYear(BOROUGH_CODE);

    expect(result.soql).toContain(`$where=${FILTERED_WHERE}`);
  });

  it("(c) Edge Case 4, the positional-argument trap: the borough-filtered $where carries no phantom `AND undefined` and the raw borough code never lands where extraWhere would", () => {
    // See the comment on the first borough-supplied test above: intentionally
    // a `tsc --noEmit` error today, valid once buildCollisionsUrl() is
    // widened.
    const url = buildCollisionsUrl(BOROUGH_CODE);
    const where = url.searchParams.get("$where") ?? "";

    expect(where).not.toMatch(/AND\s+undefined/i);
    // If `borough` were forwarded as the third (extraWhere) positional
    // argument instead of the fourth, it would surface as a bare,
    // unprefixed code (e.g. "AND Q") rather than the borough = '<value>'
    // fragment this SPEC pins.
    expect(where).not.toMatch(new RegExp(`AND\\s+${BOROUGH_CODE}(\\s|$)`));
    expect(where.endsWith(BOROUGH_WHERE)).toBe(true);
  });
});
