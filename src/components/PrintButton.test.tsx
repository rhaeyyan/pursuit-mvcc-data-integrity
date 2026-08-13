/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";
import axe from "axe-core";

import PrintButton from "./PrintButton";

describe("PrintButton component", () => {
  const originalPrint = window.print;

  beforeEach(() => {
    // Mock window.print
    window.print = vi.fn();
  });

  afterEach(() => {
    // Restore window.print
    window.print = originalPrint;
    vi.restoreAllMocks();
  });

  test("renders an accessible button", async () => {
    const { container } = render(<PrintButton />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // Check that it has an accessible name (either text content, aria-label, etc.)
    expect(button).toHaveAccessibleName();

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  test("calls window.print when clicked", async () => {
    render(<PrintButton />);

    const button = screen.getByRole("button");
    const user = userEvent.setup();

    await user.click(button);

    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
