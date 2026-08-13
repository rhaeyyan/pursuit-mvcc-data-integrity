import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import RegistryPage from "./page";

// Mock the inner component to keep it lightweight
vi.mock("../../components/SeriesRegistry", () => ({
  SeriesRegistry: vi.fn(() => <div data-testid="series-registry" />)
}));

describe("/registry (RegistryPage)", () => {
  it("renders successfully", () => {
    render(<RegistryPage />);
    expect(screen.getByRole("heading", { name: "Series Registry" })).toBeInTheDocument();
    expect(screen.getByTestId("series-registry")).toBeInTheDocument();
  });

  it("has no axe-core violations", async () => {
    const { container } = render(<RegistryPage />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
