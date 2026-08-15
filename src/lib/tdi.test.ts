import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTDILeaderboard } from "./tdi";

let fetchMock: ReturnType<typeof vi.fn>;

describe("fetchTDILeaderboard", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("calls Socrata endpoint with correct SoQL $select, $group and crash_date window", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    try {
      await fetchTDILeaderboard();
    } catch {
      // In case implementation is not ready or throws on empty data
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const urlString = fetchMock.mock.calls[0][0].toString();
    const decodedUrl = decodeURIComponent(urlString);

    expect(decodedUrl).toMatch(/\$select=.*borough/i);
    expect(decodedUrl).toMatch(
      /sum\(number_of_persons_injured\)\s+as\s+injuries/i,
    );
    expect(decodedUrl).toMatch(
      /sum\(number_of_persons_killed\)\s+as\s+deaths/i,
    );
    expect(decodedUrl).toMatch(/\$group=borough/i);

    // Window: 2018-2025
    expect(decodedUrl).toMatch(/crash_date/i);
    expect(decodedUrl).toMatch(/2018/);
    expect(decodedUrl).toMatch(/2025/);
  });

  it("calculates TDI correctly and sorts descending by TDI", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        { borough: "BRONX", injuries: "100", deaths: "2" },
        { borough: "BROOKLYN", injuries: "200", deaths: "5" },
      ],
    });

    const result = await fetchTDILeaderboard();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    // Populations derived from src/lib/fixtures/cd-populations.json
    // BROOKLYN population = 2506846
    // BRONX population = 1380712

    // Formula: TDI = (((deaths * 3) + injuries) / population) * 10000
    // BROOKLYN TDI = (((5 * 3) + 200) / 2506846) * 10000 = 0.85765...
    // BRONX TDI = (((2 * 3) + 100) / 1380712) * 10000 = 0.76771...

    // Result should be sorted descending, so Brooklyn is first
    expect(result[0].region).toBe("BROOKLYN");
    expect(result[0].deaths).toBe(5);
    expect(result[0].injuries).toBe(200);
    expect(result[0].population).toBe(2506846);
    expect(result[0].tdi).toBeCloseTo(0.858, 3);

    expect(result[1].region).toBe("BRONX");
    expect(result[1].deaths).toBe(2);
    expect(result[1].injuries).toBe(100);
    expect(result[1].population).toBe(1380712);
    expect(result[1].tdi).toBeCloseTo(0.768, 3);
  });
});
