// Server-only data module for FR-3's data half (collisions per year,
// 2018-2025). A thin wrapper over src/lib/socrata.ts's generic yearly-metric
// transport — see that module for the token read, fetch/validation/coverage
// logic (NFR-2, Rule 3: socrata.ts is the only file that reads
// SOCRATA_APP_TOKEN).
//
// Query is a frozen contract (CLAUDE.md Rule 4, SPEC.md "Query"). Do not
// edit, reorder, or extend a clause here; a Socrata rejection is a halt and
// a request for a revised SPEC, not a local repair.

import {
  buildYearlySoql,
  buildYearlyUrl,
  fetchYearlyMetric,
  type YearlyMetricResult,
  type YearlyMetricRow,
} from "./socrata";

const AGGREGATE_EXPR = "count(collision_id)";
const FIELD_ALIAS = "collisions" as const;

// FR-8: the displayed query and the sent request are derived from the same
// two constants above so they cannot drift apart.
export const COLLISIONS_SOQL = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);

export function buildCollisionsUrl(): URL {
  return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS);
}

export type CollisionsRow = YearlyMetricRow<"collisions">;
export type CollisionsResult = YearlyMetricResult<"collisions">;

export function fetchCollisionsPerYear(): Promise<CollisionsResult> {
  return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS);
}
