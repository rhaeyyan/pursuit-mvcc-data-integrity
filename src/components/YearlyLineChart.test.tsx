// Behavioral / black-box tests for src/components/YearlyLineChart.tsx —
// renamed and generalized from DeathsChart.test.tsx per SPEC.md's "Close
// FR-3's remaining chart half" task. DeathsChart.tsx becomes
// YearlyLineChart.tsx, a single component parameterized over `fieldAlias`,
// `seriesLabel`, `strokeStyle`, `colorSlot`, `ariaLabel`, `captionText`, and
// an optional `note` — the exact shape SPEC.md's Output 1 pins. Two
// configurations exercise the same shared behavioral contract below: deaths
// (unchanged rendered output, solid, slot 1) and collisions (new, dashed,
// slot 2). This file must fail red against the current tree because
// src/components/YearlyLineChart.tsx does not exist yet — only
// DeathsChart.tsx does.
//
// Per SPEC.md's "Pinned rendered contract" table (carried forward from
// Task 2): this asserts the produced SVG geometry (attributes, tick text,
// marker counts), not a Recharts prop spelling. Prop-name drift is
// explicitly Magnolia's to absorb; the rendered outcome is the contract.
//
// Fixture values are deliberately synthetic — the deaths fixture is the
// unchanged 11/22/…/88 sequence from Task 2; the collisions fixture is an
// equally obvious 1000/2000/…/8000 sequence, distinct in magnitude from both
// the deaths fixture and PRD Appendix A's real collisions column
// (231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546). A passing
// test here must never be confusable with evidence that the live data is
// correct (NFR-4).
//
// Selector choices below (e.g. `.recharts-xAxis-tick-labels
// .recharts-cartesian-axis-tick-value` rather than nesting under
// `.recharts-xAxis`) were verified against a real, temporarily-installed
// `recharts@3.10.1` render while building DeathsChart.test.tsx's
// vitest.setup.ts stub (see that file's header) — tick-label <text> nodes
// render in a separate z-index layer from the axis line/tick-mark group, not
// as their descendants. Unchanged here.
//
// Genericity: every behavioral assertion below (figure/caption/a11y-name,
// markers, stroke, axes, end-label, series-axis-label, a11y, the genuine-zero
// edge case, colorSlot token selection, note rendering, and the no-legend/
// no-tooltip contract) runs through one shared `runSharedContract()` function
// invoked once per configuration (deaths, collisions) — proving genericity by
// construction rather than by two copy-pasted describe blocks that could
// silently drift apart.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import type { YearlyMetricRow } from "../lib/socrata";
import { YearlyLineChart, type YearlyLineChartProps } from "./YearlyLineChart";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Byte-identical to Task 2's synthetic deaths fixture — the deaths
// configuration's rendered output must not change, only how its inputs
// arrive (props instead of internals).
const DEATHS_ROWS: YearlyMetricRow<"deaths">[] = [
  { year: 2018, deaths: 11 },
  { year: 2019, deaths: 22 },
  { year: 2020, deaths: 33 },
  { year: 2021, deaths: 44 },
  { year: 2022, deaths: 55 },
  { year: 2023, deaths: 66 },
  { year: 2024, deaths: 77 },
  { year: 2025, deaths: 88 },
];

const deathsProps: YearlyLineChartProps<"deaths"> = {
  rows: DEATHS_ROWS,
  fieldAlias: "deaths",
  seriesLabel: "Deaths",
  strokeStyle: "solid",
  colorSlot: 1,
  ariaLabel: "Line chart of NYC traffic deaths per year from 2018 to 2025.",
  captionText:
    "NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the table below.",
};

// Obviously-synthetic, four-digit round numbers — distinct in magnitude from
// both the deaths fixture above and PRD Appendix A's six/five-digit real
// collisions column. Never 231564/211486/112918/110558/103887/96607/91316/
// 85546.
const COLLISIONS_ROWS: YearlyMetricRow<"collisions">[] = [
  { year: 2018, collisions: 1000 },
  { year: 2019, collisions: 2000 },
  { year: 2020, collisions: 3000 },
  { year: 2021, collisions: 4000 },
  { year: 2022, collisions: 5000 },
  { year: 2023, collisions: 6000 },
  { year: 2024, collisions: 7000 },
  { year: 2025, collisions: 8000 },
];

// Verbatim, per SPEC.md's Output 3 chart copy — the same sentence already
// shipped on the collisions table (NFR-5: one claim, not a paraphrase per
// surface).
const COLLISIONS_NOTE_TEXT =
  "This series is affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions.";

const collisionsProps: YearlyLineChartProps<"collisions"> = {
  rows: COLLISIONS_ROWS,
  fieldAlias: "collisions",
  seriesLabel: "Collisions",
  strokeStyle: "dashed",
  colorSlot: 2,
  ariaLabel:
    "Line chart of NYC recorded collisions per year from 2018 to 2025.",
  captionText:
    "NYC recorded collisions per year, 2018–2025. Every plotted figure is listed in the table below.",
  note: COLLISIONS_NOTE_TEXT,
};

// ---------------------------------------------------------------------------
// Small helpers shared by every configuration
// ---------------------------------------------------------------------------

function lineCurve(container: HTMLElement): SVGPathElement | null {
  return container.querySelector(".recharts-line-curve");
}

function getPlotWrapper(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="img"]');
}

function xTickTexts(container: HTMLElement): (string | null)[] {
  return Array.from(
    container.querySelectorAll(
      ".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value",
    ),
  ).map((n) => n.textContent);
}

function yTickTexts(container: HTMLElement): (string | null)[] {
  return Array.from(
    container.querySelectorAll(
      ".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value",
    ),
  ).map((n) => n.textContent);
}

/** Returns a copy of `rows` with the first row's aggregate value forced to 0
 * (Edge Case 4: a genuine zero is data, never an absent year / filtered
 * point). Generic over the field key so it works for either configuration. */
function withZeroFirstRow<K extends string>(
  rows: YearlyMetricRow<K>[],
  fieldAlias: K,
): YearlyMetricRow<K>[] {
  const [first, ...rest] = rows;
  return [{ ...first, [fieldAlias]: 0 } as YearlyMetricRow<K>, ...rest];
}

/** Returns a copy of `rows` with the last row's aggregate value replaced —
 * used to prove the end-label renderer never applies locale formatting. */
function withLastValue<K extends string>(
  rows: YearlyMetricRow<K>[],
  fieldAlias: K,
  value: number,
): YearlyMetricRow<K>[] {
  const last = rows[rows.length - 1];
  return [
    ...rows.slice(0, -1),
    { ...last, [fieldAlias]: value } as YearlyMetricRow<K>,
  ];
}

// ---------------------------------------------------------------------------
// The shared behavioral contract — invoked once per configuration below.
// Every `it` here is a re-run of Task 2's pinned deaths-configuration
// contract, generalized to read the field/label/fixture it needs from
// `props` rather than a hardcoded internal — so calling this twice (deaths,
// collisions) proves genericity rather than assuming it.
// ---------------------------------------------------------------------------

function runSharedContract<K extends string>(
  label: string,
  props: YearlyLineChartProps<K>,
): void {
  const { rows, fieldAlias } = props;

  function renderChart(overrideRows: YearlyMetricRow<K>[] = rows) {
    return render(<YearlyLineChart {...props} rows={overrideRows} />);
  }

  describe(`<YearlyLineChart> — ${label} configuration — figure, caption, and accessible name`, () => {
    it("renders a <figure> containing a role=img plot wrapper and a <figcaption>", () => {
      const { container } = renderChart();

      const figure = container.querySelector("figure");
      expect(figure).toBeInTheDocument();

      const plot = getPlotWrapper(container);
      expect(plot).toBeInTheDocument();
      expect(figure?.contains(plot)).toBe(true);

      const figcaption = figure?.querySelector("figcaption");
      expect(figcaption).toBeInTheDocument();
    });

    it("the figcaption names the 2018-2025 window and points at the table", () => {
      const { container } = renderChart();

      const figcaption = container.querySelector("figcaption");
      const text = figcaption?.textContent ?? "";
      expect(text).toMatch(/2018/);
      expect(text).toMatch(/2025/);
      expect(text.toLowerCase()).toMatch(/table/);
    });

    it("the plot wrapper has role=img with a non-empty accessible name containing no digits other than the window years", () => {
      const { container } = renderChart();

      const plot = getPlotWrapper(container);
      expect(plot).toBeInTheDocument();

      const label = plot?.getAttribute("aria-label") ?? "";
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).toBe(props.ariaLabel);

      const withoutWindowYears = label
        .replace(/2018/g, "")
        .replace(/2025/g, "");
      expect(withoutWindowYears).not.toMatch(/\d/);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — markers`, () => {
    it("renders exactly rows.length markers, each with radius >= 4 and a 2px ring", () => {
      const { container } = renderChart();

      const dots = container.querySelectorAll(".recharts-line-dot");
      expect(dots).toHaveLength(rows.length);

      for (const dot of Array.from(dots)) {
        const radius = Number(dot.getAttribute("r"));
        expect(radius).toBeGreaterThanOrEqual(4);
        expect(dot.getAttribute("stroke-width")).toBe("2");
      }
    });

    it("renders a marker count that tracks the fixture length, not a hardcoded 8", () => {
      const shorter = rows.slice(0, 3);
      const { container } = renderChart(shorter);

      const dots = container.querySelectorAll(".recharts-line-dot");
      expect(dots).toHaveLength(3);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — line stroke (strokeStyle="${props.strokeStyle}")`, () => {
    it(`has stroke-width="2", round cap and join, and ${
      props.strokeStyle === "dashed"
        ? "a real, non-empty dash pattern"
        : "no dash pattern"
    }`, () => {
      const { container } = renderChart();

      const path = lineCurve(container);
      expect(path).toBeInTheDocument();
      expect(path?.getAttribute("stroke-width")).toBe("2");
      expect(path?.getAttribute("stroke-linecap")).toBe("round");
      expect(path?.getAttribute("stroke-linejoin")).toBe("round");

      const dash = path?.getAttribute("stroke-dasharray");
      if (props.strokeStyle === "dashed") {
        // Exact dash values are Magnolia's choice, not pinned here — only
        // that a real dash pattern exists.
        expect(dash).not.toBeNull();
        expect(dash).not.toBe("0");
        expect(dash).not.toBe("none");
      } else {
        expect(dash === null || dash === "0" || dash === "none").toBe(true);
      }
    });

    it("the line's d attribute is non-empty on the first synchronous render (no entrance animation)", () => {
      const { container } = renderChart();

      const path = lineCurve(container);
      expect(path?.getAttribute("d")).toBeTruthy();
      expect(path?.getAttribute("d")?.length ?? 0).toBeGreaterThan(0);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — colorSlot token selection (colorSlot=${props.colorSlot})`, () => {
    it(`selects the --chart-series-${props.colorSlot} custom property on the <figure> root, never a colour literal`, () => {
      const { container } = renderChart();

      const figure = container.querySelector("figure") as HTMLElement | null;
      expect(figure).toBeInTheDocument();

      // The effect of colorSlot, per SPEC.md's Output 2 mechanism: an inline
      // custom property on <figure> whose *value* is a var() reference to
      // the chosen slot, e.g. style={{ "--chart-series":
      // `var(--chart-series-${colorSlot})` }} — so every paint rule in the
      // stylesheet can read var(--chart-series) without a colour literal
      // ever appearing in the component. Asserting the effect (a distinct
      // token reference), never a literal hex.
      expect(figure?.style.getPropertyValue("--chart-series")).toBe(
        `var(--chart-series-${props.colorSlot})`,
      );

      const inlineStyle = figure?.getAttribute("style") ?? "";
      expect(inlineStyle).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(inlineStyle).not.toMatch(/rgb\(/i);
      expect(inlineStyle).not.toMatch(/hsl\(/i);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — y-axis (the single most important test in this file)`, () => {
    it("renders a 0 tick on the y-axis — the zero-baseline assertion", () => {
      const { container } = renderChart();

      expect(yTickTexts(container)).toContain("0");
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — x-axis (category scale, never numeric)`, () => {
    it("renders 2018 and 2025 as category ticks", () => {
      const { container } = renderChart();

      const ticks = xTickTexts(container);
      expect(ticks).toContain("2018");
      expect(ticks).toContain("2025");
    });

    it("never invents a fractional-year tick (a numeric/continuous scale would)", () => {
      const { container } = renderChart();

      const ticks = xTickTexts(container);
      for (const tick of ticks) {
        expect(tick).not.toMatch(/\./);
      }
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — the direct end-value label`, () => {
    it("renders exactly one direct value label, equal to the fixture's last value, with no formatting", () => {
      const { container } = renderChart();

      const lastValue = String(rows[rows.length - 1][fieldAlias]);

      const yAxisTickLabelsGroup = container.querySelector(
        ".recharts-yAxis-tick-labels",
      );
      const candidates = Array.from(container.querySelectorAll("text")).filter(
        (node) => {
          if (node.textContent !== lastValue) return false;
          if (yAxisTickLabelsGroup?.contains(node)) return false;
          return true;
        },
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0].textContent).toBe(lastValue);
    });

    it("does not format the label with a locale separator on a larger fixture value", () => {
      const modifiedRows = withLastValue(rows, fieldAlias, 1234);
      const { container } = renderChart(modifiedRows);

      const yAxisTickLabelsGroup = container.querySelector(
        ".recharts-yAxis-tick-labels",
      );
      const candidates = Array.from(container.querySelectorAll("text")).filter(
        (node) => {
          if (node.textContent !== "1234") return false;
          if (yAxisTickLabelsGroup?.contains(node)) return false;
          return true;
        },
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0].textContent).not.toMatch(/,/);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — the series axis label`, () => {
    it(`renders the word "${props.seriesLabel}" horizontally, with no rotation transform`, () => {
      const { container } = renderChart();

      const labelNodes = Array.from(container.querySelectorAll("text")).filter(
        (node) => node.textContent?.trim() === props.seriesLabel,
      );

      expect(labelNodes.length).toBeGreaterThanOrEqual(1);

      for (const node of labelNodes) {
        const transform =
          node.getAttribute("transform") ??
          node.closest("[transform]")?.getAttribute("transform") ??
          "";
        expect(transform).not.toMatch(/rotate\(\s*-?90/);
        expect(node.getAttribute("angle")).not.toBe("-90");
      }
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — no legend, no tooltip (single-series small multiple)`, () => {
    it("renders no legend wrapper and no tooltip DOM", () => {
      const { container } = renderChart();

      expect(
        container.querySelector(".recharts-legend-wrapper"),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(".recharts-tooltip-wrapper"),
      ).not.toBeInTheDocument();
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — the optional note block`, () => {
    if (props.note !== undefined) {
      it("renders `note` as a second block inside figcaption when provided, verbatim", () => {
        const { container } = renderChart();

        const figcaption = container.querySelector("figcaption");
        expect(figcaption).toBeInTheDocument();

        const noteNode = Array.from(
          figcaption?.querySelectorAll("p") ?? [],
        ).find((p) => p.textContent === props.note);
        expect(noteNode).toBeTruthy();
      });
    } else {
      it("renders no note block at all when omitted — not an empty node", () => {
        const { container } = renderChart();

        const figcaption = container.querySelector("figcaption");
        expect(figcaption).toBeInTheDocument();
        expect(figcaption?.querySelector("p")).not.toBeInTheDocument();
      });
    }
  });

  describe(`<YearlyLineChart> — ${label} configuration — accessibility (WCAG 2.2 AA)`, () => {
    it("has zero axe-core violations on the rendered figure", async () => {
      const { container } = renderChart();

      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe(`<YearlyLineChart> — ${label} configuration — a genuine zero is data, not an absent year (Edge Case 4)`, () => {
    it("renders a row with value 0 as a baseline point, never filtered out", () => {
      const zeroRows = withZeroFirstRow(rows, fieldAlias);
      const { container } = renderChart(zeroRows);

      const dots = container.querySelectorAll(".recharts-line-dot");
      expect(dots).toHaveLength(zeroRows.length);
    });
  });
}

runSharedContract("deaths", deathsProps);
runSharedContract("collisions (dashed)", collisionsProps);

// ---------------------------------------------------------------------------
// Source-level greps. These are tests too, and the only net for constraints
// the mechanical hook (guard-data-integrity.sh) does not cover for this task
// (SPEC.md Constraints 1, 3, 4 — three/six/five-digit figures and a *value*
// import of the token-reading module are both explicitly outside what the
// hook catches). Read via Node's fs, not an import, so these stay meaningful
// even before the component compiles — right now YearlyLineChart.tsx does
// not exist, so `existsSync` below correctly reports that and every test
// depending on it fails loud with a clear message, not a cryptic assertion
// mismatch.
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const COMPONENTS_DIR = join(SRC_DIR, "components");
const COMPONENT_PATH = join(COMPONENTS_DIR, "YearlyLineChart.tsx");

function readComponentSourceOrFail(): string {
  if (!existsSync(COMPONENT_PATH)) {
    throw new Error(
      `${COMPONENT_PATH} does not exist yet — this is expected red until Magnolia implements it.`,
    );
  }
  return readFileSync(COMPONENT_PATH, "utf8");
}

/** Recursively lists file paths under `dir`, skipping nothing (callers filter). */
function listFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isTestFile(path: string): boolean {
  return /\.(test|spec)\.[tj]sx?$/.test(path);
}

describe("<YearlyLineChart> — source-level greps (the only net for these constraints)", () => {
  it("Constraint 4: contains no colour literal (#rrggbb, rgb(), hsl())", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/rgb\(/i);
    expect(source).not.toMatch(/hsl\(/i);
  });

  it("Constraint 1: no process.env anywhere under src/components", () => {
    if (!existsSync(COMPONENTS_DIR)) {
      throw new Error(
        `${COMPONENTS_DIR} does not exist yet — this is expected red until Magnolia implements it.`,
      );
    }
    const offenders = listFilesRecursive(COMPONENTS_DIR)
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
      .filter((f) => !isTestFile(f))
      .filter((f) => readFileSync(f, "utf8").includes("process.env"));
    expect(offenders).toEqual([]);
  });

  it("standing clause: no @/ path-alias import in YearlyLineChart.tsx (Vitest cannot resolve it)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/from\s+["']@\//);
  });

  it("Constraint 1 (generalized): every `lib/socrata` reference under src/components is an `import type` — expected 2 hits (MetricSection.tsx, YearlyLineChart.tsx)", () => {
    if (!existsSync(COMPONENTS_DIR)) {
      throw new Error(
        `${COMPONENTS_DIR} does not exist yet — this is expected red until Magnolia implements it.`,
      );
    }
    const libSocrataLines = listFilesRecursive(COMPONENTS_DIR)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => !isTestFile(f))
      .flatMap((f) => readFileSync(f, "utf8").split("\n"))
      .filter((line) => line.includes("lib/socrata"));

    expect(libSocrataLines).toHaveLength(2);
    for (const line of libSocrataLines) {
      expect(line.trim()).toMatch(/^import type\b/);
    }
  });

  it("Constraint 3 (generalized): no real deaths (231/244/269/297/290/280/268/229) or collisions (231564/211486/112918/110558/103887/96607/91316/85546) figure appears as a literal anywhere in non-test src/**", () => {
    const pinnedNumbers = [
      // Deaths (Task 2's original pattern).
      231, 244, 269, 297, 290, 280, 268, 229,
      // Collisions (this task's extension).
      231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    const offenders = listFilesRecursive(SRC_DIR)
      .filter((f) => /\.(ts|tsx|js|jsx|css)$/.test(f))
      .filter((f) => !isTestFile(f))
      .filter((f) => pinnedFigurePattern.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("carries the 'use client' directive (it is the client boundary)", () => {
    const source = readComponentSourceOrFail();
    const firstNonEmptyLines = source
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .join("\n");
    expect(firstNonEmptyLines).toMatch(/['"]use client['"]/);
  });

  it('Constraint 5: the dashed stroke is spent exactly once, on the collisions instantiation — this file\'s own fixtures never pass strokeStyle="dashed" for deaths', () => {
    expect(deathsProps.strokeStyle).toBe("solid");
    expect(collisionsProps.strokeStyle).toBe("dashed");
  });
});
