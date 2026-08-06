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

  it("does not render a <p> note element at all when note is absent — not an empty paragraph", () => {
    const { container } = render(
      <MetricSection
        fieldAlias="widgets"
        columnLabel="Widgets"
        captionText="Synthetic widgets per year"
        result={OK_RESULT}
        soql={SYNTHETIC_SOQL}
      />,
    );

    // The only <p> that could exist in the ok branch is the note; assert
    // none is present at all.
    expect(container.querySelector("table + p")).not.toBeInTheDocument();
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
    const note = screen.getByText("Synthetic note text for the widgets series.");
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
