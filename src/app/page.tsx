// Walking-skeleton Task 1: one metric (deaths per year, 2018-2025), rendered
// from a live server-side SoQL aggregation via src/lib/deaths.ts. No chart,
// no CSS, no client component — see SPEC.md for scope. The accessible table
// (NFR-3) and the FR-8 query disclosure are built here; Magnolia's follow-on
// SPEC mounts the chart over this same table.

import { DEATHS_SOQL, fetchDeathsPerYear } from "../lib/deaths";

export default async function Home() {
  const result = await fetchDeathsPerYear();

  return (
    <main>
      <h1>NYC traffic deaths per year, 2018–2025</h1>
      <p>
        Reported collisions and reported deaths move very differently over this
        period; this page tracks deaths, the yearly figure least dependent on
        whether an officer chooses to file a report.
      </p>

      {result.status === "ok" && (
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
        <summary>SoQL query</summary>
        <pre>
          <code>{DEATHS_SOQL}</code>
        </pre>
      </details>
    </main>
  );
}
