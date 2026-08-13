import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSIPAwardStats } from "./auditor";

// Fixture matches src/lib/fixtures/sips.json
// sip-northern-blvd has completionDate: 2021-09-15, lat: 40.7530, lon: -73.8820
const SIP_ID = "sip-northern-blvd";
const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("fetchSIPAwardStats()", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calculates the 12-month Before and After windows correctly", async () => {
    // 2021-09-15 is completion date.
    // Before: 2020-09-15 to 2021-09-14
    // After: 2021-09-16 to 2022-09-15
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "100", injuries: "5", deaths: "0" }]),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "50", injuries: "2", deaths: "0" }]),
    );

    await fetchSIPAwardStats(SIP_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const call1Url = new URL(fetchMock.mock.calls[0][0]);
    const call2Url = new URL(fetchMock.mock.calls[1][0]);

    const where1 = call1Url.searchParams.get("$where") ?? "";
    const where2 = call2Url.searchParams.get("$where") ?? "";

    expect(where1).toContain(
      "between '2020-09-15T00:00:00' and '2021-09-14T23:59:59'",
    );
    expect(where2).toContain(
      "between '2021-09-16T00:00:00' and '2022-09-15T23:59:59'",
    );
  });

  it("constructs the within_circle SoQL $where clause with the correct latitude, longitude, and default 200m radius", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "100", injuries: "5", deaths: "0" }]),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "100", injuries: "5", deaths: "0" }]),
    );

    await fetchSIPAwardStats(SIP_ID);

    const callUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(callUrl.origin + callUrl.pathname).toBe(PINNED_BASE_URL);

    const where = callUrl.searchParams.get("$where") ?? "";
    expect(where).toContain("within_circle(location, 40.753, -73.882, 200)");
  });

  it("calculates percent changes correctly (after - before) / before * 100", async () => {
    // Before: 100 collisions, 5 injuries, 1 death = 6 casualties
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "100", injuries: "5", deaths: "1" }]),
    );
    // After: 50 collisions, 2 injuries, 1 death = 3 casualties
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ collisions: "50", injuries: "2", deaths: "1" }]),
    );

    const result = await fetchSIPAwardStats(SIP_ID);

    expect(result.before.collisions).toBe(100);
    expect(result.before.casualties).toBe(6);
    expect(result.after.collisions).toBe(50);
    expect(result.after.casualties).toBe(3);

    // Change collisions: (50 - 100) / 100 * 100 = -50
    // Change casualties: (3 - 6) / 6 * 100 = -50
    expect(result.change.collisionsPct).toBe(-50);
    expect(result.change.casualtiesPct).toBe(-50);
  });

  it("handles empty arrays or nulls correctly by defaulting to 0", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    fetchMock.mockResolvedValueOnce(jsonResponse([{ collisions: "10" }]));

    const result = await fetchSIPAwardStats(SIP_ID);

    expect(result.before.collisions).toBe(0);
    expect(result.before.casualties).toBe(0);
    expect(result.after.collisions).toBe(10);
    expect(result.after.casualties).toBe(0);
  });

  it("throws an error if SIP ID is not found", async () => {
    await expect(fetchSIPAwardStats("invalid-id")).rejects.toThrow();
  });
});
