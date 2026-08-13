/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import axe from "axe-core";

import GlobalNav from "./GlobalNav";

describe("GlobalNav component", () => {
  test("renders an accessible nav element containing correct semantic links", async () => {
    const { container } = render(<GlobalNav />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();

    // Links that should exist
    const expectedLinks = [
      { name: /home/i, href: "/" },
      { name: /local/i, href: "/local" },
      { name: /tdi/i, href: "/tdi" },
      { name: /auditor/i, href: "/auditor" },
    ];

    for (const link of expectedLinks) {
      const el = screen.getByRole("link", { name: link.name });
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute("href", link.href);
    }

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
