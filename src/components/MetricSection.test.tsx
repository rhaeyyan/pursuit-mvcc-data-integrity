// Characterization tests for src/components/MetricSection.tsx, written
// AFTER the extraction per SPEC.md's stated ordering deviation (this is a
// behavior-preserving mechanical refactor, not new product behavior — see
// that SPEC's Constraint 11). src/app/page.test.tsx, untouched, is the
// primary behavior-preservation gate; this file's job is narrower: prove
// MetricSection's own contract in isolation, generically, with an
// obviously-synthetic fieldAlias ("widgets") so the coverage is provably
// generic and not deaths/injuries/collisions-shaped (SPEC.md Constraint 6).
//
// No real deaths/injuries/collisions figures appear anywhere in this file —
// only synthetic widget counts, distinct in shape from the pinned Appendix A
// columns.
//
// Extended per the FR-4 percent-change SPEC (2026-08-06, "Compute and
// display the 2018→2025 percentage change for each yearly metric") to cover
// the new change-summary <p> MetricSection renders after the table. Written
// BEFORE MetricSection.tsx is updated to call src/lib/percentChange.ts, per
// CLAUDE.md Rule 4 — the new/changed assertions below are expected to fail
// red because MetricSection.tsx does not yet render the change-summary line,
// not because of a mistake in this file's own logic. Deliberately does NOT
// import anything from src/lib/percentChange.ts (which does not exist yet):
// the expected change-summary strings below are worked out by hand from this
// file's own synthetic OK_RESULT fixture (5 -> 9, i.e. +80%), so this file's
// failures stay isolated to "MetricSection doesn't render this yet" rather
// than colliding with percentChange.test.ts's own separate module-resolution
// red (see percentChange.test.ts for the function's own unit coverage).

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import type { YearlyMetricResult } from "../lib/socrata";
import { MetricSection } from "./MetricSection";

const SYNTHETIC_SOQL =
  "SYNTHETIC SOQL FOR METRICSECTION TEST $select=... $where=... $group=... $order=...";

const OK_RESULT: YearlyMetricResult<"widgets"> = {
  status: "ok",
  soql: SYNTHETIC_SOQL,
  rows: [
    { year: 2018, widgets: 5 },
    { year: 2019, widgets: 9 },
  ],
};

const EMPTY_RESULT: YearlyMetricResult<"widgets"> = {
  status: "empty",
  soql: SYNTHETIC_SOQL,
};

const ERROR_RESULT: YearlyMetricResult<"widgets"> = {
  status: "error",
  soql: SYNTHETIC_SOQL,
  kind: "contract",
  reason: "no aggregate returned for 2019 (synthetic MetricSection reason)",
};

// Same shape as OK_RESULT (2 rows) but the first row's value is 0, so
// computeChange() must return null (division undefined) and MetricSection
// must render no change-summary <p> at all — see SPEC.md Edge Cases.
const ZERO_START_RESULT: YearlyMetricResult<"widgets"> = {
  status: "ok",
  soql: SYNTHETIC_SOQL,
  rows: [
    { year: 2018, widgets: 0 },
    { year: 2019, widgets: 9 },
  ],
};

// Worked out by hand from OK_RESULT's own fixture values (5 -> 9):
// (9 - 5) / 5 * 100 = 80, an exact whole number so there is no rounding
// ambiguity here — formatPercentChange's own rounding edge cases (Math.round,
// -0, leading '+') are covered generically in percentChange.test.ts, not
// re-tested per fixture here. This is arithmetic on this file's own
// synthetic fixture, never a re-derivation of a real figure (NFR-4).
const EXPECTED_OK_RESULT_CHANGE_SUMMARY = "2018–2019 change: +80% (5 → 9)";

describe("<MetricSection> — ok branch", () => {
  it("renders an accessible table with a caption, column headers, and one row per synthetic data point", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    const table = screen.getByRole("table", { name: /synthetic widgets/i });
    expect(table).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /widgets/i }),
    ).toBeInTheDocument();
    // 2 data rows + 1 header row.
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("5")).toBeInTheDocument();
    expect(within(table).getByText("9")).toBeInTheDocument();
  });

  // Rescoped per the FR-4 SPEC (SPEC.md Files item 4): before FR-4, the ok
  // branch's *only* possible <p> was the note, so "no <p> at all after the
  // table" and "no note" were the same assertion. Now that a second,
  // unconditional change-summary <p> also lives in the ok branch, that
  // broader assertion would false-fail the moment MetricSection renders the
  // (correct, intended) change-summary line for OK_RESULT — a false
  // regression, not a real one. The original intent — "note is never
  // rendered as an empty/erroneous paragraph when the note prop is absent"
  // — is preserved below by scoping to the note's own, specific text/element
  // rather than "any <p> after the table": we assert exactly one <p> renders
  // (the legitimate change-summary line, whose exact text is independently
  // pinned above) and that the note's own known text is absent. If a stray
  // empty/erroneous note <p> were ever added back, this would still fail
  // (paragraph count would be 2, not 1).
  it("does not render a note <p> when note is absent — only the change-summary paragraph appears, never an extra or empty note paragraph", () => {
    const { container } = render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    const paragraphsAfterTable = container.querySelectorAll("table ~ p");
    expect(paragraphsAfterTable).toHaveLength(1);
    expect(paragraphsAfterTable[0]).toHaveTextContent(
      EXPECTED_OK_RESULT_CHANGE_SUMMARY,
    );
    expect(
      screen.queryByText("Synthetic note text for the widgets series."),
    ).not.toBeInTheDocument();
  });

  it("renders a <p> with the computed change-summary line after the table when the fixture yields a non-null change (FR-4)", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    const table = screen.getByRole("table", { name: /synthetic widgets/i });
    const changeSummary = screen.getByText(EXPECTED_OK_RESULT_CHANGE_SUMMARY);
    expect(changeSummary.tagName).toBe("P");

    const position = table.compareDocumentPosition(changeSummary);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("positions the change-summary <p> between the table and the optional note, in that order", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
        note="Synthetic note text for the widgets series."
      />,
    );

    const table = screen.getByRole("table", { name: /synthetic widgets/i });
    const changeSummary = screen.getByText(EXPECTED_OK_RESULT_CHANGE_SUMMARY);
    const note = screen.getByText(
      "Synthetic note text for the widgets series.",
    );

    const tableToChange = table.compareDocumentPosition(changeSummary);
    expect(Boolean(tableToChange & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    );

    const changeToNote = changeSummary.compareDocumentPosition(note);
    expect(Boolean(changeToNote & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("renders no change-summary <p> when computeChange would return null (start value 0) — never '+Infinity%' or an empty paragraph", () => {
    const { container } = render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={ZERO_START_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    // No note prop passed either, so with computeChange() returning null the
    // entire ok branch should carry zero <p> elements after the table.
    expect(container.querySelectorAll("table ~ p")).toHaveLength(0);
    expect(screen.queryByText(/change:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/infinity/i)).not.toBeInTheDocument();
  });

  it("renders the note as a <p> after the table when provided", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
        note="Synthetic note text for the widgets series."
      />,
    );

    const table = screen.getByRole("table", { name: /synthetic widgets/i });
    const note = screen.getByText(
      "Synthetic note text for the widgets series.",
    );
    expect(note.tagName).toBe("P");

    const position = table.compareDocumentPosition(note);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("has no axe-core violations in the ok state without a note", async () => {
    const { container } = render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("has no axe-core violations in the ok state with a note", async () => {
    const { container } = render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
        note="Synthetic note text for the widgets series."
      />,
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("<MetricSection> — empty branch", () => {
  it("renders a role=status message, no table, and never the note", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={EMPTY_RESULT}
        soql={SYNTHETIC_SOQL}
        note="Synthetic note text for the widgets series."
      />,
    );

    expect(
      screen.queryByRole("table", { name: /synthetic widgets/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /no rows for 2018–2025/i,
    );
    expect(
      screen.queryByText("Synthetic note text for the widgets series."),
    ).not.toBeInTheDocument();
  });
});

describe("<MetricSection> — error branch", () => {
  it("renders a role=alert message naming the reason, no table, and never the note", () => {
    render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={ERROR_RESULT}
        soql={SYNTHETIC_SOQL}
        note="Synthetic note text for the widgets series."
      />,
    );

    expect(
      screen.queryByRole("table", { name: /synthetic widgets/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /no aggregate returned for 2019 \(synthetic metricsection reason\)/i,
    );
    expect(
      screen.queryByText("Synthetic note text for the widgets series."),
    ).not.toBeInTheDocument();
  });
});

describe("<MetricSection> — disclosure (unconditional across all three statuses)", () => {
  it.each([
    ["ok", OK_RESULT],
    ["empty", EMPTY_RESULT],
    ["error", ERROR_RESULT],
  ] as const)(
    "renders the SoQL disclosure with the field-scoped summary and the query text when status is %s",
    (_label, result) => {
      const { container } = render(
        <MetricSection
          fieldAlias="widgets"
          columnLabel="Widgets"
          captionText="Synthetic widgets per year"
          result={result}
          soql={SYNTHETIC_SOQL}
        />,
      );

      const disclosure = container.querySelector("details");
      expect(disclosure).toBeInTheDocument();
      expect(disclosure).toHaveTextContent(/soql query — widgets/i);
      expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
    },
  );
});
