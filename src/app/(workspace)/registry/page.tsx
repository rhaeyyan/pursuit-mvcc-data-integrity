import {
  SeriesRegistry,
  type RegistryEntry,
} from "@/components/SeriesRegistry";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

import { fetchArrestsPerYear, ARRESTS_SOQL } from "@/lib/arrests";
import { fetchCollisionsPerYear, COLLISIONS_SOQL } from "@/lib/collisions";
import { fetchDeathsPerYear, DEATHS_SOQL } from "@/lib/deaths";
import { fetchInjuriesPerYear, INJURIES_SOQL } from "@/lib/injuries";
import {
  fetchRepairedCollisionsPerYear,
  REPAIRED_COLLISIONS_SOQL,
} from "@/lib/repairedCollisions";
import {
  SERIES_CONFIG,
  rawValueForYear,
  verifiedYearCount,
  allSeriesInspectorItems,
  defensibleLine,
  fmt,
  YEARS,
  type SeriesData,
} from "@/lib/seriesConfig";

export const metadata = {
  title: "Where every number comes from - MVCC Data",
};

const SOQL_BY_KEY: Record<string, string> = {
  deaths: DEATHS_SOQL,
  injuries: INJURIES_SOQL,
  collisions: COLLISIONS_SOQL,
  repaired: REPAIRED_COLLISIONS_SOQL,
  arrests: ARRESTS_SOQL,
  pdo: "No query of its own. For each year we take all reported crashes and subtract the injury and fatal ones — the difference is what's left.",
};

function buildRegistry(data: SeriesData): RegistryEntry[] {
  const firstYear = YEARS[0];
  const lastYear = YEARS[YEARS.length - 1];

  return SERIES_CONFIG.map((s) => {
    const start = rawValueForYear(s.key, firstYear, data);
    const end = rawValueForYear(s.key, lastYear, data);
    const coverage =
      s.key === "pdo"
        ? "Worked out from two other lines"
        : `${verifiedYearCount(s.key, data)} of ${YEARS.length} years`;

    return {
      id: s.key,
      label: s.label,
      ink: s.ink,
      dash: s.dash,
      badgeText: s.badgeText,
      badgeTone: s.badgeTone,
      note: s.note,
      dataset: s.dataset,
      aggregate: s.aggregate,
      span: `${fmt(start)} → ${fmt(end)}`,
      coverage,
      soql: SOQL_BY_KEY[s.key],
    };
  });
}

export default async function RegistryPage() {
  const [
    deathsResult,
    injuriesResult,
    collisionsResult,
    repairedResult,
    arrestsResult,
  ] = await Promise.all([
    fetchDeathsPerYear(),
    fetchInjuriesPerYear(),
    fetchCollisionsPerYear(),
    fetchRepairedCollisionsPerYear(),
    fetchArrestsPerYear(),
  ]);

  const data: SeriesData = {
    deaths: deathsResult,
    injuries: injuriesResult,
    collisions: collisionsResult,
    repaired: repairedResult,
    arrests: arrestsResult,
  };

  return (
    <>
      <WorkspaceHeader
        dateline="Citywide · 2018–2025 · loaded live"
        caveat="Every query shown in full"
        headline="Where every number comes from"
        standfirst="Six lines on one chart, and the exact query behind each. Nothing here is typed in by hand — if you want to check a number, the request we send to NYC Open Data is right there to copy."
      />
      <SeriesRegistry
        registry={buildRegistry(data)}
        inspectorItems={allSeriesInspectorItems(data)}
        defensible={defensibleLine(data)}
      />
    </>
  );
}
