// Failing tests for src/components/BoroughPicker.tsx, written BEFORE that file
// exists, per CLAUDE.md Rule 4 and SPEC.md's Phase 4 ordering: Cypress writes
// failing tests first, Magnolia implements against them.
//
// Expect this entire file to fail red on module resolution ("Cannot find
// module './BoroughPicker'") until Magnolia creates src/components/BoroughPicker.tsx.
//
// Contract under test comes from SPEC.md's FR-6 Phase 4 [SPEC] section:
// A Client Component ('use client') that renders a borough selection dropdown
// inside a <nav aria-label="Borough filter"> container and triggers URL navigation
// via router.push() on selection change.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { BOROUGHS } from "../lib/boroughs";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import { BoroughPicker } from "./BoroughPicker";

describe("<BoroughPicker> — component rendering and ARIA markup (FR-6, NFR-3)", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders a <nav aria-label=\"Borough filter\"> landmark container", () => {
    render(<BoroughPicker />);

    const nav = screen.getByRole("navigation", { name: "Borough filter" });
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe("NAV");
  });

  it("renders a <select aria-label=\"Select NYC Borough\"> inside the navigation landmark", () => {
    render(<BoroughPicker />);

    const select = screen.getByRole("combobox", { name: "Select NYC Borough" });
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe("SELECT");
  });

  it("renders a <label> for the select control inside the navigation landmark", () => {
    const { container } = render(<BoroughPicker />);

    const label = container.querySelector("label");
    expect(label).toBeInTheDocument();
    expect(label?.textContent).toMatch(/borough/i);
  });

  it("renders 6 <option> elements matching the exact borough vocabulary and display labels", () => {
    render(<BoroughPicker />);

    const select = screen.getByRole("combobox", { name: "Select NYC Borough" }) as HTMLSelectElement;
    const options = Array.from(select.options);

    expect(options).toHaveLength(6);

    expect(options[0].value).toBe("");
    expect(options[0].textContent).toBe("All NYC Boroughs (Citywide)");

    expect(options[1].value).toBe("B");
    expect(options[1].textContent).toBe(BOROUGHS.B.label); // "Bronx"

    expect(options[2].value).toBe("K");
    expect(options[2].textContent).toBe(BOROUGHS.K.label); // "Brooklyn"

    expect(options[3].value).toBe("M");
    expect(options[3].textContent).toBe(BOROUGHS.M.label); // "Manhattan"

    expect(options[4].value).toBe("Q");
    expect(options[4].textContent).toBe(BOROUGHS.Q.label); // "Queens"

    expect(options[5].value).toBe("S");
    expect(options[5].textContent).toBe(BOROUGHS.S.label); // "Staten Island"
  });

  it("reflects the currentBorough prop as the selected <select> value", () => {
    const { rerender } = render(<BoroughPicker currentBorough="K" />);

    const select = screen.getByRole("combobox", { name: "Select NYC Borough" }) as HTMLSelectElement;
    expect(select.value).toBe("K");

    rerender(<BoroughPicker currentBorough="B" />);
    expect(select.value).toBe("B");

    rerender(<BoroughPicker currentBorough="" />);
    expect(select.value).toBe("");

    rerender(<BoroughPicker />);
    expect(select.value).toBe("");
  });

  it("triggers URL navigation to /?borough=K when selecting Brooklyn ('K')", () => {
    render(<BoroughPicker currentBorough="" />);

    const select = screen.getByRole("combobox", { name: "Select NYC Borough" });
    fireEvent.change(select, { target: { value: "K" } });

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/?borough=K");
  });

  it("triggers URL navigation to / when selecting citywide ('')", () => {
    render(<BoroughPicker currentBorough="K" />);

    const select = screen.getByRole("combobox", { name: "Select NYC Borough" });
    fireEvent.change(select, { target: { value: "" } });

    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushedUrl = pushMock.mock.calls[0][0];
    expect(pushedUrl === "/" || pushedUrl === "/?borough=" || pushedUrl === "").toBe(true);
  });

  it("has zero axe-core accessibility violations (WCAG 2.2 AA)", async () => {
    const { container } = render(<BoroughPicker currentBorough="K" />);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

const BOROUGH_PICKER_PATH = join(__dirname, "BoroughPicker.tsx");

function readComponentSourceOrFail(): string {
  if (!existsSync(BOROUGH_PICKER_PATH)) {
    throw new Error(
      `${BOROUGH_PICKER_PATH} does not exist yet — this is expected red until Magnolia implements it.`,
    );
  }
  return readFileSync(BOROUGH_PICKER_PATH, "utf8");
}

describe("<BoroughPicker> — source-level greps and architecture constraints", () => {
  it("contains the 'use client' directive at the top of the file", () => {
    const source = readComponentSourceOrFail();
    expect(source).toMatch(/^['"]use client['"]/m);
  });

  it("contains no hardcoded hex/rgb/hsl color literals — styles must use CSS custom properties or module", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toMatch(/rgb\s*\(/);
    expect(source).not.toMatch(/hsl\s*\(/);
  });

  it("imports borough codes or vocabulary from ../lib/boroughs — no raw string borough codes in component code", () => {
    const source = readComponentSourceOrFail();
    expect(source).toMatch(/from\s+["']\.\.\/lib\/boroughs["']/);
  });

  it("standing clause: contains no @/ path-alias import (Vitest cannot resolve it)", () => {
    const source = readComponentSourceOrFail();
    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
