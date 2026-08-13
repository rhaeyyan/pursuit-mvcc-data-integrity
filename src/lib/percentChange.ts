// Pure, dependency-free percent-change arithmetic for FR-4 (percent-change
// across the fixed analysis window, for each yearly metric). Derives its
// window entirely from whatever rows array it is given — rows[0] as the
// start point, rows[last] as the end point — never a hardcoded copy of the
// analysis window, which stays exclusively owned by src/lib/socrata.ts per
// CLAUDE.md Rule 4.
//
// No new query, no fetch, no dataset access: operates purely on the
// already-fetched, already-validated YearlyMetricRow<K>[] MetricSection
// already renders into its <table>. See SPEC.md's FR-4 section for the full
// Intellectual Control reasoning.

import type { YearlyMetricRow } from "./socrata";

export type ChangeSummary = {
  startYear: number;
  endYear: number;
  startValue: number;
  endValue: number;
  percentChange: number; // unrounded float
};

export function computeChange<K extends string>(
  rows: YearlyMetricRow<K>[],
  fieldAlias: K,
): ChangeSummary | null {
  if (rows.length < 2) return null;

  const startRow = rows[0];
  const endRow = rows[rows.length - 1];
  const startValue = startRow[fieldAlias];
  const endValue = endRow[fieldAlias];

  if (startValue === 0) return null; // division undefined

  return {
    startYear: startRow.year,
    endYear: endRow.year,
    startValue,
    endValue,
    percentChange: ((endValue - startValue) / startValue) * 100,
  };
}

export function formatPercentChange(percentChange: number): string {
  const rounded = Math.round(percentChange);
  if (rounded === 0) return "0%"; // Object.is guard: Math.round can produce -0 (e.g. -0.4)
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function formatChangeSummary(
  change: ChangeSummary,
): string {
  const { startYear, endYear, startValue, endValue, percentChange } = change;
  return `${startYear}–${endYear} change: ${formatPercentChange(percentChange)} (${startValue} → ${endValue})`;
}
