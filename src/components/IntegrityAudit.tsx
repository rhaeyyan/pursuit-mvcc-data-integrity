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
    note: "An officer decides whether to write it up — and after 2020, often didn't have to.",
  },
  {
    key: "injuries",
    note: "An ambulance or hospital usually creates a record, so these kept being counted.",
  },
  {
    key: "deaths",
    note: "Investigated by the medical examiner every time. The most reliable number here.",
  },
];

const TIER_KEYS: { key: SeriesKey; label: string; reading: string }[] = [
  {
    key: "collisions",
    label: "All reported crashes",
    reading: "Don't quote this as a safety trend.",
  },
  {
    key: "repaired",
    label: "Injury & fatal crashes",
    reading: "Moves with injuries. Quote this one.",
  },
  {
    key: "pdo",
    label: "Minor crashes, no injuries",
    reading: "The ones police stopped being sent to.",
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
      kicker: "Years covered",
      title: `${FIRST_YEAR}–${String(LAST_YEAR).slice(2)}`,
      sub: "Citywide totals for all six lines, each one traceable back to the query behind it.",
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
          Read this before trusting any borough number
        </div>
        {coverage.status === "ok" && firstCoverage && lastCoverage ? (
          <>
            <p className={styles.warningLead}>
              {coverage.windowUnpopulatedSharePercent.toFixed(1)}% of crash
              records between {FIRST_YEAR} and {LAST_YEAR} don&apos;t say which
              borough they happened in. And the gap keeps shrinking:{" "}
              {firstCoverage.coverageRatePercent.toFixed(1)}% of records had a
              borough in {firstCoverage.year}, against{" "}
              {lastCoverage.coverageRatePercent.toFixed(1)}% in{" "}
              {lastCoverage.year}.
            </p>
            <p className={styles.warningNote}>
              That&apos;s a change in how carefully records are filled in, not a
              change in how much policing is happening — and it can&apos;t be
              compared across the two datasets on this page.
            </p>
          </>
        ) : (
          <p className={styles.warningLead}>
            We couldn&apos;t load these figures just now — see the series
            registry for the query behind them, and try again.
          </p>
        )}
      </div>

      <section>
        <h2>Which numbers can you trust?</h2>
        <p className={styles.sectionIntro}>
          It comes down to how much choice someone has about whether to write
          the incident down. The more choice, the further the official count can
          drift from what actually happened on the street.
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
        <h2>Which crashes stopped being counted</h2>
        <p className={styles.sectionIntro}>
          Split the total into crashes where someone was hurt and crashes where
          nobody was, and almost the whole drop sits in the second group — the
          one police stopped being sent to. The injury and fatal count is the
          one that holds up.
        </p>
        <div className={styles.tableWrapper}>
          <table className={workspace.table}>
            <thead>
              <tr>
                <th scope="col">Group</th>
                <th scope="col">{FIRST_YEAR}</th>
                <th scope="col">{LAST_YEAR}</th>
                <th scope="col">Change</th>
                <th scope="col">What to make of it</th>
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
            ? `Do the naive thing — divide deaths by all reported crashes — and NYC streets look ${implied.toFixed(2)}× deadlier per crash than in ${FIRST_YEAR}.`
            : "Dividing deaths by all reported crashes would give a misleading 'deadliness' rate, but we couldn't load the figures to show it."}{" "}
          Nothing got deadlier. The bottom number shrank because fewer crashes
          were written down, while the top number barely moved.
        </p>
      </section>

      <section>
        <h2>Staten Island tried it first</h2>
        {siPilot.status === "ok" ? (
          <>
            <p className={styles.sectionIntro}>
              Staten Island got the new policy a year before everywhere else, on
              18 March 2019 — well before the pandemic, so nothing else muddies
              the picture. Through {FIRST_YEAR} the borough recorded about{" "}
              {Math.round(siPilot.avg2018Monthly)} crashes a month (
              {siPilot.year2018Total.toLocaleString()} for the year)
              {siPilot.april2019 !== null
                ? `. In April 2019, the first full month under the new policy, that dropped to ${siPilot.april2019.toLocaleString()}`
                : ""}
              . Across the rest of 2019 it averaged{" "}
              {Math.round(siPilot.avgMayDec2019)} a month.
            </p>
            <p className={styles.sectionIntro}>
              The rest of the city followed on 6 April 2020. This policy change
              is the documented reason the reported crash count fell — that much
              we can say caused it. What this page does not claim is any link
              between enforcement and deaths or injuries; those are shown side
              by side so you can see how they move together, nothing more. We
              also can&apos;t check whether Staten Island recorded boroughs any
              more carefully after the switch than before, so we don&apos;t
              claim it either way.
            </p>
          </>
        ) : (
          <p className={styles.sectionIntro}>
            We couldn&apos;t load the Staten Island figures just now (
            {siPilot.reason}) — see where every number comes from for the query
            behind them, and try again.
          </p>
        )}
      </section>

      <section>
        <h2>How often the borough is missing</h2>

        {/*
         * SPEC.md [SPEC] — T4. The standing statement of why this product has
         * no borough view. It sits directly above the table that justifies it,
         * so the claim and its evidence are read together.
         *
         * Every figure comes from the `coverage` prop — never a literal, and
         * never recomputed here. Re-deriving the window share from `yearly`
         * would give the mean-of-yearly-rates, which differs from the
         * row-weighted share by ~1.1pp; computing a displayed figure in a
         * component is the same NFR-4 violation as hardcoding one.
         *
         * The `unavailable` branch is numeral-free on purpose. The claim that
         * there is no borough view is always true; only the numbers are
         * conditional. A fallback that dropped the explanation along with the
         * figures would leave the page silent about its own limits — the exact
         * silence this product exists to criticise.
         */}
        {coverage.status === "ok" && firstCoverage && lastCoverage ? (
          <p className={styles.warningNote}>
            This is why there is no borough view anywhere on the site.{" "}
            {coverage.windowUnpopulatedSharePercent.toFixed(1)}% of crash
            records never say which borough they happened in, and the gap
            narrows over time — {firstCoverage.coverageRatePercent.toFixed(1)}%
            of records carried a borough in {firstCoverage.year}, against{" "}
            {lastCoverage.coverageRatePercent.toFixed(1)}% in{" "}
            {lastCoverage.year}. A chart built on that would show record-keeping
            getting better and read as crashes going up. Rather than publish a
            trend we can&apos;t stand behind, we publish the citywide numbers
            and this table.
          </p>
        ) : (
          <p className={styles.warningNote}>
            This is why there is no borough view anywhere on the site. Many
            crash records never say which borough they happened in, and the size
            of that gap changes from year to year. A chart built on it would
            show record-keeping changing and read as crashes changing. Rather
            than publish a trend we can&apos;t stand behind, we publish the
            citywide numbers and this table.
          </p>
        )}

        <div className={styles.tableWrapper}>
          <table className={workspace.table}>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Crash records</th>
                <th scope="col">With a borough</th>
                <th scope="col">Share</th>
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
                    We couldn&apos;t load these figures just now.
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
