"use client";

// The Integrity audit view of the MVCC Workspace (implements "MVCC
// Workspace.dc.html"'s integrity screen). Every number here — the coverage
// warning, the ladder-of-discretion deltas, the tier table, the implied-
// lethality multiplier, the Staten Island pilot figures, the coverage-by-
// year table, and the inspector summary — is computed from the real
// `data`/`coverage`/`siPilot` props this component receives (fetched
// server-side in src/app/(workspace)/integrity/page.tsx), never a literal
// (CLAUDE.md Rule 1/NFR-4). The mockup's own inline Staten Island prose
// numbers and its "coverage held flat across the SI boundary" claim were
// design-tool placeholders, not verified figures, and are not reproduced
// here — see siPilot's real stats instead, and the borough-coverage-at-SI-
// boundary claim is dropped entirely: no lib function computes a per-
// borough, per-month coverage rate, so asserting one would be inventing a
// number this workspace cannot verify.

import { useMemo } from "react";
import {
  SERIES_CONFIG,
  rawValueForYear,
  allSeriesInspectorItems,
  defensibleLine,
  fmt,
  YEARS,
  type SeriesKey,
  type SeriesData,
} from "@/lib/seriesConfig";
import { computeChange, formatPercentChange } from "@/lib/percentChange";
import { useInspectorSync } from "@/context/WorkspaceInspectorContext";

import workspace from "@/app/(workspace)/workspace.module.css";
import styles from "./IntegrityAudit.module.css";

export type CoverageYearRow = {
  year: number;
  total: number;
  populated: number;
  coverageRatePercent: number;
};

export type CoverageProp =
  | {
      status: "ok";
      yearly: CoverageYearRow[];
      windowUnpopulatedSharePercent: number;
    }
  | { status: "unavailable" };

export type SIPilotProp =
  | {
      status: "ok";
      avg2018Monthly: number;
      avgMayDec2019: number;
      year2018Total: number;
      april2019: number | null;
    }
  | { status: "unavailable"; reason: string };

type Props = {
  data: SeriesData;
  coverage: CoverageProp;
  siPilot: SIPilotProp;
};

const LADDER_KEYS: { key: SeriesKey; note: string }[] = [
  {
    key: "collisions",
    note: "An officer decides whether to file. Broken by policy in 2019–20.",
  },
  {
    key: "injuries",
    note: "Ambulance or hospital record. Largely intact across the break.",
  },
  {
    key: "deaths",
    note: "Medical examiner, mandatory. The floor to measure against.",
  },
];

const TIER_KEYS: { key: SeriesKey; label: string; reading: string }[] = [
  {
    key: "collisions",
    label: "Raw collisions",
    reading: "Not quotable as a safety trend.",
  },
  {
    key: "repaired",
    label: "Casualty-filtered",
    reading: "Tracks injuries. The defensible figure.",
  },
  {
    key: "pdo",
    label: "Property-damage-only",
    reading: "The tier NYPD stopped dispatching to.",
  },
];

const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[YEARS.length - 1];

function seriesFor(key: SeriesKey) {
  return SERIES_CONFIG.find((s) => s.key === key)!;
}

// Unrounded percent change for any series (including the derived "pdo") from
// FIRST_YEAR to LAST_YEAR, via a synthetic 2-point rows array so this works
// uniformly across seriesConfig's per-series Row<K> shapes without fighting
// generic key/rows-union type inference.
function pctChangeOverWindow(key: SeriesKey, data: SeriesData): number | null {
  const start = rawValueForYear(key, FIRST_YEAR, data);
  const end = rawValueForYear(key, LAST_YEAR, data);
  if (start === null || end === null) return null;
  const change = computeChange(
    [
      { year: FIRST_YEAR, v: start },
      { year: LAST_YEAR, v: end },
    ],
    "v",
  );
  return change?.percentChange ?? null;
}

export function IntegrityAudit({ data, coverage, siPilot }: Props) {
  // Memoized on `data` alone (this component has no interactive state of
  // its own — everything is derived from props): useInspectorSync's
  // useContext call makes this a context consumer, so an unmemoized object
  // here would re-fire the sync effect every render the sync itself causes
  // — an infinite loop (the exact bug fixed in UnifiedTimeline.tsx).
  const panelData = useMemo(
    () => ({
      kicker: "Window",
      title: `${FIRST_YEAR}–${String(LAST_YEAR).slice(2)}`,
      sub: "Citywide figures, all six series, each traceable to the query or derivation behind it.",
      items: allSeriesInspectorItems(data),
      defensible: defensibleLine(data),
    }),
    [data],
  );

  useInspectorSync(panelData);

  const firstCoverage =
    coverage.status === "ok" ? coverage.yearly[0] : undefined;
  const lastCoverage =
    coverage.status === "ok"
      ? coverage.yearly[coverage.yearly.length - 1]
      : undefined;

  const implied = (() => {
    const deaths2018 = rawValueForYear("deaths", FIRST_YEAR, data);
    const deaths2025 = rawValueForYear("deaths", LAST_YEAR, data);
    const collisions2018 = rawValueForYear("collisions", FIRST_YEAR, data);
    const collisions2025 = rawValueForYear("collisions", LAST_YEAR, data);
    if (
      deaths2018 === null ||
      deaths2025 === null ||
      !collisions2018 ||
      !collisions2025
    ) {
      return null;
    }
    const lethality2018 = deaths2018 / collisions2018;
    const lethality2025 = deaths2025 / collisions2025;
    if (lethality2018 === 0) return null;
    return lethality2025 / lethality2018;
  })();

  return (
    <div className={styles.container}>
      <div role="status" className={styles.warning}>
        <div className={styles.warningKicker}>
          Coverage warning · qualifies every borough figure
        </div>
        {coverage.status === "ok" && firstCoverage && lastCoverage ? (
          <>
            <p className={styles.warningLead}>
              Recorded collisions data does not identify a NYC borough for{" "}
              {coverage.windowUnpopulatedSharePercent.toFixed(1)}% of rows
              across {FIRST_YEAR}–{LAST_YEAR}, and coverage is not constant:{" "}
              {firstCoverage.coverageRatePercent.toFixed(1)}% in{" "}
              {firstCoverage.year} against{" "}
              {lastCoverage.coverageRatePercent.toFixed(1)}% in{" "}
              {lastCoverage.year}.
            </p>
            <p className={styles.warningNote}>
              These coverage rates describe dataset record-keeping completeness,
              not enforcement activity, and cannot be compared between datasets.
            </p>
          </>
        ) : (
          <p className={styles.warningLead}>
            Coverage figures could not be fetched live for this render — see the
            Series registry for the query and try again.
          </p>
        )}
      </div>

      <section>
        <h2>The gradient of discretion</h2>
        <p className={styles.sectionIntro}>
          Ordered by how much room an officer has not to file. The further left,
          the further the recorded series can drift from the event it claims to
          count.
        </p>
        <div className={styles.ladder}>
          {LADDER_KEYS.map(({ key, note }) => {
            const s = seriesFor(key);
            const change = pctChangeOverWindow(key, data);
            return (
              <div key={key} className={styles.ladderItem}>
                <div className={styles.ladderDelta} style={{ color: s.ink }}>
                  {change !== null ? formatPercentChange(change) : "—"}
                </div>
                <div className={styles.ladderLabel}>{s.label}</div>
                <div className={styles.ladderNote}>{note}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Where the artifact lives</h2>
        <p className={styles.sectionIntro}>
          Splitting the raw count into its casualty and property-damage-only
          tiers puts the entire drop in the tier that stopped being dispatched
          to. The casualty-filtered repair is the figure to defend.
        </p>
        <div className={styles.tableWrapper}>
          <table className={workspace.table}>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">{FIRST_YEAR}</th>
                <th scope="col">{LAST_YEAR}</th>
                <th scope="col">Change</th>
                <th scope="col">Reading</th>
              </tr>
            </thead>
            <tbody>
              {TIER_KEYS.map(({ key, label, reading }) => {
                const s = seriesFor(key);
                const start = rawValueForYear(key, FIRST_YEAR, data);
                const end = rawValueForYear(key, LAST_YEAR, data);
                const change = pctChangeOverWindow(key, data);
                return (
                  <tr key={key}>
                    <th scope="row" className={styles.tierLabel}>
                      {label}
                    </th>
                    <td className={styles.numCell}>{fmt(start)}</td>
                    <td className={styles.numCell}>{fmt(end)}</td>
                    <td className={styles.numCell} style={{ color: s.ink }}>
                      {change !== null ? formatPercentChange(change) : "—"}
                    </td>
                    <td className={styles.readingCell}>{reading}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.impliedNote}>
          {implied !== null
            ? `Implied lethality rises ${implied.toFixed(2)}× across the window on the raw denominator alone.`
            : "Implied lethality (deaths ÷ raw collisions) could not be computed for this render."}{" "}
          The denominator collapsed; the numerator barely moved.
        </p>
      </section>

      <section>
        <h2>The Staten Island natural experiment</h2>
        {siPilot.status === "ok" ? (
          <>
            <p className={styles.sectionIntro}>
              The pilot began 2019-03-18, before any pandemic effect. Monthly
              recorded collisions ran about {Math.round(siPilot.avg2018Monthly)}{" "}
              on the {FIRST_YEAR} average
              {siPilot.april2019 !== null
                ? `, and ${siPilot.april2019.toLocaleString()} in the first full month after (April 2019)`
                : ""}
              . Annual {FIRST_YEAR}: {siPilot.year2018Total.toLocaleString()}.
              Post-pilot monthly average (May–Dec 2019):{" "}
              {Math.round(siPilot.avgMayDec2019)}.
            </p>
            <p className={styles.sectionIntro}>
              Citywide, the same policy took effect 2020-04-06. That is the
              documented cause of the raw collision decline, stated as cause.
              Nothing here attributes any change in deaths or injuries to
              enforcement activity. This workspace does not verify borough-level
              coverage at the Staten Island boundary — that specific claim
              isn&apos;t made here.
            </p>
          </>
        ) : (
          <p className={styles.sectionIntro}>
            The Staten Island pilot data could not be fetched live for this
            render ({siPilot.reason}) — see the Series registry for the query
            and try again.
          </p>
        )}
      </section>

      <section>
        <h2>Coverage by year</h2>
        <div className={styles.tableWrapper}>
          <table className={workspace.table}>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Total rows</th>
                <th scope="col">Borough populated</th>
                <th scope="col">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {coverage.status === "ok" ? (
                coverage.yearly.map((c) => (
                  <tr key={c.year}>
                    <th scope="row" className={styles.tierLabel}>
                      {c.year}
                    </th>
                    <td className={styles.numCell}>
                      {c.total.toLocaleString()}
                    </td>
                    <td className={styles.numCell}>
                      {c.populated.toLocaleString()}
                    </td>
                    <td className={styles.numCell}>
                      {c.coverageRatePercent.toFixed(1)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    Coverage data unavailable for this render.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
