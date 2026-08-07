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
// Task 2 addition, generalized by this SPEC ("Close FR-3's remaining chart
// half"): ../components/DeathsChart is renamed to ../components/
// YearlyLineChart and generalized to a single component used at two call
// sites (deaths, collisions). One plain vi.fn() stands in for the real
// component at both call sites, differentiated by `props.fieldAlias` via
// `data-testid={`yearly-chart-${props.fieldAlias}`}` — never by call order,
// mirroring the discrimination discipline already established for the three
// fetch mocks below. This file's job is to prove page.tsx's *mounting*
// decisions (only in each metric's own ok branch, before that metric's
// table, receiving that metric's own `rows` array, and — this task's new
// guarantee — one chart's failure never suppresses the other's mount) — the
// chart's own rendered geometry is src/components/YearlyLineChart.test.tsx's
// job, against the real component. Multiple vi.hoisted() bindings side by
// side is the same pattern this file already got right the second time on
// Task 1 (see the TDZ-bug fix commit); the `SYNTHETIC_SOQL` fix from that bug
// is why all bindings live in the same vi.hoisted() call below rather than a
// bare top-level const.
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
//
// This-SPEC addition ("Collisions per year: the raw reporting-affected
// series, data half only", FR-3): ../lib/collisions is mocked the same way
// as ../lib/deaths and ../lib/injuries, with its own default-"ok" beforeEach
// entry mirroring injuries' — every pre-existing deaths/injuries-only test
// now also gets a well-formed collisions result to Promise.all against
// without having to touch that test's body. Because a default "ok"
// collisions render adds a *third* unconditional <details> disclosure to
// every render, the small number of pre-existing assertions that hard-coded
// "2 disclosures total" are updated in place to "3" below — that is a
// necessary consequence of this file's own new default, not scope creep, and
// the assertions' original intent (this specific disclosure is present and
// reachable) is preserved exactly; only the total-count arithmetic changes.
// SPEC.md Output 3 places the collisions block after the injuries block in
// document order (deaths, then injuries, then collisions), so the unscoped
// `container.querySelector("details")` call sites (which only ever want the
// *first* details, the deaths one) remain correct unchanged.
//
// Edge Case 9 (new coverage this task introduces): the two-way independence
// describe block below FR-2 established is extended with a third describe
// block exercising three-way independence — collisions, deaths, and
// injuries in various ok/empty/error combinations, discriminated by which
// mocked module a call belongs to (three distinct hoisted vi.fn()s bound to
// three distinct vi.mock()'d modules), never by call order.
//
// This-SPEC addition (SPEC.md "Casualty-filtered 'repaired' collisions per
// year (FR-12), data half only — the corrected number"): ../lib/
// repairedCollisions is mocked the same way as the other three, with its own
// default-"ok" beforeEach entry mirroring injuries'/collisions', so every
// pre-existing deaths/injuries/collisions-only test above now also gets a
// well-formed repaired-collisions result to Promise.all against without
// having to touch that test's body. Because a default "ok" repaired-
// collisions render adds a *fourth* unconditional <details> disclosure to
// every render, the pre-existing assertions that hard-coded "3 disclosures
// total" are updated in place to "4" below — a necessary consequence of this
// file's own new default, not scope creep; the assertions' original intent
// (this specific disclosure is present and reachable) is preserved exactly,
// only the total-count arithmetic changes. page.tsx places the repaired-
// collisions block after the collisions block in document order (deaths,
// injuries, collisions, then repaired collisions), so the unscoped
// `container.querySelector("details")` call sites (which only ever want the
// *first* details, the deaths one) remain correct unchanged. Edge Case 9's
// three-way independence coverage is extended with a fourth describe block
// below exercising four-way independence, mirroring that block's structure
// exactly, substituting the repaired-collisions module/alias.
//
// This-SPEC addition (FR-5, "traffic-enforcement arrest counts per year,
// 2018-2025, filtered to five offense categories"): ../lib/arrests is mocked
// the same way as the other four (fetchArrestsPerYear + ARRESTS_SOQL), with
// its own default-"ok" beforeEach entry mirroring injuries'/collisions'/
// repaired's, so every pre-existing test above now also gets a well-formed
// arrests result to Promise.all against without having to touch that test's
// body. Because a default "ok" arrests render adds a *fifth* unconditional
// <details> disclosure to every render, the pre-existing assertions that
// hard-coded "4 disclosures total" are updated in place to "5" throughout —
// a necessary consequence of this file's own new default, not scope creep;
// the assertions' original intent (this specific disclosure is present and
// reachable) is preserved exactly, only the total-count arithmetic changes.
// page.tsx places the arrests block after the repaired-collisions block and
// before Caveats (SPEC.md's Files item 3), so the unscoped
// `container.querySelector("details")` call sites (which only ever want the
// *first* details, the deaths one) remain correct unchanged. Unlike
// YearlyLineChart, MetricSection is NOT mocked anywhere in this file — every
// pre-existing table assertion above renders the real component — so the
// new arrests table assertions below follow that same real-render idiom
// (getByRole("table", { name: /arrests/i }) etc.) rather than inspecting
// mock call props, consistent with this file as it exists today (the actual
// reference for how prior SPEC iterations extended this pattern). The
// arrests chart mount, by contrast, is asserted the same way the deaths/
// collisions chart mounts already are — via `callsFor("arrests")` against
// the shared YearlyLineChart mock — since that component IS mocked here.
// Edge Case 9's four-way independence coverage is extended with a fifth
// describe block below exercising five-way independence at the two
// combinations the dispatch instructions name explicitly: arrests alone
// failing while the other four succeed, and the inverse.

import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import type { YearlyLineChartProps } from "../components/YearlyLineChart";

const {
  fetchDeathsPerYear,
  fetchInjuriesPerYear,
  fetchCollisionsPerYear,
  fetchRepairedCollisionsPerYear,
  fetchArrestsPerYear,
  SYNTHETIC_SOQL,
  INJURIES_SYNTHETIC_SOQL,
  COLLISIONS_SYNTHETIC_SOQL,
  REPAIRED_SYNTHETIC_SOQL,
  ARRESTS_SYNTHETIC_SOQL,
  YearlyLineChart,
  Caveats,
} = vi.hoisted(() => ({
  fetchDeathsPerYear: vi.fn(),
  fetchInjuriesPerYear: vi.fn(),
  fetchCollisionsPerYear: vi.fn(),
  fetchRepairedCollisionsPerYear: vi.fn(),
  fetchArrestsPerYear: vi.fn(),
  SYNTHETIC_SOQL:
    "SYNTHETIC SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  INJURIES_SYNTHETIC_SOQL:
    "SYNTHETIC INJURIES SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  COLLISIONS_SYNTHETIC_SOQL:
    "SYNTHETIC COLLISIONS SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  REPAIRED_SYNTHETIC_SOQL:
    "SYNTHETIC REPAIRED COLLISIONS SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  ARRESTS_SYNTHETIC_SOQL:
    "SYNTHETIC ARRESTS SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
  // A minimal stand-in, not the real chart — YearlyLineChart.test.tsx is
  // where the real component's rendered SVG geometry is asserted against
  // real recharts output. Here we only need something identifiable in the
  // DOM, discriminated by `fieldAlias` so the same stub serves both the
  // deaths and collisions call sites, and a vi.fn() we can inspect the call
  // args of (filtered by fieldAlias, never by call order).
  YearlyLineChart: vi.fn((props: YearlyLineChartProps<string>) => (
    <figure
      data-testid={`yearly-chart-${props.fieldAlias}`}
      data-row-count={props.rows.length}
    >
      stubbed chart
    </figure>
  )),
  // This-SPEC addition (FR-9, "Add a standalone caveats section"): a minimal
  // stand-in, not the real component — Caveats.test.tsx is where the real
  // component's own five-item structure and verbatim prose are asserted
  // against real rendered output. Here we only need something identifiable
  // in the DOM (a heading + testid) and a vi.fn() whose call count/args we
  // can inspect, to prove page.tsx's *mounting* decision: rendered exactly
  // once, unconditionally, independent of all four metrics' fetch status.
  // Typed with an explicit props parameter, rather than a bare `() => ...`,
  // purely so `Caveats.mock.calls[0][0]` below has a real tuple index to
  // read at the type level — the real Caveats component still takes zero
  // props (SPEC.md's Inputs/Outputs section); this mock is invoked as
  // <Caveats /> exactly like the real one. `data-props-key-count` surfaces
  // the received props object's own key count into the DOM so the "called
  // with zero props" assertion has a use for the parameter beyond typing.
  Caveats: vi.fn((props: Record<string, never>) => (
    <section
      data-testid="caveats-stub"
      data-props-key-count={Object.keys(props).length}
    >
      <h2>Caveats</h2>
    </section>
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

vi.mock("../lib/collisions", () => ({
  fetchCollisionsPerYear,
  COLLISIONS_SOQL: COLLISIONS_SYNTHETIC_SOQL,
}));

vi.mock("../lib/repairedCollisions", () => ({
  fetchRepairedCollisionsPerYear,
  REPAIRED_COLLISIONS_SOQL: REPAIRED_SYNTHETIC_SOQL,
}));

vi.mock("../lib/arrests", () => ({
  fetchArrestsPerYear,
  ARRESTS_SOQL: ARRESTS_SYNTHETIC_SOQL,
}));

vi.mock("../components/YearlyLineChart", () => ({ YearlyLineChart }));
vi.mock("../components/Caveats", () => ({ Caveats }));

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

// Obviously-synthetic, four-digit round numbers — distinct in magnitude from
// both the deaths (11..88) and injuries (100..800) fixtures above, and never
// the pinned Appendix A / mvcc-data-skill collisions column (six- and
// five-digit figures in the hundred-thousands: 231564, 211486, 112918,
// 110558, 103887, 96607, 91316, 85546).
const COLLISIONS_SYNTHETIC_ROWS = [
  { year: 2018, collisions: 1000 },
  { year: 2019, collisions: 2000 },
  { year: 2020, collisions: 3000 },
  { year: 2021, collisions: 4000 },
  { year: 2022, collisions: 5000 },
  { year: 2023, collisions: 6000 },
  { year: 2024, collisions: 7000 },
  { year: 2025, collisions: 8000 },
];

// Verbatim per SPEC.md's Output 3 — copied exactly, not paraphrased.
const COLLISIONS_NOTE_TEXT =
  "This series is affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions.";

// Obviously-synthetic, three-digit round numbers ascending by 100 — distinct
// in magnitude from deaths (11..88), injuries (100..800), and raw collisions
// (1000..8000) above, and never the pinned mvcc-data-skill "Casualty-
// filtered" column (45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420).
const REPAIRED_SYNTHETIC_ROWS = [
  { year: 2018, repaired: 150 },
  { year: 2019, repaired: 250 },
  { year: 2020, repaired: 350 },
  { year: 2021, repaired: 450 },
  { year: 2022, repaired: 550 },
  { year: 2023, repaired: 650 },
  { year: 2024, repaired: 750 },
  { year: 2025, repaired: 850 },
];

// Verbatim per SPEC.md's Output 4 — copied exactly, not paraphrased.
const REPAIRED_NOTE_TEXT =
  "This series counts only collisions with a recorded injury or death — records that still required an officer response after the 2020 policy change, unlike the property-damage-only collisions the raw count above stopped capturing. It tracks close to the injuries trend and is the more reliable figure for judging whether collisions actually declined.";

// Obviously-synthetic, five-digit round numbers ascending by 500 — distinct
// in magnitude/shape from deaths (11..88), injuries (100..800), raw
// collisions (1000..8000), and repaired collisions (150..850) above, and
// never the pinned mvcc-data-skill arrests figures (29007 in 2018, 8330 in
// 2020, 21123 in 2025 — those are non-monotonic; this fixture is strictly
// ascending, an unmistakably different shape).
const ARRESTS_SYNTHETIC_ROWS = [
  { year: 2018, arrests: 12000 },
  { year: 2019, arrests: 12500 },
  { year: 2020, arrests: 13000 },
  { year: 2021, arrests: 13500 },
  { year: 2022, arrests: 14000 },
  { year: 2023, arrests: 14500 },
  { year: 2024, arrests: 15000 },
  { year: 2025, arrests: 15500 },
];

// This-SPEC addition (FR-9) — verbatim per SPEC.md's page.tsx Output section,
// copied exactly, not paraphrased. Appended (string concatenation, not a
// rewrite) to the end of both COLLISIONS_NOTE_TEXT and REPAIRED_NOTE_TEXT
// above. Deliberately declared as its own constant, not inlined into the two
// assertions below, so a future re-read of this file can see at a glance
// that both notes are expected to share one identical trailing sentence
// (ADR 0001's "don't let two copies of the same string drift apart"
// discipline, applied at test level too).
const SEE_CAVEATS_POINTER =
  " See Caveats, below, for the two policy dates and other limits on this figure.";

// Disambiguating <table> accessible-name matchers. Once the repaired-
// collisions block renders by default (this SPEC's beforeEach), a bare
// `/collisions/i` table-name matcher becomes ambiguous: the raw collisions
// caption ("NYC recorded collisions per year, 2018–2025") and the repaired-
// collisions caption ("NYC collisions with a recorded injury or death per
// year, 2018–2025") both contain the word "collisions". These two matchers
// key on a substring unique to each caption instead — "recorded collisions"
// appears only in the raw caption, "injury or death" appears only in the
// repaired caption — so every pre-existing raw-collisions query below still
// finds exactly the raw table, and every new repaired-collisions query below
// finds exactly the repaired table.
const COLLISIONS_TABLE_NAME = /recorded collisions/i;
const REPAIRED_TABLE_NAME = /injury or death/i;

// `YearlyLineChart` is one shared mock serving both the deaths and
// collisions call sites (this SPEC's generalization) — every assertion that
// used to read `DeathsChart.mock.calls` directly must now filter by
// `fieldAlias` first, never rely on call order, since the two call sites can
// resolve in either order and either one can be absent independently.
function callsFor(fieldAlias: string) {
  return YearlyLineChart.mock.calls.filter(
    (call) =>
      (call[0] as YearlyLineChartProps<string>).fieldAlias === fieldAlias,
  );
}

async function renderHome() {
  // Home() is an async function component; calling and awaiting it directly
  // resolves the JSX tree the Server Component would have streamed.
  const ui = await Home();
  return render(ui);
}

beforeEach(() => {
  // Default: injuries and collisions "just work" unless a test overrides
  // them with mockResolvedValueOnce. Deaths intentionally has no default —
  // every test that cares about the page's rendered output already arranges
  // its own fetchDeathsPerYear() result, per the pre-existing Task 1/2
  // convention.
  fetchInjuriesPerYear.mockResolvedValue({
    status: "ok",
    soql: INJURIES_SYNTHETIC_SOQL,
    rows: INJURIES_SYNTHETIC_ROWS,
  });
  fetchCollisionsPerYear.mockResolvedValue({
    status: "ok",
    soql: COLLISIONS_SYNTHETIC_SOQL,
    rows: COLLISIONS_SYNTHETIC_ROWS,
  });
  fetchRepairedCollisionsPerYear.mockResolvedValue({
    status: "ok",
    soql: REPAIRED_SYNTHETIC_SOQL,
    rows: REPAIRED_SYNTHETIC_ROWS,
  });
  fetchArrestsPerYear.mockResolvedValue({
    status: "ok",
    soql: ARRESTS_SYNTHETIC_SOQL,
    rows: ARRESTS_SYNTHETIC_ROWS,
  });
});

afterEach(() => {
  fetchDeathsPerYear.mockReset();
  fetchInjuriesPerYear.mockReset();
  fetchCollisionsPerYear.mockReset();
  fetchRepairedCollisionsPerYear.mockReset();
  fetchArrestsPerYear.mockReset();
  YearlyLineChart.mockClear();
  Caveats.mockClear();
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

  it("Task 2: mounts the deaths <YearlyLineChart> with the same rows array, positioned before the deaths table", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const deathsCalls = callsFor("deaths");
    expect(deathsCalls).toHaveLength(1);
    const props = deathsCalls[0][0] as YearlyLineChartProps<"deaths">;
    // Same array, not a copy — the chart and the table must provably plot
    // and list the same objects, never two reads of one source that could
    // drift (SPEC.md's Intellectual Control).
    expect(props.rows).toBe(SYNTHETIC_ROWS);

    const chartStub = screen.getByTestId("yearly-chart-deaths");
    const table = screen.getByRole("table", { name: /deaths/i });
    const position = chartStub.compareDocumentPosition(table);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    // Sanity check that the stub actually landed inside the rendered tree,
    // not merely constructed and discarded.
    expect(container.contains(chartStub)).toBe(true);
  });

  it('this SPEC: mounts the collisions <YearlyLineChart> with the same rows array, positioned before the collisions table, when collisionsResult.status is "ok"', async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Collisions' default "ok" beforeEach value applies here unmodified.

    const { container } = await renderHome();

    const collisionsCalls = callsFor("collisions");
    expect(collisionsCalls).toHaveLength(1);
    const props = collisionsCalls[0][0] as YearlyLineChartProps<"collisions">;
    expect(props.rows).toBe(COLLISIONS_SYNTHETIC_ROWS);

    const chartStub = screen.getByTestId("yearly-chart-collisions");
    const table = screen.getByRole("table", { name: COLLISIONS_TABLE_NAME });
    const position = chartStub.compareDocumentPosition(table);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
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

  it("Task 2 Edge Case 1 (generalized): renders no deaths chart at all — the deaths YearlyLineChart is never mounted, independent of collisions' own (default-ok) chart still rendering", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(screen.queryByTestId("yearly-chart-deaths")).not.toBeInTheDocument();
    // Not a blanket "no <figure> anywhere" check: the collisions beforeEach
    // default is "ok", so its own independent chart legitimately renders a
    // <figure> here too — proving this test actually exercises the deaths
    // branch specifically, not an incidental absence of every chart.
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
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

  it("Task 2 Edge Case 1 (generalized): renders no deaths chart at all — the deaths YearlyLineChart is never mounted, independent of collisions' own (default-ok) chart still rendering", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(screen.queryByTestId("yearly-chart-deaths")).not.toBeInTheDocument();
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
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
    // a false-positive pass off deaths' unrelated content. Total is 3, not
    // 2, because this-SPEC's default "ok" collisions mock (see beforeEach)
    // also renders its own unconditional disclosure on every test in this
    // file unless overridden.
    expect(container.querySelectorAll("details")).toHaveLength(5);
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
    expect(callsFor("deaths")).toHaveLength(1);
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
    expect(callsFor("deaths")).toHaveLength(0);
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

  it("disambiguates the five <details> disclosures by summary text, all reachable by accessible name (FR-8)", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: REPAIRED_SYNTHETIC_SOQL,
      rows: REPAIRED_SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: ARRESTS_SYNTHETIC_SOQL,
      rows: ARRESTS_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const disclosures = Array.from(container.querySelectorAll("details"));
    expect(disclosures).toHaveLength(5);

    const summaries = disclosures.map(
      (d) => d.querySelector("summary")?.textContent ?? "",
    );
    expect(
      summaries.some((s) => /soql query/i.test(s) && /deaths/i.test(s)),
    ).toBe(true);
    expect(
      summaries.some((s) => /soql query/i.test(s) && /injuries/i.test(s)),
    ).toBe(true);
    expect(
      summaries.some((s) => /soql query/i.test(s) && /collisions/i.test(s)),
    ).toBe(true);
    expect(
      summaries.some((s) => /soql query/i.test(s) && /repaired/i.test(s)),
    ).toBe(true);
    expect(
      summaries.some((s) => /soql query/i.test(s) && /arrests/i.test(s)),
    ).toBe(true);
    // Distinct accessible names, so assistive tech can reach any of the
    // five disclosures independently — this extends the pre-existing
    // deaths/injuries/collisions/repaired-collisions distinct-summary
    // guarantee (SPEC.md Output 5) to the fifth, arrests disclosure this
    // SPEC adds.
    expect(new Set(summaries).size).toBe(5);
  });

  it("has no axe-core violations across the injuries table and all three SoQL disclosures", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    // Prove the elements this test claims to cover actually exist before
    // scanning them — otherwise a passing axe.run() here would be a
    // false-positive that proves nothing about the injuries table or its
    // disclosure (axe has no opinion on content that isn't present).
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(5);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — collisions block (FR-3 data half, FR-8, FR-10, NFR-3, NFR-5 label-only)", () => {
  it("renders an accessible collisions <table> with caption, headers, 8 rows, the verbatim inline reporting-change note, and its own SoQL disclosure", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const table = screen.getByRole("table", { name: COLLISIONS_TABLE_NAME });
    expect(table).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /collisions/i }),
    ).toBeInTheDocument();
    // 8 data rows + 1 header row, scoped to the collisions table only.
    expect(within(table).getAllByRole("row")).toHaveLength(9);

    // The verbatim inline note (SPEC.md Output 3) — copied exactly, not
    // paraphrased, and present as real page copy (not merely in an
    // attribute).
    expect(document.body.textContent ?? "").toContain(COLLISIONS_NOTE_TEXT);

    const disclosures = Array.from(container.querySelectorAll("details"));
    const collisionsDisclosure = disclosures.find((d) =>
      /collisions/i.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(collisionsDisclosure).toBeTruthy();
    expect(collisionsDisclosure).toHaveTextContent("SoQL query — collisions");
    expect(collisionsDisclosure).toHaveTextContent(COLLISIONS_SYNTHETIC_SOQL);
  });

  it("renders a visible, non-decorative collisions error message, independent of deaths and injuries (FR-10)", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "contract",
      reason:
        "no aggregate returned for 2020 (synthetic collisions test reason)",
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2020/i),
    ).toBeInTheDocument();
    // The failure must not suppress the other two metrics' renders.
    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
  });

  it("renders a visible, non-decorative collisions empty-state message, distinct from the error path (FR-10)", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    // Not just "some text somewhere" — the collisions block's own disclosure
    // must still be present, proving this assertion actually exercises
    // collisions and isn't a false-positive pass off the other two blocks'
    // unrelated content.
    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
  });

  it("never renders the inline reporting-change note on the collisions error or empty paths — the note is part of the ok-branch table rendering only", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    // Prove the collisions block is actually rendering its own defined
    // empty state (a third, independent disclosure) before asserting on
    // what it must not contain — otherwise this negative assertion would
    // trivially "pass" against a page that doesn't implement the collisions
    // block at all, which would be exactly the kind of spuriously-passing
    // test the dispatch instructions warn against.
    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect(document.body.textContent ?? "").not.toContain(COLLISIONS_NOTE_TEXT);
  });

  it("has no axe-core violations on the collisions table, its inline note, and its disclosure", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    // Prove the elements this test claims to cover actually exist before
    // scanning them — an axe.run() that passes over content that isn't
    // present would be a false-positive that proves nothing.
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(COLLISIONS_NOTE_TEXT);
    expect(container.querySelectorAll("details")).toHaveLength(5);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — three independent metrics on one page (new coverage this SPEC introduces, Edge Case 9)", () => {
  // These mocks are discriminated by which module they come from
  // (fetchDeathsPerYear / fetchInjuriesPerYear / fetchCollisionsPerYear —
  // three distinct hoisted vi.fn()s bound to three distinct vi.mock()'d
  // modules) — never by which one Promise.all happens to settle first.
  // FR-2 (Task 3) only exercised two independent unions (deaths x injuries);
  // this is the first three-way independence coverage, per SPEC.md's Edge
  // Case 9. Not all 8 permutations are enumerated — enough combinations are
  // covered that "any one metric failing doesn't affect the other two" is
  // actually demonstrated for every metric in at least one failing role and
  // at least one succeeding role.

  it("collisions ok while deaths AND injuries both error: collisions renders fully, completely unaffected by the other two failing together", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (three-way test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (three-way test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    await renderHome();

    // Collisions renders fully.
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(COLLISIONS_NOTE_TEXT);

    // Deaths and injuries each show their own error, no crash, no
    // suppression of the collisions render.
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(three-way test, deaths\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(three-way test, injuries\)/i),
    ).toBeInTheDocument();
  });

  it("collisions error while deaths AND injuries both ok (the inverse): the other two render fully, unsuppressed by the collisions failure", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (three-way test, collisions)",
    });

    await renderHome();

    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(callsFor("deaths")).toHaveLength(1);

    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(three-way test, collisions\)/i),
    ).toBeInTheDocument();
  });

  it("mixed combination: deaths ok, injuries error, collisions empty — each of the three renders its own defined state independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2019 (three-way mixed test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2019/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();

    // All three disclosures still render regardless of each metric's status
    // (FR-8's unconditional-disclosure guarantee, extended to three).
    expect(container.querySelectorAll("details")).toHaveLength(5);
  });

  it("mixed combination (another): deaths error, injuries empty, collisions ok — each of the three renders its own defined state independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2021 (three-way mixed test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: INJURIES_SYNTHETIC_SOQL,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2021/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(COLLISIONS_NOTE_TEXT);

    expect(container.querySelectorAll("details")).toHaveLength(5);
  });
});

describe("/ (Home) — this SPEC: chart independence (a collisions chart failure must never suppress the deaths chart, and vice versa)", () => {
  // Table-level independence between deaths/injuries/collisions was already
  // established above (Task 3 Edge Case 9, this SPEC's three-way block).
  // This block is the chart-specific extension SPEC.md's Output 3/Inputs-
  // Outputs section names explicitly: each of the two YearlyLineChart call
  // sites must mount or not mount purely as a function of its *own*
  // metric's status, never the other's.

  it("both charts mount, each exactly once, when both metrics are ok", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Collisions' default-"ok" beforeEach value applies unmodified.

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(1);
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-deaths")).toBeInTheDocument();
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
  });

  it("collisions empty: the collisions chart never mounts, but the deaths chart still does", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(callsFor("collisions")).toHaveLength(0);
    expect(
      screen.queryByTestId("yearly-chart-collisions"),
    ).not.toBeInTheDocument();
    expect(callsFor("deaths")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-deaths")).toBeInTheDocument();
  });

  it("collisions error: the collisions chart never mounts, but the deaths chart still does", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (chart-independence test, collisions)",
    });

    await renderHome();

    expect(callsFor("collisions")).toHaveLength(0);
    expect(
      screen.queryByTestId("yearly-chart-collisions"),
    ).not.toBeInTheDocument();
    expect(callsFor("deaths")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-deaths")).toBeInTheDocument();
  });

  it("deaths error while collisions ok (the inverse): the deaths chart never mounts, but the collisions chart still does", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (chart-independence test, deaths)",
    });
    // Collisions' default-"ok" beforeEach value applies unmodified.

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(screen.queryByTestId("yearly-chart-deaths")).not.toBeInTheDocument();
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
  });

  it("deaths empty while collisions ok (the inverse): the deaths chart never mounts, but the collisions chart still does", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(screen.queryByTestId("yearly-chart-deaths")).not.toBeInTheDocument();
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
  });

  it("both charts are absent when both metrics fail together", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason:
        "Socrata responded 503 (chart-independence test, both-fail deaths)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason:
        "Socrata responded 503 (chart-independence test, both-fail collisions)",
    });

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(callsFor("collisions")).toHaveLength(0);
    expect(screen.queryByTestId("yearly-chart-deaths")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("yearly-chart-collisions"),
    ).not.toBeInTheDocument();
  });
});

describe("/ (Home) — repaired collisions block (FR-12, FR-8, FR-10, NFR-3, NFR-5 affirmative framing)", () => {
  it("renders an accessible repaired-collisions <table> with columnLabel 'Repaired collisions', the verbatim caption text, the verbatim inline note, and its own SoQL disclosure", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Injuries, collisions, and repaired collisions all use their default
    // "ok" beforeEach values here unmodified.

    const { container } = await renderHome();

    const table = screen.getByRole("table", { name: REPAIRED_TABLE_NAME });
    expect(table).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /repaired collisions/i }),
    ).toBeInTheDocument();
    // 8 data rows + 1 header row, scoped to the repaired-collisions table
    // only.
    expect(within(table).getAllByRole("row")).toHaveLength(9);

    // The verbatim caption text (SPEC.md Output 4) — copied exactly, not
    // paraphrased.
    expect(
      screen.getByText(
        "NYC collisions with a recorded injury or death per year, 2018–2025",
      ),
    ).toBeInTheDocument();

    // The verbatim inline note (SPEC.md Output 4) — copied exactly, not
    // paraphrased, and present as real page copy (not merely in an
    // attribute).
    expect(document.body.textContent ?? "").toContain(REPAIRED_NOTE_TEXT);

    const disclosures = Array.from(container.querySelectorAll("details"));
    const repairedDisclosure = disclosures.find((d) =>
      /repaired/i.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(repairedDisclosure).toBeTruthy();
    expect(repairedDisclosure).toHaveTextContent("SoQL query — repaired");
    expect(repairedDisclosure).toHaveTextContent(REPAIRED_SYNTHETIC_SOQL);
  });

  it("positions the repaired-collisions table after the raw collisions table in document order", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const collisionsTable = screen.getByRole("table", {
      name: COLLISIONS_TABLE_NAME,
    });
    const repairedTable = screen.getByRole("table", {
      name: REPAIRED_TABLE_NAME,
    });
    const position = collisionsTable.compareDocumentPosition(repairedTable);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("renders a visible, non-decorative repaired-collisions error message, independent of deaths, injuries, and raw collisions (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: REPAIRED_SYNTHETIC_SOQL,
      kind: "contract",
      reason:
        "no aggregate returned for 2021 (synthetic repaired-collisions test reason)",
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2021/i),
    ).toBeInTheDocument();
    // The failure must not suppress the other three metrics' renders.
    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
  });

  it("renders a visible, non-decorative repaired-collisions empty-state message, distinct from the error path (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: REPAIRED_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();
    // Not just "some text somewhere" — the repaired-collisions block's own
    // disclosure must still be present, proving this assertion actually
    // exercises repaired collisions and isn't a false-positive pass off the
    // other three blocks' unrelated content.
    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
  });

  it("never renders the inline REPAIRED_NOTE_TEXT on the repaired-collisions error or empty paths — the note is part of the ok-branch table rendering only", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: REPAIRED_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect(document.body.textContent ?? "").not.toContain(REPAIRED_NOTE_TEXT);
  });

  it("has no axe-core violations on the repaired-collisions table, its inline note, and its disclosure", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    // Prove the elements this test claims to cover actually exist before
    // scanning them — an axe.run() that passes over content that isn't
    // present would be a false-positive that proves nothing.
    expect(
      screen.getByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(REPAIRED_NOTE_TEXT);
    expect(container.querySelectorAll("details")).toHaveLength(5);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — arrests block (FR-5, FR-8, FR-10, NFR-3, NFR-5 label-only)", () => {
  // Unlike the collisions/repaired-collisions blocks above, MetricSection is
  // not mocked in this file (it never has been) — the real component renders
  // a real <table>, so these assertions read the rendered DOM directly, the
  // same idiom every pre-existing table assertion in this file already uses.
  // The chart half, by contrast, IS mocked (YearlyLineChart), so its props
  // are asserted via `callsFor("arrests")` against the shared mock, exactly
  // like the deaths/collisions chart-mount assertions above.

  // Worked out by hand from ARRESTS_SYNTHETIC_ROWS' own fixture values
  // (12000 -> 15500, 2018 -> 2025): (15500 - 12000) / 12000 * 100 =
  // 29.1666...%, rounds to 29, an arithmetic fact about this file's own
  // synthetic fixture, never a re-derivation of a real figure (NFR-4).
  const ARRESTS_CHANGE_SUMMARY = "2018–2025 change: +29% (12000 → 15500)";

  it("renders an accessible arrests <table> with columnLabel 'Arrests', the verbatim caption text, 8 rows, and its own SoQL disclosure", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Injuries, collisions, repaired collisions, and arrests all use their
    // default "ok" beforeEach values here unmodified.

    const { container } = await renderHome();

    const table = screen.getByRole("table", { name: /arrests/i });
    expect(table).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Arrests" }),
    ).toBeInTheDocument();
    // 8 data rows + 1 header row, scoped to the arrests table only.
    expect(within(table).getAllByRole("row")).toHaveLength(9);

    // The verbatim caption text (SPEC.md's pinned string) — copied exactly,
    // not paraphrased.
    expect(
      screen.getByText(
        "NYC traffic-enforcement arrests per year, 2018–2025 (five offense categories)",
      ),
    ).toBeInTheDocument();

    const disclosures = Array.from(container.querySelectorAll("details"));
    const arrestsDisclosure = disclosures.find((d) =>
      /arrests/i.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(arrestsDisclosure).toBeTruthy();
    expect(arrestsDisclosure).toHaveTextContent("SoQL query — arrests");
    expect(arrestsDisclosure).toHaveTextContent(ARRESTS_SYNTHETIC_SOQL);
  });

  it("positions the arrests table after the repaired-collisions table, and before Caveats, in document order", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const repairedTable = screen.getByRole("table", {
      name: REPAIRED_TABLE_NAME,
    });
    const arrestsTable = screen.getByRole("table", { name: /arrests/i });
    const caveatsStub = screen.getByTestId("caveats-stub");

    const repairedToArrests =
      repairedTable.compareDocumentPosition(arrestsTable);
    expect(Boolean(repairedToArrests & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    );

    const arrestsToCaveats = arrestsTable.compareDocumentPosition(caveatsStub);
    expect(Boolean(arrestsToCaveats & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    );
  });

  it("renders a visible, non-decorative arrests error message, independent of the other four metrics (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: ARRESTS_SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2021 (synthetic arrests test reason)",
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: /arrests/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2021/i),
    ).toBeInTheDocument();
    // The failure must not suppress the other four metrics' renders.
    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).toBeInTheDocument();
  });

  it("renders a visible, non-decorative arrests empty-state message, distinct from the error path (FR-10)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: ARRESTS_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(
      screen.queryByRole("table", { name: /arrests/i }),
    ).not.toBeInTheDocument();
    // Not just "some text somewhere" — the arrests block's own disclosure
    // must still be present, proving this assertion actually exercises
    // arrests and isn't a false-positive pass off the other four blocks'
    // unrelated content.
    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
  });

  it("Intellectual Control point 5: renders no inline note for arrests — the ok branch carries exactly one <p> after the table (the change-summary line), never a bespoke caveat, unlike collisions/repaired-collisions", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const arrestsTable = screen.getByRole("table", { name: /arrests/i });
    const disclosures = Array.from(container.querySelectorAll("details"));
    const arrestsDisclosure = disclosures.find((d) =>
      /arrests/i.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(arrestsDisclosure).toBeTruthy();

    // Every <p> in the document that comes after the arrests table and
    // before the arrests table's own SoQL disclosure — arrests is the last
    // metric block before Caveats, so this range contains only this
    // metric's own paragraphs (the change summary, and the note if any),
    // never another metric's.
    const paragraphsBetween = Array.from(
      container.querySelectorAll("p"),
    ).filter((p) => {
      const afterTable = Boolean(
        arrestsTable.compareDocumentPosition(p) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      const beforeDisclosure = Boolean(
        (arrestsDisclosure as Element).compareDocumentPosition(p) &
        Node.DOCUMENT_POSITION_PRECEDING,
      );
      return afterTable && beforeDisclosure;
    });

    expect(paragraphsBetween).toHaveLength(1);
    expect(paragraphsBetween[0]).toHaveTextContent(ARRESTS_CHANGE_SUMMARY);
    // None of the known caveat sentences used elsewhere on the page (which
    // would indicate a note was mistakenly wired up) appear here.
    expect(paragraphsBetween[0].textContent).not.toContain(
      COLLISIONS_NOTE_TEXT,
    );
    expect(paragraphsBetween[0].textContent).not.toContain(REPAIRED_NOTE_TEXT);
  });

  it("has no axe-core violations on the arrests table, its chart stub, and its disclosure", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    expect(screen.getByRole("table", { name: /arrests/i })).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(5);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — the arrests <YearlyLineChart> mount (FR-5)", () => {
  // The chart half is asserted through the shared YearlyLineChart mock, the
  // same idiom the deaths/collisions chart-mount tests above already use —
  // this component IS mocked in this file, unlike MetricSection.

  it("mounts the arrests chart exactly once, before the arrests table, with the pinned props verbatim", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Arrests' default-"ok" beforeEach value applies unmodified.

    const { container } = await renderHome();

    const arrestsCalls = callsFor("arrests");
    expect(arrestsCalls).toHaveLength(1);
    const props = arrestsCalls[0][0] as YearlyLineChartProps<"arrests">;

    // Same array, not a copy — the chart and the table must provably plot
    // and list the same objects, never two reads of one source that could
    // drift (SPEC.md's Intellectual Control).
    expect(props.rows).toBe(ARRESTS_SYNTHETIC_ROWS);
    expect(props.fieldAlias).toBe("arrests");
    expect(props.seriesLabel).toBe("Arrests");
    expect(props.strokeStyle).toBe("solid");
    // Reuse, not a new token (SPEC.md Intellectual Control point 4) — a
    // wrong colorSlot here would silently visually collide with the deaths
    // chart's own solid/slot-1 line without any other test catching it.
    expect(props.colorSlot).toBe(1);
    expect(props.ariaLabel).toBe(
      "Line chart of NYC traffic-enforcement arrest counts per year from 2018 to 2025.",
    );
    expect(props.captionText).toBe(
      "NYC traffic-enforcement arrests per year, 2018–2025. Every plotted figure is listed in the table below.",
    );
    // No bespoke caveat (SPEC.md Intellectual Control point 5) — unlike the
    // collisions/repaired-collisions chart and table calls, arrests passes
    // no `note` prop at all, not even an empty string.
    expect(props.note).toBeUndefined();
    expect("note" in props).toBe(false);

    const chartStub = screen.getByTestId("yearly-chart-arrests");
    const table = screen.getByRole("table", { name: /arrests/i });
    const position = chartStub.compareDocumentPosition(table);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(container.contains(chartStub)).toBe(true);
  });

  it("the arrests chart never mounts on the arrests error path, independent of the other four metrics' charts/tables", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: ARRESTS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (arrests chart-independence test)",
    });

    await renderHome();

    expect(callsFor("arrests")).toHaveLength(0);
    expect(
      screen.queryByTestId("yearly-chart-arrests"),
    ).not.toBeInTheDocument();
    expect(callsFor("deaths")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-deaths")).toBeInTheDocument();
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
  });

  it("the arrests chart never mounts on the arrests empty path, independent of the other four metrics", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: ARRESTS_SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(callsFor("arrests")).toHaveLength(0);
    expect(
      screen.queryByTestId("yearly-chart-arrests"),
    ).not.toBeInTheDocument();
    expect(callsFor("deaths")).toHaveLength(1);
  });

  it("the deaths and collisions charts are unaffected when only the arrests chart fails (the deaths/collisions chart-independence guarantee extended to a third, independently-mounted chart)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: ARRESTS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason:
        "Socrata responded 503 (arrests chart-independence test, inverse)",
    });
    // Collisions' default-"ok" beforeEach value applies unmodified.

    await renderHome();

    expect(callsFor("deaths")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-deaths")).toBeInTheDocument();
    expect(callsFor("collisions")).toHaveLength(1);
    expect(screen.getByTestId("yearly-chart-collisions")).toBeInTheDocument();
    expect(callsFor("arrests")).toHaveLength(0);
  });
});

describe("/ (Home) — five independent metrics on one page (this SPEC's Edge Case 9 extension: arrests joins deaths, injuries, collisions, repaired collisions)", () => {
  // These two tests are the combinations the dispatch instructions name
  // explicitly: arrests alone failing while the other four succeed, and the
  // inverse (arrests alone succeeding while the other four fail) —
  // extending the four-way independence block above (Edge Case 9) to the
  // fifth, arrests metric this SPEC adds. Not all 32 permutations are
  // enumerated, matching the established convention of this file's prior
  // three-way/four-way independence blocks.

  it("arrests ok while deaths, injuries, collisions, AND repaired collisions all error: arrests renders fully, completely unaffected by the other four failing together", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (five-way test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (five-way test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (five-way test, collisions)",
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: REPAIRED_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (five-way test, repaired collisions)",
    });
    // Arrests' default-"ok" beforeEach value applies unmodified.

    await renderHome();

    expect(screen.getByRole("table", { name: /arrests/i })).toBeInTheDocument();
    expect(callsFor("arrests")).toHaveLength(1);

    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(five-way test, deaths\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(five-way test, injuries\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(five-way test, collisions\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Socrata responded 503 \(five-way test, repaired collisions\)/i,
      ),
    ).toBeInTheDocument();
  });

  it("arrests error while deaths, injuries, collisions, AND repaired collisions are all ok (the inverse): the other four render fully, unsuppressed by the arrests failure", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: REPAIRED_SYNTHETIC_SOQL,
      rows: REPAIRED_SYNTHETIC_ROWS,
    });
    fetchArrestsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: ARRESTS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (five-way test, arrests)",
    });

    await renderHome();

    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: /arrests/i }),
    ).not.toBeInTheDocument();
    expect(callsFor("arrests")).toHaveLength(0);
    expect(
      screen.getByText(/Socrata responded 503 \(five-way test, arrests\)/i),
    ).toBeInTheDocument();

    // All five disclosures still render regardless of each metric's status
    // (FR-8's unconditional-disclosure guarantee, extended to five).
    expect(document.querySelectorAll("details")).toHaveLength(5);
  });
});

describe("/ (Home) — four independent metrics on one page (this SPEC's Edge Case 9 extension: deaths, injuries, collisions, repaired collisions)", () => {
  // These mocks are discriminated by which module they come from (four
  // distinct hoisted vi.fn()s bound to four distinct vi.mock()'d modules) —
  // never by which one Promise.all happens to settle first. This is the
  // first four-way independence coverage, extending the three-way block
  // above (Edge Case 9) to the repaired-collisions metric this SPEC adds.
  // Not all 16 permutations are enumerated — enough combinations are covered
  // that "any one metric failing doesn't affect the other three" is
  // demonstrated for repaired collisions in both a failing role and a
  // succeeding role, alongside the other three in mixed states.

  it("repaired collisions ok while deaths, injuries, AND collisions all error: repaired collisions renders fully, completely unaffected by the other three failing together", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (four-way test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (four-way test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (four-way test, collisions)",
    });
    // Repaired collisions' default-"ok" beforeEach value applies unmodified.

    await renderHome();

    expect(
      screen.getByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(REPAIRED_NOTE_TEXT);

    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(four-way test, deaths\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(four-way test, injuries\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Socrata responded 503 \(four-way test, collisions\)/i),
    ).toBeInTheDocument();
  });

  it("repaired collisions error while deaths, injuries, AND collisions are all ok (the inverse): the other three render fully, unsuppressed by the repaired-collisions failure", async () => {
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
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: REPAIRED_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (four-way test, repaired collisions)",
    });

    await renderHome();

    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /injuries/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Socrata responded 503 \(four-way test, repaired collisions\)/i,
      ),
    ).toBeInTheDocument();
  });

  it("mixed combination: deaths ok, injuries error, collisions empty, repaired collisions ok — each of the four renders its own defined state independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2019 (four-way mixed test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });
    // Repaired collisions' default-"ok" beforeEach value applies unmodified.

    const { container } = await renderHome();

    expect(screen.getByRole("table", { name: /deaths/i })).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2019/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(REPAIRED_NOTE_TEXT);

    // All four disclosures still render regardless of each metric's status
    // (FR-8's unconditional-disclosure guarantee, extended to four).
    expect(container.querySelectorAll("details")).toHaveLength(5);
  });

  it("mixed combination (another): deaths error, injuries empty, collisions ok, repaired collisions empty — each of the four renders its own defined state independently", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2021 (four-way mixed test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: INJURIES_SYNTHETIC_SOQL,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: REPAIRED_SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    expect(callsFor("deaths")).toHaveLength(0);
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2021/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain(COLLISIONS_NOTE_TEXT);

    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();

    expect(container.querySelectorAll("details")).toHaveLength(5);
  });
});

describe("/ (Home) — Caveats section (FR-9): mounted unconditionally, independent of all four metrics' fetch status", () => {
  // Caveats has no data dependency (SPEC.md's Intellectual Control: "a
  // reader is arguably most in need of these caveats exactly when something
  // *has* gone wrong"), so unlike every MetricSection/YearlyLineChart call
  // site above, its render must never be gated behind any result.status —
  // this is the "critical independence test" the dispatch instructions name
  // explicitly.

  it("renders the Caveats component exactly once, with no props, in the default all-ok path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    // Injuries, collisions, and repaired collisions use their default "ok"
    // beforeEach values here unmodified.

    await renderHome();

    expect(Caveats).toHaveBeenCalledTimes(1);
    expect(Caveats.mock.calls[0][0]).toEqual({});
    expect(screen.getByTestId("caveats-stub")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("caveats-stub")).getByRole("heading", {
        name: "Caveats",
      }),
    ).toBeInTheDocument();
  });

  it("positions the Caveats mount after the repaired-collisions table — the last child of <main>, per SPEC.md's page.tsx Output", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const repairedTable = screen.getByRole("table", {
      name: REPAIRED_TABLE_NAME,
    });
    const caveatsStub = screen.getByTestId("caveats-stub");
    const position = repairedTable.compareDocumentPosition(caveatsStub);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("the critical independence test: all four metrics erroring simultaneously never suppresses Caveats", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (Caveats independence test, deaths)",
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (Caveats independence test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (Caveats independence test, collisions)",
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: REPAIRED_SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 503 (Caveats independence test, repaired)",
    });

    await renderHome();

    // All four metrics show their own error state, no crash — and, the
    // point of this test, Caveats renders anyway.
    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();

    expect(Caveats).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("caveats-stub")).toBeInTheDocument();
  });

  it("all four metrics empty simultaneously never suppresses Caveats", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: INJURIES_SYNTHETIC_SOQL,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: REPAIRED_SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(
      screen.queryByRole("table", { name: /deaths/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /injuries/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: COLLISIONS_TABLE_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: REPAIRED_TABLE_NAME }),
    ).not.toBeInTheDocument();

    expect(Caveats).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("caveats-stub")).toBeInTheDocument();
  });

  it("a mixed combination of statuses (ok/error/empty/error) never suppresses Caveats — genuine independence, not just the happy path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: INJURIES_SYNTHETIC_SOQL,
      kind: "contract",
      reason:
        "no aggregate returned for 2020 (Caveats independence test, injuries)",
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: COLLISIONS_SYNTHETIC_SOQL,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: REPAIRED_SYNTHETIC_SOQL,
      kind: "contract",
      reason:
        "no aggregate returned for 2021 (Caveats independence test, repaired)",
    });

    await renderHome();

    expect(Caveats).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("caveats-stub")).toBeInTheDocument();
  });

  it("has no axe-core violations with the Caveats stub mounted alongside the rest of the page", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    expect(screen.getByTestId("caveats-stub")).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — the SEE_CAVEATS_POINTER forward-reference (FR-9): appended to both existing inline notes", () => {
  // Edge Case from SPEC.md: "The appended pointer text must not break any
  // existing toContain(COLLISIONS_NOTE_TEXT) / toContain(REPAIRED_NOTE_TEXT)
  // assertion in page.test.tsx — those are substring checks against the
  // *original* (unappended) constants defined in the test file itself, so
  // they remain valid against the longer, pointer-appended strings in
  // page.tsx without modification." Verified true by inspection: every
  // pre-existing `toContain(COLLISIONS_NOTE_TEXT)` / `toContain
  // (REPAIRED_NOTE_TEXT)` call above this describe block is left completely
  // unmodified — `String.prototype.includes`/`toContain` matches a
  // substring, and COLLISIONS_NOTE_TEXT/REPAIRED_NOTE_TEXT remain exact
  // prefixes of the longer, pointer-appended strings page.tsx is expected to
  // render once SEE_CAVEATS_POINTER is appended. The two tests below add the
  // new, positive assertion that the longer, appended string is actually
  // present — which the pre-existing prefix-only assertions cannot by
  // themselves prove.

  it("appends the pointer sentence to the end of the rendered collisions note", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });

    await renderHome();

    expect(document.body.textContent ?? "").toContain(
      COLLISIONS_NOTE_TEXT + SEE_CAVEATS_POINTER,
    );
  });

  it("appends the pointer sentence to the end of the rendered repaired-collisions note", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: REPAIRED_SYNTHETIC_SOQL,
      rows: REPAIRED_SYNTHETIC_ROWS,
    });

    await renderHome();

    expect(document.body.textContent ?? "").toContain(
      REPAIRED_NOTE_TEXT + SEE_CAVEATS_POINTER,
    );
  });

  it("the pre-existing verbatim COLLISIONS_NOTE_TEXT/REPAIRED_NOTE_TEXT substring assertions remain satisfiable unmodified, since both remain exact prefixes of their pointer-appended rendering", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });
    fetchCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: COLLISIONS_SYNTHETIC_SOQL,
      rows: COLLISIONS_SYNTHETIC_ROWS,
    });
    fetchRepairedCollisionsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: REPAIRED_SYNTHETIC_SOQL,
      rows: REPAIRED_SYNTHETIC_ROWS,
    });

    await renderHome();

    const text = document.body.textContent ?? "";
    // Exactly the pre-existing assertion form used throughout this file
    // above (e.g. line ~823, ~950, ~1285) — unmodified.
    expect(text).toContain(COLLISIONS_NOTE_TEXT);
    expect(text).toContain(REPAIRED_NOTE_TEXT);
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
