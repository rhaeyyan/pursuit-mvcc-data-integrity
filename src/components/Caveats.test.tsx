// Failing tests for src/components/Caveats.tsx, written BEFORE that file
// exists, per CLAUDE.md Rule 4 and SPEC.md's standard (non-SPIKE) ordering:
// Cypress writes failing tests first, Redwood implements against them.
//
// Expect this entire file to fail red on module resolution ("Cannot find
// module './Caveats'") until Redwood creates src/components/Caveats.tsx — a
// single-cause failure, not evidence of a flawed test.
//
// Contract under test comes from SPEC.md's FR-9 "[SPEC]" Inputs/Outputs
// section: a zero-prop Server Component (no 'use client'), same posture as
// MetricSection (see src/components/MetricSection.tsx and its test file for
// the sibling static-content component convention this file follows).
//
// Every INTRO/ITEM_1..5 string below is copied verbatim, character-for-
// character, from SPEC.md's Inputs/Outputs section — never paraphrased,
// summarized, or approximately matched (SPEC.md Constraints: "Prose above
// must be reproduced verbatim, not paraphrased — Cypress will assert against
// it with toContain, matching the COLLISIONS_NOTE_TEXT/REPAIRED_NOTE_TEXT
// convention"). If Caveats.tsx's actual prose ever drifts from these
// constants, that is the finding this file exists to catch — do not "fix" a
// failure here by loosening the assertion to match the implementation.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import { Caveats } from "./Caveats";

// Verbatim from SPEC.md's Inputs/Outputs section — see this file's header.
const INTRO =
  "The figures above are accurate to what NYPD recorded, but the record itself has documented limits. Five are covered here.";

const ITEM_1 =
  "Every collision-count figure on this page after early 2020 is affected by a documented change in NYPD procedure, not a change in how many collisions actually happened. NYPD piloted a policy of no longer dispatching officers to property-damage-only collisions in Staten Island on 2019-03-18, and made it permanent citywide on 2020-04-06. Drivers in those crashes now exchange information themselves and file a report with the state DMV, and those filings never reach the dataset this page reads from. The deaths and injuries series above are largely unaffected — both still require an officer or a hospital record — which is why they hold roughly flat while the raw collision count falls.";

const ITEM_2 =
  "This dataset's borough field is left blank on a substantial share of rows, and how completely it's filled in has changed over the 2018–2025 window rather than staying constant. Any claim broken out by borough should be read alongside that fact, not as if the field were fully and evenly populated across every year.";

const ITEM_3 =
  "Deaths and injuries both rose in 2020–2021 even as recorded collisions fell. Nationwide, average vehicle speeds increased during pandemic-era lockdowns as roads emptied, which independently raises crash severity. This page does not attribute the 2020–2021 rise, or any later change, to enforcement activity or its absence — it shows the series moving together and names this as one of the reasons a causal reading isn't supported.";

const ITEM_4 =
  "Manhattan's Central Business District congestion pricing program began in January 2025 and reduced traffic entering that zone. Any claim about Manhattan specifically that runs through a 2025 endpoint should be read with that launch in mind as a possible contributor, separate from anything this page attributes to reporting or enforcement.";

const ITEM_5 =
  "NYC DOT's own reporting states that street-redesign investment since 2014 was concentrated deliberately in lower-income neighborhoods and communities of color, including several in the Bronx. A borough's deaths trend can therefore reflect a targeted infrastructure intervention rather than, or in addition to, anything this page measures about reporting or enforcement.";

// The five <h3> subheadings, in the exact order SPEC.md's Inputs/Outputs
// section's HTML sketch specifies.
const H3_HEADINGS = [
  "The 2019–2020 reporting-policy change",
  "Borough-field coverage isn't complete or constant",
  "The pandemic-era rise in deaths, 2020–2021",
  "Manhattan congestion pricing, January 2025",
  "Street Improvement Project placement",
] as const;

describe("<Caveats> — structure and content (FR-9)", () => {
  it("renders a <section> landmark with an accessible name of 'Caveats', labelled via aria-labelledby pointing at the <h2>", () => {
    const { container } = render(<Caveats />);

    const region = screen.getByRole("region", { name: "Caveats" });
    expect(region.tagName).toBe("SECTION");

    const heading = within(region).getByRole("heading", {
      level: 2,
      name: "Caveats",
    });
    expect(heading.id).toBe("caveats-heading");
    expect(region.getAttribute("aria-labelledby")).toBe("caveats-heading");

    // Sanity check that the region actually landed in the rendered tree.
    expect(container.contains(region)).toBe(true);
  });

  it("renders the INTRO paragraph verbatim", () => {
    render(<Caveats />);
    expect(screen.getByText(INTRO)).toBeInTheDocument();
  });

  it("renders all five <h3> subheadings, in order, with the exact SPEC.md text", () => {
    render(<Caveats />);

    const h3s = screen.getAllByRole("heading", { level: 3 });
    expect(h3s.map((h) => h.textContent)).toEqual([...H3_HEADINGS]);
  });

  it.each([
    ["ITEM_1", ITEM_1],
    ["ITEM_2", ITEM_2],
    ["ITEM_3", ITEM_3],
    ["ITEM_4", ITEM_4],
    ["ITEM_5", ITEM_5],
  ])("renders %s's body paragraph verbatim", (_label, itemText) => {
    render(<Caveats />);
    expect(screen.getByText(itemText)).toBeInTheDocument();
  });

  it("places the <h2> before all five <h3> elements in document order (no skipped/out-of-order heading level)", () => {
    render(<Caveats />);

    const h2 = screen.getByRole("heading", { level: 2, name: "Caveats" });
    const h3s = screen.getAllByRole("heading", { level: 3 });
    expect(h3s).toHaveLength(5);

    for (const h3 of h3s) {
      const position = h2.compareDocumentPosition(h3);
      expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    }
  });

  it("pairs each <h3> with its own body paragraph immediately following it, in the five-item order SPEC.md specifies", () => {
    render(<Caveats />);

    const h3s = screen.getAllByRole("heading", { level: 3 });
    const bodyTexts = [ITEM_1, ITEM_2, ITEM_3, ITEM_4, ITEM_5];

    h3s.forEach((h3, i) => {
      const body = screen.getByText(bodyTexts[i]);
      const position = h3.compareDocumentPosition(body);
      expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    });
  });

  it("renders synchronously from a bare zero-prop invocation, exactly as page.tsx mounts it (<Caveats />), with no mocked hooks required", () => {
    // No props passed, no hook mocked, no async awaiting required to obtain
    // the JSX — consistent with a pure, static Server Component (Caveats
    // takes zero props per SPEC.md's Inputs/Outputs section).
    const rendered = render(<Caveats />);
    expect(rendered.container.textContent).toContain("Caveats");
  });

  it("has no axe-core violations, including heading-order, on the rendered output", async () => {
    const { container } = render(<Caveats />);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — generalizing the same infra pattern already used in
// src/lib/percentChange.test.ts, src/lib/repairedCollisions.test.ts, and
// src/components/YearlyLineChart.test.tsx (the pinned-figure literal check
// and the 'use client' / Server Component posture check).
// ---------------------------------------------------------------------------

const CAVEATS_PATH = join(__dirname, "Caveats.tsx");

function readComponentSourceOrFail(): string {
  if (!existsSync(CAVEATS_PATH)) {
    throw new Error(
      `${CAVEATS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
    );
  }
  return readFileSync(CAVEATS_PATH, "utf8");
}

describe("<Caveats> — source-level greps (the only net for these constraints)", () => {
  it("contains no PRD Appendix A pinned figure (deaths/injuries/collisions/casualty-filtered) as a literal — this file's only numbers are the two policy dates (NFR-4)", () => {
    const source = readComponentSourceOrFail();

    const pinnedNumbers = [
      // Deaths.
      231, 244, 269, 297, 290, 280, 268, 229,
      // Injuries.
      61940, 61391, 44615, 51785, 51933, 54252, 54030, 49634,
      // Collisions (raw, reporting-affected).
      231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546,
      // Casualty-filtered / repaired collisions.
      45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedNumbers.join("|")})([^0-9]|$)`,
    );
    expect(pinnedFigurePattern.test(source)).toBe(false);
  });

  it("does not carry the 'use client' directive — this is a static Server Component, matching MetricSection's precedent", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/['"]use client['"]/);
  });

  it("does not read process.env — a static-prose component has no token access (NFR-2, Rule 3)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("declares no interactivity — no useState, no onClick, no useEffect (static prose only, matching the Server Component posture)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/useState/);
    expect(source).not.toMatch(/useEffect/);
    expect(source).not.toMatch(/onClick/);
  });

  it("standing clause: no @/ path-alias import in Caveats.tsx (Vitest cannot resolve it)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
