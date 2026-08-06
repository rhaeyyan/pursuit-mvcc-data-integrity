// Behavioral / black-box test of src/app/page.tsx (the Home Server Component),
// per Rule 4 and NFR-3.
//
// `Home` is an async Server Component. It is rendered here by awaiting the
// component function directly and passing the resolved JSX into
// @testing-library/react's render() — the standard pattern for exercising an
// async Server Component outside Next's own server runtime, since Home only
// touches fetchDeathsPerYear()/fetchInjuriesPerYear() and semantic HTML (no
// cookies()/headers()/etc).
//
// fetchDeathsPerYear()/DEATHS_SOQL and fetchInjuriesPerYear()/INJURIES_SOQL
// are all mocked from their respective shared lib modules so this test is
// agnostic to whether page.tsx reads the query text via the `soql` field on
// the result or via a direct *_SOQL import — either is a legitimate
// implementation choice under this SPEC.
//
// Task 2 addition: ../components/DeathsChart is also mocked, with a plain
// vi.fn() standing in for the real component. This file's job is to prove
// page.tsx's *mounting* decision (only in the ok branch, before the table,
// receiving the same `rows` array) — the chart's own rendered geometry is
// src/components/DeathsChart.test.tsx's job, against the real component. Two
// vi.hoisted() bindings side by side is the same pattern this file already
// got right the second time on Task 1 (see the TDZ-bug fix commit); the
// `SYNTHETIC_SOQL` fix from that bug is why both bindings live in the same
// vi.hoisted() call below rather than a bare top-level const.
//
// Task 3 addition (SPEC.md "Injuries per year: parameterize the data layer
// for a second series", FR-2): ../lib/injuries is mocked the same way as
// ../lib/deaths. A `beforeEach` gives fetchInjuriesPerYear() a default
// resolved "ok" value so every pre-existing Task 1/2 deaths-only test (which
// never mentions injuries) still gets a well-formed injuries result to
// Promise.all against, without having to touch that test's body — Home() now
// always awaits both fetches in parallel, so an un-mocked/unresolved second
// fetch would otherwise throw when the page reads `injuriesResult.status`.
// Individual tests override this default with `mockResolvedValueOnce` when
// they care about a specific injuries branch.
//
// Because the page now renders two <table>s and two <details> disclosures,
// several *pre-existing* queries that used to be safely singular
// (`screen.getByRole("table")`, `screen.queryByRole("table")`) are now
// ambiguous or would silently match the *other* metric's element once a
// default "ok" injuries render exists alongside a deaths error/empty state.
// Per the dispatch instructions, those call sites are scoped with an
// accessible-name filter (`{ name: /deaths/i }` / `{ name: /injuries/i }`,
// matched against each <table>'s <caption>) so the assertion's *original
// intent* — "the deaths table renders/doesn't render" — still holds. The
// `container.querySelector("details")` call sites are deliberately left
// unscoped: SPEC.md's Output 5 places the deaths block (chart + table +
// disclosure) entirely before the injuries block in document order, so the
// first `<details>` in the tree is always the deaths one regardless of
// either metric's status — verified by inspection, not assumed.

import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import type { DeathsChartProps } from "../components/DeathsChart";

const {
  fetchDeathsPerYear,
  fetchInjuriesPerYear,
  SYNTHETIC_SOQL,
  INJURIES_SYNTHETIC_SOQL,
  DeathsChart,
} = vi.hoisted(() => ({
  fetchDeathsPerYear: vi.fn(),
  fetchInjuriesPerYear: vi.fn(),
  SYNTHETIC_SOQL:
    "SYNTHETIC SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  INJURIES_SYNTHETIC_SOQL:
    "SYNTHETIC INJURIES SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  // A minimal stand-in, not the real chart — DeathsChart.test.tsx is where
  // the real component's rendered SVG geometry is asserted against real
  // recharts output. Here we only need something identifiable in the DOM
  // and a vi.fn() we can inspect the call args of.
  DeathsChart: vi.fn((props: DeathsChartProps) => (
    <figure data-testid="deaths-chart-stub" data-row-count={props.rows.length}>
      stubbed chart
    </figure>
  )),
}));

vi.mock("../lib/deaths", () => ({
  fetchDeathsPerYear,
  DEATHS_SOQL: SYNTHETIC_SOQL,
}));

vi.mock("../lib/injuries", () => ({
  fetchInjuriesPerYear,
  INJURIES_SOQL: INJURIES_SYNTHETIC_SOQL,
}));

vi.mock("../components/DeathsChart", () => ({ DeathsChart }));

import Home from "./page";

const SYNTHETIC_ROWS = [
  { year: 2018, deaths: 11 },
  { year: 2019, deaths: 22 },
  { year: 2020, deaths: 33 },
  { year: 2021, deaths: 44 },
  { year: 2022, deaths: 55 },
  { year: 2023, deaths: 66 },
  { year: 2024, deaths: 77 },
  { year: 2025, deaths: 88 },
];

const INJURIES_SYNTHETIC_ROWS = [
  { year: 2018, injuries: 100 },
  { year: 2019, injuries: 200 },
  { year: 2020, injuries: 300 },
  { year: 2021, injuries: 400 },
  { year: 2022, injuries: 500 },
  { year: 2023, injuries: 600 },
  { year: 2024, injuries: 700 },
  { year: 2025, injuries: 800 },
];

async function renderHome() {
  // Home() is an async function component; calling and awaiting it directly
  // resolves the JSX tree the Server Component would have streamed.
  const ui = await Home();
  return render(ui);
}

beforeEach(() => {
  // Default: injuries "just works" unless a test overrides it with
  // mockResolvedValueOnce. Deaths intentionally has no default — every test
  // that cares about the page's rendered output already arranges its own
  // fetchDeathsPerYear() result, per the pre-existing Task 1/2 convention.
  fetchInjuriesPerYear.mockResolvedValue({
    status: "ok",
    soql: INJURIES_SYNTHETIC_SOQL,
    rows: INJURIES_SYNTHETIC_ROWS,
  });
});

afterEach(() => {
  fetchDeathsPerYear.mockReset();
  fetchInjuriesPerYear.mockReset();
  DeathsChart.mockClear();
});

describe("/ (Home) — the ok path", () => {
  it("renders an accessible <table> with a caption, column headers, and 8 data rows (NFR-3)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const table = screen.getByRole("table", { name: /deaths/i });
    expect(table).toBeInTheDocument();

    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /deaths/i }),
    ).toBeInTheDocument();

    // 8 data rows + 1 header row, within the deaths table specifically — the
    // page now also renders a second (injuries) table via the beforeEach
    // default, so this must not count rows page-wide.
    expect(within(table).getAllByRole("row")).toHaveLength(9);
  });

  it("has no axe-core violations on the rendered table (NFR-3 / WCAG 2.2 AA)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("renders the FR-8 SoQL query disclosure containing the query text", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(/soql query/i);
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });

  it("uses correlation language only in the framing copy — never asserts enforcement caused a change in deaths (NFR-5)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const text = (document.body.textContent ?? "").toLowerCase();
    expect(text).not.toMatch(/\bcaused\b|\bcausing\b|\bcauses\b/);
  });

  it("uses the updated three-metric intro sentence verbatim (Task 3 / SPEC.md Output 5) — not paraphrased", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const text = document.body.textContent ?? "";
    expect(text).toContain(
      "Reported collisions, injuries, and deaths move very differently over this period; collisions are the most discretionary figure (an officer decides whether to file), injuries typically involve an ambulance or hospital record, and deaths are the least discretionary, the medical examiner's count.",
    );
  });

  it("Task 2: mounts <DeathsChart> with the same rows array, positioned before the table", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    expect(DeathsChart).toHaveBeenCalledTimes(1);
    const props = DeathsChart.mock.calls[0][0] as DeathsChartProps;
    // Same array, not a copy — the chart and the table must provably plot
    // and list the same objects, never two reads of one source that could
    // drift (SPEC.md's Intellectual Control).
    expect(props.rows).toBe(SYNTHETIC_ROWS);

    const chartStub = screen.getByTestId("deaths-chart-stub");
    const table = screen.getByRole("table", { name: /deaths/i });
    const position = chartStub.compareDocumentPosition(table);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    // Sanity check that the stub actually landed inside the rendered tree,
    // not merely constructed and discarded.
    expect(container.contains(chartStub)).toBe(true);
  });
});

describe("/ (Home) — the error path (FR-10)", () => {
  it("renders a visible, non-decorative message naming the reason — never an empty table, never a crash", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    await renderHome();

    // Scoped to the deaths table specifically: the injuries beforeEach
    // default still renders its own table, which must not make this
    // assertion about the *deaths* branch pass or fail for the wrong reason.
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2024/i),
    ).toBeInTheDocument();
  });

  it("Task 2 Edge Case 1: renders no chart at all — no <figure>, no <svg>, DeathsChart never mounted", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    const { container } = await renderHome();

    expect(DeathsChart).not.toHaveBeenCalled();
    expect(screen.queryByTestId("deaths-chart-stub")).not.toBeInTheDocument();
    expect(container.querySelector("figure")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("still renders the FR-8 query disclosure on the error path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 502 (synthetic test reason)",
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });

  it("has no axe-core violations on the rendered error state", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    const { container } = await renderHome();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — the empty path (FR-10)", () => {
  it("renders a visible, non-decorative message distinct from the error path — never an empty table", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    // A defined empty state per FR-10 means real, perceivable copy — not
    // merely "did not crash". This does not lock in exact wording, only
    // that some non-trivial message is present.
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
  });

  it("still renders the FR-8 query disclosure on the empty path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });

  it("Task 2 Edge Case 1: renders no chart at all — no <figure>, no <svg>, DeathsChart never mounted", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(DeathsChart).not.toHaveBeenCalled();
    expect(screen.queryByTestId("deaths-chart-stub")).not.toBeInTheDocument();
    expect(container.querySelector("figure")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("/ (Home) — injuries block (FR-2, Task 3)", () => {
  it("renders an accessible injuries <table> with caption, headers, 8 rows, and its own SoQL disclosure", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: INJURIES_SYNTHETIC_SOQL,
      rows: INJURIES_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const table = screen.getByRole("table", { name: /injuries/i });
    expect(table).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(9);

    const disclosures = Array.from(container.querySelectorAll("details"));
    const injuriesDisclosure = disclosures.find((d) =>
      /injuries/i.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(injuriesDisclosure).toBeTruthy();
    expect(injuriesDisclosure).toHaveTextContent(INJURIES_SYNTHETIC_SOQL);
  });

  it("renders a visible, non-decorative injuries error message, independent of deaths (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2023 (synthetic injuries test reason)",
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2023/i),
    ).toBeInTheDocument();
  });

  it("renders a visible, non-decorative injuries empty-state message, distinct from the error path (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: INJURIES_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
    // Not just "some text somewhere" (that's trivially true from the deaths
    // block alone) — the injuries block's own disclosure must still be
    // present, proving this assertion actually exercises injuries and isn't
    // a false-positive pass off deaths' unrelated content.
    expect(container.querySelectorAll("details")).toHaveLength(2);
  });
});

describe("/ (Home) — two independent metrics on one page (new coverage, Task 3, Edge Case 9)", () => {
  // These mocks are discriminated by which module they come from
  // (fetchDeathsPerYear vs fetchInjuriesPerYear, two distinct hoisted vi.fn()s
  // bound to two distinct vi.mock()'d modules) — never by which one Promise.all
  // happens to settle first. That matches the SPEC's "must be discriminated by
  // request URL / SoQL, not call order" guidance one layer up: page.tsx calls
  // two named functions, not one shared fetch, so there is no call-order
  // ambiguity to guard against at this boundary.

  it("deaths ok + injuries error: each branch renders correctly and independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (synthetic independence test, injuries)",
    });

    await renderHome();

    // Deaths renders fully: chart + table.
    expect(DeathsChart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();

    // Injuries shows its own error, never a table, and deaths is unaffected.
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Socrata responded 503 \(synthetic independence test, injuries\)/i,
      ),
    ).toBeInTheDocument();
  });

  it("deaths error + injuries ok (the inverse): each branch renders correctly and independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (synthetic independence test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: INJURIES_SYNTHETIC_SOQL,
      rows: INJURIES_SYNTHETIC_ROWS,
    });

    await renderHome();

    // Deaths shows its own error, no chart, no deaths table — and this must
    // not be suppressed or altered by injuries having succeeded.
    expect(DeathsChart).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Socrata responded 503 \(synthetic independence test, deaths\)/i,
      ),
    ).toBeInTheDocument();

    // Injuries renders fully, unsuppressed by the deaths failure.
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
  });

  it("disambiguates the two <details> disclosures by summary text, both reachable by accessible name (FR-8)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: INJURIES_SYNTHETIC_SOQL,
      rows: INJURIES_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const disclosures = Array.from(container.querySelectorAll("details"));
    expect(disclosures).toHaveLength(2);

    const summaries = disclosures.map(
      (d) => d.querySelector("summary")?.textContent ?? "",
    );
    expect(
      summaries.some((s) => /soql query/i.test(s) && /deaths/i.test(s)),
    ).toBe(true);
    expect(
      summaries.some((s) => /soql query/i.test(s) && /injuries/i.test(s)),
    ).toBe(true);
    // Distinct accessible names, so assistive tech can reach either
    // disclosure independently — this changed from the pre-Task-3 generic
    // "SoQL query" summary text on purpose (SPEC.md Output 5).
    expect(summaries[0]).not.toBe(summaries[1]);
  });

  it("has no axe-core violations across the injuries table and both SoQL disclosures", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: INJURIES_SYNTHETIC_SOQL,
      rows: INJURIES_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    // Prove the elements this test claims to cover actually exist before
    // scanning them — otherwise a passing axe.run() here would be a
    // false-positive that proves nothing about the injuries table or its
    // disclosure (axe has no opinion on content that isn't present).
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(2);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — source-level grep (standing clause: no @/ alias imports)", () => {
  it("page.tsx contains no @/ path-alias import (Vitest cannot resolve it)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
