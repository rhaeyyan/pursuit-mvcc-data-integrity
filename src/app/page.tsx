// Task 1 walking skeleton (deaths per year) plus Task 3's independent
// injuries series (FR-2) and the collisions series (FR-3, data half only).
// All three metrics are fetched in parallel (Promise.all — NFR-1) and
// rendered as fully independent branches: one metric erroring must never
// suppress or alter another's render. No chart for injuries or collisions —
// DeathsChart.tsx is untouched. The accessible tables (NFR-3) and the FR-8
// query disclosures are built by the shared MetricSection component
// (extracted per the page.tsx decomposition SPEC, 2026-08-06); this file
// composes the three calls plus the deaths-chart sibling mount, which stays
// here rather than inside MetricSection (see that component's file header).

import { DeathsChart } from "../components/DeathsChart";
import { MetricSection } from "../components/MetricSection";
import { COLLISIONS_SOQL, fetchCollisionsPerYear } from "../lib/collisions";
import { DEATHS_SOQL, fetchDeathsPerYear } from "../lib/deaths";
import { INJURIES_SOQL, fetchInjuriesPerYear } from "../lib/injuries";

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

      {result.status === "ok" && <DeathsChart rows={result.rows} />}
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

      <MetricSection
        fieldAlias="collisions"
        columnLabel="Collisions"
        captionText="NYC recorded collisions per year, 2018–2025"
        result={collisionsResult}
        soql={COLLISIONS_SOQL}
        note="This series is affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions."
      />
    </main>
  );
}
