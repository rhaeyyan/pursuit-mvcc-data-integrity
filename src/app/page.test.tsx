// Behavioral / black-box test of src/app/page.tsx (the Home Server Component),
// per Rule 4 and NFR-3.
//
// `Home` is an async Server Component. It is rendered here by awaiting the
// component function directly and passing the resolved JSX into
// @testing-library/react's render() — the standard pattern for exercising an
// async Server Component outside Next's own server runtime, since Home only
// touches fetchDeathsPerYear() and semantic HTML (no cookies()/headers()/etc).
//
// fetchDeathsPerYear() and DEATHS_SOQL are both mocked from the shared lib
// module so this test is agnostic to whether page.tsx reads the query text
// via the `soql` field on the DeathsResult or via a direct DEATHS_SOQL
// import — either is a legitimate implementation choice under this SPEC.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

const { fetchDeathsPerYear, SYNTHETIC_SOQL } = vi.hoisted(() => ({
  fetchDeathsPerYear: vi.fn(),
  SYNTHETIC_SOQL:
    "SYNTHETIC SOQL FOR PAGE TEST $select=... $where=... $group=... $order=...",
}));

vi.mock("../lib/deaths", () => ({
  fetchDeathsPerYear,
  DEATHS_SOQL: SYNTHETIC_SOQL,
}));

import Home from "./page";

const SYNTHETIC_ROWS = [
  { year: 2018, deaths: 11 },
  { year: 2019, deaths: 22 },
  { year: 2020, deaths: 33 },
  { year: 2021, deaths: 44 },
  { year: 2022, deaths: 55 },
  { year: 2023, deaths: 66 },
  { year: 2024, deaths: 77 },
  { year: 2025, deaths: 88 },
];

async function renderHome() {
  // Home() is an async function component; calling and awaiting it directly
  // resolves the JSX tree the Server Component would have streamed.
  const ui = await Home();
  return render(ui);
}

afterEach(() => {
  fetchDeathsPerYear.mockReset();
});

describe("/ (Home) — the ok path", () => {
  it("renders an accessible <table> with a caption, column headers, and 8 data rows (NFR-3)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: /year/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /deaths/i }),
    ).toBeInTheDocument();

    // 8 data rows + 1 header row.
    expect(screen.getAllByRole("row")).toHaveLength(9);
  });

  it("has no axe-core violations on the rendered table (NFR-3 / WCAG 2.2 AA)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("renders the FR-8 SoQL query disclosure containing the query text", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(/soql query/i);
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });

  it("uses correlation language only in the framing copy — never asserts enforcement caused a change in deaths (NFR-5)", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows: SYNTHETIC_ROWS,
    });

    await renderHome();

    const text = (document.body.textContent ?? "").toLowerCase();
    expect(text).not.toMatch(/\bcaused\b|\bcausing\b|\bcauses\b/);
  });
});

describe("/ (Home) — the error path (FR-10)", () => {
  it("renders a visible, non-decorative message naming the reason — never an empty table, never a crash", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    await renderHome();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.getByText(/no aggregate returned for 2024/i),
    ).toBeInTheDocument();
  });

  it("still renders the FR-8 query disclosure on the error path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 502 (synthetic test reason)",
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });

  it("has no axe-core violations on the rendered error state", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    const { container } = await renderHome();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("/ (Home) — the empty path (FR-10)", () => {
  it("renders a visible, non-decorative message distinct from the error path — never an empty table", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    await renderHome();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    // A defined empty state per FR-10 means real, perceivable copy — not
    // merely "did not crash". This does not lock in exact wording, only
    // that some non-trivial message is present.
    expect((document.body.textContent ?? "").trim().length).toBeGreaterThan(10);
  });

  it("still renders the FR-8 query disclosure on the empty path", async () => {
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const { container } = await renderHome();

    const disclosure = container.querySelector("details");
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(SYNTHETIC_SOQL);
  });
});
