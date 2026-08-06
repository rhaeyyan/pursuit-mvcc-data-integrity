// Generic yearly-metric transport for h9gi-nx95 (Motor Vehicle Collisions –
// Crashes), 2018-2025. The only file in the repo that reads
// SOCRATA_APP_TOKEN (NFR-2, Rule 3). Never imported by a 'use client' module.
//
// Extracted per Task 1's own pre-committed Tipping Point ("a second Route
// Handler appears -> extract src/lib/socrata.ts") once injuries (FR-2)
// arrived as the second caller. `deaths.ts` and `injuries.ts` are both thin
// wrappers over fetchYearlyMetric() below.
//
// The $where/$group/$order clauses (the fixed 2018-2025 window,
// date_extract_y(crash_date), year) are fixed internal constants, not
// parameters — per SPEC.md, that generality is unearned until a third
// distinct query *shape* arrives (a different $where or group key). Only the
// $select aggregate expression and its field alias vary per caller.

import { z } from "zod";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

const WHERE_CLAUSE =
  "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'";
const GROUP_CLAUSE = "date_extract_y(crash_date)";
const ORDER_CLAUSE = "year";

const EXPECTED_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export type YearlyMetricRow<K extends string> = { year: number } & Record<
  K,
  number
>;

export type YearlyMetricResult<K extends string> =
  | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[] } // exactly 8 rows, 2018..2025
  | { status: "empty"; soql: string } // FR-10: zero rows returned
  | {
      status: "error";
      soql: string;
      kind: "upstream" | "contract";
      reason: string;
    };

function selectClause(aggregateExpr: string, fieldAlias: string): string {
  return `date_extract_y(crash_date) AS year, ${aggregateExpr} AS ${fieldAlias}`;
}

// FR-8: the displayed query and the sent request are derived from the same
// clause builders so they cannot drift apart.
export function buildYearlySoql(
  aggregateExpr: string,
  fieldAlias: string,
): string {
  return [
    `$select=${selectClause(aggregateExpr, fieldAlias)}`,
    `$where=${WHERE_CLAUSE}`,
    `$group=${GROUP_CLAUSE}`,
    `$order=${ORDER_CLAUSE}`,
  ].join("\n");
}

export function buildYearlyUrl(aggregateExpr: string, fieldAlias: string): URL {
  const url = new URL(BASE_URL);
  url.searchParams.set("$select", selectClause(aggregateExpr, fieldAlias));
  url.searchParams.set("$where", WHERE_CLAUSE);
  url.searchParams.set("$group", GROUP_CLAUSE);
  url.searchParams.set("$order", ORDER_CLAUSE);
  return url;
}

const YearSchema = z.union([z.string(), z.number()]);
// Deliberate asymmetry (FR-11): the aggregate value is strict because that is
// where the integrity claim lives; `year` accepts either JSON shape Socrata
// might send.
const ValueSchema = z.string().regex(/^\d+$/);

function normalizeYear(year: string | number): number {
  return typeof year === "number" ? year : Number(year);
}

function describeYear(raw: unknown): string {
  const rawYear = (raw as Record<string, unknown> | null | undefined)?.year;
  return typeof rawYear === "string" || typeof rawYear === "number"
    ? String(rawYear)
    : "an unknown year";
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "missing";
  if (typeof value === "string" && value === "") return "an empty string";
  return typeof value;
}

// Trap 1: absent-key-as-zero. Never coerce a missing/invalid aggregate value
// to 0 — that fabricates the exact safety improvement this product exists to
// disprove.
function parseRow<K extends string>(
  raw: unknown,
  fieldAlias: K,
): { row: YearlyMetricRow<K> } | { error: string } {
  const yearParsed = YearSchema.safeParse(
    (raw as Record<string, unknown> | null | undefined)?.year,
  );
  if (!yearParsed.success) {
    return { error: `invalid year value for ${describeYear(raw)}` };
  }

  const rawValue = (raw as Record<string, unknown> | null | undefined)?.[
    fieldAlias
  ];
  const valueParsed = ValueSchema.safeParse(rawValue);
  if (!valueParsed.success) {
    return {
      error: `invalid ${fieldAlias} value for ${describeYear(raw)} (${describeValue(rawValue)})`,
    };
  }

  return {
    row: {
      year: normalizeYear(yearParsed.data),
      [fieldAlias]: Number(valueParsed.data),
    } as YearlyMetricRow<K>,
  };
}

function validateYearCoverage<K extends string>(
  rows: YearlyMetricRow<K>[],
): string | null {
  if (rows.length > EXPECTED_YEARS.length) {
    return `expected ${EXPECTED_YEARS.length} yearly rows, got ${rows.length}`;
  }

  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.year)) {
      return `duplicate row for year ${row.year}`;
    }
    seen.add(row.year);
  }

  const missing = EXPECTED_YEARS.filter((year) => !seen.has(year));
  if (missing.length > 0) {
    return `no aggregate returned for ${missing.join(", ")}`;
  }

  const outOfWindow = [...seen].filter(
    (year) => !EXPECTED_YEARS.includes(year),
  );
  if (outOfWindow.length > 0) {
    return `unexpected year(s) outside 2018-2025: ${outOfWindow.join(", ")}`;
  }

  return null;
}

export async function fetchYearlyMetric<K extends string>(
  aggregateExpr: string,
  fieldAlias: K,
): Promise<YearlyMetricResult<K>> {
  const soql = buildYearlySoql(aggregateExpr, fieldAlias);
  const url = buildYearlyUrl(aggregateExpr, fieldAlias);

  const token = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-App-Token"] = token;
  } else {
    // Edge case 8: the token is a rate-limit attribution token, not an
    // authorization secret. Its absence degrades throughput, never
    // correctness, so this is a warning, not a failure.
    console.warn(
      `SOCRATA_APP_TOKEN is unset; requesting Socrata (${fieldAlias}) without rate-limit attribution.`,
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86400 },
    });
  } catch {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "the request to Socrata failed (network error or timeout)",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: `Socrata responded ${response.status}`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "Socrata responded with a non-JSON body",
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "Socrata's response body could not be parsed as JSON",
    };
  }

  if (!Array.isArray(body)) {
    return {
      status: "error",
      soql,
      kind: "contract",
      reason: "Socrata's response was not a JSON array of yearly aggregates",
    };
  }

  if (body.length === 0) {
    return { status: "empty", soql };
  }

  const rows: YearlyMetricRow<K>[] = [];
  for (const raw of body) {
    const parsed = parseRow(raw, fieldAlias);
    if ("error" in parsed) {
      return { status: "error", soql, kind: "contract", reason: parsed.error };
    }
    rows.push(parsed.row);
  }

  const coverageError = validateYearCoverage(rows);
  if (coverageError) {
    return { status: "error", soql, kind: "contract", reason: coverageError };
  }

  rows.sort((a, b) => a.year - b.year);

  return { status: "ok", soql, rows };
}
