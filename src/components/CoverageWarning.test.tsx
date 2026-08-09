// Failing tests for src/components/CoverageWarning.tsx, written BEFORE that file
// exists, per CLAUDE.md Rule 4 and SPEC.md's standard (non-SPIKE) ordering:
// Cypress writes failing tests first, Magnolia implements against them.
//
// Expect this file to fail red on module resolution ("Cannot find module './CoverageWarning'")
// until Magnolia creates src/components/CoverageWarning.tsx — a single-cause failure,
// not evidence of a flawed test.
//
// Contract under test comes from SPEC.md's FR-7 Phase 6 "[SPEC]" Inputs/Outputs section.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import type { CoverageResult } from "../lib/arrestsCoverage";
import { CoverageWarning } from "./CoverageWarning";

const OK_COVERAGE_RESULT: CoverageResult = {
  status: "ok",
  collisions: {
    yearly: [
      { year: 2018, total: 231564, populated: 160000, coverageRatePercent: 69.1 },
      { year: 2019, total: 211486, populated: 145000, coverageRatePercent: 68.6 },
      { year: 2020, total: 112918, populated: 78000, coverageRatePercent: 69.1 },
      { year: 2021, total: 110558, populated: 76000, coverageRatePercent: 68.7 },
      { year: 2022, total: 103887, populated: 72000, coverageRatePercent: 69.3 },
      { year: 2023, total: 96607, populated: 66000, coverageRatePercent: 68.3 },
      { year: 2024, total: 91316, populated: 63000, coverageRatePercent: 69.0 },
      { year: 2025, total: 85546, populated: 59000, coverageRatePercent: 69.0 },
    ],
    totalWindow: 1043882,
    populatedWindow: 719000,
    windowUnpopulatedSharePercent: 31.1,
  },
  arrests: {
    yearly: [
      { year: 2018, total: 29007, populated: 19500, coverageRatePercent: 67.2 },
      { year: 2019, total: 25000, populated: 16800, coverageRatePercent: 67.2 },
      { year: 2020, total: 8330, populated: 5580, coverageRatePercent: 67.0 },
      { year: 2021, total: 12000, populated: 8040, coverageRatePercent: 67.0 },
      { year: 2022, total: 15000, populated: 10050, coverageRatePercent: 67.0 },
      { year: 2023, total: 18000, populated: 12060, coverageRatePercent: 67.0 },
      { year: 2024, total: 20000, populated: 13400, coverageRatePercent: 67.0 },
      { year: 2025, total: 21123, populated: 14173, coverageRatePercent: 67.1 },
    ],
    totalWindow: 148460,
    populatedWindow: 99603,
    windowUnpopulatedSharePercent: 32.9,
  },
};

const PARTIAL_COVERAGE_RESULT: CoverageResult = {
  status: "partial",
  collisions: OK_COVERAGE_RESULT.collisions,
  reason: "Failed to fetch arrests coverage data",
};

const ERROR_COVERAGE_RESULT: CoverageResult = {
  status: "error",
  kind: "upstream",
  reason: "Failed to fetch coverage data for both datasets",
};

const NON_COMPARABILITY_SENTENCE =
  "These coverage rates describe dataset record-keeping completeness, not enforcement activity, and cannot be compared between datasets.";

const SEE_CAVEATS_SENTENCE =
  "See Caveats below for additional reporting policy context.";

describe("<CoverageWarning> — status: 'ok' path (FR-7 Phase 6)", () => {
  it("renders an <aside aria-label=\"Dataset coverage warning\"> landmark container", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    const aside = screen.getByRole("complementary", {
      name: "Dataset coverage warning",
    });
    expect(aside).toBeInTheDocument();
    expect(aside.tagName).toBe("ASIDE");
  });

  it("collisions coverage block leads with window unpopulated share percentage", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    const aside = screen.getByRole("complementary", {
      name: "Dataset coverage warning",
    });
    expect(within(aside).getByText(/31\.1%/)).toBeInTheDocument();
  });

  it("renders the explicit non-comparability sentence verbatim between blocks", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    expect(screen.getByText(NON_COMPARABILITY_SENTENCE)).toBeInTheDocument();
  });

  it("arrests coverage block follows as a concise sentence containing its window unpopulated share percentage", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    const aside = screen.getByRole("complementary", {
      name: "Dataset coverage warning",
    });
    expect(within(aside).getByText(/32\.9%/)).toBeInTheDocument();
  });

  it("preserves document ordering: collisions block -> non-comparability sentence -> arrests block", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    const collisionsText = screen.getByText(/31\.1%/);
    const nonCompText = screen.getByText(NON_COMPARABILITY_SENTENCE);
    const arrestsText = screen.getByText(/32\.9%/);

    const pos1 = collisionsText.compareDocumentPosition(nonCompText);
    expect(Boolean(pos1 & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    const pos2 = nonCompText.compareDocumentPosition(arrestsText);
    expect(Boolean(pos2 & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("renders a <details> disclosure with <summary>Coverage details by year</summary> carrying 2018–2025 yearly tables", () => {
    const { container } = render(
      <CoverageWarning coverageResult={OK_COVERAGE_RESULT} />,
    );

    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();

    const summary = details?.querySelector("summary");
    expect(summary?.textContent).toMatch(/coverage details by year/i);

    const tables = within(details!).getAllByRole("table");
    expect(tables.length).toBeGreaterThanOrEqual(1);

    for (let year = 2018; year <= 2025; year++) {
      expect(
        within(details!).getAllByText(new RegExp(String(year))).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders the forward pointer sentence verbatim referencing Caveats", () => {
    render(<CoverageWarning coverageResult={OK_COVERAGE_RESULT} />);

    expect(screen.getByText(SEE_CAVEATS_SENTENCE)).toBeInTheDocument();
  });

  it("has zero axe-core accessibility violations on full banner render", async () => {
    const { container } = render(
      <CoverageWarning coverageResult={OK_COVERAGE_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<CoverageWarning> — status: 'partial' path (FR-7 Phase 6)", () => {
  it("renders collisions section and non-comparability notice cleanly when arrests coverage is missing", () => {
    render(<CoverageWarning coverageResult={PARTIAL_COVERAGE_RESULT} />);

    const aside = screen.getByRole("complementary", {
      name: "Dataset coverage warning",
    });
    expect(aside).toBeInTheDocument();
    expect(within(aside).getByText(/31\.1%/)).toBeInTheDocument();
    expect(screen.getByText(NON_COMPARABILITY_SENTENCE)).toBeInTheDocument();
    expect(screen.getByText(SEE_CAVEATS_SENTENCE)).toBeInTheDocument();
  });

  it("has zero axe-core accessibility violations on partial coverage result", async () => {
    const { container } = render(
      <CoverageWarning coverageResult={PARTIAL_COVERAGE_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<CoverageWarning> — status: 'error' path (FR-7 Phase 6)", () => {
  it("renders fallback paragraph with role=\"status\" when coverage metadata fails entirely", () => {
    render(<CoverageWarning coverageResult={ERROR_COVERAGE_RESULT} />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(
      "Coverage metadata is currently unavailable.",
    );
  });

  it("has zero axe-core accessibility violations on error status", async () => {
    const { container } = render(
      <CoverageWarning coverageResult={ERROR_COVERAGE_RESULT} />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — enforcing honesty rules and code constraints.
// ---------------------------------------------------------------------------

const COVERAGE_WARNING_PATH = join(__dirname, "CoverageWarning.tsx");

function readComponentSourceOrFail(): string {
  if (!existsSync(COVERAGE_WARNING_PATH)) {
    throw new Error(
      `${COVERAGE_WARNING_PATH} does not exist yet — this is expected red until Magnolia implements it.`,
    );
  }
  return readFileSync(COVERAGE_WARNING_PATH, "utf8");
}

describe("<CoverageWarning> — source-level greps (honesty rules & constraints)", () => {
  it("contains no hardcoded dataset figure literals in component source (NFR-4)", () => {
    const source = readComponentSourceOrFail();

    const pinnedNumbers = [231564, 211486, 112918, 29007, 8330, 1043882, 148460];
    for (const num of pinnedNumbers) {
      const pattern = new RegExp(`(^|[^0-9.])(${num})([^0-9]|$)`);
      expect(source).not.toMatch(pattern);
    }
  });

  it("contains no forbidden comparative vocabulary (better, worse, higher, lower, compared to, unlike, whereas)", () => {
    const source = readComponentSourceOrFail();

    const forbidden = [
      "better",
      "worse",
      "higher",
      "lower",
      "compared to",
      "unlike",
      "whereas",
    ];
    for (const word of forbidden) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      expect(source).not.toMatch(regex);
    }
  });

  it("contains no comparative math between collisions and arrests fields", () => {
    const source = readComponentSourceOrFail();

    expect(source).not.toMatch(/collisions\s*[\-\/]\s*arrests/i);
    expect(source).not.toMatch(/arrests\s*[\-\/]\s*collisions/i);
    expect(source).not.toMatch(/Math\.abs\(.*collisions.*arrests.*\)/i);
  });

  it("standing clause: no @/ path-alias import in CoverageWarning.tsx", () => {
    const source = readComponentSourceOrFail();

    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
