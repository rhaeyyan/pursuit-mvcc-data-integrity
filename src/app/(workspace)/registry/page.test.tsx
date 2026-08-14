import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { fetchDeathsPerYear } from "@/lib/deaths";
import { fetchInjuriesPerYear } from "@/lib/injuries";
import { fetchCollisionsPerYear } from "@/lib/collisions";
import { fetchRepairedCollisionsPerYear } from "@/lib/repairedCollisions";
import { fetchArrestsPerYear } from "@/lib/arrests";

vi.mock("@/lib/deaths", () => ({
  fetchDeathsPerYear: vi.fn(),
  DEATHS_SOQL: "DEATHS SOQL",
}));
vi.mock("@/lib/injuries", () => ({
  fetchInjuriesPerYear: vi.fn(),
  INJURIES_SOQL: "INJURIES SOQL",
}));
vi.mock("@/lib/collisions", () => ({
  fetchCollisionsPerYear: vi.fn(),
  COLLISIONS_SOQL: "COLLISIONS SOQL",
}));
vi.mock("@/lib/repairedCollisions", () => ({
  fetchRepairedCollisionsPerYear: vi.fn(),
  REPAIRED_COLLISIONS_SOQL: "REPAIRED SOQL",
}));
vi.mock("@/lib/arrests", () => ({
  fetchArrestsPerYear: vi.fn(),
  ARRESTS_SOQL: "ARRESTS SOQL",
}));

// Mock the inner component to keep it lightweight — it's covered by its own
// SeriesRegistry.test.tsx.
vi.mock("@/components/SeriesRegistry", () => ({
  SeriesRegistry: vi.fn(() => <div data-testid="series-registry" />),
}));

import RegistryPage from "./page";

async function renderPage() {
  const ui = await RegistryPage();
  return render(ui);
}

describe("/registry (RegistryPage)", () => {
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
  });

  it("renders successfully with the registry headline", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { name: "Six series, one contract" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("series-registry")).toBeInTheDocument();
  });

  it("has no axe-core violations", async () => {
    const { container } = await renderPage();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
