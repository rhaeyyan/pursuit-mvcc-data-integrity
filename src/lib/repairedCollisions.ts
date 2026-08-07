// Server-only data module for FR-12's casualty-filtered "repaired"
// collisions per year, 2018-2025 — the corrected number the raw collisions
// series (FR-3) cannot provide. A thin wrapper over src/lib/socrata.ts's
// generic yearly-metric transport, exactly like deaths.ts/injuries.ts/
// collisions.ts — see that module for the app token read, fetch/validation/
// coverage logic (NFR-2, Rule 3: socrata.ts is the only file that reads it).
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
const FIELD_ALIAS = "repaired" as const;
const EXTRA_WHERE =
  "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)";

// FR-8: the displayed query and the sent request are derived from the same
// constants above so they cannot drift apart.
export const REPAIRED_COLLISIONS_SOQL = buildYearlySoql(
  AGGREGATE_EXPR,
  FIELD_ALIAS,
  EXTRA_WHERE,
);

export function buildRepairedCollisionsUrl(): URL {
  return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);
}

export type RepairedCollisionsRow = YearlyMetricRow<"repaired">;
export type RepairedCollisionsResult = YearlyMetricResult<"repaired">;

export function fetchRepairedCollisionsPerYear(): Promise<RepairedCollisionsResult> {
  return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);
}
