// Shared series metadata and value-lookup helpers for the MVCC Workspace's
// three views (Timeline, Integrity audit, Series registry) — extracted so
// all three read one definition of "what a series is" (label, ink, dash
// style, trust badge, note) instead of three drifting copies. Only static
// copy (label/badge text/notes) lives here as literals — every *number* a
// caller renders still comes from real fetched rows passed in as `data`
// (CLAUDE.md Rule 1/NFR-4); this module never fetches anything itself.

import { pdo, valueAtYear } from "./derived";
import { computeChange, formatPercentChange } from "./percentChange";
import type {
  InspectorBadgeTone,
  InspectorItem,
} from "@/context/WorkspaceInspectorContext";

export type Row<K extends string> = { year: number } & Record<K, number>;

// Structurally compatible with (but looser than) each lib module's own
// YearlyMetricResult<K>/YearlyMetricResultWithSource<K> — accepts whatever
// extra fields those carry (soql, source) since only status/rows are read
// here.
export type Dataset<K extends string> = {
  status: "ok" | "error" | "empty";
  rows?: Row<K>[];
};

export type SeriesData = {
  deaths: Dataset<"deaths">;
  injuries: Dataset<"injuries">;
  collisions: Dataset<"collisions">;
  repaired: Dataset<"repaired">;
  arrests: Dataset<"arrests">;
};

export const YEARS: number[] = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export type SeriesKey =
  "deaths" | "injuries" | "collisions" | "repaired" | "pdo" | "arrests";

export type SeriesDef = {
  key: SeriesKey;
  label: string;
  short: string;
  ink: string;
  dash: "solid" | "dashed" | "dotted";
  strokeWidth: number;
  badgeText: string;
  badgeTone: InspectorBadgeTone;
  note: string;
  dataset: string;
  aggregate: string;
};

export const SERIES_CONFIG: SeriesDef[] = [
  {
    key: "deaths",
    label: "Deaths",
    short: "Deaths",
    ink: "var(--color-text)",
    dash: "solid",
    strokeWidth: 2.5,
    badgeText: "Mandatory record",
    badgeTone: "neutral",
    note: "Medical examiner's count. The least discretionary figure on the page and the one the reporting change does not touch.",
    dataset: "h9gi-nx95",
    aggregate: "sum(number_of_persons_killed)",
  },
  {
    key: "injuries",
    label: "Injuries",
    short: "Injuries",
    ink: "var(--color-neutral-700)",
    dash: "solid",
    strokeWidth: 1.5,
    badgeText: "Hospital record",
    badgeTone: "neutral",
    note: "Typically involves an ambulance or hospital record, so an officer's filing decision rarely removes it from the count.",
    dataset: "h9gi-nx95",
    aggregate: "sum(number_of_persons_injured)",
  },
  {
    key: "collisions",
    label: "Collisions, raw",
    short: "Raw",
    ink: "var(--color-accent-2)",
    dash: "dashed",
    strokeWidth: 1.5,
    badgeText: "Discretionary · policy break",
    badgeTone: "accent2",
    note: "Affected by a documented NYPD dispatch policy change (Staten Island 2019-03-18, citywide 2020-04-06). Not evidence of a comparable drop in real collisions.",
    dataset: "h9gi-nx95",
    aggregate: "count(collision_id)",
  },
  {
    key: "repaired",
    label: "Collisions, casualty-filtered",
    short: "Repaired",
    ink: "var(--color-accent)",
    dash: "solid",
    strokeWidth: 2.5,
    badgeText: "Repaired · defensible",
    badgeTone: "accent",
    note: "The same aggregate with one added where clause: only collisions with a recorded injury or death, which still required an officer response after 2020. The figure to quote.",
    dataset: "h9gi-nx95",
    aggregate: "count(collision_id) + casualty filter",
  },
  {
    key: "pdo",
    label: "Property-damage-only, derived",
    short: "PDO",
    ink: "var(--color-accent-2-400)",
    dash: "dotted",
    strokeWidth: 1.5,
    badgeText: "Derived residual",
    badgeTone: "outline",
    note: "Raw minus casualty-filtered. Not a query of its own — the tier the dispatch policy stopped recording, and where the entire artifact lives.",
    dataset: "derived",
    aggregate: "collisions − repaired",
  },
  {
    key: "arrests",
    label: "Traffic-enforcement arrests",
    short: "Arrests",
    ink: "var(--color-accent-800)",
    dash: "dashed",
    strokeWidth: 1.5,
    badgeText: "Co-moving only",
    badgeTone: "outline",
    note: "Five offense categories, both spellings of the impaired-driving offense. Shown as co-moving data: no causal claim about enforcement and safety is supported here.",
    dataset: "8h9b-rp9u",
    aggregate: "count(*) over five ofns_desc values",
  },
];

export const DASH_PATTERN: Record<SeriesDef["dash"], string | undefined> = {
  solid: undefined,
  dashed: "8 6",
  dotted: "2 4",
};

export function rawValueForYear(
  key: SeriesKey,
  year: number,
  data: SeriesData,
): number | null {
  switch (key) {
    case "deaths":
      return valueAtYear(data.deaths.rows, year, "deaths");
    case "injuries":
      return valueAtYear(data.injuries.rows, year, "injuries");
    case "collisions":
      return valueAtYear(data.collisions.rows, year, "collisions");
    case "repaired":
      return valueAtYear(data.repaired.rows, year, "repaired");
    case "arrests":
      return valueAtYear(data.arrests.rows, year, "arrests");
    case "pdo":
      return pdo(
        valueAtYear(data.collisions.rows, year, "collisions"),
        valueAtYear(data.repaired.rows, year, "repaired"),
      );
  }
}

// Count of years (out of the fixed 8-year window) with a real, non-null
// value — used for an "N of 8 years verified" coverage badge so it stays
// truthful as the underlying data changes, rather than a copied-in claim.
export function verifiedYearCount(key: SeriesKey, data: SeriesData): number {
  return YEARS.filter((year) => rawValueForYear(key, year, data) !== null)
    .length;
}

export function deltaLabel(
  key: SeriesKey,
  baseYear: number,
  targetYear: number,
  data: SeriesData,
): string {
  if (baseYear === targetYear) return `base year (${baseYear})`;
  const baseVal = rawValueForYear(key, baseYear, data);
  const targetVal = rawValueForYear(key, targetYear, data);
  if (baseVal === null || targetVal === null) return "no verified base";
  const change = computeChange(
    [
      { year: baseYear, value: baseVal },
      { year: targetYear, value: targetVal },
    ],
    "value",
  );
  if (!change) return "no verified base";
  return `${formatPercentChange(change.percentChange)} vs ${baseYear}`;
}

export const fmt = (n: number | null) =>
  n === null ? "—" : n.toLocaleString();

// The one-line headline claim ("the figure to defend"), shared verbatim by
// the Timeline and Integrity audit inspector panels — computed from the
// full citywide repaired/deaths rows arrays (rows[0]/rows[last], via
// computeChange), never a copy of the mockup's fixed "-18.2%" wording.
export function defensibleLine(data: SeriesData): string {
  const repairedChange =
    data.repaired.status === "ok" && data.repaired.rows
      ? computeChange(data.repaired.rows, "repaired")
      : null;
  const deathsChange =
    data.deaths.status === "ok" && data.deaths.rows
      ? computeChange(data.deaths.rows, "deaths")
      : null;

  if (!repairedChange || !deathsChange) {
    return "Casualty-filtered collisions and deaths are both live queries — see the table for the exact per-year values.";
  }

  return `Casualty-filtered collisions moved ${formatPercentChange(repairedChange.percentChange)} from ${repairedChange.startYear} to ${repairedChange.endYear} while deaths moved ${formatPercentChange(deathsChange.percentChange)}. See the Integrity audit for why the raw count can't carry this claim.`;
}

// All 6 series' "2018 vs LAST_YEAR" summary — the static inspector content
// shared verbatim by the Integrity audit and Series registry views (the
// Timeline view instead shows only the currently-toggled-visible series for
// the currently-hovered year; that reactive version stays local to
// UnifiedTimeline.tsx, not here).
export function allSeriesInspectorItems(data: SeriesData): InspectorItem[] {
  const firstYear = YEARS[0];
  const lastYear = YEARS[YEARS.length - 1];
  return SERIES_CONFIG.map((s) => ({
    id: s.key,
    label: s.label,
    ink: s.ink,
    value: fmt(rawValueForYear(s.key, lastYear, data)),
    badgeText:
      s.key === "arrests"
        ? `${s.badgeText} · ${verifiedYearCount(s.key, data)} of ${YEARS.length} years verified`
        : s.badgeText,
    badgeTone: s.badgeTone,
    delta: deltaLabel(s.key, firstYear, lastYear, data),
    note: s.note,
  }));
}
