import React from "react";
import styles from "./SeriesRegistry.module.css";

export function SeriesRegistry() {
  const metrics = [
    {
      name: "Deaths",
      dataset: "h9gi-nx95 (Motor Vehicle Collisions – Crashes)",
      select:
        "date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths",
      where:
        "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'",
    },
    {
      name: "Injuries",
      dataset: "h9gi-nx95 (Motor Vehicle Collisions – Crashes)",
      select:
        "date_extract_y(crash_date) AS year, sum(number_of_persons_injured) AS injuries",
      where:
        "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'",
    },
    {
      name: "Raw Collisions (Includes Minor Crashes)",
      dataset: "h9gi-nx95 (Motor Vehicle Collisions – Crashes)",
      select:
        "date_extract_y(crash_date) AS year, count(collision_id) AS collisions",
      where:
        "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'",
    },
    {
      name: "Repaired Collisions (Injury/Fatal Crashes Only)",
      dataset: "h9gi-nx95 (Motor Vehicle Collisions – Crashes)",
      select:
        "date_extract_y(crash_date) AS year, count(collision_id) AS repaired_collisions",
      where:
        "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'\nAND (number_of_persons_injured > 0 OR number_of_persons_killed > 0)",
    },
    {
      name: "Traffic-Enforcement Arrests",
      dataset: "8h9b-rp9u (NYPD Arrests Data Historic)",
      select: "date_extract_y(arrest_date) AS year, count(*) AS arrests",
      where:
        "arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00'\nAND (ofns_desc = 'VEHICLE AND TRAFFIC LAWS'\n  OR ofns_desc = 'OTHER TRAFFIC INFRACTION'\n  OR ofns_desc = 'INTOXICATED & IMPAIRED DRIVING'\n  OR ofns_desc = 'INTOXICATED/IMPAIRED DRIVING'\n  OR ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE')",
    },
  ];

  return (
    <div className={styles.container} aria-labelledby="registry-heading">
      <div className="glass-panel" style={{ padding: "var(--space-6)" }}>
        <h2
          id="registry-heading"
          style={{ marginTop: 0, marginBottom: "var(--space-4)" }}
        >
          Series Registry
        </h2>
        <p
          style={{
            marginBottom: "var(--space-6)",
            color: "var(--color-text)",
            lineHeight: 1.6,
          }}
        >
          For full transparency, the exact SoQL queries used to fetch the five
          core series from the Socrata open data portal are listed below. All
          figures are computed entirely on the server to prevent data
          truncation.
        </p>

        <div className={styles.tableWrapper}>
          <table
            className={styles.table}
            aria-label="Metric definitions and SoQL queries"
          >
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Dataset</th>
                <th scope="col">$select Clause</th>
                <th scope="col">$where Clause</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.name}>
                  <td>
                    <div className={styles.metricName}>{metric.name}</div>
                  </td>
                  <td style={{ color: "var(--color-text-muted)" }}>
                    {metric.dataset}
                  </td>
                  <td>
                    <pre className={styles.codeBlock}>{metric.select}</pre>
                  </td>
                  <td>
                    <pre className={styles.codeBlock}>{metric.where}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
