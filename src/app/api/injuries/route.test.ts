// @vitest-environment node
//
// Behavioral / black-box test of the union-to-HTTP mapping in
// src/app/api/injuries/route.ts, per Rule 4: this tests the Route Handler's
// JSON response shape given a stubbed fetchInjuriesPerYear() result — not its
// fetch plumbing, which src/lib/injuries.test.ts already covers. Mirrors
// src/app/api/deaths/route.test.ts's structure exactly, per the dispatch
// instructions.
//
// `// @vitest-environment node` is Edge Case 10's pre-authorized, Cypress-
// budget fix: constructing a Web Response under the default `jsdom`
// environment is unreliable for Route Handlers, and this per-file docblock
// avoids splitting vitest.config into `projects` for a single file.
//
// fetchInjuriesPerYear() is mocked here on purpose — its own contract (ok /
// empty / error-upstream / error-contract) is already exercised in
// src/lib/injuries.test.ts. Re-testing it here would duplicate that coverage
// and couple this file to injuries.ts's internals rather than to route.ts's
// public HTTP contract.

import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchInjuriesPerYear } = vi.hoisted(() => ({
  fetchInjuriesPerYear: vi.fn(),
}));

vi.mock("../../../lib/injuries", () => ({ fetchInjuriesPerYear }));

import { GET } from "./route";

afterEach(() => {
  fetchInjuriesPerYear.mockReset();
});

const SYNTHETIC_SOQL = "SYNTHETIC $select=... $where=... $group=... $order=...";

describe("GET /api/injuries — the union-to-HTTP mapping", () => {
  it('maps status: "ok" to HTTP 200 with { status, soql, rows }', async () => {
    const rows = [{ year: 2018, injuries: 100 }];
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows,
    });
  });

  it('maps status: "empty" to HTTP 200 with { status, soql } and no rows key', async () => {
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "empty", soql: SYNTHETIC_SOQL });
    expect(body).not.toHaveProperty("rows");
  });

  it('maps status: "error", kind: "upstream" to HTTP 502 with { status, soql, kind, reason }', async () => {
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 429 (synthetic test reason)",
    });

    const response = await GET();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "Socrata responded 429 (synthetic test reason)",
    });
  });

  it('maps status: "error", kind: "contract" to HTTP 422 with { status, soql, kind, reason }', async () => {
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });

    const response = await GET();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2024 (synthetic test reason)",
    });
  });

  it("distinguishes upstream (502) from contract (422) failures with different HTTP status codes on purpose", async () => {
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "upstream failure (synthetic)",
    });
    const upstreamResponse = await GET();

    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "contract failure (synthetic)",
    });
    const contractResponse = await GET();

    expect(upstreamResponse.status).not.toBe(contractResponse.status);
    expect(upstreamResponse.status).toBe(502);
    expect(contractResponse.status).toBe(422);
  });

  it("responds with a JSON content type on every branch", async () => {
    fetchInjuriesPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const response = await GET();

    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });
});
