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

import { UnifiedTimeline } from "../../components/UnifiedTimeline";
import { fetchArrestsPerYear } from "../../lib/arrests";
import { BOROUGH_CODES, BOROUGHS, parseBoroughParam } from "../../lib/boroughs";
import { fetchCollisionsPerYear } from "../../lib/collisions";
import { fetchDeathsPerYear } from "../../lib/deaths";
import { withFallback } from "../../lib/fallback";
import deathsFixtureData from "../../lib/fixtures/deaths-fallback.json";
import { fetchInjuriesPerYear } from "../../lib/injuries";
import { fetchRepairedCollisionsPerYear } from "../../lib/repairedCollisions";

import styles from "../page.module.css";

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
  ] = await Promise.all([
    fetchDeathsPerYear(activeCode),
    fetchInjuriesPerYear(activeCode),
    fetchCollisionsPerYear(activeCode),
    fetchRepairedCollisionsPerYear(activeCode),
    fetchArrestsPerYear(activeCode),
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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            One timeline, five series, one honest scale
          </h1>
          <p className={styles.intro}>
            {boroughParam.status === "ok"
              ? ` (${BOROUGHS[boroughParam.code].label}) `
              : ""}
            Reported collisions, injuries, and deaths move very differently over
            this period. By indexing them to 2018 baselines, we can see how they
            diverge across the policy changes of 2019-2020.
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

      {result.status === "ok" && result.source === "cache" && (
        <div style={{ marginBottom: "1rem" }}>
          <CachedDataBanner asOf={result.asOf} />
        </div>
      )}

      <UnifiedTimeline
        data={{
          deaths: result,
          injuries: injuriesResult,
          collisions: collisionsResult,
          repaired: repairedResult,
          arrests: arrestsResult,
        }}
      />
    </main>
  );
}
