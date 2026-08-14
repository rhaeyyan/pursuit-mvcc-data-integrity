/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { expect, test, describe, vi, beforeEach } from "vitest";
import axe from "axe-core";

import TDILeaderboard from "@/components/TDILeaderboard";
import TDIPage from "./page";
import * as tdiLib from "@/lib/tdi";

vi.mock("@/lib/tdi", () => ({
  fetchTDILeaderboard: vi.fn(),
}));

describe("TDILeaderboard component", () => {
  const mockData = [
    {
      region: "Brooklyn",
      tdi: 8.5,
      deaths: 40,
      injuries: 4000,
      population: 2600000,
    },
    {
      region: "Queens",
      tdi: 6.2,
      deaths: 30,
      injuries: 3000,
      population: 2400000,
    },
    {
      region: "Staten Island",
      tdi: 2.1,
      deaths: 5,
      injuries: 500,
      population: 500000,
    },
  ];

  test("renders an accessible table with caption and column headers", async () => {
    const { container } = render(<TDILeaderboard data={mockData} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Must have a caption
    const caption = container.querySelector("caption");
    expect(caption).toBeInTheDocument();

    // Must have scope="col" for th elements
    const colHeaders = screen.getAllByRole("columnheader");
    expect(colHeaders.length).toBeGreaterThan(0);
    colHeaders.forEach((th) => {
      expect(th).toHaveAttribute("scope", "col");
    });

    // Accessibility check
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  test("renders data correctly and highlights highest/lowest TDI", () => {
    render(<TDILeaderboard data={mockData} />);

    // Verify regions are rendered
    expect(screen.getByText("Brooklyn")).toBeInTheDocument();
    expect(screen.getByText("Queens")).toBeInTheDocument();
    expect(screen.getByText("Staten Island")).toBeInTheDocument();

    // Verify highlighting exists (implementation can vary, but we expect some
    // structural difference, e.g. a specific class, data-attribute, or inline style
    // for the most dangerous (first) and safest (last) rows compared to middle ones)
    const rows = screen.getAllByRole("row");
    // rows[0] is typically the header row.
    const dataRows = rows.slice(1);
    expect(dataRows).toHaveLength(3);

    // For TDD, we just expect the row to have SOME attribute indicating highlight
    // or we can just ensure they render. To enforce the SPEC's highlighting requirement:
    // We expect the highest (first) and lowest (last) to have different classes or styles
    // than the middle one.
    const highestRow = dataRows[0];
    const middleRow = dataRows[1];
    const lowestRow = dataRows[2];

    const highestAttr =
      highestRow.className +
      highestRow.getAttribute("style") +
      highestRow.getAttribute("data-highlight");
    const middleAttr =
      middleRow.className +
      middleRow.getAttribute("style") +
      middleRow.getAttribute("data-highlight");
    const lowestAttr =
      lowestRow.className +
      lowestRow.getAttribute("style") +
      lowestRow.getAttribute("data-highlight");

    expect(highestAttr).not.toEqual(middleAttr);
    expect(lowestAttr).not.toEqual(middleAttr);
  });
});

describe("TDI Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches and renders TDI leaderboard data", async () => {
    const mockData = [
      {
        region: "Bronx",
        tdi: 9.0,
        deaths: 45,
        injuries: 4500,
        population: 1400000,
      },
      {
        region: "Manhattan",
        tdi: 5.0,
        deaths: 25,
        injuries: 2500,
        population: 1600000,
      },
    ];

    vi.mocked(tdiLib.fetchTDILeaderboard).mockResolvedValue(mockData);

    const { container } = render(
      await TDIPage({ searchParams: Promise.resolve({}) }),
    );

    expect(tdiLib.fetchTDILeaderboard).toHaveBeenCalledTimes(1);

    // Expect the table to render with fetched data
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Bronx")).toBeInTheDocument();
    expect(screen.getByText("Manhattan")).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
