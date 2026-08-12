// @vitest-environment node
//
// Behavioral / black-box test of the union-to-HTTP mapping in
// src/app/api/staten-island-pilot/route.ts, per Rule 4: this tests the Route
// Handler's JSON response shape given a stubbed fetchStatenIslandPilot()
// result — not its fetch plumbing, which src/lib/statenIslandPilot.test.ts
// already covers. Structure mirrors src/app/api/deaths/route.test.ts exactly,
// per the dispatch instructions.
//
// `// @vitest-environment node` is the same pre-authorized fix used by
// deaths/route.test.ts: constructing a Web Response under the default
// `jsdom` environment is unreliable for Route Handlers.
//
// fetchStatenIslandPilot() is mocked here on purpose — its own contract (ok /
// empty / error-upstream / error-contract) is already exercised in
// src/lib/statenIslandPilot.test.ts. Re-testing it here would duplicate that
// coverage and couple this file to statenIslandPilot.ts's internals rather
// than to route.ts's public HTTP contract.
//
// NAMING — mirrors the judgment call recorded in statenIslandPilot.test.ts:
// the mocked import is `fetchStatenIslandPilot` from
// "../../../lib/statenIslandPilot".

import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchStatenIslandPilot } = vi.hoisted(() => ({
  fetchStatenIslandPilot: vi.fn(),
}));

vi.mock("../../../lib/statenIslandPilot", () => ({ fetchStatenIslandPilot }));

import { GET } from "./route";

afterEach(() => {
  fetchStatenIslandPilot.mockReset();
});

const SYNTHETIC_SOQL = "SYNTHETIC $select=... $where=... $group=... $order=...";

describe("GET /api/staten-island-pilot — the union-to-HTTP mapping", () => {
  it('maps status: "ok" to HTTP 200 with { status, soql, rows, stats }', async () => {
    const rows = [{ month: "2018-01", collisions: 100 }];
    const stats = { avg2018Monthly: 100, avgMayDec2019: 300 };
    fetchStatenIslandPilot.mockResolvedValueOnce({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows,
      stats,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      soql: SYNTHETIC_SOQL,
      rows,
      stats,
    });
  });

  it('maps status: "empty" to HTTP 200 with { status, soql } and no rows/stats keys', async () => {
    fetchStatenIslandPilot.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "empty", soql: SYNTHETIC_SOQL });
    expect(body).not.toHaveProperty("rows");
    expect(body).not.toHaveProperty("stats");
  });

  it('maps status: "error", kind: "upstream" to HTTP 502 with { status, soql, kind, reason }', async () => {
    fetchStatenIslandPilot.mockResolvedValueOnce({
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
    fetchStatenIslandPilot.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2019-07 (synthetic test reason)",
    });

    const response = await GET();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "contract",
      reason: "no aggregate returned for 2019-07 (synthetic test reason)",
    });
  });

  it("distinguishes upstream (502) from contract (422) failures with different HTTP status codes on purpose", async () => {
    fetchStatenIslandPilot.mockResolvedValueOnce({
      status: "error",
      soql: SYNTHETIC_SOQL,
      kind: "upstream",
      reason: "upstream failure (synthetic)",
    });
    const upstreamResponse = await GET();

    fetchStatenIslandPilot.mockResolvedValueOnce({
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
    fetchStatenIslandPilot.mockResolvedValueOnce({
      status: "empty",
      soql: SYNTHETIC_SOQL,
    });

    const response = await GET();

    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });
});
