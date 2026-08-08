// Behavioral / black-box tests for src/lib/socrata.ts's generic yearly-metric
// transport, widened for FR-12 (SPEC.md — "Casualty-filtered 'repaired'
// collisions per year (FR-12), data half only — the corrected number").
//
// Written BEFORE socrata.ts's third, optional `extraWhere` parameter exists,
// per CLAUDE.md Rule 4 and this SPEC's standard (non-SPIKE) ordering:
// Cypress writes failing tests first, Redwood implements against them. This
// file must fail red against the current tree because buildYearlySoql(),
// buildYearlyUrl(), and fetchYearlyMetric() do not yet accept a third
// argument — not because of a mistake in this file's own assertions.
//
// SPEC.md's single most load-bearing acceptance criterion (Output 1,
// Constraint 5, Edge Case 10): calling buildYearlySoql()/buildYearlyUrl()/
// fetchYearlyMetric() with exactly the same two arguments as today must
// produce output that is byte-for-byte identical to today's, so widening the
// signature is provably safe for deaths.ts/injuries.ts/collisions.ts's
// existing two-argument call sites without editing any of those three
// modules, their tests, or their route tests (Acceptance clause 5). The
// two-argument exact-equality assertions below (`.toBe()`, not
// `.toContain()`) are that mechanical proof — any future whitespace or
// ordering drift on the two-argument path fails this file, per Edge Case 10.
//
// This file exercises src/lib/socrata.ts's shared transport directly and
// generically — a synthetic aggregate expression/field alias
// ("count(widget_id)" / "widgets") never reused from deaths/injuries/
// collisions/repairedCollisions — so this coverage stays agnostic to any one
// real caller's identity. Each real caller keeps its own thin-wrapper test
// file (deaths.test.ts, injuries.test.ts, collisions.test.ts,
// repairedCollisions.test.ts); this file is the one place the shared
// transport's own two/three-argument contract is exercised directly, rather
// than only indirectly through those four.
//
// The fixed $where/$group/$order clause text below is copied verbatim from
// the existing (unmodified) src/lib/socrata.ts source and from SPEC.md's
// Query section — a Rule-4 frozen contract, not re-derived — exactly the
// same clause values collisions.test.ts/deaths.test.ts/injuries.test.ts
// already hardcode as `PINNED_CLAUSES`.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COLLISIONS_SOQL } from "./collisions";
import { DEATHS_SOQL } from "./deaths";
import { INJURIES_SOQL } from "./injuries";
import { REPAIRED_COLLISIONS_SOQL } from "./repairedCollisions";
import {
  buildYearlySoql,
  buildYearlyUrl,
  fetchYearlyMetric,
  type YearlyMetricResult,
} from "./socrata";

const FIXED_WHERE =
  "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'";
const FIXED_GROUP = "date_extract_y(crash_date)";
const FIXED_ORDER = "year";
const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// Synthetic, generic caller identity — deliberately never reused from any
// real metric module's aggregate/alias, so this file's coverage proves the
// shared transport's own contract, not any one caller's.
const AGGREGATE_EXPR = "count(widget_id)";
const FIELD_ALIAS = "widgets" as const;
const EXTRA_WHERE = "(widget_status = 'broken')";

// The exact two-argument output today, before any widening — this is the
// literal string Constraint 5 / Edge Case 10 protect.
const TWO_ARG_SOQL = [
  `$select=${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`,
  `$where=${FIXED_WHERE}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

// The expected three-argument output per SPEC.md's Output 1 `whereClause()`
// shape: `${WHERE_CLAUSE} AND ${extraWhere}`, AND-ed onto the fixed clause,
// $select/$group/$order untouched.
const THREE_ARG_SOQL = [
  `$select=${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`,
  `$where=${FIXED_WHERE} AND ${EXTRA_WHERE}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const SYNTHETIC_VALUE_STRINGS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
] as const;

function syntheticOkBody() {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    widgets: SYNTHETIC_VALUE_STRINGS[i],
  }));
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

describe("buildYearlySoql() — the two-argument call path stays byte-identical (Constraint 5, Edge Case 10)", () => {
  it("produces the exact today's-shape SoQL string for two arguments", () => {
    expect(buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS)).toBe(TWO_ARG_SOQL);
  });

  it("produces an identical string whether the third argument is omitted or passed explicitly as `undefined`", () => {
    expect(buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined)).toBe(
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS),
    );
  });
});

describe("buildYearlySoql() — the new third, optional extraWhere argument", () => {
  it("AND-s extraWhere onto the fixed WHERE_CLAUSE, leaving $select/$group/$order untouched", () => {
    expect(buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE)).toBe(
      THREE_ARG_SOQL,
    );
  });

  it("keeps the two-argument and three-argument outputs independently correct and distinct within the same run", () => {
    const twoArg = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);
    const threeArg = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);

    expect(twoArg).toBe(TWO_ARG_SOQL);
    expect(threeArg).toBe(THREE_ARG_SOQL);
    expect(twoArg).not.toBe(threeArg);
  });
});

describe("buildYearlyUrl() — the same two/three-argument invariant, expressed as a URL", () => {
  it("two-argument call: $where is the fixed clause verbatim, no extra AND fragment", () => {
    const url = buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS);

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.get("$where")).toBe(FIXED_WHERE);
    expect(url.searchParams.get("$select")).toBe(
      `${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`,
    );
    expect(url.searchParams.get("$group")).toBe(FIXED_GROUP);
    expect(url.searchParams.get("$order")).toBe(FIXED_ORDER);
    expect(url.searchParams.has("$limit")).toBe(false);
  });

  it("three-argument call: $where is the fixed clause AND-ed with extraWhere verbatim; $select/$group/$order untouched", () => {
    const url = buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);

    expect(url.searchParams.get("$where")).toBe(
      `${FIXED_WHERE} AND ${EXTRA_WHERE}`,
    );
    expect(url.searchParams.get("$select")).toBe(
      `${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`,
    );
    expect(url.searchParams.get("$group")).toBe(FIXED_GROUP);
    expect(url.searchParams.get("$order")).toBe(FIXED_ORDER);
  });
});

describe("fetchYearlyMetric() — the widened third parameter forwards correctly to both builders", () => {
  it("two-argument call requests exactly buildYearlyUrl(agg, alias)'s URL and returns exactly buildYearlySoql(agg, alias) as `soql`", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS);

    expect(result.soql).toBe(TWO_ARG_SOQL);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).toBe(
      buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS).toString(),
    );
  });

  it("three-argument call requests a URL whose $where is AND-ed with extraWhere, and returns the AND-ed soql", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
    );

    expect(result.soql).toBe(THREE_ARG_SOQL);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("$where")).toBe(
      `${FIXED_WHERE} AND ${EXTRA_WHERE}`,
    );
  });

  it("still fails loud with error/contract — never a zero-fill — for an absent year when extraWhere is present (FR-11, trap 1 applies identically on the widened path)", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = (await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
    )) as Extract<YearlyMetricResult<"widgets">, { status: "error" }>;

    expect(result.status).toBe("error");
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2021/);
  });

  it("still succeeds with 8 ok rows when extraWhere is present and the reply is well-formed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = (await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
    )) as Extract<YearlyMetricResult<"widgets">, { status: "ok" }>;

    expect(result.status).toBe("ok");
    expect(result.rows).toHaveLength(8);
  });
});

// ===========================================================================
// FR-6 Phase 1 — the fourth, optional `borough?: BoroughCode` parameter.
//
// Everything above this line is FR-12's original coverage and is deliberately
// untouched: those two/three-argument assertions passing *unmodified* against
// a four-parameter socrata.ts is itself half the byte-identity proof this
// phase owes. The other half is the explicit unfiltered-output pins below.
//
// Written BEFORE socrata.ts accepts a fourth argument. These blocks must fail
// red because no borough fragment is appended — not because of a mistake in
// their own expectations. The four `*_SOQL` byte-identity assertions are the
// exception and must be green both before and after: they are the regression
// net, not the red test.
//
// The borough fragments below are pinned literals, transcribed from the SPEC's
// Inputs/Outputs table (`K` -> BROOKLYN, `B` -> BRONX — the mvcc-data skill's
// trap 2) rather than imported from ./boroughs, so this file cross-checks that
// module's table instead of reading it back.
// ===========================================================================

const BOROUGH_WHERE = {
  B: "borough = 'BRONX'",
  K: "borough = 'BROOKLYN'",
  M: "borough = 'MANHATTAN'",
  Q: "borough = 'QUEENS'",
  S: "borough = 'STATEN ISLAND'",
} as const;

const SELECT_LINE = `$select=${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`;

// Edge Case 1 — window AND borough, no extraWhere in between.
const BOROUGH_ONLY_SOQL = [
  SELECT_LINE,
  `$where=${FIXED_WHERE} AND ${BOROUGH_WHERE.K}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

// Edge Case 2 — the pinned composition order: window AND extraWhere AND borough.
const FOUR_ARG_SOQL = [
  SELECT_LINE,
  `$where=${FIXED_WHERE} AND ${EXTRA_WHERE} AND ${BOROUGH_WHERE.K}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

// ---------------------------------------------------------------------------
// The byte-identity guarantee. These four constants are already rendered on
// the page under FR-8; widening the transport must not move one byte of them.
// Each expectation is written out from this file's own pinned clause text, not
// read back from the module under test.
// ---------------------------------------------------------------------------

const PINNED_DEATHS_SOQL = [
  `$select=${FIXED_GROUP} AS year, sum(number_of_persons_killed) AS deaths`,
  `$where=${FIXED_WHERE}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

const PINNED_INJURIES_SOQL = [
  `$select=${FIXED_GROUP} AS year, sum(number_of_persons_injured) AS injuries`,
  `$where=${FIXED_WHERE}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

const PINNED_COLLISIONS_SOQL = [
  `$select=${FIXED_GROUP} AS year, count(collision_id) AS collisions`,
  `$where=${FIXED_WHERE}`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

const PINNED_REPAIRED_COLLISIONS_SOQL = [
  `$select=${FIXED_GROUP} AS year, count(collision_id) AS repaired`,
  `$where=${FIXED_WHERE} AND (number_of_persons_injured > 0 OR number_of_persons_killed > 0)`,
  `$group=${FIXED_GROUP}`,
  `$order=${FIXED_ORDER}`,
].join("\n");

describe("FR-8 byte-identity — the four already-displayed query contracts are unchanged by this phase", () => {
  it("DEATHS_SOQL is byte-for-byte its current value", () => {
    expect(DEATHS_SOQL).toBe(PINNED_DEATHS_SOQL);
  });

  it("INJURIES_SOQL is byte-for-byte its current value", () => {
    expect(INJURIES_SOQL).toBe(PINNED_INJURIES_SOQL);
  });

  it("COLLISIONS_SOQL is byte-for-byte its current value", () => {
    expect(COLLISIONS_SOQL).toBe(PINNED_COLLISIONS_SOQL);
  });

  it("REPAIRED_COLLISIONS_SOQL is byte-for-byte its current value", () => {
    expect(REPAIRED_COLLISIONS_SOQL).toBe(PINNED_REPAIRED_COLLISIONS_SOQL);
  });

  it("none of the four carries a borough fragment — no caller passes one in this phase", () => {
    for (const soql of [
      DEATHS_SOQL,
      INJURIES_SOQL,
      COLLISIONS_SOQL,
      REPAIRED_COLLISIONS_SOQL,
    ]) {
      expect(soql).not.toContain("borough");
      expect(soql).not.toContain("arrest_boro");
    }
  });
});

describe("the unfiltered call path is unchanged by the fourth parameter (Constraint 3, FORCES 2)", () => {
  it("buildYearlySoql(agg, alias) is identical to buildYearlySoql(agg, alias, undefined, undefined)", () => {
    expect(
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, undefined),
    ).toBe(buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS));
  });

  it("an explicit `undefined` borough leaves the two-argument string byte-identical", () => {
    expect(
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, undefined),
    ).toBe(TWO_ARG_SOQL);
  });

  it("an explicit `undefined` borough leaves the three-argument (extraWhere) string byte-identical", () => {
    expect(
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, undefined),
    ).toBe(THREE_ARG_SOQL);
  });

  it("buildYearlyUrl() is likewise unchanged when the borough is omitted or explicitly undefined", () => {
    expect(
      buildYearlyUrl(
        AGGREGATE_EXPR,
        FIELD_ALIAS,
        undefined,
        undefined,
      ).toString(),
    ).toBe(buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS).toString());
  });
});

describe("buildYearlySoql() — the new fourth, optional borough argument", () => {
  it("Edge Case 1: borough without extraWhere AND-s exactly one fragment onto the window", () => {
    expect(buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, "K")).toBe(
      BOROUGH_ONLY_SOQL,
    );
  });

  it("Edge Case 2: with both present, the order is window AND extraWhere AND borough", () => {
    const soql = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, "K");

    expect(soql).toBe(FOUR_ARG_SOQL);
    expect(soql.indexOf(EXTRA_WHERE)).toBeLessThan(
      soql.indexOf(BOROUGH_WHERE.K),
    );
  });

  it("adds no stray AND, no double space, and no parentheses around the window or the borough fragment", () => {
    for (const soql of [
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, "K"),
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, "K"),
    ]) {
      const whereLine = soql
        .split("\n")
        .find((line) => line.startsWith("$where="));

      expect(whereLine).toBeDefined();
      const clause = (whereLine as string).slice("$where=".length);

      expect(clause).not.toMatch(/ {2}/);
      expect(clause).not.toMatch(/\bAND\s+AND\b/);
      expect(clause).not.toMatch(/AND\s*$/);
      expect(clause).not.toContain("(borough");
      expect(clause.startsWith(`${FIXED_WHERE} AND `)).toBe(true);
      expect(clause.endsWith(BOROUGH_WHERE.K)).toBe(true);
      expect(clause.split(" AND borough").length - 1).toBe(1);
    }
  });

  it("trap 2 at the transport level: each code produces its own pinned fragment, and B is the BRONX", () => {
    const codes = ["B", "K", "M", "Q", "S"] as const;

    for (const code of codes) {
      expect(
        buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, code),
      ).toContain(`$where=${FIXED_WHERE} AND ${BOROUGH_WHERE[code]}`);
    }

    expect(
      buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS, undefined, "B"),
    ).not.toContain("BROOKLYN");
  });

  it("leaves $select, $group and $order untouched when a borough is present", () => {
    const lines = buildYearlySoql(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
      "K",
    ).split("\n");

    expect(lines[0]).toBe(SELECT_LINE);
    expect(lines[2]).toBe(`$group=${FIXED_GROUP}`);
    expect(lines[3]).toBe(`$order=${FIXED_ORDER}`);
    expect(lines).toHaveLength(4);
  });
});

describe("buildYearlyUrl() — the same invariant, expressed as a URL", () => {
  it("borough only: $where is the window AND-ed with exactly the borough fragment", () => {
    const url = buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, undefined, "K");

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.get("$where")).toBe(
      `${FIXED_WHERE} AND ${BOROUGH_WHERE.K}`,
    );
  });

  it("both: $where is window AND extraWhere AND borough, in that order", () => {
    const url = buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, "K");

    expect(url.searchParams.get("$where")).toBe(
      `${FIXED_WHERE} AND ${EXTRA_WHERE} AND ${BOROUGH_WHERE.K}`,
    );
  });

  it("leaves $select/$group/$order untouched and still sets no $limit (trap 5, Edge Case 7)", () => {
    const url = buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, "K");

    expect(url.searchParams.get("$select")).toBe(
      `${FIXED_GROUP} AS year, ${AGGREGATE_EXPR} AS ${FIELD_ALIAS}`,
    );
    expect(url.searchParams.get("$group")).toBe(FIXED_GROUP);
    expect(url.searchParams.get("$order")).toBe(FIXED_ORDER);
    expect(url.searchParams.has("$limit")).toBe(false);
  });
});

describe("fetchYearlyMetric() — the fourth parameter forwards to both builders", () => {
  it("requests exactly buildYearlyUrl(agg, alias, undefined, code)'s URL and returns the matching soql", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    );

    expect(result.soql).toBe(BOROUGH_ONLY_SOQL);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).toBe(
      buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, undefined, "K").toString(),
    );
  });

  it("forwards extraWhere and borough together, in the pinned order", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
      "K",
    );

    expect(result.soql).toBe(FOUR_ARG_SOQL);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("$where")).toBe(
      `${FIXED_WHERE} AND ${EXTRA_WHERE} AND ${BOROUGH_WHERE.K}`,
    );
  });

  it("casts the string aggregate explicitly on the borough path — Socrata sends strings, the rows carry numbers", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = (await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    )) as Extract<YearlyMetricResult<"widgets">, { status: "ok" }>;

    expect(result.status).toBe("ok");
    expect(result.rows).toHaveLength(8);
    for (const row of result.rows) {
      expect(typeof row.year).toBe("number");
      expect(typeof row.widgets).toBe("number");
    }
  });

  it("Constraint 5: the 8-year coverage requirement is NOT relaxed for a borough-filtered query — a missing year is an error, never a gap", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = (await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    )) as Extract<YearlyMetricResult<"widgets">, { status: "error" }>;

    expect(result.status).toBe("error");
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2021/);
  });

  it("FR-11 / trap 1: a null aggregate on a borough-filtered year fails loud and is never coerced to zero", async () => {
    const body = syntheticOkBody().map((row) =>
      row.year === "2021" ? { year: row.year, widgets: null } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    );

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2021/);
  });

  it("FR-11 / trap 1: an absent aggregate key on a borough-filtered year fails loud, never zero", async () => {
    const body = syntheticOkBody().map((row) =>
      row.year === "2021" ? { year: row.year } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    );

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2021/);
  });

  it("Edge Case 6: a borough-filtered query returning zero rows takes the existing FR-10 `empty` branch, carrying the filtered soql", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchYearlyMetric(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      undefined,
      "K",
    );

    expect(result.status).toBe("empty");
    expect(result.soql).toBe(BOROUGH_ONLY_SOQL);
  });
});

// ---------------------------------------------------------------------------
// Compile-time assertions, enforced by `tsc --noEmit` rather than by vitest
// (this project's vitest config does not typecheck). Never called.
//
// FORCES 1: the borough parameter is typed BoroughCode, never string, so a
// value from a URL cannot reach a $where clause without passing
// parseBoroughParam() first. If the parameter is ever widened to `string`,
// TypeScript reports "Unused '@ts-expect-error' directive" and the Stop
// quality gate fails — which is the assertion.
// ---------------------------------------------------------------------------

export function __typeOnly_boroughParamIsClosed(fromTheUrl: string) {
  // Short local aliases keep each offending call on a single line, so the
  // directive above it anchors to the line the compiler reports on.
  const agg = AGGREGATE_EXPR;
  const alias = FIELD_ALIAS;

  // @ts-expect-error — an unparsed string from a URL is not a BoroughCode.
  buildYearlySoql(agg, alias, undefined, fromTheUrl);
  // @ts-expect-error — 'BROOKLYN' is the dataset literal, not a code.
  buildYearlyUrl(agg, alias, undefined, "BROOKLYN");
  // @ts-expect-error — an injection payload is unrepresentable, not rejected.
  void fetchYearlyMetric(agg, alias, undefined, "K' OR 1=1 --");
}
