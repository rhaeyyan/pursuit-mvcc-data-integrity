/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, describe, vi, beforeEach } from "vitest";
import axe from "axe-core";

import LocalSearch from "../../components/LocalSearch";
import LocalPage from "./page";
import * as localLedger from "../../lib/localLedger";
import type { YearlyMetricResult } from "../../lib/socrata";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the data layer
vi.mock("../../lib/localLedger", () => ({
  fetchLocalRawSeries: vi.fn(),
  fetchLocalRepairedSeries: vi.fn(),
}));

describe("LocalSearch component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders an accessible searchbox", async () => {
    const { container } = render(<LocalSearch />);

    const input = screen.getByRole("searchbox", { name: /zip/i });
    expect(input).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  test("navigates to ?zip={value} on submit", async () => {
    render(<LocalSearch />);
    const input = screen.getByRole("searchbox", { name: /zip/i });
    const button = screen.getByRole("button", { name: /search/i });

    await userEvent.type(input, "11201");
    await userEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("?zip=11201");
  });
});

describe("Local Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("displays prompt when no zip is provided", async () => {
    const { container } = render(
      await LocalPage({ searchParams: Promise.resolve({}) }),
    );

    // Look for a prompt state rather than data
    expect(screen.getByText(/search/i)).toBeInTheDocument();

    // Should not call data fetching if no zip
    expect(localLedger.fetchLocalRawSeries).not.toHaveBeenCalled();
    expect(localLedger.fetchLocalRepairedSeries).not.toHaveBeenCalled();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  test("fetches and renders metrics when zip is provided", async () => {
    const mockRaw: YearlyMetricResult<"collisions"> = {
      status: "ok",
      soql: "SELECT *",
      rows: [{ year: 2023, collisions: 100 }],
    };
    const mockRepaired: YearlyMetricResult<"collisions"> = {
      status: "ok",
      soql: "SELECT *",
      rows: [{ year: 2023, collisions: 150 }],
    };

    vi.mocked(localLedger.fetchLocalRawSeries).mockResolvedValue(mockRaw);
    vi.mocked(localLedger.fetchLocalRepairedSeries).mockResolvedValue(
      mockRepaired,
    );

    // Provide zip via searchParams
    const { container } = render(
      await LocalPage({ searchParams: Promise.resolve({ zip: "11201" }) }),
    );

    expect(localLedger.fetchLocalRawSeries).toHaveBeenCalledWith("11201");
    expect(localLedger.fetchLocalRepairedSeries).toHaveBeenCalledWith("11201");

    // Assuming the page passes caption texts to MetricSection
    // In a real TDD scenario, these would act as the contract for the developer to follow
    expect(screen.getByRole("table", { name: /raw/i })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /repaired/i }),
    ).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
