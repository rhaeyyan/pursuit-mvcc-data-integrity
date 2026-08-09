import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";

import { KPIRow } from "./KPIRow";

describe("KPIRow", () => {
  it("renders a container with role='region' and aria-label='Key Performance Indicators'", () => {
    render(<KPIRow deaths={20} collisions={2000} arrests={15000} />);
    const region = screen.getByRole("region", {
      name: "Key Performance Indicators",
    });
    expect(region).toBeInTheDocument();
  });

  it("displays the correct numbers passed via props", () => {
    render(<KPIRow deaths={25} collisions={2500} arrests={16000} />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
    expect(screen.getByText("16000")).toBeInTheDocument();
  });

  it("passes axe-core accessibility audit with 0 violations", async () => {
    const { container } = render(
      <KPIRow deaths={20} collisions={2000} arrests={15000} />
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
