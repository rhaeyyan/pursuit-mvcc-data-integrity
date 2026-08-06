// Task 1 walking skeleton (deaths per year) plus Task 3's independent
// injuries series (FR-2) and this SPEC's independent collisions series
// (FR-3, data half only). All three metrics are fetched in parallel
// (Promise.all — NFR-1) and rendered as fully independent branches: one
// metric erroring must never suppress or alter another's render. No chart
// for injuries or collisions — DeathsChart.tsx is untouched, per SPEC.md's
// scope for this task. The accessible tables (NFR-3) and the FR-8 query
// disclosures are built here.

import { DeathsChart } from "../components/DeathsChart";
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

      {result.status === "ok" && (
        <>
          <DeathsChart rows={result.rows} />
          <table>
            <caption>NYC traffic deaths per year, 2018–2025</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Deaths</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.deaths}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {result.status === "empty" && (
        <p role="status">
          Socrata returned no rows for 2018–2025, so no figures could be
          produced.
        </p>
      )}

      {result.status === "error" && (
        <p role="alert">No figures could be produced: {result.reason}</p>
      )}

      <details>
        <summary>SoQL query — deaths</summary>
        <pre>
          <code>{DEATHS_SOQL}</code>
        </pre>
      </details>

      {injuriesResult.status === "ok" && (
        <table>
          <caption>NYC traffic injuries per year, 2018–2025</caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Injuries</th>
            </tr>
          </thead>
          <tbody>
            {injuriesResult.rows.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{row.injuries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {injuriesResult.status === "empty" && (
        <p role="status">
          Socrata returned no rows for 2018–2025, so no figures could be
          produced.
        </p>
      )}

      {injuriesResult.status === "error" && (
        <p role="alert">
          No figures could be produced: {injuriesResult.reason}
        </p>
      )}

      <details>
        <summary>SoQL query — injuries</summary>
        <pre>
          <code>{INJURIES_SOQL}</code>
        </pre>
      </details>

      {collisionsResult.status === "ok" && (
        <>
          <table>
            <caption>NYC recorded collisions per year, 2018–2025</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Collisions</th>
              </tr>
            </thead>
            <tbody>
              {collisionsResult.rows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.collisions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            This series is affected by a 2020 NYPD reporting-policy change that
            reduced how many minor collisions are recorded; it is not evidence
            of a comparable drop in real collisions.
          </p>
        </>
      )}

      {collisionsResult.status === "empty" && (
        <p role="status">
          Socrata returned no rows for 2018–2025, so no figures could be
          produced.
        </p>
      )}

      {collisionsResult.status === "error" && (
        <p role="alert">
          No figures could be produced: {collisionsResult.reason}
        </p>
      )}

      <details>
        <summary>SoQL query — collisions</summary>
        <pre>
          <code>{COLLISIONS_SOQL}</code>
        </pre>
      </details>
    </main>
  );
}
