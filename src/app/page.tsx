// Task 1 walking skeleton (deaths per year) plus Task 3's independent
// injuries series (FR-2) and the collisions series (FR-3, now complete —
// chart half plus data half). All three metrics are fetched in parallel
// (Promise.all — NFR-1) and rendered as fully independent branches: one
// metric erroring must never suppress or alter another's render. Injuries
// has no chart — only deaths and collisions do, via two independently-scaled
// small-multiple instantiations of YearlyLineChart (SPEC.md, "Close FR-3's
// remaining chart half"; see that component's file header for why a shared
// axis is rejected). The accessible tables (NFR-3) and the FR-8 query
// disclosures are built by the shared MetricSection component (extracted per
// the page.tsx decomposition SPEC, 2026-08-06); this file composes the three
// MetricSection calls plus the two chart sibling mounts, which stay here
// rather than inside MetricSection (see that component's file header).

import { MetricSection } from "../components/MetricSection";
import { YearlyLineChart } from "../components/YearlyLineChart";
import { COLLISIONS_SOQL, fetchCollisionsPerYear } from "../lib/collisions";
import { DEATHS_SOQL, fetchDeathsPerYear } from "../lib/deaths";
import { INJURIES_SOQL, fetchInjuriesPerYear } from "../lib/injuries";

// FR-3 / NFR-5: the collisions series' caveat is shared verbatim between its
// chart and its table so the two renderings cannot drift apart (ADR 0001).
const COLLISIONS_REPORTING_NOTE =
  "This series is affected by a 2020 NYPD reporting-policy change that reduced how many " +
  "minor collisions are recorded; it is not evidence of a comparable drop in real collisions.";

export default async function Home() {
  const [result, injuriesResult, collisionsResult] = await Promise.all([
    fetchDeathsPerYear(),
    fetchInjuriesPerYear(),
    fetchCollisionsPerYear(),
  ]);

  return (
    <main>
      <h1>NYC traffic deaths per year, 2018–2025</h1>
      <p>
        Reported collisions, injuries, and deaths move very differently over
        this period; collisions are the most discretionary figure (an officer
        decides whether to file), injuries typically involve an ambulance or
        hospital record, and deaths are the least discretionary, the medical
        examiner&apos;s count.
      </p>

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

      <MetricSection
        fieldAlias="injuries"
        columnLabel="Injuries"
        captionText="NYC traffic injuries per year, 2018–2025"
        result={injuriesResult}
        soql={INJURIES_SOQL}
      />

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
    </main>
  );
}
