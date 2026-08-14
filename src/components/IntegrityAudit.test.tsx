// Behavioral tests for the redesigned <IntegrityAudit> (MVCC Workspace
// Integrity audit view). Fixtures use deliberately synthetic, non-pinned
// values — never a PRD Appendix A figure — same discipline as
// UnifiedTimeline.test.tsx, and proof this component reads its numbers from
// props rather than any copied-in mockup placeholder.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import {
  IntegrityAudit,
  type CoverageProp,
  type SIPilotProp,
} from "./IntegrityAudit";
import { WorkspaceInspectorProvider } from "@/context/WorkspaceInspectorContext";
import type { SeriesData } from "@/lib/seriesConfig";

type Row<K extends string> = { year: number } & Record<K, number>;

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

function rows<K extends string>(key: K, values: number[]): Row<K>[] {
  return YEARS.map((year, i) => ({ year, [key]: values[i] }) as Row<K>);
}

// collisions - repaired = pdo, per year, so the tier table's PDO row can be
// checked against a hand-computed expectation below.
const COLLISIONS = rows(
  "collisions",
  [8000, 7800, 4000, 3900, 3850, 3800, 3750, 3200],
);
const REPAIRED = rows(
  "repaired",
  [2000, 1980, 1700, 1750, 1780, 1790, 1795, 1900],
);
const DEATHS = rows("deaths", [80, 82, 90, 88, 85, 84, 83, 79]);
const INJURIES = rows(
  "injuries",
  [1500, 1480, 1100, 1200, 1250, 1260, 1270, 1350],
);
const ARRESTS = rows("arrests", [500, 480, 300, 310, 320, 330, 340, 350]);

const BASE_DATA: SeriesData = {
  deaths: { status: "ok", rows: DEATHS },
  injuries: { status: "ok", rows: INJURIES },
  collisions: { status: "ok", rows: COLLISIONS },
  repaired: { status: "ok", rows: REPAIRED },
  arrests: { status: "ok", rows: ARRESTS },
};

const OK_COVERAGE: CoverageProp = {
  status: "ok",
  windowUnpopulatedSharePercent: 25.5,
  yearly: [
    { year: 2018, total: 8000, populated: 4812, coverageRatePercent: 60.1 },
    { year: 2019, total: 7800, populated: 4800, coverageRatePercent: 61.5 },
    { year: 2020, total: 4000, populated: 2800, coverageRatePercent: 70.0 },
    { year: 2021, total: 3900, populated: 2800, coverageRatePercent: 71.8 },
    { year: 2022, total: 3850, populated: 2820, coverageRatePercent: 73.2 },
    { year: 2023, total: 3800, populated: 2830, coverageRatePercent: 74.5 },
    { year: 2024, total: 3750, populated: 2820, coverageRatePercent: 75.2 },
    { year: 2025, total: 3200, populated: 2416, coverageRatePercent: 75.5 },
  ],
};

const OK_SI_PILOT: SIPilotProp = {
  status: "ok",
  avg2018Monthly: 666.7,
  avgMayDec2019: 480.25,
  // Deliberately distinct from OK_COVERAGE's 2018 `total` (8000) so the two
  // sections' numbers can be asserted unambiguously with getByText.
  year2018Total: 8004,
  april2019: 512,
};

function withProvider(children: ReactNode) {
  return render(
    <WorkspaceInspectorProvider>{children}</WorkspaceInspectorProvider>,
  );
}

describe("<IntegrityAudit> — coverage warning reads real numbers from props", () => {
  it("renders the exact synthetic coverage numbers passed via props", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );

    // Scoped to the role="status" banner: 60.1%/75.5% also appear in the
    // coverage-by-year table further down (same underlying fixture years),
    // which would otherwise make getByText ambiguous.
    const banner = screen.getByRole("status");
    expect(within(banner).getByText(/25\.5%/)).toBeInTheDocument();
    expect(within(banner).getByText(/60\.1%/)).toBeInTheDocument();
    expect(within(banner).getByText(/75\.5%/)).toBeInTheDocument();
  });

  it("degrades to a plain explanation (never an invented number) when coverage is unavailable", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={{ status: "unavailable" }}
        siPilot={OK_SI_PILOT}
      />,
    );
    expect(screen.getByText(/could not be fetched live/i)).toBeInTheDocument();
  });
});

describe("<IntegrityAudit> — ladder of discretion computes real percent changes", () => {
  it("shows a distinct, correctly-signed delta per series derived from the rows fixtures (not a shared/copied value)", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );

    const ladderHeading = screen.getByRole("heading", {
      name: "The gradient of discretion",
    });
    const ladderSection = ladderHeading.closest("section") as HTMLElement;
    expect(ladderSection).not.toBeNull();

    // collisions: 8000 -> 3200 = -60%; deaths: 80 -> 79 ~ -1%. Scoped to
    // this section since the tier table below repeats the raw-collisions
    // delta and would otherwise make getByText ambiguous.
    expect(within(ladderSection).getByText("-60%")).toBeInTheDocument();
    expect(within(ladderSection).getByText("-1%")).toBeInTheDocument();
  });
});

describe("<IntegrityAudit> — tier table includes a derived PDO row, not a fabricated query", () => {
  it("computes the PDO row as collisions - repaired for the first and last year", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );

    const table = screen.getAllByRole("table")[0];
    const pdoRow = within(table).getByRole("row", {
      name: /Property-damage-only/,
    });
    // 2018: 8000-2000=6000; 2025: 3200-1900=1300.
    expect(within(pdoRow).getByText("6,000")).toBeInTheDocument();
    expect(within(pdoRow).getByText("1,300")).toBeInTheDocument();
  });
});

describe("<IntegrityAudit> — Staten Island section reads siPilot props, never the mockup's placeholder prose", () => {
  it("renders the exact synthetic SI pilot numbers passed via props", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );
    expect(screen.getByText(/667/)).toBeInTheDocument(); // Math.round(666.7)
    expect(screen.getByText(/512/)).toBeInTheDocument();
    expect(screen.getByText(/8,004/)).toBeInTheDocument();
  });

  it("shows the fetch-failure reason (never an invented figure) when siPilot is unavailable", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={{ status: "unavailable", reason: "synthetic test reason" }}
      />,
    );
    expect(screen.getByText(/synthetic test reason/)).toBeInTheDocument();
  });
});

describe("<IntegrityAudit> — coverage-by-year table renders every row from props", () => {
  it("renders all 8 years, not just the mockup's illustrative 2", () => {
    withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );
    const tables = screen.getAllByRole("table");
    const coverageTable = tables[tables.length - 1];
    const rowGroup = within(coverageTable).getAllByRole("rowgroup")[1];
    expect(within(rowGroup).getAllByRole("row")).toHaveLength(8);
  });
});

describe("<IntegrityAudit> — accessibility", () => {
  it("has zero axe-core violations", async () => {
    const { container } = withProvider(
      <IntegrityAudit
        data={BASE_DATA}
        coverage={OK_COVERAGE}
        siPilot={OK_SI_PILOT}
      />,
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — same infra pattern as UnifiedTimeline.test.tsx.
// ---------------------------------------------------------------------------

const COMPONENT_PATH = join(__dirname, "IntegrityAudit.tsx");

describe("src/components/IntegrityAudit.tsx — source-level greps", () => {
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

  it("does not hardcode the mockup's placeholder coverage/SI-pilot figures", () => {
    const source = readSourceOrFail();
    for (const n of [
      "64.4",
      "80.1",
      "514",
      "370",
      "217",
      "6,171",
      "6171",
      "3,650",
      "3650",
    ]) {
      expect(source).not.toContain(n);
    }
  });
});
