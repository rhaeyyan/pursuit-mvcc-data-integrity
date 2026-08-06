"use client";

// The deaths-per-year line chart (Task 2, walking skeleton). Pure rendering
// layer over the `rows` Task 1's Route Handler already fetched and
// validated — no fetch, no query, no arithmetic. See SPEC.md's "Walking
// skeleton Task 2" for the full contract this file implements; the
// Intellectual Control section there explains every non-obvious choice
// below (zero-based axis, no tooltip, role="img", colour-in-CSS-only).

import type { JSX } from "react";
import type { LabelProps } from "recharts";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// Load-bearing `import type` — see SPEC.md's Output 1 and Constraint 1. A
// *value* import of the data module below would pull the only file in the
// repo that reads SOCRATA_APP_TOKEN into the client bundle; `import type`
// is erased at compile time and cannot.
import type { DeathsRow } from "../lib/deaths";

import styles from "./DeathsChart.module.css";

export type DeathsChartProps = { rows: DeathsRow[] };

/**
 * Builds the direct end-value label renderer for a given `rows` array.
 * Recharts calls the returned function once per data point (the `label`
 * render-prop convention for `<Line>`); it returns an element only for the
 * last index, so exactly one label renders — SPEC.md's pinned rendered
 * contract. The rendered text is `rows[rows.length - 1].deaths`, read
 * verbatim from the closed-over array, never Recharts' own `props.value` —
 * this is the one place in the file that writes a deaths figure to the
 * screen, and it performs no arithmetic on it (NFR-4).
 */
function makeEndLabelRenderer(rows: DeathsRow[]) {
  const lastIndex = rows.length - 1;
  const lastDeaths = rows[lastIndex]?.deaths;

  return function renderEndLabel(props: LabelProps): JSX.Element | null {
    if (props.index !== lastIndex || lastDeaths === undefined) {
      return null;
    }

    const x = typeof props.x === "number" ? props.x : Number(props.x);
    const y = typeof props.y === "number" ? props.y : Number(props.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return (
      <text
        x={x + 8}
        y={y}
        dy={4}
        textAnchor="start"
        className={styles.endLabel}
      >
        {lastDeaths}
      </text>
    );
  };
}

export function DeathsChart({ rows }: DeathsChartProps): JSX.Element {
  const renderEndLabel = makeEndLabelRenderer(rows);

  return (
    <figure className={styles.figure}>
      <div
        className={styles.plot}
        role="img"
        aria-label="Line chart of NYC traffic deaths per year from 2018 to 2025."
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={rows}
            margin={{ top: 24, right: 56, bottom: 8, left: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" type="category" />
            <YAxis
              domain={[0, "auto"]}
              allowDecimals={false}
              width={48}
              label={{ value: "Deaths", position: "insideTopLeft", angle: 0 }}
            />
            <Line
              type="linear"
              dataKey="deaths"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
              label={renderEndLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className={styles.caption}>
        NYC traffic deaths per year, 2018–2025. Every plotted figure is listed
        in the table below.
      </figcaption>
    </figure>
  );
}
