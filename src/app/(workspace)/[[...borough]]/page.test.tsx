// Page-level behavioral tests for the Timeline route.
//
// The second describe is SPEC.md [SPEC] — T3 (wave 1). It was written in the
// TDD red phase against a page that still rendered `<BoroughPicker />`; that
// component is now deleted and every assertion here is green. The
// "no borough control" assertions are the regression guard against it
// returning. The borough-blocked assertions in the same block must also stay
// green — deleting the picker removed the in-app path to /B, not the URL.
// generateStaticParams still prerenders all six
// variants, so /B remains a static file on the CDN reachable by bookmark,
// external link or typed URL, and the refusal panel becomes the only thing
// between a direct hit and a chart the product itself says cannot be trusted.

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { fetchDeathsPerYear } from "@/lib/deaths";
import { fetchInjuriesPerYear } from "@/lib/injuries";
import { fetchCollisionsPerYear } from "@/lib/collisions";
import { fetchRepairedCollisionsPerYear } from "@/lib/repairedCollisions";
import { fetchArrestsPerYear } from "@/lib/arrests";
import { fetchCoverageData } from "@/lib/arrestsCoverage";
import { UnifiedTimeline } from "@/components/UnifiedTimeline";
import { WorkspaceInspectorProvider } from "@/context/WorkspaceInspectorContext";

import Home from "./page";
import type { ComponentProps, JSX } from "react";

vi.mock("@/lib/deaths", () => ({ fetchDeathsPerYear: vi.fn() }));
vi.mock("@/lib/injuries", () => ({ fetchInjuriesPerYear: vi.fn() }));
vi.mock("@/lib/collisions", () => ({ fetchCollisionsPerYear: vi.fn() }));
vi.mock("@/lib/repairedCollisions", () => ({
  fetchRepairedCollisionsPerYear: vi.fn(),
}));
vi.mock("@/lib/arrests", () => ({ fetchArrestsPerYear: vi.fn() }));
vi.mock("@/lib/arrestsCoverage", () => ({ fetchCoverageData: vi.fn() }));

// Mock UnifiedTimeline so we don't need to test recharts internals here.
// Declared as a hoisted `function` (not a const) so the hoisted vi.mock
// factory below can reference it, and so afterEach can put it back after a
// test swaps in the real component via vi.importActual.
function TimelineStub({
  data,
}: ComponentProps<typeof UnifiedTimeline>): JSX.Element {
  return (
    <div data-testid="unified-timeline">
      <div data-testid="deaths-status">{data.deaths?.status}</div>
    </div>
  );
}

vi.mock("@/components/UnifiedTimeline", () => ({
  UnifiedTimeline: vi.fn(TimelineStub),
}));

async function renderHome(params?: { borough?: string[] }) {
  const ui = await Home({ params: params ?? {} });
  return render(ui);
}

// The refusal panel is emitted by the real <UnifiedTimeline>, a client
// component that reads the shared inspector Context (workspace)/layout.tsx
// normally provides. Swapping the stub for the actual implementation keeps
// this a page-level integration render: the panel is asserted as the page
// really emits it for a given route param, not as a mock claims.
async function renderHomeWithRealTimeline(params?: { borough?: string[] }) {
  const actual = await vi.importActual<
    typeof import("@/components/UnifiedTimeline")
  >("@/components/UnifiedTimeline");
  vi.mocked(UnifiedTimeline).mockImplementation(actual.UnifiedTimeline);

  const ui = await Home({ params: params ?? {} });
  return render(<WorkspaceInspectorProvider>{ui}</WorkspaceInspectorProvider>);
}

// Applies to every describe below: all six page fetches resolve "ok" with no
// rows, so each test varies only the route param it is actually about.
beforeEach(() => {
  vi.mocked(fetchDeathsPerYear).mockResolvedValue({
    status: "ok",
    soql: "SELECT",
    rows: [],
  });
  vi.mocked(fetchInjuriesPerYear).mockResolvedValue({
    status: "ok",
    soql: "SELECT",
    rows: [],
  });
  vi.mocked(fetchCollisionsPerYear).mockResolvedValue({
    status: "ok",
    soql: "SELECT",
    rows: [],
  });
  vi.mocked(fetchRepairedCollisionsPerYear).mockResolvedValue({
    status: "ok",
    soql: "SELECT",
    rows: [],
  });
  vi.mocked(fetchArrestsPerYear).mockResolvedValue({
    status: "ok",
    soql: "SELECT",
    rows: [],
  });
  vi.mocked(fetchCoverageData).mockResolvedValue({
    status: "ok",
    collisions: {
      yearly: [],
      totalWindow: 0,
      populatedWindow: 0,
      windowUnpopulatedSharePercent: 0,
    },
    arrests: {
      yearly: [],
      totalWindow: 0,
      populatedWindow: 0,
      windowUnpopulatedSharePercent: 0,
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  // clearAllMocks resets calls, not implementations: put the light stub back
  // so a test that swapped in the real timeline cannot leak into the next one.
  vi.mocked(UnifiedTimeline).mockImplementation(TimelineStub);
});

describe("/[[...borough]] (Home)", () => {
  it("renders successfully and mounts UnifiedTimeline", async () => {
    await renderHome();

    expect(
      screen.getByText("The crash count fell. The crashes didn't."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("unified-timeline")).toBeInTheDocument();
  });

  it("displays an error message for invalid borough parameters", async () => {
    await renderHome({ borough: ["invalid-borough"] });
    expect(
      screen.getByText(/isn't a borough we recognise/i),
    ).toBeInTheDocument();
  });

  it("has no axe-core violations on the rendered page", async () => {
    const { container } = await renderHome();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// Every role a borough selector could plausibly wear — the <select> the
// retired picker used (combobox, plus its <option>s), the <nav> landmark that
// gave it an accessible name, and the shapes a rebuilt one would most likely
// take. Queried through the accessibility tree, so this asserts on computed
// accessible names rather than on markup that merely spells "borough".
const BOROUGH_CONTROL_ROLES = [
  "combobox",
  "listbox",
  "option",
  "button",
  "link",
  "navigation",
  "radiogroup",
  "menu",
  "group",
  "form",
] as const;

function boroughControlsIn(): string[] {
  return BOROUGH_CONTROL_ROLES.flatMap((role) =>
    screen
      .queryAllByRole(role, { name: /borough/i })
      .map((el) => `${role}: ${el.outerHTML.slice(0, 120)}`),
  );
}

describe("/[[...borough]] (Home) — T3: no borough control, refusal panel retained", () => {
  it("offers no borough control anywhere on the citywide page", async () => {
    const { container } = await renderHome();

    // Nothing in the accessibility tree may offer a borough choice, under any
    // role. Asserted first because its failure names the offender.
    expect(boroughControlsIn()).toEqual([]);

    // The retired <select> was the page's only combobox.
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);

    // UI Scope: structural — the control leaves the DOM, it is not merely
    // relabelled or visually hidden.
    expect(container.querySelector("select")).toBeNull();
  });

  it("still refuses to chart a borough reached directly at /B, with no control to have gotten there", async () => {
    await renderHomeWithRealTimeline({ borough: ["B"] });

    // "B" is the BRONX, not Brooklyn (mvcc-data trap 2) — pinned here because
    // the label now reaches the reader only via a typed or bookmarked URL.
    expect(
      screen.getByRole("heading", { name: "We can't chart Bronx reliably" }),
    ).toBeInTheDocument();

    const notes = screen.getByRole("link", {
      name: "Read the data quality notes",
    });
    expect(notes).toHaveAttribute("href", "/integrity");

    // FR-7: the refusal is the whole response — no chart, no table, no figure
    // sneaking through beside it.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("unified-timeline")).not.toBeInTheDocument();
  });

  it("degrades the refusal to figure-free language when coverage is unavailable", async () => {
    // toCoverageInfo's "unavailable" branch (SPEC T3 Edge Case 3): the empty
    // `yearly` array from the shared fetch stub above lands here, so the panel
    // must state the problem without inventing a coverage percentage.
    await renderHomeWithRealTimeline({ borough: ["B"] });

    expect(screen.getByText(/say which borough/i)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("has no axe-core violations on the borough-blocked render", async () => {
    const { container } = await renderHomeWithRealTimeline({ borough: ["B"] });

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
