import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import IntegrityPage from "./page";

// Mock the inner component to keep it lightweight
vi.mock("../../components/IntegrityAudit", () => ({
  IntegrityAudit: vi.fn(() => <div data-testid="integrity-audit" />)
}));

describe("/integrity (IntegrityPage)", () => {
  it("renders successfully", () => {
    render(<IntegrityPage />);
    expect(screen.getByRole("heading", { name: "Integrity Audit" })).toBeInTheDocument();
    expect(screen.getByTestId("integrity-audit")).toBeInTheDocument();
  });

  it("has no axe-core violations", async () => {
    const { container } = render(<IntegrityPage />);
    // Include main landmark context to avoid axe core 'region' violation if there isn't one
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
