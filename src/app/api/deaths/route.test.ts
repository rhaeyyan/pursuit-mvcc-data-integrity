// @vitest-environment node
//
// Behavioral / black-box test of the union-to-HTTP mapping in
// src/app/api/deaths/route.ts, per Rule 4: this tests the Route Handler's
// JSON response shape given a stubbed fetchDeathsPerYear() result — not its
// fetch plumbing, which src/lib/deaths.test.ts already covers.
//
// `// @vitest-environment node` is Edge Case 10's pre-authorized, Cypress-
// budget fix: constructing a Web Response under the default `jsdom`
// environment is unreliable for Route Handlers, and this per-file docblock
// avoids splitting vitest.config into `projects` for a single file.
//
// fetchDeathsPerYear() is mocked here on purpose — its own contract (ok /
// empty / error-upstream / error-contract) is already exercised in
// src/lib/deaths.test.ts. Re-testing it here would duplicate that coverage
// and couple this file to deaths.ts's internals rather than to route.ts's
// public HTTP contract.

import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchDeathsPerYear } = vi.hoisted(() => ({
  fetchDeathsPerYear: vi.fn(),
}));

vi.mock("../../../lib/deaths", () => ({ fetchDeathsPerYear }));

import { GET } from "./route";

afterEach(() => {
  fetchDeathsPerYear.mockReset();
});

const SYNTHETIC_SOQL = "SYNTHETIC $select=... $where=... $group=... $order=...";

describe("GET /api/deaths — the union-to-HTTP mapping", () => {
  it('maps status: "ok" to HTTP 200 with { status, soql, rows }', async () => {
    const rows = [{ year: 2018, deaths: 11 }];
    fetchDeathsPerYear.mockResolvedValueOnce({
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
    fetchDeathsPerYear.mockResolvedValueOnce({
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
    fetchDeathsPerYear.mockResolvedValueOnce({
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
    fetchDeathsPerYear.mockResolvedValueOnce({
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
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "upstream failure (synthetic)",
    });
    const upstreamResponse = await GET();

    fetchDeathsPerYear.mockResolvedValueOnce({
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
    fetchDeathsPerYear.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const response = await GET();

    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });
});
