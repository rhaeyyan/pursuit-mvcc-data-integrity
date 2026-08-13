"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import styles from "./UnifiedTimeline.module.css";

type Dataset = {
  status: "ok" | "error" | "invalid_borough" | "empty";
  rows?: { year: number; [key: string]: number }[];
};

type Props = {
  data: {
    deaths: Dataset;
    injuries: Dataset;
    collisions: Dataset;
    repaired: Dataset;
    arrests: Dataset;
  };
};

const SERIES_CONFIG = [
  { key: "deaths", label: "Deaths", color: "var(--color-accent)" },
  { key: "injuries", label: "Injuries", color: "var(--color-accent-2)" },
  {
    key: "collisions",
    label: "Raw Collisions",
    color: "var(--color-accent-3)",
  },
  {
    key: "repaired",
    label: "Injury/Fatal Crashes Only",
    color: "var(--color-accent-4)",
  },
  {
    key: "arrests",
    label: "Traffic-enforcement arrests",
    color: "var(--color-accent-5)",
  },
] as const;

type SeriesKey = (typeof SERIES_CONFIG)[number]["key"];

export function UnifiedTimeline({ data }: Props) {
  const [scale, setScale] = useState<"indexed" | "absolute">("indexed");
  const [visibleSeries, setVisibleSeries] = useState<
    Record<SeriesKey, boolean>
  >({
    deaths: true,
    injuries: true,
    collisions: true,
    repaired: true,
    arrests: true,
  });

  const toggleSeries = (key: SeriesKey) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chartData = useMemo(() => {
    // 1. Extract base values (2018) for indexing
    const baseValues: Record<string, number> = {};
    for (const { key } of SERIES_CONFIG) {
      const dataset = data[key];
      if (dataset.status === "ok" && dataset.rows) {
        const row2018 = dataset.rows.find((r) => r.year === 2018);
        baseValues[key] = row2018 ? row2018[key] : 1;
      } else {
        baseValues[key] = 1; // Fallback to avoid division by zero
      }
    }

    // 2. Build rows 2018-2025
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    return years.map((year) => {
      const point: Record<string, number | null> = { year };
      for (const { key } of SERIES_CONFIG) {
        const dataset = data[key];
        let val = null;
        if (dataset.status === "ok" && dataset.rows) {
          const row = dataset.rows.find((r) => r.year === year);
          if (row && typeof row[key] === "number") {
            val = row[key];
          }
        }

        if (val !== null) {
          if (scale === "indexed") {
            // (value / 2018_value) * 100
            point[key] = (val / baseValues[key]) * 100;
          } else {
            point[key] = val;
          }
        } else {
          point[key] = null;
        }
      }
      return point;
    });
  }, [data, scale]);

  return (
    <section
      className={`glass-panel ${styles.container}`}
      aria-labelledby="timeline-heading"
    >
      <header className={styles.header}>
        <h2 id="timeline-heading" className="sr-only">
          Consolidated Traffic Timeline
        </h2>

        <div className={styles.controlsRow}>
          <div
            className={styles.toggles}
            role="group"
            aria-label="Toggle series visibility"
          >
            {SERIES_CONFIG.map(({ key, label, color }) => (
              <label
                key={key}
                className={styles.toggleLabel}
                style={{ "--accent-color": color } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  checked={visibleSeries[key]}
                  onChange={() => toggleSeries(key)}
                  className={styles.checkbox}
                />
                <span className={styles.labelText}>{label}</span>
              </label>
            ))}
          </div>

          <div
            className={styles.scaleSwitch}
            role="radiogroup"
            aria-label="Select scale"
          >
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="scale"
                value="indexed"
                checked={scale === "indexed"}
                onChange={() => setScale("indexed")}
              />
              Indexed (2018=100)
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="scale"
                value="absolute"
                checked={scale === "absolute"}
                onChange={() => setScale("absolute")}
              />
              Absolute Counts
            </label>
          </div>
        </div>
      </header>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              stroke="var(--color-text-muted)"
              tick={{ fill: "var(--color-text-muted)" }}
              tickMargin={10}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={(val) =>
                scale === "indexed" ? `${val}` : val.toLocaleString()
              }
              domain={scale === "indexed" ? [0, "auto"] : ["auto", "auto"]}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                backdropFilter: "var(--blur-glass)",
              }}
              formatter={(value, name) => {
                const val = Number(value);
                const strName = String(name);
                const label =
                  SERIES_CONFIG.find((c) => c.key === strName)?.label ?? strName;
                if (scale === "indexed") {
                  return [val.toFixed(1), label];
                }
                return [val.toLocaleString(), label];
              }}
              labelStyle={{
                color: "var(--color-text-heading)",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            />

            <ReferenceLine
              x={2019}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              label={{
                position: "top",
                value: "SI Pilot (2019)",
                fill: "var(--color-text-muted)",
                fontSize: 12,
              }}
            />
            <ReferenceLine
              x={2020}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              label={{
                position: "top",
                value: "Citywide Policy (2020)",
                fill: "var(--color-text-muted)",
                fontSize: 12,
              }}
            />

            {SERIES_CONFIG.map(
              ({ key, color }) =>
                visibleSeries[key] && (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "var(--color-bg)" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                    animationDuration={300}
                  />
                ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
