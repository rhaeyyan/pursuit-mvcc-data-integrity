// Self-contained yearly-metric transport for FR-5's traffic-enforcement
// arrest counts (2018-2025), dataset 8h9b-rp9u (NYPD Arrests Data Historic).
//
// Deliberately NOT a wrapper over socrata.ts's fetchYearlyMetric() (SPEC.md's
// Intellectual Control point 2): the shared transport module hardcodes
// h9gi-nx95/crash_date as fixed constants, and widening it to accept a
// second dataset would couple every P0 metric (deaths, injuries, collisions,
// repaired) to a feature the PRD marks droppable (§5.2). This file
// duplicates that module's fetch/validate/coverage-check scaffold instead,
// so dropping FR-5 later means deleting this one file — see SPEC.md's
// Tipping Point for when that duplication should be resolved instead of
// repeated a third time.
//
// Constraint 3 (SPEC.md): this is the one accepted exception to "the shared
// transport module is the only file that reads SOCRATA_APP_TOKEN" — this
// module reads it directly because it does not call into that module's
// fetch path.
//
// FR-6 (the arrest-borough filter) is out of scope: that field never
// appears here. Demographic offender fields are permanently excluded
// (PRD §6).
//
// Query is a frozen contract (CLAUDE.md Rule 4, SPEC.md "Query"). Do not
// edit, reorder, or extend a clause here; a Socrata rejection is a halt and
// a request for a revised SPEC, not a local repair.

import { z } from "zod";

import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";

const BASE_URL = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";

const FIELD_ALIAS = "arrests" as const;

const SELECT_CLAUSE =
  "date_extract_y(arrest_date) AS year, count(*) AS arrests";

// Trap 4: both ofns_desc spellings must appear, or ~10% of the series is
// silently dropped. Vehicle-theft categories (GRAND LARCENY OF MOTOR
// VEHICLE, UNAUTHORIZED USE OF A VEHICLE) are deliberately absent — property
// crimes, not road safety (PRD §5.2).
const WHERE_CLAUSE =
  "arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00' " +
  "AND (ofns_desc = 'VEHICLE AND TRAFFIC LAWS' " +
  "OR ofns_desc = 'OTHER TRAFFIC INFRACTION' " +
  "OR ofns_desc = 'INTOXICATED & IMPAIRED DRIVING' " +
  "OR ofns_desc = 'INTOXICATED/IMPAIRED DRIVING' " +
  "OR ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE')";

const GROUP_CLAUSE = "date_extract_y(arrest_date)";
const ORDER_CLAUSE = "year";

const EXPECTED_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// FR-8: the displayed query and the sent request are built from the same
// clause constants above so they cannot drift apart.
export const ARRESTS_SOQL = [
  `$select=${SELECT_CLAUSE}`,
  `$where=${WHERE_CLAUSE}`,
  `$group=${GROUP_CLAUSE}`,
  `$order=${ORDER_CLAUSE}`,
].join("\n");

function buildArrestsUrl(): URL {
  const url = new URL(BASE_URL);
  url.searchParams.set("$select", SELECT_CLAUSE);
  url.searchParams.set("$where", WHERE_CLAUSE);
  url.searchParams.set("$group", GROUP_CLAUSE);
  url.searchParams.set("$order", ORDER_CLAUSE);
  return url;
}

export type ArrestsRow = YearlyMetricRow<typeof FIELD_ALIAS>;
export type ArrestsResult = YearlyMetricResult<typeof FIELD_ALIAS>;

const YearSchema = z.union([z.string(), z.number()]);
// Deliberate asymmetry (FR-11), mirroring socrata.ts's ValueSchema: the
// aggregate value is strict because that is where the integrity claim
// lives; `year` accepts either JSON shape Socrata might send.
const ArrestsValueSchema = z.string().regex(/^\d+$/);

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

// Trap 1: absent-key-as-zero. Never coerce a missing/invalid `arrests` value
// to 0 — that fabricates the exact safety improvement this product exists to
// disprove.
function parseArrestsRow(
  raw: unknown,
): { row: ArrestsRow } | { error: string } {
  const yearParsed = YearSchema.safeParse(
    (raw as Record<string, unknown> | null | undefined)?.year,
  );
  if (!yearParsed.success) {
    return { error: `invalid year value for ${describeYear(raw)}` };
  }

  const rawValue = (raw as Record<string, unknown> | null | undefined)?.[
    FIELD_ALIAS
  ];
  const valueParsed = ArrestsValueSchema.safeParse(rawValue);
  if (!valueParsed.success) {
    return {
      error: `invalid ${FIELD_ALIAS} value for ${describeYear(raw)} (${describeValue(rawValue)})`,
    };
  }

  return {
    row: {
      year: normalizeYear(yearParsed.data),
      [FIELD_ALIAS]: Number(valueParsed.data),
    } as ArrestsRow,
  };
}

function validateYearCoverage(rows: ArrestsRow[]): string | null {
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

export async function fetchArrestsPerYear(): Promise<ArrestsResult> {
  const soql = ARRESTS_SOQL;
  const url = buildArrestsUrl();

  const token = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-App-Token"] = token;
  } else {
    // Edge Case 8: the token is a rate-limit attribution token, not an
    // authorization secret. Its absence degrades throughput, never
    // correctness, so this is a warning, not a failure.
    console.warn(
      "SOCRATA_APP_TOKEN is unset; requesting Socrata (arrests) without rate-limit attribution.",
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

  const rows: ArrestsRow[] = [];
  for (const raw of body) {
    const parsed = parseArrestsRow(raw);
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
