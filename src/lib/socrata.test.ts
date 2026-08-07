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
