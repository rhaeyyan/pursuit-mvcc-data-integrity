// Self-contained yearly-metric transport for FR-5's traffic-enforcement
// arrest counts (2018-2025), dataset 8h9b-rp9u (NYPD Arrests Data Historic).
//
// Deliberately NOT a wrapper over socrata.ts's fetchYearlyMetric() (SPEC.md's
// Intellectual Control point 2): the shared transport module hardcodes
// h9gi-nx95/crash_date as fixed constants, and widening it to accept a
// second dataset would couple every P0 metric (deaths, injuries, collisions,
// repaired) to a feature the PRD marks droppable (§5.2). Transport execution
// is delegated to arrestsSocrata.ts (dataset 8h9b-rp9u transport).
//
// FR-6 Phase 3: the arrest-borough filter is composed via the imported
// arrestsBoroughWhere() from ./boroughs — the literal field name never
// appears inline here (SPEC.md Constraint 6). Demographic offender
// fields are permanently excluded (PRD §6).
//
// Query is a frozen contract (CLAUDE.md Rule 4, SPEC.md "Query"). Do not
// edit, reorder, or extend a clause here; a Socrata rejection is a halt and
// a request for a revised SPEC, not a local repair.

import { arrestsBoroughWhere, type BoroughCode } from "./boroughs";
import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";
import { BASE_URL, fetchArrestsQuery } from "./arrestsSocrata";

const FIELD_ALIAS = "arrests" as const;

const SELECT_CLAUSE =
  "date_extract_y(arrest_date) AS year, count(*) AS arrests";

// Trap 4: both ofns_desc spellings must appear, or ~10% of the series is
// silently dropped. Vehicle-theft categories (GRAND LARCENY OF MOTOR
// VEHICLE, UNAUTHORIZED USE OF A VEHICLE) are deliberately absent — property
// crimes, not road safety (PRD §5.2).
export const ARRESTS_OFFENSE_WHERE =
  "arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00' " +
  "AND (ofns_desc = 'VEHICLE AND TRAFFIC LAWS' " +
  "OR ofns_desc = 'OTHER TRAFFIC INFRACTION' " +
  "OR ofns_desc = 'INTOXICATED & IMPAIRED DRIVING' " +
  "OR ofns_desc = 'INTOXICATED/IMPAIRED DRIVING' " +
  "OR ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE')";

const WHERE_CLAUSE = ARRESTS_OFFENSE_WHERE;

const GROUP_CLAUSE = "date_extract_y(arrest_date)";
const ORDER_CLAUSE = "year";

function whereClause(borough?: BoroughCode): string {
  const parts = [WHERE_CLAUSE];
  if (borough) parts.push(arrestsBoroughWhere(borough));
  return parts.join(" AND ");
}

function buildArrestsSoql(borough?: BoroughCode): string {
  return [
    `$select=${SELECT_CLAUSE}`,
    `$where=${whereClause(borough)}`,
    `$group=${GROUP_CLAUSE}`,
    `$order=${ORDER_CLAUSE}`,
  ].join("\n");
}

// FR-8: the displayed query and the sent request are built from the same
// clause constants above so they cannot drift apart.
export const ARRESTS_SOQL = buildArrestsSoql();

function buildArrestsUrl(borough?: BoroughCode): URL {
  const url = new URL(BASE_URL);
  url.searchParams.set("$select", SELECT_CLAUSE);
  url.searchParams.set("$where", whereClause(borough));
  url.searchParams.set("$group", GROUP_CLAUSE);
  url.searchParams.set("$order", ORDER_CLAUSE);
  return url;
}

export type ArrestsRow = YearlyMetricRow<typeof FIELD_ALIAS>;
export type ArrestsResult = YearlyMetricResult<typeof FIELD_ALIAS>;

export async function fetchArrestsPerYear(
  borough?: BoroughCode,
): Promise<ArrestsResult> {
  const soql = buildArrestsSoql(borough);
  const url = buildArrestsUrl(borough);
  return fetchArrestsQuery(soql, url, FIELD_ALIAS);
}
