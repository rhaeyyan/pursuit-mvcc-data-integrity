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
  title: "Series Registry - MVCC Data",
};

const SOQL_BY_KEY: Record<string, string> = {
  deaths: DEATHS_SOQL,
  injuries: INJURIES_SOQL,
  collisions: COLLISIONS_SOQL,
  repaired: REPAIRED_COLLISIONS_SOQL,
  arrests: ARRESTS_SOQL,
  pdo: "Derived client-side: collisions − repaired, per year. No query of its own.",
};

function buildRegistry(data: SeriesData): RegistryEntry[] {
  const firstYear = YEARS[0];
  const lastYear = YEARS[YEARS.length - 1];

  return SERIES_CONFIG.map((s) => {
    const start = rawValueForYear(s.key, firstYear, data);
    const end = rawValueForYear(s.key, lastYear, data);
    const coverage =
      s.key === "pdo"
        ? "Derived from two verified series"
        : `${verifiedYearCount(s.key, data)} of ${YEARS.length} years verified`;

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
        dateline="Citywide · window 2018–2025 · live aggregate"
        caveat="Every query is a frozen contract"
        headline="Six series, one contract"
        standfirst="Each series with its aggregate, its trust grade and the frozen query behind it, so any figure on the timeline can be traced back to the clause that produced it."
      />
      <SeriesRegistry
        registry={buildRegistry(data)}
        inspectorItems={allSeriesInspectorItems(data)}
        defensible={defensibleLine(data)}
      />
    </>
  );
}
