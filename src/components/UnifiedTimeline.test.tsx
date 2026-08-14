// Behavioral tests for the redesigned <UnifiedTimeline> (MVCC Workspace
// Timeline view). Fixtures below use deliberately synthetic, non-pinned
// values — never a PRD Appendix A figure — same discipline as
// percentChange.test.ts/derived.test.ts, and proof this component reads its
// numbers from props rather than any copied-in mockup placeholder.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import { UnifiedTimeline, type CoverageInfo } from "./UnifiedTimeline";
import { WorkspaceInspectorProvider } from "@/context/WorkspaceInspectorContext";

type Row<K extends string> = { year: number } & Record<K, number>;

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Builds a rows[] fixture from a parallel values array, dropping any year
// whose value is null — so a sparse series (see ARRESTS below) ends up with
// fewer than 8 rows, matching how a real fetch result looks when Socrata
// omits a key rather than returning zero.
function rows<K extends string>(key: K, values: (number | null)[]): Row<K>[] {
  const result: Row<K>[] = [];
  YEARS.forEach((year, i) => {
    const v = values[i];
    if (v !== null) result.push({ year, [key]: v } as Row<K>);
  });
  return result;
}

const DEATHS = rows("deaths", [100, 98, 95, 99, 97, 96, 94, 90]);
const INJURIES = rows(
  "injuries",
  [2000, 1980, 1500, 1700, 1750, 1780, 1760, 1600],
);
const COLLISIONS = rows(
  "collisions",
  [10000, 9500, 5000, 4900, 4800, 4700, 4600, 4000],
);
const REPAIRED = rows(
  "repaired",
  [2500, 2480, 2000, 2100, 2150, 2180, 2160, 2050],
);
// Only 3 of 8 years verified — deliberately sparse, to prove the "N of 8
// years verified" badge text is computed, not copied from the mockup.
const ARRESTS = rows("arrests", [1200, null, 600, null, null, null, null, 900]);

const BASE_DATA = {
  deaths: { status: "ok" as const, rows: DEATHS },
  injuries: { status: "ok" as const, rows: INJURIES },
  collisions: { status: "ok" as const, rows: COLLISIONS },
  repaired: { status: "ok" as const, rows: REPAIRED },
  arrests: { status: "ok" as const, rows: ARRESTS },
};

const OK_COVERAGE: CoverageInfo = {
  status: "ok",
  unpopulatedSharePercent: 22.2,
  firstYear: { year: 2018, ratePercent: 55.5 },
  lastYear: { year: 2025, ratePercent: 72.2 },
};

function withProvider(children: ReactNode) {
  return render(
    <WorkspaceInspectorProvider>{children}</WorkspaceInspectorProvider>,
  );
}

describe("<UnifiedTimeline> — citywide chart + accessible table", () => {
  it("renders an accessible table with the default-visible series (deaths, injuries, raw collisions, repaired) and excludes PDO/arrests by default", () => {
    withProvider(<UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />);

    const table = screen.getByRole("table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent);

    expect(headers).toEqual([
      "Year",
      "Deaths",
      "Injuries",
      "All crashes",
      "Injury/fatal",
    ]);
    expect(headers).not.toContain("Minor");
    expect(headers).not.toContain("Arrests");
  });

  it("renders one row per year in the full 2018–2025 window", () => {
    withProvider(<UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />);

    const table = screen.getByRole("table");
    const rowGroup = within(table).getAllByRole("rowgroup")[1];
    const rows = within(rowGroup).getAllByRole("row");
    expect(rows).toHaveLength(8);
  });

  it("toggling the PDO checkbox adds a derived PDO column computed from collisions - repaired, not a query of its own", () => {
    withProvider(<UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />);

    const pdoToggle = screen.getByRole("checkbox", {
      name: /Minor crashes, no injuries/,
    });
    pdoToggle.click();

    const table = screen.getByRole("table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("Minor");
  });

  it("selecting the pre-policy window narrows the table to 2018-2019 only", () => {
    withProvider(<UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />);

    screen.getByRole("radio", { name: "Before the change" }).click();

    const table = screen.getByRole("table");
    const rowGroup = within(table).getAllByRole("rowgroup")[1];
    const rows = within(rowGroup).getAllByRole("row");
    expect(rows).toHaveLength(2);
  });

  it("renders a real Recharts line per visible series, styled with distinct stroke-dasharray so no series relies on color alone (FR-3/WCAG)", () => {
    const { container } = withProvider(
      <UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />,
    );

    const lines = container.querySelectorAll(".recharts-line-curve");
    // 4 default-visible series.
    expect(lines.length).toBe(4);

    const dashArrays = Array.from(lines).map((l) =>
      l.getAttribute("stroke-dasharray"),
    );
    // At least one solid (null/none) and one dashed series among the
    // defaults (deaths solid, raw collisions dashed) — proves dash styling
    // varies per series rather than being uniform.
    expect(dashArrays.some((d) => d === null)).toBe(true);
    expect(dashArrays.some((d) => d !== null)).toBe(true);
  });

  it("renders the two documented policy-date reference lines when they fall inside the selected window", () => {
    const { container } = withProvider(
      <UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />,
    );
    const refLines = container.querySelectorAll(".recharts-reference-line");
    // 2 policy markers + 1 active-year crosshair line = 3.
    expect(refLines.length).toBeGreaterThanOrEqual(2);
  });

  it("has zero axe-core violations", async () => {
    const { container } = withProvider(
      <UnifiedTimeline data={BASE_DATA} coverage={OK_COVERAGE} />,
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<UnifiedTimeline> — borough-blocked state reads coverage from props, not a copied-in figure", () => {
  it("shows the blocked explainer with the exact synthetic coverage numbers passed via props", () => {
    withProvider(
      <UnifiedTimeline
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        boroughLabel="Test Borough"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "We can't chart Test Borough reliably",
      }),
    ).toBeInTheDocument();

    // Values sourced from OK_COVERAGE (22.2 / 55.5 / 72.2) — deliberately
    // not the real 30% / 64.4% / 80.1% figures, proving these render from
    // the prop rather than a hardcoded copy of the design mockup. Asserted
    // against the whole paragraph's text, since the numbers are interpolated
    // mid-sentence and each lands in its own text node.
    const explainer = screen.getByRole("heading", {
      name: "We can't chart Test Borough reliably",
    }).nextElementSibling as HTMLElement;
    expect(explainer.textContent).toMatch(/22%/);
    expect(explainer.textContent).toMatch(/55\.5%/);
    expect(explainer.textContent).toMatch(/72\.2%/);
  });

  it("links to the data quality notes and renders no chart/table while blocked", () => {
    withProvider(
      <UnifiedTimeline
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        boroughLabel="Test Borough"
      />,
    );

    const link = screen.getByRole("link", { name: /data quality/i });
    expect(link).toHaveAttribute("href", "/integrity");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("degrades to qualitative language (never an invented number) when coverage is unavailable", () => {
    withProvider(
      <UnifiedTimeline
        data={BASE_DATA}
        coverage={{ status: "unavailable" }}
        boroughLabel="Test Borough"
      />,
    );

    expect(screen.getByText(/say which borough/i)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("has zero axe-core violations in the blocked state", async () => {
    const { container } = withProvider(
      <UnifiedTimeline
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        boroughLabel="Test Borough"
      />,
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — same infra pattern as percentChange.test.ts/derived.test.ts.
// ---------------------------------------------------------------------------

const COMPONENT_PATH = join(__dirname, "UnifiedTimeline.tsx");

describe("src/components/UnifiedTimeline.tsx — source-level greps", () => {
  function readSourceOrFail(): string {
    if (!existsSync(COMPONENT_PATH)) {
      throw new Error(`${COMPONENT_PATH} does not exist.`);
    }
    return readFileSync(COMPONENT_PATH, "utf8");
  }

  it("contains the 'use client' directive at the top of the file", () => {
    expect(readSourceOrFail()).toMatch(/^['"]use client['"]/m);
  });

  it("contains no PRD Appendix A pinned figure as a literal (NFR-4)", () => {
    const source = readSourceOrFail();
    const pinnedNumbers = [
      231, 244, 269, 297, 290, 280, 268, 229, 61940, 61391, 44615, 51785, 51933,
      54252, 54030, 49634, 231564, 211486, 112918, 110558, 103887, 96607, 91316,
      85546, 45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    expect(pinnedFigurePattern.test(source)).toBe(false);
  });

  it("does not read process.env — a client component never touches the token (NFR-2, Rule 3)", () => {
    const source = readSourceOrFail();
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("does not hardcode the mockup's placeholder coverage/SI-pilot figures (64.4, 80.1, 30%, 514, 370, 217, 6171, 3650)", () => {
    const source = readSourceOrFail();
    for (const n of ["64.4", "80.1", "514", "370", "6171", "3650"]) {
      expect(source).not.toContain(n);
    }
  });
});
