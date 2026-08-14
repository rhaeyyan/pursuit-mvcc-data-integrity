// Behavioral tests for the redesigned <SeriesRegistry> (MVCC Workspace
// registry view). This component is purely presentational — every value
// it renders comes straight from the `registry`/`inspectorItems`/
// `defensible` props, so these tests prove wiring and structure, not
// arithmetic (that's covered by seriesConfig.test.ts's real callers).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import { SeriesRegistry, type RegistryEntry } from "./SeriesRegistry";
import { WorkspaceInspectorProvider } from "@/context/WorkspaceInspectorContext";

const REGISTRY: RegistryEntry[] = [
  {
    id: "deaths",
    label: "Deaths",
    ink: "var(--color-text)",
    dash: "solid",
    badgeText: "Mandatory record",
    badgeTone: "neutral",
    note: "Medical examiner's count.",
    dataset: "h9gi-nx95",
    aggregate: "sum(number_of_persons_killed)",
    span: "80 → 79",
    coverage: "8 of 8 years verified",
    soql: "$select=date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths",
  },
  {
    id: "pdo",
    label: "Property-damage-only, derived",
    ink: "var(--color-accent-2-400)",
    dash: "dotted",
    badgeText: "Derived residual",
    badgeTone: "outline",
    note: "Raw minus casualty-filtered.",
    dataset: "derived",
    aggregate: "collisions − repaired",
    span: "6,000 → 1,300",
    coverage: "Derived from two verified series",
    soql: "Derived client-side: collisions − repaired, per year. No query of its own.",
  },
];

function withProvider(children: ReactNode) {
  return render(
    <WorkspaceInspectorProvider>{children}</WorkspaceInspectorProvider>,
  );
}

describe("<SeriesRegistry> — renders every entry from props", () => {
  it("renders one article per registry entry, with its label, badge, and dataset/aggregate/span/coverage", () => {
    withProvider(
      <SeriesRegistry
        registry={REGISTRY}
        inspectorItems={[]}
        defensible="test defensible line"
      />,
    );

    expect(screen.getByRole("heading", { name: "Deaths" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Property-damage-only, derived" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mandatory record")).toBeInTheDocument();
    expect(screen.getByText("80 → 79")).toBeInTheDocument();
    expect(screen.getByText("6,000 → 1,300")).toBeInTheDocument();
  });

  it("gives the derived PDO entry a 'no query of its own' note instead of a fabricated SoQL string", () => {
    withProvider(
      <SeriesRegistry
        registry={REGISTRY}
        inspectorItems={[]}
        defensible="test defensible line"
      />,
    );

    const pdoHeading = screen.getByRole("heading", {
      name: "Property-damage-only, derived",
    });
    const pdoArticle = pdoHeading.closest("article") as HTMLElement;
    expect(
      within(pdoArticle).getByText(/No query of its own/),
    ).toBeInTheDocument();
  });

  it("keeps each entry's SoQL text collapsed behind a <details>/<summary> disclosure, not shown by default", () => {
    withProvider(
      <SeriesRegistry
        registry={REGISTRY}
        inspectorItems={[]}
        defensible="test defensible line"
      />,
    );

    const details = document.querySelectorAll("details");
    expect(details).toHaveLength(REGISTRY.length);
    details.forEach((d) => expect(d.hasAttribute("open")).toBe(false));
  });

  it("renders the arrest-demographic exclusion footnote", () => {
    withProvider(
      <SeriesRegistry
        registry={REGISTRY}
        inspectorItems={[]}
        defensible="test defensible line"
      />,
    );
    expect(
      screen.getByText(/permanently excluded from ingestion/i),
    ).toBeInTheDocument();
  });

  it("has zero axe-core violations", async () => {
    const { container } = withProvider(
      <SeriesRegistry
        registry={REGISTRY}
        inspectorItems={[]}
        defensible="test defensible line"
      />,
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source-level greps — same infra pattern as UnifiedTimeline.test.tsx.
// ---------------------------------------------------------------------------

const COMPONENT_PATH = join(__dirname, "SeriesRegistry.tsx");

describe("src/components/SeriesRegistry.tsx — source-level greps", () => {
  function readSourceOrFail(): string {
    if (!existsSync(COMPONENT_PATH)) {
      throw new Error(`${COMPONENT_PATH} does not exist.`);
    }
    return readFileSync(COMPONENT_PATH, "utf8");
  }

  it("contains the 'use client' directive at the top of the file", () => {
    expect(readSourceOrFail()).toMatch(/^['"]use client['"]/m);
  });

  it("never imports a lib/fetch module directly — every value must arrive as a prop from the server page", () => {
    const source = readSourceOrFail();
    expect(source).not.toMatch(/from ["']@\/lib\//);
  });

  it("does not read process.env — a client component never touches the token (NFR-2, Rule 3)", () => {
    const source = readSourceOrFail();
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });
});
