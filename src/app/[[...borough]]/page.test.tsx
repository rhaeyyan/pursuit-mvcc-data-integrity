import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { fetchDeathsPerYear } from "../../lib/deaths";
import { fetchInjuriesPerYear } from "../../lib/injuries";
import { fetchCollisionsPerYear } from "../../lib/collisions";
import { fetchRepairedCollisionsPerYear } from "../../lib/repairedCollisions";
import { fetchArrestsPerYear } from "../../lib/arrests";

import Home from "./page";
import type { JSX } from "react";

vi.mock("../../lib/deaths", () => ({ fetchDeathsPerYear: vi.fn() }));
vi.mock("../../lib/injuries", () => ({ fetchInjuriesPerYear: vi.fn() }));
vi.mock("../../lib/collisions", () => ({ fetchCollisionsPerYear: vi.fn() }));
vi.mock("../../lib/repairedCollisions", () => ({ fetchRepairedCollisionsPerYear: vi.fn() }));
vi.mock("../../lib/arrests", () => ({ fetchArrestsPerYear: vi.fn() }));

// Mock UnifiedTimeline so we don't need to test recharts internals here
vi.mock("../../components/UnifiedTimeline", () => ({
  UnifiedTimeline: vi.fn(({ data }): JSX.Element => (
    <div data-testid="unified-timeline">
      <div data-testid="deaths-status">{data.deaths?.status}</div>
    </div>
  ))
}));

async function renderHome(params?: { borough?: string[] }) {
  const ui = await Home({ params: params ?? {} });
  return render(ui);
}

describe("/[[...borough]] (Home)", () => {
  beforeEach(() => {
    vi.mocked(fetchDeathsPerYear).mockResolvedValue({ status: "ok", soql: "SELECT", rows: [] });
    vi.mocked(fetchInjuriesPerYear).mockResolvedValue({ status: "ok", soql: "SELECT", rows: [] });
    vi.mocked(fetchCollisionsPerYear).mockResolvedValue({ status: "ok", soql: "SELECT", rows: [] });
    vi.mocked(fetchRepairedCollisionsPerYear).mockResolvedValue({ status: "ok", soql: "SELECT", rows: [] });
    vi.mocked(fetchArrestsPerYear).mockResolvedValue({ status: "ok", soql: "SELECT", rows: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders successfully and mounts UnifiedTimeline", async () => {
    await renderHome();
    
    expect(screen.getByText("One timeline, five series, one honest scale")).toBeInTheDocument();
    expect(screen.getByTestId("unified-timeline")).toBeInTheDocument();
  });

  it("displays an error message for invalid borough parameters", async () => {
    await renderHome({ borough: ["invalid-borough"] });
    expect(screen.getByText(/Invalid borough parameter/i)).toBeInTheDocument();
  });

  it("has no axe-core violations on the rendered page", async () => {
    const { container } = await renderHome();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
