import { describe, it, expect, vi } from "vitest";
import { fetchDangerIndex } from "../src/lib/dangerIndexFetcher";

describe("dangerIndexFetcher", () => {
  it("should format the query correctly and return parsed data", async () => {
    const mockData = [
      { latitude: "40.7128", longitude: "-74.0060", total: "15" },
      { latitude: "40.7129", longitude: "-74.0061", total: "10" },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchDangerIndex();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Check if the URL contains the expected query params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(fetchCall).toContain("%24limit=1000");
    expect(fetchCall).toContain("%24order=total+DESC");

    // The pinned SPEC query contract (SPEC.md, 2026-08-14): the raw
    // percent-encoded substring above is not a sufficient check on its own —
    // that style is exactly how a prior audit let the $where date-window
    // filter and the raw-coordinate $group ship undetected. Parse the actual
    // URL and assert on the decoded, exact clause content instead.
    const requestUrl = new URL(fetchCall);
    const params = requestUrl.searchParams;

    // REVISED 2026-08-14: the original `round(latitude * 100000) / 100000`
    // form was live-tested and rejected — a 2-arg-only SoQL surface has no
    // 1-arg round(); it also produced trailing-zero-padded strings even for
    // the syntactically valid `round(x * n) / n` variant. The corrected,
    // live-verified expression is the 2-arg decimal-places form (SPEC.md).
    const EXPECTED_SELECT =
      "round(latitude, 5) AS latitude, round(longitude, 5) AS longitude, COUNT(*) AS total";
    const EXPECTED_WHERE =
      "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00' AND latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0";
    const EXPECTED_GROUP = "round(latitude, 5), round(longitude, 5)";

    // Defect (b): coordinates must be grouped on the 5-decimal-place rounded
    // expression, not raw floats, so floating-point noise doesn't fragment
    // one physical intersection into multiple ranked rows.
    expect(params.get("$select")).toBe(EXPECTED_SELECT);
    expect(params.get("$group")).toBe(EXPECTED_GROUP);

    // Defect (a): the product-wide 2018-2025 analysis window must bound the
    // query — the pre-fix implementation omits $where's date clause entirely.
    expect(params.get("$where")).toBe(EXPECTED_WHERE);

    // The rounding expression and date-window literals must appear verbatim
    // in both $select and $group / $where respectively — a mismatch between
    // the $select and $group rounding expressions would produce an invalid
    // or inconsistent grouping.
    expect(params.get("$select")).toContain("round(latitude, 5)");
    expect(params.get("$group")).toContain("round(latitude, 5)");
    expect(params.get("$select")).toContain("round(longitude, 5)");
    expect(params.get("$group")).toContain("round(longitude, 5)");
    expect(params.get("$where")).toContain("2018-01-01T00:00:00");
    expect(params.get("$where")).toContain("2026-01-01T00:00:00");

    expect(result).toEqual([
      { latitude: 40.7128, longitude: -74.006, total: 15 },
      { latitude: 40.7129, longitude: -74.0061, total: 10 },
    ]);
  });

  it("should throw an error on a failed fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(fetchDangerIndex()).rejects.toThrow(
      "Danger index fetch failed: 500 Internal Server Error",
    );
  });
});
