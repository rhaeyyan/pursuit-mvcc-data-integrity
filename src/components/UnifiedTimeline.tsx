"use client";

// The Timeline view of the MVCC Workspace (implements "MVCC Workspace.dc.html"'s
// timeline screen). Every number rendered here — chart points, table cells,
// inspector values/deltas, the borough-blocked coverage message, the
// "defensible line" — is computed from the real `data`/`coverage` props this
// component receives (fetched server-side in
// src/app/(workspace)/[[...borough]]/page.tsx), never a literal (CLAUDE.md
// Rule 1/NFR-4). The mockup's own inline `V` figures were design-tool
// placeholders and are not reproduced anywhere in this file.
//
// Series metadata (label/ink/dash/badge/note), value lookup, and delta/
// defensible-line arithmetic are shared with the Integrity audit and Series
// registry views via src/lib/seriesConfig.ts — not reimplemented here.
//
// Active-year crosshair: Recharts' onMouseMove exposes `activeLabel` (the
// hovered x-axis `year`, since XAxis dataKey="year") — that state is shared
// by the accessible table's row selection (button + onMouseEnter, both fire
// the same setActiveYear) and pushed to the shared Right Inspector via
// useInspectorSync (src/context/WorkspaceInspectorContext.tsx). NFR-3: the
// chart's accessible table equivalent is not optional decoration — it is the
// only reading of these values for anyone who can't perceive the SVG.

import { useMemo, useState } from "react";
import Link from "next/link";
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

import {
  YEARS,
  SERIES_CONFIG,
  DASH_PATTERN,
  rawValueForYear,
  verifiedYearCount,
  deltaLabel,
  defensibleLine,
  fmt,
  type SeriesKey,
  type SeriesData,
} from "@/lib/seriesConfig";
import {
  useInspectorSync,
  type InspectorItem,
} from "@/context/WorkspaceInspectorContext";

import workspace from "@/app/(workspace)/workspace.module.css";
import styles from "./UnifiedTimeline.module.css";

export type CoverageInfo =
  | {
      status: "ok";
      unpopulatedSharePercent: number;
      firstYear: { year: number; ratePercent: number };
      lastYear: { year: number; ratePercent: number };
    }
  | { status: "unavailable" };

type Props = {
  data: SeriesData;
  boroughLabel?: string;
  coverage: CoverageInfo;
};

type WindowKey = "full" | "pre" | "post";

type WindowDef = { key: WindowKey; label: string; years: number[] };

const WINDOWS: WindowDef[] = [
  { key: "full", label: "All years", years: YEARS },
  { key: "pre", label: "Before the change", years: [2018, 2019] },
  {
    key: "post",
    label: "After the change",
    years: [2020, 2021, 2022, 2023, 2024, 2025],
  },
];

const MARKERS = [
  { year: 2019, label: "Staten Island, Mar 2019" },
  { year: 2020, label: "Citywide, Apr 2020" },
] as const;

export function UnifiedTimeline({ data, boroughLabel, coverage }: Props) {
  const [windowKey, setWindowKey] = useState<WindowKey>("full");
  const [scale, setScale] = useState<"indexed" | "absolute">("indexed");
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    deaths: true,
    injuries: true,
    collisions: true,
    repaired: true,
    pdo: false,
    arrests: false,
  });

  const activeWindow = WINDOWS.find((w) => w.key === windowKey) ?? WINDOWS[0];
  const windowYears = activeWindow.years;
  const baseYear = windowYears[0];

  const [activeYear, setActiveYear] = useState<number>(
    windowYears[windowYears.length - 1],
  );
  const activeYearInWindow = windowYears.includes(activeYear)
    ? activeYear
    : windowYears[windowYears.length - 1];

  function selectWindow(key: WindowKey) {
    const next = WINDOWS.find((w) => w.key === key) ?? WINDOWS[0];
    setWindowKey(key);
    setActiveYear(next.years[next.years.length - 1]);
  }

  const activeSeries = SERIES_CONFIG.filter((s) => visible[s.key]);

  const chartData = useMemo(() => {
    return windowYears.map((year) => {
      const point: { year: number } & Record<string, number | null> = {
        year,
      };
      for (const s of SERIES_CONFIG) {
        const raw = rawValueForYear(s.key, year, data);
        if (raw === null) {
          point[s.key] = null;
          continue;
        }
        if (scale === "indexed") {
          const base = rawValueForYear(s.key, baseYear, data);
          point[s.key] =
            base !== null && base !== 0 ? (raw / base) * 100 : null;
        } else {
          point[s.key] = raw;
        }
      }
      return point;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scale, windowKey]);

  const visibleMarkers = MARKERS.filter((m) => windowYears.includes(m.year));

  const defensible = defensibleLine(data);

  const boroughBlocked = Boolean(boroughLabel);

  // useInspectorSync's own useContext call makes this component a context
  // consumer, so an unmemoized object here would re-fire the sync effect on
  // every render the sync itself causes — an infinite loop, not just wasted
  // work (confirmed by a hung test run). Depending on `visible`/`windowKey`
  // (stable between renders unless the user actually changes a control)
  // rather than the derived `activeSeries`/`baseYear` values keeps this
  // memo cache-hit on every render that isn't a real control interaction.
  const panelData = useMemo(() => {
    const items: InspectorItem[] = boroughBlocked
      ? []
      : activeSeries.map((s) => ({
          id: s.key,
          label: s.label,
          ink: s.ink,
          value: fmt(rawValueForYear(s.key, activeYearInWindow, data)),
          badgeText:
            s.key === "arrests"
              ? `${s.badgeText} · ${verifiedYearCount(s.key, data)} of ${YEARS.length} years of data`
              : s.badgeText,
          badgeTone: s.badgeTone,
          delta: deltaLabel(s.key, baseYear, activeYearInWindow, data),
          note: s.note,
        }));

    return {
      kicker: boroughBlocked ? "Borough" : "Selected year",
      title: boroughBlocked ? (boroughLabel ?? "") : String(activeYearInWindow),
      sub: boroughBlocked
        ? "We can't chart this borough reliably — see the explanation."
        : "The numbers as recorded, with a note on how much each one can be trusted.",
      items,
      defensible,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    boroughBlocked,
    boroughLabel,
    activeYearInWindow,
    defensible,
    visible,
    data,
    windowKey,
  ]);

  useInspectorSync(panelData);

  if (boroughBlocked) {
    return (
      <section
        aria-labelledby="timeline-blocked-heading"
        className={styles.blocked}
      >
        <h2 id="timeline-blocked-heading">
          We can&apos;t chart {boroughLabel} reliably
        </h2>
        <p className={styles.blockedText}>
          {coverage.status === "ok" ? (
            <>
              Many crash records don&apos;t say which borough they happened in —
              about {Math.round(coverage.unpopulatedSharePercent)}% of them
              between {YEARS[0]} and {YEARS[YEARS.length - 1]}. Worse, that gap
              shrinks over time: {coverage.firstYear.ratePercent.toFixed(1)}% of
              records had a borough in {coverage.firstYear.year}, against{" "}
              {coverage.lastYear.ratePercent.toFixed(1)}% in{" "}
              {coverage.lastYear.year}. A borough chart would show
              record-keeping improving and look like crashes increasing.
            </>
          ) : (
            <>
              Many crash records don&apos;t say which borough they happened in,
              and that gap isn&apos;t steady from year to year. A borough chart
              would show record-keeping changing and look like crashes changing.
            </>
          )}{" "}
          Switch back to citywide, or read the data quality notes for the full
          picture.
        </p>
        <Link
          href="/integrity"
          className={`${workspace.btn} ${workspace.btnSecondary}`}
        >
          Read the data quality notes
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="timeline-heading" className={styles.container}>
      <h2 id="timeline-heading" className={styles.srOnly}>
        Timeline
      </h2>

      <div className={styles.controlsRow}>
        <div className={workspace.field}>
          <span className={workspace.fieldLabel}>Years</span>
          <div className={workspace.seg} role="radiogroup" aria-label="Years">
            {WINDOWS.map((w) => (
              <label key={w.key} className={workspace.segOpt}>
                <input
                  type="radio"
                  name="window"
                  checked={windowKey === w.key}
                  onChange={() => selectWindow(w.key)}
                />
                <span>{w.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={workspace.field}>
          <span className={workspace.fieldLabel}>Show as</span>
          <div className={workspace.seg} role="radiogroup" aria-label="Show as">
            <label className={workspace.segOpt}>
              <input
                type="radio"
                name="scale"
                checked={scale === "indexed"}
                onChange={() => setScale("indexed")}
              />
              <span>Change since {baseYear}</span>
            </label>
            <label className={workspace.segOpt}>
              <input
                type="radio"
                name="scale"
                checked={scale === "absolute"}
                onChange={() => setScale("absolute")}
              />
              <span>Actual counts</span>
            </label>
          </div>
        </div>

        <div className={styles.readout}>
          Showing {activeYearInWindow} · {activeSeries.length} of{" "}
          {SERIES_CONFIG.length} lines
        </div>
      </div>

      <div
        className={styles.toggles}
        role="group"
        aria-label="Choose which lines to show"
      >
        {SERIES_CONFIG.map((s) => (
          <label key={s.key} className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={visible[s.key]}
              onChange={() =>
                setVisible((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
              }
              className={styles.checkbox}
            />
            <span
              className={styles.swatch}
              style={{
                borderTopColor: s.ink,
                borderTopStyle: s.dash === "dotted" ? "dotted" : s.dash,
              }}
              aria-hidden="true"
            />
            <span
              className={styles.toggleText}
              style={{
                color: visible[s.key] ? "var(--color-text)" : undefined,
              }}
            >
              {s.label}
              {s.dashNote && (
                <span className={styles.dashNote}>
                  {" "}
                  ({s.dash} — {s.dashNote})
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      <figure className={styles.figure}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
            onMouseMove={(state) => {
              if (
                state.activeLabel !== undefined &&
                state.activeLabel !== null
              ) {
                const year = Number(state.activeLabel);
                if (!Number.isNaN(year)) setActiveYear(year);
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-divider)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              stroke="var(--color-neutral-600)"
              tick={{ fill: "var(--color-neutral-700)", fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              stroke="var(--color-neutral-600)"
              tick={{ fill: "var(--color-neutral-700)", fontSize: 11 }}
              tickFormatter={(val: number) =>
                scale === "indexed" ? String(val) : val.toLocaleString()
              }
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                fontSize: 13,
              }}
              formatter={(value, name) => {
                const val = Number(value);
                const strName = String(name);
                const label =
                  SERIES_CONFIG.find((c) => c.key === strName)?.label ??
                  strName;
                return [
                  scale === "indexed" ? val.toFixed(1) : val.toLocaleString(),
                  label,
                ];
              }}
              labelStyle={{ color: "var(--color-text)", fontWeight: 600 }}
            />

            {visibleMarkers.map((m) => (
              <ReferenceLine
                key={m.year}
                x={m.year}
                stroke="var(--color-accent-2)"
                strokeDasharray="2 3"
                label={{
                  value: m.label,
                  position: "top",
                  fontSize: 10,
                  fill: "var(--color-accent-2-700)",
                }}
              />
            ))}

            {windowYears.includes(activeYearInWindow) && (
              <ReferenceLine
                x={activeYearInWindow}
                stroke="var(--color-text)"
                strokeWidth={1}
              />
            )}

            {activeSeries.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key}
                stroke={s.ink}
                strokeWidth={s.strokeWidth}
                strokeDasharray={DASH_PATTERN[s.dash]}
                dot={{ r: 3, strokeWidth: 0, fill: s.ink }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-bg)" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <figcaption className={styles.caption}>
          {scale === "indexed"
            ? `Every line starts at 100 in ${baseYear}, so you can compare how far each one moved rather than how big it is. Dashed and dotted lines aren't measured the same way all the way through — see the note next to each one. The two pink lines mark when NYPD changed its policy.`
            : "The actual counts, all on one scale. The two pink lines mark when NYPD changed its policy."}
        </figcaption>
      </figure>

      <div className={styles.tableWrapper}>
        <table className={workspace.table}>
          <caption className={styles.tableCaption}>
            {(scale === "indexed"
              ? `Change since ${baseYear}, `
              : "Actual counts, ") +
              windowYears[0] +
              "–" +
              windowYears[windowYears.length - 1] +
              " · pick a year to highlight it on the chart"}
          </caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              {activeSeries.map((s) => (
                <th key={s.key} scope="col" style={{ color: s.ink }}>
                  {s.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {windowYears.map((year) => {
              const isActive = year === activeYearInWindow;
              return (
                <tr
                  key={year}
                  style={{
                    background: isActive
                      ? "var(--color-accent-100)"
                      : undefined,
                  }}
                >
                  <th scope="row" className={styles.yearCell}>
                    <button
                      type="button"
                      className={styles.yearButton}
                      style={{
                        color: isActive
                          ? "var(--color-accent-800)"
                          : "var(--color-text)",
                      }}
                      onMouseEnter={() => setActiveYear(year)}
                      onFocus={() => setActiveYear(year)}
                      onClick={() => setActiveYear(year)}
                    >
                      {year}
                    </button>
                  </th>
                  {activeSeries.map((s) => {
                    const raw = rawValueForYear(s.key, year, data);
                    const base = rawValueForYear(s.key, baseYear, data);
                    let text = "—";
                    if (raw !== null) {
                      text =
                        scale === "indexed"
                          ? base !== null && base !== 0
                            ? String(Math.round((raw / base) * 100))
                            : "—"
                          : raw.toLocaleString();
                    }
                    return (
                      <td key={s.key} className={styles.numCell}>
                        {text}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
