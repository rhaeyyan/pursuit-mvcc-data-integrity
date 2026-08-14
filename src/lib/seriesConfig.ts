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
  // Why this line is dashed/dotted rather than solid — shown inline next to
  // the label, so the distinction never rests on line style or color alone
  // (FR-3, WCAG). Per-series rather than one shared string: the arrests line
  // is dashed because it comes from a different dataset, NOT because it's
  // affected by the crash-reporting change, and saying otherwise would be
  // wrong.
  dashNote?: string;
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
    badgeText: "Always recorded",
    badgeTone: "neutral",
    note: "Counted by the medical examiner. This is the hardest number to leave out of the record, and the 2020 reporting change doesn't affect it.",
    dataset: "Motor Vehicle Collisions – Crashes (h9gi-nx95)",
    aggregate: "sum(number_of_persons_killed)",
  },
  {
    key: "injuries",
    label: "Injuries",
    short: "Injuries",
    ink: "var(--color-neutral-700)",
    dash: "solid",
    strokeWidth: 1.5,
    badgeText: "Backed by hospital records",
    badgeTone: "neutral",
    note: "Usually involves an ambulance or a hospital, so these rarely go unrecorded — even when an officer doesn't file a report.",
    dataset: "Motor Vehicle Collisions – Crashes (h9gi-nx95)",
    aggregate: "sum(number_of_persons_injured)",
  },
  {
    key: "collisions",
    label: "All reported crashes",
    short: "All crashes",
    ink: "var(--color-accent-2)",
    dash: "dashed",
    strokeWidth: 1.5,
    badgeText: "Undercounted after 2020",
    badgeTone: "accent2",
    dashNote: "undercounted after 2020",
    note: "NYPD stopped sending officers to minor crashes — Staten Island in March 2019, citywide in April 2020. Most of the drop after that is a change in what gets written down, not a drop in crashes.",
    dataset: "Motor Vehicle Collisions – Crashes (h9gi-nx95)",
    aggregate: "count(collision_id)",
  },
  {
    key: "repaired",
    label: "Injury & fatal crashes",
    short: "Injury/fatal",
    ink: "var(--color-accent)",
    dash: "solid",
    strokeWidth: 2.5,
    badgeText: "The number to trust",
    badgeTone: "accent",
    note: "The same count, limited to crashes where someone was hurt or killed. Police still respond to these, so the count stayed consistent across the 2020 change. This is the number to quote.",
    dataset: "Motor Vehicle Collisions – Crashes (h9gi-nx95)",
    aggregate: "count(collision_id), injury or death only",
  },
  {
    key: "pdo",
    label: "Minor crashes, no injuries",
    short: "Minor",
    ink: "var(--color-accent-2-400)",
    dash: "dotted",
    strokeWidth: 1.5,
    badgeText: "Worked out by subtraction",
    badgeTone: "outline",
    dashNote: "not measured directly; undercounted after 2020",
    note: "All reported crashes minus the injury and fatal ones. We work this out by subtraction rather than asking for it directly. This is the group that largely stopped being recorded.",
    dataset: "worked out, not queried",
    aggregate: "all reported crashes − injury & fatal crashes",
  },
  {
    key: "arrests",
    label: "Traffic enforcement arrests",
    short: "Arrests",
    ink: "var(--color-accent-800)",
    dash: "dashed",
    strokeWidth: 1.5,
    badgeText: "Shown for comparison only",
    badgeTone: "outline",
    dashNote: "a different dataset, shown alongside",
    note: "Five traffic offence categories, including both spellings of the impaired-driving charge. Shown next to the crash numbers so you can see how they move together — this page does not claim enforcement caused any change in deaths or injuries.",
    dataset: "NYPD Arrests, historic (8h9b-rp9u)",
    aggregate: "count(*) across five offence categories",
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
  if (baseYear === targetYear) return `starting year (${baseYear})`;
  const baseVal = rawValueForYear(key, baseYear, data);
  const targetVal = rawValueForYear(key, targetYear, data);
  if (baseVal === null || targetVal === null) return "no data to compare";
  const change = computeChange(
    [
      { year: baseYear, value: baseVal },
      { year: targetYear, value: targetVal },
    ],
    "value",
  );
  if (!change) return "no data to compare";
  return `${formatPercentChange(change.percentChange)} since ${baseYear}`;
}

export const fmt = (n: number | null) =>
  n === null ? "—" : n.toLocaleString();

// The one-line takeaway, shared by the Timeline and Integrity audit
// inspector panels — computed from the full citywide injury/fatal and deaths
// rows arrays (rows[0]/rows[last], via computeChange), never a copy of the
// mockup's fixed "-18.2%" wording.
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
    return "Injury and fatal crashes and deaths are both loaded live — see the table below for the year-by-year numbers.";
  }

  return `Injury and fatal crashes changed ${formatPercentChange(repairedChange.percentChange)} between ${repairedChange.startYear} and ${repairedChange.endYear}, while deaths changed ${formatPercentChange(deathsChange.percentChange)}. The much larger drop in total reported crashes reflects the reporting change — see the data quality notes.`;
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
        ? `${s.badgeText} · ${verifiedYearCount(s.key, data)} of ${YEARS.length} years of data`
        : s.badgeText,
    badgeTone: s.badgeTone,
    delta: deltaLabel(s.key, firstYear, lastYear, data),
    note: s.note,
  }));
}
