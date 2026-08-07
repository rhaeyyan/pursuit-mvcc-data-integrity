"use client";

// A single-series yearly line chart, parameterized over which metric it
// plots. Generalized from Task 2's DeathsChart.tsx (see SPEC.md, "Close
// FR-3's remaining chart half") once a second metric (collisions) needed the
// same geometry with a different field, stroke, colour slot, and copy. Pure
// rendering layer over the `rows` a Route Handler already fetched and
// validated — no fetch, no query, no arithmetic. See SPEC.md's Intellectual
// Control section for why this stays one component with two call sites
// (small multiples) rather than a merged two-series chart.

import type { JSX } from "react";
import type { CSSProperties } from "react";
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
import type { YearlyMetricRow } from "../lib/socrata";

import styles from "./YearlyLineChart.module.css";

export type YearlyLineChartProps<K extends string> = {
  rows: YearlyMetricRow<K>[];
  fieldAlias: K;
  seriesLabel: string;
  strokeStyle: "solid" | "dashed";
  colorSlot: 1 | 2;
  ariaLabel: string;
  captionText: string;
  note?: string;
};

// The dash pattern for the "affected by reporting decline" treatment FR-3
// requires — a real, visible dash, never derived from strokeStyle at every
// call site individually.
const DASH_PATTERN = "8 6";

/**
 * Builds the direct end-value label renderer for a given `rows`/`fieldAlias`
 * pair. Recharts calls the returned function once per data point (the
 * `label` render-prop convention for `<Line>`); it returns an element only
 * for the last index, so exactly one label renders — SPEC.md's pinned
 * rendered contract. The rendered text is `rows[rows.length - 1][fieldAlias]`,
 * read verbatim from the closed-over array, never Recharts' own `props.value`
 * — this is the one place in the file that writes a metric's figure to the
 * screen, and it performs no arithmetic on it (NFR-4).
 */
function makeEndLabelRenderer<K extends string>(
  rows: YearlyMetricRow<K>[],
  fieldAlias: K,
) {
  const lastIndex = rows.length - 1;
  const lastValue = rows[lastIndex]?.[fieldAlias];

  return function renderEndLabel(props: LabelProps): JSX.Element | null {
    if (props.index !== lastIndex || lastValue === undefined) {
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
        {lastValue}
      </text>
    );
  };
}

export function YearlyLineChart<K extends string>({
  rows,
  fieldAlias,
  seriesLabel,
  strokeStyle,
  colorSlot,
  ariaLabel,
  captionText,
  note,
}: YearlyLineChartProps<K>): JSX.Element {
  const renderEndLabel = makeEndLabelRenderer(rows, fieldAlias);

  // SPEC.md's Output 2 mechanism: an inline custom property whose *value* is
  // a var() reference to the chosen slot, never a colour literal — every
  // paint rule in YearlyLineChart.module.css reads var(--chart-series).
  const figureStyle = {
    "--chart-series": `var(--chart-series-${colorSlot})`,
  } as CSSProperties;

  return (
    <figure className={styles.figure} style={figureStyle}>
      <div className={styles.plot} role="img" aria-label={ariaLabel}>
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
              label={{
                value: seriesLabel,
                position: "insideTopLeft",
                angle: 0,
              }}
            />
            <Line
              type="linear"
              dataKey={fieldAlias}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={
                strokeStyle === "dashed" ? DASH_PATTERN : undefined
              }
              dot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
              label={renderEndLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className={styles.caption}>
        {captionText}
        {note !== undefined && <p>{note}</p>}
      </figcaption>
    </figure>
  );
}
