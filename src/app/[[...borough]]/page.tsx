// Task 1 walking skeleton (deaths per year) plus Task 3's independent
// injuries series (FR-2), the collisions series (FR-3, complete — chart half
// plus data half), and FR-12's repaired (casualty-filtered) collisions
// series — the corrected number the raw collisions series cannot provide.
// All four metrics are fetched in parallel (Promise.all — NFR-1) and
// rendered as fully independent branches: one metric erroring must never
// suppress or alter another's render. Injuries and repaired collisions have
// no chart — only deaths and collisions do, via two independently-scaled
// small-multiple instantiations of YearlyLineChart (SPEC.md, "Close FR-3's
// remaining chart half"; see that component's file header for why a shared
// axis is rejected; FR-12's SPEC names a chart overlay as optional future
// work, not owed by this task). The accessible tables (NFR-3) and the FR-8
// query disclosures are built by the shared MetricSection component
// (extracted per the page.tsx decomposition SPEC, 2026-08-06); this file
// composes the five MetricSection calls plus the three chart sibling mounts,
// which stay here rather than inside MetricSection (see that component's
// file header).
//
// FR-5 addition (SPEC.md, "traffic-enforcement arrest counts per year"): a
// fifth, independently-scaled small-multiples panel (chart + table), sourced
// from src/lib/arrests.ts — a deliberately self-contained sibling module,
// not a socrata.ts caller (see that file's header). No inline note: the
// correlation-only framing this series needs already lives in Caveats,
// page-wide (SPEC.md Intellectual Control point 5).
//
// NFR-1 addition (SPEC.md, "prerendered/CDN-cacheable borough routes"):
// moved from src/app/page.tsx (a searchParams-based page, which opted the
// whole route out of static rendering — every response was a cache MISS) to
// this optional catch-all route segment. The borough now arrives as a route
// param (an array of path segments) rather than a query string, enumerated
// at build time by generateStaticParams below so all six variants
// (citywide + five boroughs) become static HTML on the CDN. A
// `params.borough` array of length other than 1 — the root of the catch-all
// ([]/undefined) or a defensive multi-segment path a misconfigured link
// could produce — is treated as "no borough" (citywide) rather than reading
// `[0]` blindly; `dynamicParams = false` 404s any path outside the
// enumerated six before this code ever runs, but the array-length guard
// keeps page.tsx correct even if invoked directly. Case-folding and code
// validation for whichever single segment survives that guard stay owned by
// src/lib/boroughs.ts's `parseBoroughParam`, unmodified (this task's Query
// section keeps that file out of scope).

import { BoroughPicker } from "../../components/BoroughPicker";
import { CachedDataBanner } from "../../components/CachedDataBanner";
import { Caveats } from "../../components/Caveats";
import { CoverageWarning } from "../../components/CoverageWarning";
import { KPIRow } from "../../components/KPIRow";
import { MetricSection } from "../../components/MetricSection";
import { YearlyLineChart } from "../../components/YearlyLineChart";
import { ARRESTS_SOQL, fetchArrestsPerYear } from "../../lib/arrests";
import { fetchCoverageData } from "../../lib/arrestsCoverage";
import { BOROUGH_CODES, BOROUGHS, parseBoroughParam } from "../../lib/boroughs";
import { COLLISIONS_SOQL, fetchCollisionsPerYear } from "../../lib/collisions";
import { DEATHS_SOQL, fetchDeathsPerYear } from "../../lib/deaths";
import { withFallback } from "../../lib/fallback";
import deathsFixtureData from "../../lib/fixtures/deaths-fallback.json";
import { INJURIES_SOQL, fetchInjuriesPerYear } from "../../lib/injuries";
import {
  REPAIRED_COLLISIONS_SOQL,
  fetchRepairedCollisionsPerYear,
} from "../../lib/repairedCollisions";
import styles from "../page.module.css";

// FR-9: the one-sentence forward pointer appended to both existing inline
// notes below, closing the deferred "forward reference to nothing" decision
// named in the FR-3 data-half SPEC. Defined once and appended via
// concatenation to both notes, not duplicated as two separately-typed
// strings (ADR 0001's discipline).
const SEE_CAVEATS_POINTER =
  " See Caveats, below, for the two policy dates and other limits on this figure.";

// FR-3 / NFR-5: the collisions series' caveat is shared verbatim between its
// chart and its table so the two renderings cannot drift apart (ADR 0001).
const COLLISIONS_REPORTING_NOTE =
  "This series is affected by a 2020 NYPD reporting-policy change that reduced how many " +
  "minor collisions are recorded; it is not evidence of a comparable drop in real collisions." +
  SEE_CAVEATS_POINTER;

// FR-12: the corrected series — affirmative framing, not another caveat.
// Ties the "trust this one" claim to the same documented policy mechanism
// named above rather than asserting it independently (NFR-5).
const REPAIRED_COLLISIONS_NOTE =
  "This series counts only collisions with a recorded injury or death — records that still " +
  "required an officer response after the 2020 policy change, unlike the property-damage-only " +
  "collisions the raw count above stopped capturing. It tracks close to the injuries trend and " +
  "is the more reliable figure for judging whether collisions actually declined." +
  SEE_CAVEATS_POINTER;

// NFR-1: the closed, six-member set (citywide + five boroughs) enumerated at
// build time so every variant is prerendered and CDN-cacheable. Mirrors
// SPEC.md's Intellectual Control: a closed filter domain is the exact case
// generateStaticParams is for, versus the project-wide `cacheComponents`
// change this SPEC declines.
export function generateStaticParams() {
  return [
    { borough: [] },
    ...BOROUGH_CODES.map((code) => ({ borough: [code] })),
  ];
}

// Only the six enumerated paths above are ever served; every other path
// (unknown code, lowercase, multi-segment) 404s here rather than falling
// back to citywide (Edge Cases 1-3).
export const dynamicParams = false;

// Matches the Socrata Data Cache TTL in socrata.ts so the prerendered HTML
// and the upstream aggregate age on the same clock.
export const revalidate = 86400;

export default async function Home({
  params,
}: {
  params: Promise<{ borough?: string[] }> | { borough?: string[] };
}) {
  const resolvedParams = await params;
  const segments = resolvedParams.borough;
  const singleSegment = segments?.length === 1 ? segments[0] : undefined;
  const boroughParam = parseBoroughParam(singleSegment);

  const activeCode =
    boroughParam.status === "ok" ? boroughParam.code : undefined;

  const [
    rawDeathsResult,
    injuriesResult,
    collisionsResult,
    repairedResult,
    arrestsResult,
    coverageResult,
  ] = await Promise.all([
    fetchDeathsPerYear(activeCode),
    fetchInjuriesPerYear(activeCode),
    fetchCollisionsPerYear(activeCode),
    fetchRepairedCollisionsPerYear(activeCode),
    fetchArrestsPerYear(activeCode),
    fetchCoverageData(),
  ]);

  // PRD §7 risk mitigation: substitute the committed fixture only when the
  // deaths fetch failed upstream (never on a contract violation or an empty
  // result — withFallback's own decline logic, unchanged here) and only for
  // the citywide view (activeCode === undefined) — a borough-filtered
  // request still shows the existing FR-10 error state unchanged. See
  // SPEC.md's Intellectual Control point 3.
  const result = withFallback(
    rawDeathsResult,
    activeCode === undefined ? deathsFixtureData : undefined,
  );

  const deaths2025 =
    result.status === "ok"
      ? (result.rows.find((y) => y.year === 2025)?.deaths ?? 0)
      : 0;
  const collisions2025 =
    collisionsResult.status === "ok"
      ? (collisionsResult.rows.find((y) => y.year === 2025)?.collisions ?? 0)
      : 0;
  const arrests2025 =
    arrestsResult.status === "ok"
      ? (arrestsResult.rows.find((y) => y.year === 2025)?.arrests ?? 0)
      : 0;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            NYC Traffic Safety Data
            {boroughParam.status === "ok"
              ? ` (${BOROUGHS[boroughParam.code].label})`
              : ""}
          </h1>
          <p className={styles.intro}>
            Reported collisions, injuries, and deaths move very differently over
            this period; collisions are the most discretionary figure (an
            officer decides whether to file), injuries typically involve an
            ambulance or hospital record, and deaths are the least
            discretionary, the medical examiner&apos;s count.
          </p>
        </div>
        <div className={styles.controls}>
          <BoroughPicker currentBorough={activeCode ?? ""} />
          {boroughParam.status === "invalid" && (
            <p role="alert" className={styles.error}>
              Invalid borough parameter: &quot;{boroughParam.received}&quot;.
              Displaying citywide data.
            </p>
          )}
        </div>
      </header>

      <KPIRow
        deaths={deaths2025}
        collisions={collisions2025}
        arrests={arrests2025}
      />

      <section className={styles.storySection}>
        <h2 className={styles.sectionTitle}>The Human Toll</h2>
        <div className={styles.dashboard}>
          <div className={styles.card}>
            {result.status === "ok" && result.source === "cache" && (
              <CachedDataBanner asOf={result.asOf} />
            )}
            {result.status === "ok" && (
              <YearlyLineChart
                rows={result.rows}
                fieldAlias="deaths"
                seriesLabel="Deaths"
                strokeStyle="solid"
                colorSlot={1}
                ariaLabel="Line chart of NYC traffic deaths per year from 2018 to 2025."
                captionText="NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the table below."
              />
            )}
            <MetricSection
              fieldAlias="deaths"
              columnLabel="Deaths"
              captionText="NYC traffic deaths per year, 2018–2025"
              result={result}
              soql={DEATHS_SOQL}
            />
          </div>

          <div className={styles.card}>
            <MetricSection
              fieldAlias="injuries"
              columnLabel="Injuries"
              captionText="NYC traffic injuries per year, 2018–2025"
              result={injuriesResult}
              soql={INJURIES_SOQL}
            />
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <h2 className={styles.sectionTitle}>
          Data Integrity &amp; Policy Impact
        </h2>
        <div className={styles.fullWidthCard}>
          <CoverageWarning coverageResult={coverageResult} />
        </div>
        <div className={styles.dashboard}>
          <div className={styles.card}>
            {collisionsResult.status === "ok" && (
              <YearlyLineChart
                rows={collisionsResult.rows}
                fieldAlias="collisions"
                seriesLabel="Collisions"
                strokeStyle="dashed"
                colorSlot={2}
                ariaLabel="Line chart of NYC recorded collisions per year from 2018 to 2025."
                captionText="NYC recorded collisions per year, 2018–2025. Every plotted figure is listed in the table below."
                note={COLLISIONS_REPORTING_NOTE}
              />
            )}
            <MetricSection
              fieldAlias="collisions"
              columnLabel="Collisions"
              captionText="NYC recorded collisions per year, 2018–2025"
              result={collisionsResult}
              soql={COLLISIONS_SOQL}
              note={COLLISIONS_REPORTING_NOTE}
            />
          </div>

          <div className={styles.card}>
            <MetricSection
              fieldAlias="repaired"
              columnLabel="Repaired collisions"
              captionText="NYC collisions with a recorded injury or death per year, 2018–2025"
              result={repairedResult}
              soql={REPAIRED_COLLISIONS_SOQL}
              note={REPAIRED_COLLISIONS_NOTE}
            />
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <h2 className={styles.sectionTitle}>Enforcement</h2>
        <div className={styles.dashboard}>
          <div className={styles.card}>
            {arrestsResult.status === "ok" && (
              <YearlyLineChart
                rows={arrestsResult.rows}
                fieldAlias="arrests"
                seriesLabel="Arrests"
                strokeStyle="solid"
                colorSlot={1}
                ariaLabel="Line chart of NYC traffic-enforcement arrest counts per year from 2018 to 2025."
                captionText="NYC traffic-enforcement arrests per year, 2018–2025. Every plotted figure is listed in the table below."
              />
            )}
            <MetricSection
              fieldAlias="arrests"
              columnLabel="Arrests"
              captionText="NYC traffic-enforcement arrests per year, 2018–2025 (five offense categories)"
              result={arrestsResult}
              soql={ARRESTS_SOQL}
            />
          </div>
        </div>
      </section>

      <section className={styles.fullWidth}>
        <Caveats />
      </section>
    </main>
  );
}
