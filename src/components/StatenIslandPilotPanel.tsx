"use client";

import type { JSX } from "react";
import type { SIPilotResult, SIPilotRow } from "../lib/statenIslandPilot";
import { POLICY_DATE_MARKERS, type PolicyDateMarker } from "../lib/policyDates";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import styles from "./StatenIslandPilotPanel.module.css";

export type StatenIslandPilotPanelProps = {
  result: SIPilotResult;
};

const DASH_PATTERN = "8 6";
const MARKER_DASH_PATTERN = "2 3";

function getVisiblePolicyMarkers(rows: SIPilotRow[]): PolicyDateMarker[] {
  const months = new Set(rows.map((row) => row.month));
  return POLICY_DATE_MARKERS.filter((marker) =>
    months.has(marker.isoDate.slice(0, 7)),
  );
}

function buildPolicyMarkerCaption(markers: PolicyDateMarker[]): string {
  const parts = markers
    .map((marker) => `${marker.isoDate} (${marker.label})`)
    .join(" and ");
  return `Vertical reference lines mark ${parts} — see Caveats, below, for details.`;
}

export function StatenIslandPilotPanel({
  result,
}: StatenIslandPilotPanelProps): JSX.Element {
  if (result.status === "empty") {
    return (
      <div className={styles.container}>
        <p role="status">
          No data available for the Jan 2018–Dec 2019 Staten Island pilot
          window.
        </p>
        <details className={styles.details}>
          <summary>SoQL query — staten-island-pilot</summary>
          <pre>
            <code>{result.soql}</code>
          </pre>
        </details>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className={styles.container}>
        <p role="alert">{result.reason}</p>
        <details className={styles.details}>
          <summary>SoQL query — staten-island-pilot</summary>
          <pre>
            <code>{result.soql}</code>
          </pre>
        </details>
      </div>
    );
  }

  const { rows, stats } = result;
  const visibleMarkers = getVisiblePolicyMarkers(rows);
  const boundaryMarker = visibleMarkers.find(
    (m) => m.label === "Staten Island pilot begins",
  );
  const boundaryMonth = boundaryMarker
    ? boundaryMarker.isoDate.slice(0, 7)
    : null;

  // Split data into pre and post boundary for styling
  const plotData = rows.map((row) => {
    let pre: number | undefined = undefined;
    let post: number | undefined = undefined;

    if (!boundaryMonth) {
      pre = row.collisions;
    } else {
      if (row.month < boundaryMonth) {
        pre = row.collisions;
      } else if (row.month === boundaryMonth) {
        pre = row.collisions;
        post = row.collisions;
      } else {
        post = row.collisions;
      }
    }

    return {
      month: row.month,
      pre,
      post,
    };
  });

  const markerCaption =
    visibleMarkers.length > 0 ? buildPolicyMarkerCaption(visibleMarkers) : null;

  const reportingNote =
    visibleMarkers.length > 0
      ? "This series is affected by a NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions."
      : null;

  return (
    <div className={styles.container}>
      <figure className={styles.figure}>
        <div
          role="img"
          aria-label="Line chart of Staten Island collisions per month from Jan 2018 to Dec 2019"
          className={styles.plot}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={plotData}
              margin={{ top: 24, right: 56, bottom: 8, left: 8 }}
            >
              <CartesianGrid vertical={false} className={styles.grid} />
              <XAxis dataKey="month" type="category" />
              <YAxis
                domain={[0, "auto"]}
                allowDecimals={false}
                width={48}
                label={{
                  value: "Collisions",
                  position: "insideTopLeft",
                  angle: 0,
                }}
              />
              <Line
                type="linear"
                dataKey="pre"
                stroke="var(--chart-series-1)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls
              />
              {boundaryMonth && (
                <Line
                  type="linear"
                  dataKey="post"
                  stroke="var(--chart-series-1)"
                  strokeWidth={2}
                  strokeDasharray={DASH_PATTERN}
                  dot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls
                />
              )}
              {visibleMarkers.map((marker) => (
                <ReferenceLine
                  key={marker.year + marker.isoDate}
                  x={marker.isoDate.slice(0, 7)}
                  strokeDasharray={MARKER_DASH_PATTERN}
                  stroke="var(--chart-annotation)"
                  label={{
                    value: marker.label,
                    position: "top",
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <figcaption className={styles.caption}>
          <p>Monthly collision counts for the Jan 2018–Dec 2019 window.</p>
          {reportingNote && <p>{reportingNote}</p>}
          {markerCaption && <p>{markerCaption}</p>}
        </figcaption>
      </figure>

      <div className={styles.stats}>
        <p>
          In 2018, Staten Island averaged {stats.avg2018Monthly.toFixed(1)}{" "}
          collisions per month. From May to December 2019, that average was{" "}
          {stats.avgMayDec2019.toFixed(1)}.
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption>Staten Island Monthly Collisions (2018-2019)</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Collisions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <td>{r.month}</td>
                <td>{r.collisions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className={styles.details}>
        <summary>SoQL query — staten-island-pilot</summary>
        <pre>
          <code>{result.soql}</code>
        </pre>
      </details>
    </div>
  );
}
