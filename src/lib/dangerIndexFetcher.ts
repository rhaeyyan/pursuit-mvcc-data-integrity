// Collision-density transport for h9gi-nx95 (Motor Vehicle Collisions -
// Crashes), 2018-2025. Server-side only (NFR-2, Rule 3): it reads the app
// token through socrata.ts and must never be imported by a 'use client'
// module.

import { z } from "zod";
import { CRASH_WINDOW_WHERE, getSocrataAppToken } from "./socrata";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// The aliases are lat_c/lon_c, not latitude/longitude, and that is not
// cosmetic: `avg(latitude) AS latitude` shadows the source column, so the
// `latitude != 0` guard below resolves to the aggregate and Socrata rejects
// the whole query with query.soql.aggregate-in-ungrouped-context. The rename
// back to latitude/longitude happens in the schema instead, which keeps
// DangerMap.tsx's props unchanged.
const SELECT_CLAUSE = [
  "floor(latitude * 10000) AS lat_e4",
  "floor(longitude * 10000) AS lon_e4",
  "count(collision_id) AS total",
  "avg(latitude) AS lat_c",
  "avg(longitude) AS lon_c",
].join(", ");

// The window is imported, never retyped — one definition of 2018-2025 for
// every metric in the product.
const WHERE_CLAUSE = [
  CRASH_WINDOW_WHERE,
  "latitude IS NOT NULL",
  "longitude IS NOT NULL",
  "latitude != 0",
  "longitude != 0",
].join(" AND ");

// Grouping on the raw floats splits one intersection across rows: 40.696033
// and 40.6960346 are ~18cm apart and counted separately. Four decimal places
// is a ~11m x 8m cell at this latitude — wide enough to absorb that jitter,
// far below the ~60m spacing of genuinely distinct NYC intersections. The
// residual is honest and stated in the page copy: a pair straddling a cell
// boundary still splits.
const GROUP_CLAUSE = "floor(latitude * 10000), floor(longitude * 10000)";
// The grid key breaks ties, so the 1,000-row cutoff — and therefore the
// ranking — is reproducible between requests.
const ORDER_CLAUSE = "total DESC, lat_e4, lon_e4";
const LIMIT_CLAUSE = "1000";

// FR-8: the displayed query and the sent request are built from the same
// clause constants, so they cannot drift apart.
export const DANGER_INDEX_SOQL = [
  `$select=${SELECT_CLAUSE}`,
  `$where=${WHERE_CLAUSE}`,
  `$group=${GROUP_CLAUSE}`,
  `$order=${ORDER_CLAUSE}`,
  `$limit=${LIMIT_CLAUSE}`,
].join("\n");

// Socrata sends every numeric as a string, so each one is parsed as a string
// and cast explicitly (FR-11). z.coerce.number() is banned here: it maps null
// to 0, which is trap 1 (absent-key-as-zero) in Zod syntax, and a fabricated
// zero invents a safe intersection. No .optional(), .default() or .catch() on
// any field — an absent aggregate throws.
const TotalSchema = z.string().regex(/^\d+$/).transform(Number);
// Signed because floor() snaps a negative longitude west (floor(-739845.29) =
// -739846); uniform across rows, and never the marker position, which uses
// avg().
const CoordinateSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .transform(Number)
  .refine(Number.isFinite);

const DANGER_INDEX_SCHEMA = z.array(
  z
    .object({
      lat_e4: CoordinateSchema,
      lon_e4: CoordinateSchema,
      total: TotalSchema,
      lat_c: CoordinateSchema,
      lon_c: CoordinateSchema,
    })
    // lat_c/lon_c are wire names only. The centroid is Socrata's avg(), never
    // the floor key divided back out — that corner would be a caller-computed
    // figure (NFR-4).
    .transform(({ lat_e4, lon_e4, total, lat_c, lon_c }) => ({
      lat_e4,
      lon_e4,
      total,
      latitude: lat_c,
      longitude: lon_c,
    })),
);

export type DangerIndexRow = z.infer<typeof DANGER_INDEX_SCHEMA>[number];

export async function fetchDangerIndex(): Promise<DangerIndexRow[]> {
  const query = new URLSearchParams({
    $select: SELECT_CLAUSE,
    $where: WHERE_CLAUSE,
    $group: GROUP_CLAUSE,
    $order: ORDER_CLAUSE,
    $limit: LIMIT_CLAUSE,
  });

  const url = `${BASE_URL}?${query.toString()}`;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const token = getSocrataAppToken();
  if (token) {
    headers["X-App-Token"] = token;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Danger index fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return DANGER_INDEX_SCHEMA.parse(data);
}
