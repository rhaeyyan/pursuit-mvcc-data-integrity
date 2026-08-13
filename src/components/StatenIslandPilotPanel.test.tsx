// Behavioral / black-box tests for src/components/StatenIslandPilotPanel.tsx
// — written BEFORE that file exists, per CLAUDE.md Rule 4 and SPEC.md's
// standard (non-SPIKE) ordering: Cypress writes failing tests first,
// Magnolia implements against them.
//
// Expect this entire file to fail red on module resolution ("Cannot find
// module './StatenIslandPilotPanel'") until Magnolia creates
// src/components/StatenIslandPilotPanel.tsx — a single-cause failure, not
// evidence of a flawed test.
//
// Contract under test comes verbatim from SPEC.md's "[SPEC] — Staten Island
// pilot panel, chart/UI half" section (Inputs/Outputs, Constraints, Edge
// Cases), not from reading any implementation (there isn't one yet).
//
// Data-layer discipline (mvcc-data skill, NFR-4): the two stats rendered by
// this component (avg2018Monthly, avgMayDec2019) are computed here by
// calling src/lib/statenIslandPilot.ts's own frozen, already-tested pure
// functions on this file's row fixtures — never re-derived by hand — mirroring
// statenIslandPilot.test.ts's own discipline for the same two functions.
// Every row/collision-count fixture below is deliberately synthetic and
// obviously distinct in shape from the real, pinned Staten Island natural-
// experiment figures named in the mvcc-data skill (2018 monthly avg ~514.25,
// Mar 2019 370, Apr 2019 217, May-Dec 2019 avg ~271.25, annual sums 6,171 /
// 3,650) — a passing test here must never be confusable with evidence that
// the live data is correct.
//
// Recharts DOM selectors below (`.recharts-line-curve`, `.recharts-line-dot`,
// `.recharts-reference-line`, `.recharts-xAxis-tick-labels
// .recharts-cartesian-axis-tick-value`) were verified against a real,
// temporarily-installed recharts@3.10.1 two-<Line>-plus-<ReferenceLine>
// render over a synthetic 24-point category axis (never committed) before
// writing the assertions below — same discipline YearlyLineChart.test.tsx's
// own header documents. That probe confirmed: two `<Line>` series sharing one
// boundary data point render as two `.recharts-line-curve` paths (one with no
// dash attribute, one with the series' own `stroke-dasharray`), and their
// `.recharts-line-dot` markers total `rows.length` or `rows.length + 1`
// depending on whether the boundary point is shared between both series or
// left to only one — both are legitimate implementations, so the dot-count
// assertion below is a bounded range, not an exact pin. The 24-point
// category x-axis auto-thins its rendered tick labels (Recharts' default
// `interval` behavior) rather than rendering all 24 — unlike
// YearlyLineChart's 8-point yearly axis, which reliably renders every tick —
// so this file deliberately does NOT assert the reference line's pixel `x1`
// against a specific tick's position; only that a reference line renders,
// with a real, non-empty, series-distinguishable dash pattern.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import type { SIPilotResult, SIPilotRow } from "../lib/statenIslandPilot";
import { avg2018Monthly, avgMayDec2019 } from "../lib/statenIslandPilot";
import { StatenIslandPilotPanel } from "./StatenIslandPilotPanel";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SYNTHETIC_SOQL =
  "SYNTHETIC SI PILOT SOQL FOR COMPONENT TEST $select=... $where=... $group=... $order=...";

// Jan 2018 .. Dec 2019, "YYYY-MM", ascending — the same 24-month shape
// statenIslandPilot.ts's own EXPECTED_MONTHS produces, rebuilt independently
// here (not imported) so a shared bug in that internal list can't silently
// validate itself against this file too.
function buildMonths(): string[] {
  const months: string[] = [];
  for (let year = 2018; year <= 2019; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${String(month).padStart(2, "0")}`);
    }
  }
  return months;
}

const ALL_MONTHS = buildMonths();

// Obviously-synthetic ascending four-digit values, in the thousands — never
// mistakable for the real ~500/~370/~220 monthly counts or the ~6,171/~3,650
// annual sums named in the mvcc-data skill. Index 14 ("2019-03") is the
// derived boundary month (POLICY_DATE_MARKERS' Staten Island entry,
// "2019-03-18".slice(0, 7)) — independently re-typed here, not imported, per
// this codebase's established two-independently-typed-copies redundancy
// convention (see YearlyLineChart.test.tsx's own BOTH_MARKERS_CAPTION
// comment).
const SI_MARKER_ISO_DATE = "2019-03-18";
const SI_MARKER_LABEL = "Staten Island pilot begins";
const BOUNDARY_MONTH = "2019-03"; // SI_MARKER_ISO_DATE.slice(0, 7), re-typed

const SI_ROWS: SIPilotRow[] = ALL_MONTHS.map((month, index) => ({
  month,
  collisions: 4000 + index * 7,
}));

const BOUNDARY_INDEX = SI_ROWS.findIndex((row) => row.month === BOUNDARY_MONTH);
// Sanity-check the fixture itself, not the component — if this ever fails,
// the fixture (not StatenIslandPilotPanel) is broken.
if (BOUNDARY_INDEX !== 14) {
  throw new Error(
    `Fixture assumption broke: expected "${BOUNDARY_MONTH}" at index 14, found it at ${BOUNDARY_INDEX}.`,
  );
}

const OK_RESULT: SIPilotResult = {
  status: "ok",
  soql: SYNTHETIC_SOQL,
  rows: SI_ROWS,
  // Computed by statenIslandPilot.ts's own frozen, already-tested pure
  // functions — never hand-derived (NFR-4).
  stats: {
    avg2018Monthly: avg2018Monthly(SI_ROWS),
    avgMayDec2019: avgMayDec2019(SI_ROWS),
  },
};

const EMPTY_RESULT: SIPilotResult = {
  status: "empty",
  soql: SYNTHETIC_SOQL,
};

const ERROR_RESULT: SIPilotResult = {
  status: "error",
  soql: SYNTHETIC_SOQL,
  kind: "upstream",
  reason:
    "the request to Socrata failed (network error or timeout) (synthetic test reason)",
};

// Edge Case 3: a row window that does NOT contain the boundary month at all
// (only 2018 months) — proves the "no marker falls within range" defensive
// path without depending on any change to the frozen 2018-2019 window
// contract; this fixture is deliberately narrower than what
// fetchStatenIslandPilot() would ever actually return, exactly the way
// YearlyLineChart.test.tsx's `withYearsFrom` narrows its own fixture to
// exercise an analogous defensive branch.
const NO_BOUNDARY_ROWS: SIPilotRow[] = SI_ROWS.slice(0, 12); // 2018-01..2018-12
const NO_BOUNDARY_RESULT: SIPilotResult = {
  status: "ok",
  soql: SYNTHETIC_SOQL,
  rows: NO_BOUNDARY_ROWS,
  // Arbitrary synthetic values — this fixture's point is the chart's
  // solid/dashed and reference-line behavior, not the stats paragraph.
  stats: { avg2018Monthly: 999.9, avgMayDec2019: 111.1 },
};

// ---------------------------------------------------------------------------
// DOM helpers (verified against a real recharts@3.10.1 render — see header)
// ---------------------------------------------------------------------------

function getFigure(container: HTMLElement): HTMLElement | null {
  return container.querySelector("figure");
}

function getPlotWrapper(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="img"]');
}

function lineCurves(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(".recharts-line-curve"));
}

function lineDots(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(".recharts-line-dot"));
}

function referenceLineGroups(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(".recharts-reference-line"));
}

function referenceLineElements(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll(".recharts-reference-line line"),
  );
}

function isRealDash(value: string | null): boolean {
  return value !== null && value !== "" && value !== "0" && value !== "none";
}

// ---------------------------------------------------------------------------
// status: "ok" — chart, table, stats, disclosure
// ---------------------------------------------------------------------------

describe("<StatenIslandPilotPanel> — status: ok — figure, caption, accessible name", () => {
  it("renders a <figure> containing a role=img plot wrapper and a <figcaption>", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const figure = getFigure(container);
    expect(figure).toBeInTheDocument();

    const plot = getPlotWrapper(container);
    expect(plot).toBeInTheDocument();
    expect(figure?.contains(plot)).toBe(true);

    const figcaption = figure?.querySelector("figcaption");
    expect(figcaption).toBeInTheDocument();
  });

  it("the plot wrapper has role=img with a non-empty, descriptive aria-label naming Staten Island and the pilot window", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const plot = getPlotWrapper(container);
    const label = plot?.getAttribute("aria-label") ?? "";
    expect(label.trim().length).toBeGreaterThan(0);
    expect(label).toMatch(/staten island/i);
  });

  it("the figcaption names the Jan 2018-Dec 2019 pilot window", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const figcaption = container.querySelector("figcaption");
    const text = figcaption?.textContent ?? "";
    expect(text).toMatch(/2018/);
    expect(text).toMatch(/2019/);
  });

  it("the figcaption carries the FR-3 inline label (an 'affected'/reporting-decline sentence) when a boundary marker is found", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const figcaption = container.querySelector("figcaption");
    const text = figcaption?.textContent ?? "";
    expect(text).toMatch(/affected/i);
    expect(text).toMatch(/report/i);
  });

  it("the figcaption carries the FR-13 marker sentence naming the Staten Island marker's label and ISO date when a boundary marker is found", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const figcaption = container.querySelector("figcaption");
    const text = figcaption?.textContent ?? "";
    expect(text).toContain(SI_MARKER_LABEL);
    expect(text).toContain(SI_MARKER_ISO_DATE);
  });
});

describe("<StatenIslandPilotPanel> — status: ok — the accessible table (NFR-3)", () => {
  it("renders a <table> with a real, non-empty <caption>", () => {
    render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const table = screen.getByRole("table");
    const caption = table.querySelector("caption");
    expect(caption).toBeInTheDocument();
    expect(caption?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it('renders exactly the pinned column headers <th scope="col">Month</th> and <th scope="col">Collisions</th>', () => {
    render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const table = screen.getByRole("table");
    const monthHeader = within(table).getByRole("columnheader", {
      name: "Month",
    });
    const collisionsHeader = within(table).getByRole("columnheader", {
      name: "Collisions",
    });
    expect(monthHeader.tagName).toBe("TH");
    expect(monthHeader.getAttribute("scope")).toBe("col");
    expect(collisionsHeader.tagName).toBe("TH");
    expect(collisionsHeader.getAttribute("scope")).toBe("col");
  });

  it("renders exactly 24 data rows (25 with the header row), one per result.rows entry", () => {
    render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(SI_ROWS.length + 1);
  });

  it("renders every row's month and collisions value verbatim, month then collisions, matching result.rows exactly", () => {
    render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const table = screen.getByRole("table");
    for (const row of SI_ROWS) {
      const monthCell = within(table).getByText(row.month);
      const tr = monthCell.closest("tr");
      expect(tr).toBeInTheDocument();
      expect(tr).toHaveTextContent(String(row.collisions));
    }
  });
});

describe("<StatenIslandPilotPanel> — status: ok — the stats paragraph (NFR-4: display-formatted only)", () => {
  it("renders avg2018Monthly and avgMayDec2019, each formatted to one decimal (.toFixed(1)), never re-derived", () => {
    render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const text = document.body.textContent ?? "";
    if (OK_RESULT.status !== "ok") throw new Error("fixture is not ok");
    expect(text).toContain(OK_RESULT.stats.avg2018Monthly.toFixed(1));
    expect(text).toContain(OK_RESULT.stats.avgMayDec2019.toFixed(1));
  });

  it("reflects a different stats object distinctly — the values are read from props, not hardcoded", () => {
    const distinctResult: SIPilotResult = {
      ...OK_RESULT,
      stats: { avg2018Monthly: 123.45, avgMayDec2019: 678.91 },
    };
    render(<StatenIslandPilotPanel result={distinctResult} />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("123.5");
    expect(text).toContain("678.9");
    if (OK_RESULT.status !== "ok") throw new Error("fixture is not ok");
    expect(text).not.toContain(OK_RESULT.stats.avg2018Monthly.toFixed(1));
  });
});

describe("<StatenIslandPilotPanel> — status: ok — the line split (solid before the boundary, dashed from it — FR-3/NFR-5)", () => {
  it("renders exactly 2 line-curve paths: one with no dash, one with an 8 6 dash pattern", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const curves = lineCurves(container);
    expect(curves).toHaveLength(2);

    const dashes = curves.map((c) => c.getAttribute("stroke-dasharray"));
    const solidCount = dashes.filter((d) => !isRealDash(d)).length;
    const dashedCount = dashes.filter((d) => d === "8 6").length;
    expect(solidCount).toBe(1);
    expect(dashedCount).toBe(1);
  });

  it("never renders a uniformly dashed line — at least one segment has no dash pattern", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const curves = lineCurves(container);
    const anySolid = curves.some(
      (c) => !isRealDash(c.getAttribute("stroke-dasharray")),
    );
    expect(anySolid).toBe(true);
  });

  it("plots every row (no fewer than 24 markers, no more than 25 — the +1 allows a shared boundary point between the two segments)", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const dots = lineDots(container);
    expect(dots.length).toBeGreaterThanOrEqual(SI_ROWS.length);
    expect(dots.length).toBeLessThanOrEqual(SI_ROWS.length + 1);
  });

  it("renders exactly one reference-line marker at the boundary, with a real, non-empty dash pattern distinct from the data series' 8 6 pattern", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    expect(referenceLineGroups(container)).toHaveLength(1);
    const lines = referenceLineElements(container);
    expect(lines).toHaveLength(1);

    const dash = lines[0].getAttribute("stroke-dasharray");
    expect(isRealDash(dash)).toBe(true);
    expect(dash).not.toBe("8 6");
  });
});

describe("<StatenIslandPilotPanel> — the SoQL disclosure (FR-8) — always present", () => {
  it("renders <details><summary>SoQL query — staten-island-pilot</summary><pre><code>{soql}</code></pre></details> on the ok path", () => {
    const { container } = render(<StatenIslandPilotPanel result={OK_RESULT} />);

    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    const summary = details?.querySelector("summary");
    expect(summary?.textContent).toBe("SoQL query — staten-island-pilot");
    const code = details?.querySelector("pre code");
    expect(code?.textContent).toBe(SYNTHETIC_SOQL);
  });

  it("renders the same disclosure on the empty path", () => {
    const { container } = render(
      <StatenIslandPilotPanel result={EMPTY_RESULT} />,
    );

    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(details?.querySelector("summary")?.textContent).toBe(
      "SoQL query — staten-island-pilot",
    );
    expect(details?.querySelector("pre code")?.textContent).toBe(
      SYNTHETIC_SOQL,
    );
  });

  it("renders the same disclosure on the error path", () => {
    const { container } = render(
      <StatenIslandPilotPanel result={ERROR_RESULT} />,
    );

    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(details?.querySelector("summary")?.textContent).toBe(
      "SoQL query — staten-island-pilot",
    );
    expect(details?.querySelector("pre code")?.textContent).toBe(
      SYNTHETIC_SOQL,
    );
  });
});

// ---------------------------------------------------------------------------
// status: "empty"
// ---------------------------------------------------------------------------

describe('<StatenIslandPilotPanel> — status: "empty" (Edge Case 2)', () => {
  it('renders a <p role="status"> naming the Jan 2018-Dec 2019 window, with no chart, table, or stats', () => {
    const { container } = render(
      <StatenIslandPilotPanel result={EMPTY_RESULT} />,
    );

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status.textContent).toMatch(/2018/);
    expect(status.textContent).toMatch(/2019/);

    expect(container.querySelector("figure")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(lineCurves(container)).toHaveLength(0);
  });

  it("has zero axe-core violations on the empty state", async () => {
    const { container } = render(
      <StatenIslandPilotPanel result={EMPTY_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// status: "error"
// ---------------------------------------------------------------------------

describe('<StatenIslandPilotPanel> — status: "error" (Edge Case 1)', () => {
  it('renders a <p role="alert"> with result.reason rendered verbatim, with no chart, table, or stats', () => {
    const { container } = render(
      <StatenIslandPilotPanel result={ERROR_RESULT} />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    if (ERROR_RESULT.status !== "error")
      throw new Error("fixture is not error");
    expect(alert.textContent).toContain(ERROR_RESULT.reason);

    expect(container.querySelector("figure")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(lineCurves(container)).toHaveLength(0);
  });

  it("reflects a different reason string verbatim — never a hardcoded/generic message", () => {
    const distinctError: SIPilotResult = {
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "a completely different synthetic reason, never seen before",
    };
    render(<StatenIslandPilotPanel result={distinctError} />);

    expect(
      screen.getByText(/a completely different synthetic reason/i),
    ).toBeInTheDocument();
  });

  it("has zero axe-core violations on the error state", async () => {
    const { container } = render(
      <StatenIslandPilotPanel result={ERROR_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Edge Case 3: no POLICY_DATE_MARKERS entry's derived month falls within
// result.rows' range
// ---------------------------------------------------------------------------

describe("<StatenIslandPilotPanel> — status: ok, no boundary in range (Edge Case 3 — defensive, never crash, never fabricate a boundary)", () => {
  it("renders a single, fully solid, undashed line — never throws", () => {
    expect(() =>
      render(<StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />),
    ).not.toThrow();
  });

  it("renders exactly 1 line-curve path with no dash pattern", () => {
    const { container } = render(
      <StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />,
    );

    const curves = lineCurves(container);
    expect(curves).toHaveLength(1);
    expect(isRealDash(curves[0].getAttribute("stroke-dasharray"))).toBe(false);
  });

  it("renders no reference-line marker at all", () => {
    const { container } = render(
      <StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />,
    );

    expect(referenceLineGroups(container)).toHaveLength(0);
    expect(referenceLineElements(container)).toHaveLength(0);
  });

  it("renders no FR-3 inline label and no FR-13 marker sentence in the figcaption", () => {
    const { container } = render(
      <StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />,
    );

    const figcaption = container.querySelector("figcaption");
    const text = figcaption?.textContent ?? "";
    expect(text).not.toMatch(/affected/i);
    expect(text).not.toContain(SI_MARKER_LABEL);
    expect(text).not.toContain(SI_MARKER_ISO_DATE);
  });

  it("still renders the table and stats paragraph normally — Edge Case 3 affects only the chart region", () => {
    render(<StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />);

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(
      NO_BOUNDARY_ROWS.length + 1,
    );
  });

  it("has zero axe-core violations on the no-boundary-found path", async () => {
    const { container } = render(
      <StatenIslandPilotPanel result={NO_BOUNDARY_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Edge Case 6: defensive multi-marker handling — render every matching
// reference line, never assume exactly one. Uses an isolated module mock
// (vi.doMock + dynamic import) so it does not disturb every other test in
// this file, which relies on the real, frozen POLICY_DATE_MARKERS.
// ---------------------------------------------------------------------------

describe("<StatenIslandPilotPanel> — Edge Case 6: renders every matching reference line if POLICY_DATE_MARKERS ever grows a second in-window entry", () => {
  afterEach(() => {
    vi.doUnmock("../lib/policyDates");
    vi.resetModules();
  });

  it("renders 2 reference-line groups when 2 markers' derived months both fall within rows' range", async () => {
    vi.resetModules();
    vi.doMock("../lib/policyDates", () => ({
      POLICY_DATE_MARKERS: [
        { year: 2018, isoDate: "2018-06-15", label: "Hypothetical marker A" },
        { year: 2019, isoDate: SI_MARKER_ISO_DATE, label: SI_MARKER_LABEL },
      ],
    }));

    const { StatenIslandPilotPanel: IsolatedPanel } =
      await import("./StatenIslandPilotPanel");
    const { container } = render(<IsolatedPanel result={OK_RESULT} />);

    expect(referenceLineGroups(container)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — the only net for constraints the mechanical hook
// (guard-data-integrity.sh) does not cover for this task (type-only import
// discipline, the boundary-month/date literal ban, colour literals). Read via
// Node's fs, not an import, so these stay meaningful even before the
// component compiles. Mirrors YearlyLineChart.test.tsx's own discipline.
// ---------------------------------------------------------------------------

const COMPONENT_PATH = join(__dirname, "StatenIslandPilotPanel.tsx");

function readComponentSourceOrFail(): string {
  if (!existsSync(COMPONENT_PATH)) {
    throw new Error(
      `${COMPONENT_PATH} does not exist yet — this is expected red until Magnolia implements it.`,
    );
  }
  return readFileSync(COMPONENT_PATH, "utf8");
}

describe("<StatenIslandPilotPanel> — source-level greps (the only net for these constraints)", () => {
  it("carries the 'use client' directive (Recharts, matches YearlyLineChart.tsx)", () => {
    const source = readComponentSourceOrFail();
    const firstNonEmptyLines = source
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .join("\n");
    expect(firstNonEmptyLines).toMatch(/['"]use client['"]/);
  });

  it("imports SIPilotResult (and any other statenIslandPilot type it uses) as `import type` only — never a value import of the token-reading module", () => {
    const source = readComponentSourceOrFail();
    const statenIslandPilotLines = source
      .split("\n")
      .filter((line) => line.includes("lib/statenIslandPilot"));

    expect(statenIslandPilotLines.length).toBeGreaterThan(0);
    for (const line of statenIslandPilotLines) {
      expect(line.trim()).toMatch(/^import type\b/);
    }
  });

  it("imports POLICY_DATE_MARKERS from ../lib/policyDates as a genuine (non-type-only) value import", () => {
    const source = readComponentSourceOrFail();
    const policyDatesLines = source
      .split("\n")
      .filter((line) => line.includes("lib/policyDates"));

    expect(policyDatesLines.length).toBeGreaterThan(0);
    expect(
      policyDatesLines.some((line) => !/^import type\b/.test(line.trim())),
    ).toBe(true);
  });

  it("contains no colour literal (#rrggbb, rgb(), hsl()) — all colour lives in the CSS module", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/rgb\(/i);
    expect(source).not.toMatch(/hsl\(/i);
  });

  it("no process.env anywhere in this component (the token stays server-side, in statenIslandPilot.ts only)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/process\.env/);
  });

  it("never hardcodes the boundary month or the Staten Island marker's ISO date as an independent literal — both must be derived from POLICY_DATE_MARKERS", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/2019-03/);
  });

  it("never hardcodes any of the real, pinned Staten Island natural-experiment figures (514, 370, 217, 271, 6171, 3650) as a literal", () => {
    const source = readComponentSourceOrFail();
    const pinnedNumbers = [514, 370, 217, 271, 6171, 3650];
    for (const num of pinnedNumbers) {
      const pattern = new RegExp(`(^|[^0-9.])(${num})([^0-9]|$)`);
      expect(source).not.toMatch(pattern);
    }
  });

  it("uses isAnimationActive={false}, never {true} (respects prefers-reduced-motion, matches YearlyLineChart.tsx)", () => {
    const source = readComponentSourceOrFail();
    expect(source).toMatch(/isAnimationActive=\{false\}/);
    expect(source).not.toMatch(/isAnimationActive=\{true\}/);
  });

  it("never calls toLocaleDateString() — row.month renders as returned ('YYYY-MM')", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/toLocaleDateString/);
  });

  it("standing clause: no @/ path-alias import (Vitest cannot resolve it)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
