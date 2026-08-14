import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { fetchDeathsPerYear } from "@/lib/deaths";
import { fetchInjuriesPerYear } from "@/lib/injuries";
import { fetchCollisionsPerYear } from "@/lib/collisions";
import { fetchRepairedCollisionsPerYear } from "@/lib/repairedCollisions";
import { fetchArrestsPerYear } from "@/lib/arrests";
import { fetchCoverageData } from "@/lib/arrestsCoverage";
import { fetchStatenIslandPilot } from "@/lib/statenIslandPilot";

vi.mock("@/lib/deaths", () => ({ fetchDeathsPerYear: vi.fn() }));
vi.mock("@/lib/injuries", () => ({ fetchInjuriesPerYear: vi.fn() }));
vi.mock("@/lib/collisions", () => ({ fetchCollisionsPerYear: vi.fn() }));
vi.mock("@/lib/repairedCollisions", () => ({
  fetchRepairedCollisionsPerYear: vi.fn(),
}));
vi.mock("@/lib/arrests", () => ({ fetchArrestsPerYear: vi.fn() }));
vi.mock("@/lib/arrestsCoverage", () => ({ fetchCoverageData: vi.fn() }));
vi.mock("@/lib/statenIslandPilot", () => ({ fetchStatenIslandPilot: vi.fn() }));

// Mock the inner component to keep it lightweight — it's covered by its own
// IntegrityAudit.test.tsx.
vi.mock("@/components/IntegrityAudit", () => ({
  IntegrityAudit: vi.fn(() => <div data-testid="integrity-audit" />),
}));

import IntegrityPage from "./page";

async function renderPage() {
  const ui = await IntegrityPage();
  return render(ui);
}

describe("/integrity (IntegrityPage)", () => {
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
    vi.mocked(fetchStatenIslandPilot).mockResolvedValue({
      status: "empty",
      soql: "SELECT",
    });
  });

  it("renders successfully with the integrity headline", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", {
        name: "What the record can and cannot support",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("integrity-audit")).toBeInTheDocument();
  });

  it("has no axe-core violations", async () => {
    const { container } = await renderPage();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
