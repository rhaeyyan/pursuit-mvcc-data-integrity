// Self-contained transport + derivation module for the Staten Island pilot
// panel — the monthly Staten Island collision count for 2018-2019, the
// pre-COVID natural experiment (SPEC.md "Staten Island pilot panel — data
// half only"; PRD §3 P2; PRD §7 residual-risk retirement).
//
// Deliberately NOT an extension of src/lib/socrata.ts: that module's own
// header is explicit that its $group/$order stay fixed *annual* constants
// and its EXPECTED_YEARS/validateYearCoverage machinery is hard-wired to an
// 8-row yearly shape (2018-2025). This panel needs a 24-row *monthly* shape
// over a *2018-2019* window with a *fixed, non-optional* borough — three
// simultaneous deviations from socrata.ts's contract. The precedent is
// src/lib/arrestsSocrata.ts, itself "a deliberately self-contained sibling
// module, not a socrata.ts caller," for the same reason (different shape).
//
// Query is a frozen contract (CLAUDE.md Rule 4, SPEC.md "Query"). Do not
// edit, reorder, or extend a clause here; a Socrata rejection is a halt and
// a request for a revised SPEC, not a local repair.

import { z } from "zod";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

const SELECT_CLAUSE =
  "date_trunc_ym(crash_date) AS month, count(collision_id) AS collisions";
const WHERE_CLAUSE =
  "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2020-01-01T00:00:00' AND borough = 'STATEN ISLAND'";
const GROUP_CLAUSE = "date_trunc_ym(crash_date)";
const ORDER_CLAUSE = "month";

// FR-8: the displayed query and the sent request are derived from the same
// four clause constants above so they cannot drift apart.
export const SI_PILOT_SOQL = [
  `$select=${SELECT_CLAUSE}`,
  `$where=${WHERE_CLAUSE}`,
  `$group=${GROUP_CLAUSE}`,
  `$order=${ORDER_CLAUSE}`,
].join("\n");

// Zero arguments: fixed window + fixed Staten Island borough, nothing
// varies (SPEC's Intellectual Control 3).
export function buildStatenIslandPilotUrl(): URL {
  const url = new URL(BASE_URL);
  url.searchParams.set("$select", SELECT_CLAUSE);
  url.searchParams.set("$where", WHERE_CLAUSE);
  url.searchParams.set("$group", GROUP_CLAUSE);
  url.searchParams.set("$order", ORDER_CLAUSE);
  return url;
}

export type SIPilotRow = { month: string; collisions: number }; // "YYYY-MM"
export type SIPilotStats = { avg2018Monthly: number; avgMayDec2019: number };
export type SIPilotResult =
  | { status: "ok"; soql: string; rows: SIPilotRow[]; stats: SIPilotStats }
  | { status: "empty"; soql: string } // FR-10: zero rows returned
  | {
      status: "error";
      soql: string;
      kind: "upstream" | "contract";
      reason: string;
    };

// Jan 2018 .. Dec 2019, "YYYY-MM", ascending — the 24 expected months.
const EXPECTED_MONTHS: string[] = [];
for (let year = 2018; year <= 2019; year++) {
  for (let month = 1; month <= 12; month++) {
    EXPECTED_MONTHS.push(`${year}-${String(month).padStart(2, "0")}`);
  }
}

// Trap 1's monthly-grain extension: the aggregate value is strict because
// that is where the integrity claim lives.
const ValueSchema = z.string().regex(/^\d+$/);

function describeMonth(raw: unknown): string {
  const rawMonth = (raw as Record<string, unknown> | null | undefined)?.month;
  return typeof rawMonth === "string" ? rawMonth : "an unknown month";
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "missing";
  if (typeof value === "string" && value === "") return "an empty string";
  return typeof value;
}

// Never coerce a missing/invalid collisions value to 0 — that fabricates
// the exact reporting-decline finding this product exists to expose.
function parseRow(raw: unknown): { row: SIPilotRow } | { error: string } {
  const rawMonthValue = (raw as Record<string, unknown> | null | undefined)
    ?.month;
  if (typeof rawMonthValue !== "string" || rawMonthValue.length < 7) {
    return { error: `invalid month value for ${describeMonth(raw)}` };
  }
  // Socrata's date_trunc_ym() shape is a full floating-timestamp string
  // ("2018-01-01T00:00:00.000"), never a bare "YYYY-MM" — slice, don't parse.
  const month = rawMonthValue.slice(0, 7);

  const rawValue = (raw as Record<string, unknown> | null | undefined)
    ?.collisions;
  const valueParsed = ValueSchema.safeParse(rawValue);
  if (!valueParsed.success) {
    return {
      error: `invalid collisions value for ${month} (${describeValue(rawValue)})`,
    };
  }

  return { row: { month, collisions: Number(valueParsed.data) } };
}

// Mirrors socrata.ts's validateYearCoverage, adapted to months instead of
// years (Edge Cases 1, 3, 4).
function validateMonthCoverage(rows: SIPilotRow[]): string | null {
  if (rows.length > EXPECTED_MONTHS.length) {
    return `expected ${EXPECTED_MONTHS.length} monthly rows, got ${rows.length}`;
  }

  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.month)) {
      return `duplicate row for month ${row.month}`;
    }
    seen.add(row.month);
  }

  const missing = EXPECTED_MONTHS.filter((month) => !seen.has(month));
  if (missing.length > 0) {
    return `no aggregate returned for ${missing.join(", ")}`;
  }

  const outOfWindow = [...seen].filter(
    (month) => !EXPECTED_MONTHS.includes(month),
  );
  if (outOfWindow.length > 0) {
    return `unexpected month(s) outside 2018-01..2019-12: ${outOfWindow.join(", ")}`;
  }

  return null;
}

// Pure, single-use, single-caller derivation (SPEC's Intellectual Control
// 4) — takes the full validated row array and filters internally, so it
// agrees whether called with all 24 rows or a pre-filtered subset.
export function avg2018Monthly(rows: SIPilotRow[]): number {
  const relevant = rows.filter((row) => row.month.startsWith("2018"));
  const sum = relevant.reduce((total, row) => total + row.collisions, 0);
  return sum / relevant.length;
}

export function avgMayDec2019(rows: SIPilotRow[]): number {
  const relevant = rows.filter((row) => {
    if (!row.month.startsWith("2019")) return false;
    const monthNumber = Number(row.month.slice(5, 7));
    return monthNumber >= 5 && monthNumber <= 12;
  });
  const sum = relevant.reduce((total, row) => total + row.collisions, 0);
  return sum / relevant.length;
}

export async function fetchStatenIslandPilot(): Promise<SIPilotResult> {
  const soql = SI_PILOT_SOQL;
  const url = buildStatenIslandPilotUrl();

  const token = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-App-Token"] = token;
  } else {
    // Edge Case 8: the token is a rate-limit attribution token, not an
    // authorization secret. Its absence degrades throughput, never
    // correctness, so this is a warning, not a failure.
    console.warn(
      "SOCRATA_APP_TOKEN is unset; requesting Socrata (staten-island-pilot) without rate-limit attribution.",
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
      reason: "Socrata's response was not a JSON array of monthly aggregates",
    };
  }

  if (body.length === 0) {
    return { status: "empty", soql };
  }

  const rows: SIPilotRow[] = [];
  for (const raw of body) {
    const parsed = parseRow(raw);
    if ("error" in parsed) {
      return { status: "error", soql, kind: "contract", reason: parsed.error };
    }
    rows.push(parsed.row);
  }

  const coverageError = validateMonthCoverage(rows);
  if (coverageError) {
    return { status: "error", soql, kind: "contract", reason: coverageError };
  }

  rows.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));

  // Constraint: stats are derived by calling these same exported pure
  // functions on the already-validated rows, never a second,
  // independently-computed value.
  const stats: SIPilotStats = {
    avg2018Monthly: avg2018Monthly(rows),
    avgMayDec2019: avgMayDec2019(rows),
  };

  return { status: "ok", soql, rows, stats };
}
