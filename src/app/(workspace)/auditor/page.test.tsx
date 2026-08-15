/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { expect, test, describe, vi, beforeEach } from "vitest";
import axe from "axe-core";

import AuditorPage from "./page";
import * as auditorLib from "../../../lib/auditor";
import * as sipsLib from "../../../lib/socrata-sips";

vi.mock("../../../lib/auditor", () => ({
  fetchSIPAwardStats: vi.fn(),
}));
vi.mock("../../../lib/socrata-sips", () => ({
  fetchDynamicSIPs: vi.fn(),
}));
vi.mock("../../../components/SIPAuditor", () => ({
  default: () => <div data-testid="mock-sip-auditor">Mock SIP Auditor</div>,
}));

describe("SIPAuditor component", () => {
  beforeEach(() => {
    vi.mocked(sipsLib.fetchDynamicSIPs).mockResolvedValue([
      { id: "test-id", name: "Test SIP", borough: "N/A", latitude: 40, longitude: -73, completionDate: "2023-01-01" }
    ]);
  });

  test("renders a form with a select and a valid accessible label", async () => {
    const { default: ActualSIPAuditor } = await vi.importActual<{ default: any }>("../../../components/SIPAuditor");
    const UI = await ActualSIPAuditor();
    const { container } = render(UI);

    const form =
      screen.getByRole("form", { name: /select project/i }) ||
      container.querySelector("form");
    expect(form).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Must have a valid accessible label
    expect(select).toHaveAccessibleName();

    // Accessibility check
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe("Auditor Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the empty state when no sipId is provided", async () => {
    const { container } = render(
      await AuditorPage({ searchParams: Promise.resolve({}) }),
    );

    expect(auditorLib.fetchSIPAwardStats).not.toHaveBeenCalled();

    // Expect empty state text
    const emptyStateText = screen.getByText(/select a project/i);
    expect(emptyStateText).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  test("calls fetchSIPAwardStats and renders the scorecard when sipId is provided", async () => {
    const mockData = {
      sip: {
        id: "sip-123",
        name: "Test SIP",
        borough: "Queens",
        completionDate: "2021-09-15",
      },
      before: { collisions: 100, casualties: 10 },
      after: { collisions: 50, casualties: 2 },
      change: { collisionsPct: -50, casualtiesPct: -80 },
    };

    vi.mocked(auditorLib.fetchSIPAwardStats).mockResolvedValue(
      mockData as unknown as auditorLib.SIPStats,
    );

    const { container } = render(
      await AuditorPage({
        searchParams: Promise.resolve({ sipId: "sip-123" }),
      }),
    );

    expect(auditorLib.fetchSIPAwardStats).toHaveBeenCalledTimes(1);
    expect(auditorLib.fetchSIPAwardStats).toHaveBeenCalledWith("sip-123");

    // Expect scorecard elements to be rendered
    expect(screen.getByText("Test SIP")).toBeInTheDocument();

    // Check that Before/After metrics and percent changes are present
    expect(screen.getByText(/-50%/)).toBeInTheDocument();
    expect(screen.getByText(/-80%/)).toBeInTheDocument();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
