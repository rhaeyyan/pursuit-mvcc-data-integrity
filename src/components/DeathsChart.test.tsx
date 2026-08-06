// Behavioral / black-box tests for src/components/DeathsChart.tsx (Task 2,
// the walking-skeleton chart). Written BEFORE the component (and before
// `recharts` is installed — that's Magnolia's dependency, per SPEC.md's
// Files list), per CLAUDE.md Rule 4 and this SPEC's standard (non-SPIKE)
// ordering.
//
// Per SPEC.md's "Pinned rendered contract" table: this asserts the produced
// SVG geometry (attributes, tick text, marker counts), not a Recharts prop
// spelling. Prop-name drift is explicitly Magnolia's to absorb; the rendered
// outcome is the contract.
//
// Fixture values are deliberately synthetic (11, 22, ... 88) — never PRD
// Appendix A's real deaths column (231, 244, 269, 297, 290, 280, 268, 229).
// A passing test here must never be confusable with evidence that the live
// data is correct (NFR-4).
//
// Selector choices below (e.g. `.recharts-xAxis-tick-labels
// .recharts-cartesian-axis-tick-value` rather than nesting under
// `.recharts-xAxis`) were verified against a real, temporarily-installed
// `recharts@3.10.1` render (never committed) while building the
// vitest.setup.ts stub this file depends on — tick-label <text> nodes render
// in a separate z-index layer from the axis line/tick-mark group, not as
// their descendants.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import type { DeathsRow } from "../lib/deaths";
import { DeathsChart } from "./DeathsChart";

// Obviously-synthetic fixture: small round numbers, 2018..2025 ascending —
// never the real Appendix A deaths column.
const SYNTHETIC_ROWS: DeathsRow[] = [
  { year: 2018, deaths: 11 },
  { year: 2019, deaths: 22 },
  { year: 2020, deaths: 33 },
  { year: 2021, deaths: 44 },
  { year: 2022, deaths: 55 },
  { year: 2023, deaths: 66 },
  { year: 2024, deaths: 77 },
  { year: 2025, deaths: 88 },
];

function renderChart(rows: DeathsRow[] = SYNTHETIC_ROWS) {
  return render(<DeathsChart rows={rows} />);
}

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

describe("<DeathsChart> — figure, caption, and accessible name", () => {
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
    // "points at the table" — the caption tells the reader the numbers are
    // also listed elsewhere on the page, per SPEC.md's pinned copy
    // ("Every plotted figure is listed in the table below.").
    expect(text.toLowerCase()).toMatch(/table/);
  });

  it("the plot wrapper has role=img with a non-empty accessible name containing no digits other than the window years", () => {
    const { container } = renderChart();

    const plot = getPlotWrapper(container);
    expect(plot).toBeInTheDocument();

    const label = plot?.getAttribute("aria-label") ?? "";
    expect(label.trim().length).toBeGreaterThan(0);

    // Strip the two permitted years, then confirm no digit survives — a
    // label reciting any other figure would be a hand-maintained copy of
    // the data (NFR-4's failure mode), and would go stale on the first feed
    // revision.
    const withoutWindowYears = label.replace(/2018/g, "").replace(/2025/g, "");
    expect(withoutWindowYears).not.toMatch(/\d/);
  });
});

describe("<DeathsChart> — markers", () => {
  it("renders exactly rows.length markers, each with radius >= 4 and a 2px ring", () => {
    const { container } = renderChart();

    const dots = container.querySelectorAll(".recharts-line-dot");
    expect(dots).toHaveLength(SYNTHETIC_ROWS.length);

    for (const dot of Array.from(dots)) {
      const radius = Number(dot.getAttribute("r"));
      expect(radius).toBeGreaterThanOrEqual(4);
      expect(dot.getAttribute("stroke-width")).toBe("2");
    }
  });

  it("renders a marker count that tracks the fixture length, not a hardcoded 8", () => {
    const shorter: DeathsRow[] = SYNTHETIC_ROWS.slice(0, 3);
    const { container } = renderChart(shorter);

    const dots = container.querySelectorAll(".recharts-line-dot");
    expect(dots).toHaveLength(3);
  });
});

describe("<DeathsChart> — line stroke (Constraint 5: solid, never dashed)", () => {
  it('has stroke-width="2", round cap and join, and no dash pattern', () => {
    const { container } = renderChart();

    const path = lineCurve(container);
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute("stroke-width")).toBe("2");
    expect(path?.getAttribute("stroke-linecap")).toBe("round");
    expect(path?.getAttribute("stroke-linejoin")).toBe("round");

    const dash = path?.getAttribute("stroke-dasharray");
    expect(dash === null || dash === "0" || dash === "none").toBe(true);
  });

  it("the line's d attribute is non-empty on the first synchronous render (no entrance animation)", () => {
    const { container } = renderChart();

    const path = lineCurve(container);
    expect(path?.getAttribute("d")).toBeTruthy();
    expect(path?.getAttribute("d")?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("<DeathsChart> — y-axis (Constraint 6: the single most important test in this file)", () => {
  it("renders a 0 tick on the y-axis — the zero-baseline assertion", () => {
    const { container } = renderChart();

    expect(yTickTexts(container)).toContain("0");
  });
});

describe("<DeathsChart> — x-axis (category scale, never numeric)", () => {
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

describe("<DeathsChart> — the direct end-value label", () => {
  it("renders exactly one direct value label, equal to the fixture's last deaths value, with no formatting", () => {
    const { container } = renderChart();

    const lastDeaths = String(SYNTHETIC_ROWS[SYNTHETIC_ROWS.length - 1].deaths);
    expect(lastDeaths).toBe("88");

    // Every <text> node whose content is exactly "88" and which is not a
    // y-axis tick label (SPEC.md's explicit exclusion — a coincidental tick
    // at the same numeric value must not be mistaken for the direct label).
    const yAxisTickLabelsGroup = container.querySelector(
      ".recharts-yAxis-tick-labels",
    );
    const candidates = Array.from(container.querySelectorAll("text")).filter(
      (node) => {
        if (node.textContent !== lastDeaths) return false;
        if (yAxisTickLabelsGroup?.contains(node)) return false;
        return true;
      },
    );

    expect(candidates).toHaveLength(1);
    // No formatting: not "88.0", not truncated oddly, exactly the verbatim
    // number as text — already guaranteed by the strict `===` filter above,
    // restated here as the behavioral intent.
    expect(candidates[0].textContent).toBe("88");
  });

  it("does not format the label with a locale separator on a larger fixture value", () => {
    const rows: DeathsRow[] = [
      ...SYNTHETIC_ROWS.slice(0, 7),
      { year: 2025, deaths: 1234 },
    ];
    const { container } = renderChart(rows);

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

describe("<DeathsChart> — the Deaths axis label", () => {
  it('renders the word "Deaths" horizontally, with no rotation transform', () => {
    const { container } = renderChart();

    const deathsLabelNodes = Array.from(
      container.querySelectorAll("text"),
    ).filter((node) => node.textContent?.trim() === "Deaths");

    expect(deathsLabelNodes.length).toBeGreaterThanOrEqual(1);

    for (const node of deathsLabelNodes) {
      const transform =
        node.getAttribute("transform") ??
        node.closest("[transform]")?.getAttribute("transform") ??
        "";
      expect(transform).not.toMatch(/rotate\(\s*-?90/);
      expect(node.getAttribute("angle")).not.toBe("-90");
    }
  });
});

describe("<DeathsChart> — accessibility (WCAG 2.2 AA)", () => {
  it("has zero axe-core violations on the rendered figure", async () => {
    const { container } = renderChart();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<DeathsChart> — a genuine zero is data, not an absent year (Edge Case 4)", () => {
  it("renders a row with deaths: 0 as a baseline point, never filtered out", () => {
    const rows: DeathsRow[] = [
      { year: 2018, deaths: 0 },
      ...SYNTHETIC_ROWS.slice(1),
    ];
    const { container } = renderChart(rows);

    const dots = container.querySelectorAll(".recharts-line-dot");
    expect(dots).toHaveLength(rows.length);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps. These are tests too, and the only net for constraints
// the mechanical hook (guard-data-integrity.sh) does not cover for this task
// (SPEC.md Constraints 1, 3, 4 — three-digit deaths figures and a *value*
// import of the token-reading module are both explicitly outside what the
// hook catches). Read via Node's fs, not an import, so these stay meaningful
// even before the component compiles — right now DeathsChart.tsx does not
// exist, so `existsSync` below correctly reports that and every test in this
// block fails loud with a clear message, not a cryptic assertion mismatch.
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const COMPONENTS_DIR = join(SRC_DIR, "components");
const COMPONENT_PATH = join(COMPONENTS_DIR, "DeathsChart.tsx");

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

describe("<DeathsChart> — source-level greps (the only net for these constraints)", () => {
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
      .filter((f) => readFileSync(f, "utf8").includes("process.env"));
    expect(offenders).toEqual([]);
  });

  it("standing clause: no @/ path-alias import in DeathsChart.tsx (Vitest cannot resolve it)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/from\s+["']@\//);
  });

  it("Constraint 1: the sole lib/deaths reference under src/components is an `import type`", () => {
    if (!existsSync(COMPONENTS_DIR)) {
      throw new Error(
        `${COMPONENTS_DIR} does not exist yet — this is expected red until Magnolia implements it.`,
      );
    }
    const libDeathsLines = listFilesRecursive(COMPONENTS_DIR)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => !isTestFile(f))
      .flatMap((f) => readFileSync(f, "utf8").split("\n"))
      .filter((line) => line.includes("lib/deaths"));

    expect(libDeathsLines).toHaveLength(1);
    expect(libDeathsLines[0].trim()).toMatch(/^import type\b/);
  });

  it("Constraint 3: no real deaths figure (231/244/269/297/290/280/268/229) appears as a literal anywhere in non-test src/**", () => {
    const pinnedFigurePattern =
      /(^|[^0-9.])(231|244|269|297|290|280|268|229)([^0-9]|$)/;
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
});
