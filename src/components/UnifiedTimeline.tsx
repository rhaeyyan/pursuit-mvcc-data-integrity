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
  { key: "full", label: "2018–2025", years: YEARS },
  { key: "pre", label: "Pre-policy 2018–19", years: [2018, 2019] },
  {
    key: "post",
    label: "Post-policy 2020–25",
    years: [2020, 2021, 2022, 2023, 2024, 2025],
  },
];

const MARKERS = [
  { year: 2019, label: "SI pilot 2019-03-18" },
  { year: 2020, label: "Citywide 2020-04-06" },
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
              ? `${s.badgeText} · ${verifiedYearCount(s.key, data)} of ${YEARS.length} years verified`
              : s.badgeText,
          badgeTone: s.badgeTone,
          delta: deltaLabel(s.key, baseYear, activeYearInWindow, data),
          note: s.note,
        }));

    return {
      kicker: boroughBlocked ? "Borough view" : "Selected year",
      title: boroughBlocked ? (boroughLabel ?? "") : String(activeYearInWindow),
      sub: boroughBlocked
        ? "Not pinned in this workspace — see the explainer."
        : "Figures as recorded, with the grade that governs how each may be read.",
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
          {boroughLabel} is not pinned in this workspace
        </h2>
        <p className={styles.blockedText}>
          {coverage.status === "ok" ? (
            <>
              No borough series is pinned in this workspace: the borough field
              is unpopulated on roughly{" "}
              {Math.round(coverage.unpopulatedSharePercent)}% of collision rows
              across {YEARS[0]}–{YEARS[YEARS.length - 1]}, and coverage drifts
              from {coverage.firstYear.ratePercent.toFixed(1)}% (
              {coverage.firstYear.year}) to{" "}
              {coverage.lastYear.ratePercent.toFixed(1)}% (
              {coverage.lastYear.year}).
            </>
          ) : (
            <>
              No borough series is pinned in this workspace: the borough field
              is not reliably populated on every collision row, and its coverage
              is not constant across the analysis window.
            </>
          )}{" "}
          Switch back to citywide, or open the integrity audit to see the
          coverage that qualifies every borough figure.
        </p>
        <Link
          href="/integrity"
          className={`${workspace.btn} ${workspace.btnSecondary}`}
        >
          Open integrity audit
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
          <span className={workspace.fieldLabel}>Window</span>
          <div className={workspace.seg} role="radiogroup" aria-label="Window">
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
          <span className={workspace.fieldLabel}>Scale</span>
          <div className={workspace.seg} role="radiogroup" aria-label="Scale">
            <label className={workspace.segOpt}>
              <input
                type="radio"
                name="scale"
                checked={scale === "indexed"}
                onChange={() => setScale("indexed")}
              />
              <span>Indexed to {baseYear} = 100</span>
            </label>
            <label className={workspace.segOpt}>
              <input
                type="radio"
                name="scale"
                checked={scale === "absolute"}
                onChange={() => setScale("absolute")}
              />
              <span>Absolute counts</span>
            </label>
          </div>
        </div>

        <div className={styles.readout}>
          {activeYearInWindow} selected · {activeSeries.length} of{" "}
          {SERIES_CONFIG.length} series
        </div>
      </div>

      <div
        className={styles.toggles}
        role="group"
        aria-label="Toggle series visibility"
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
              {s.dash !== "solid" && (
                <span className={styles.dashNote}>
                  {" "}
                  ({s.dash} — affected by reporting decline)
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
            ? `Indexed to ${baseYear} = 100. Dashed lines are series affected by the NYPD dispatch policy change; the dotted line is derived. Magenta rules mark the two documented policy dates.`
            : "Absolute counts on one linear axis. Magenta rules mark the two documented policy dates."}
        </figcaption>
      </figure>

      <div className={styles.tableWrapper}>
        <table className={workspace.table}>
          <caption className={styles.tableCaption}>
            {(scale === "indexed" ? "Indexed values, " : "Absolute counts, ") +
              windowYears[0] +
              "–" +
              windowYears[windowYears.length - 1] +
              " · select a row to move the crosshair"}
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
