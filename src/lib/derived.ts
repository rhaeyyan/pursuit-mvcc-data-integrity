// Pure, dependency-free derivations shared across the Timeline, Integrity
// audit, and Series registry views of the MVCC Workspace redesign. Every
// input here is a real, already-fetched yearly-metric row array (or a single
// looked-up value from one) — never a literal (CLAUDE.md Rule 1/NFR-4).
//
// Percent-change-across-a-window arithmetic already exists in
// src/lib/percentChange.ts (computeChange/formatPercentChange) and is reused
// as-is by callers of this module, not reimplemented here. This module adds
// only what didn't already exist: a single-year lookup, and the
// property-damage-only (PDO) derivation the mockup itself frames as
// "Derived client-side: collisions − repaired, per year. No query of its
// own."
//
// No new query, no fetch, no dataset access — operates purely on rows
// arrays callers already have from fetchDeathsPerYear/fetchCollisionsPerYear/
// fetchRepairedCollisionsPerYear/etc.

// Looks up a single year's aggregate from a yearly-metric result's `rows`
// array. Returns null (not 0) when that year is missing or the value isn't a
// finite number — a missing input must never silently present as zero
// (FR-11's zero-coercion ban applies here exactly as it does to an absent
// Socrata aggregate).
export function valueAtYear<K extends string>(
  rows: (({ year: number } & Record<K, number>) | undefined)[] | undefined,
  year: number,
  field: K,
): number | null {
  const row = rows?.find((r) => r?.year === year);
  const value = row?.[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Property-damage-only: collisions minus the casualty-filtered ("repaired")
// count for the same year. Null (not 0) when either input is missing — a
// missing input must never silently present as "zero PDO crashes."
export function pdo(
  collisionsForYear: number | null,
  repairedForYear: number | null,
): number | null {
  if (collisionsForYear === null || repairedForYear === null) return null;
  return collisionsForYear - repairedForYear;
}
