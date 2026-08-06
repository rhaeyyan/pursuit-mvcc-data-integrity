// Server-only data module for FR-1 (deaths per year, 2018-2025). A thin
// wrapper over src/lib/socrata.ts's generic yearly-metric transport — see
// that module for the token read, fetch/validation/coverage logic (NFR-2,
// Rule 3: socrata.ts is now the only file that reads SOCRATA_APP_TOKEN).
//
// Query is a frozen contract (CLAUDE.md Rule 4, SPEC.md "Query"). Do not
// edit, reorder, or extend a clause here; a Socrata rejection is a halt and
// a request for a revised SPEC, not a local repair. DEATHS_SOQL's string
// value must stay byte-identical to what it was before this refactor — this
// change is to *how* the string is built, never *what* it says.

import {
  buildYearlySoql,
  buildYearlyUrl,
  fetchYearlyMetric,
  type YearlyMetricResult,
  type YearlyMetricRow,
} from "./socrata";

const AGGREGATE_EXPR = "sum(number_of_persons_killed)";
const FIELD_ALIAS = "deaths" as const;

// FR-8: the displayed query and the sent request are derived from the same
// two constants above so they cannot drift apart.
export const DEATHS_SOQL = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);

export function buildDeathsUrl(): URL {
  return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS);
}

export type DeathsRow = YearlyMetricRow<"deaths">;
export type DeathsResult = YearlyMetricResult<"deaths">;

export function fetchDeathsPerYear(): Promise<DeathsResult> {
  return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS);
}
