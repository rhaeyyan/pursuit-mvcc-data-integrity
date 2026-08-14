import { describe, it, expect, vi } from "vitest";
import { fetchDangerIndex } from "../src/lib/dangerIndexFetcher";

describe("dangerIndexFetcher", () => {
  it("should format the query correctly and return parsed data", async () => {
    const mockData = [
      { latitude: "40.7128", longitude: "-74.0060", total: "15" },
      { latitude: "40.7129", longitude: "-74.0061", total: "10" }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    const result = await fetchDangerIndex();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Check if the URL contains the expected query params
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(fetchCall).toContain("%24limit=1000");
    expect(fetchCall).toContain("%24order=total+DESC");

    expect(result).toEqual([
      { latitude: 40.7128, longitude: -74.006, total: 15 },
      { latitude: 40.7129, longitude: -74.0061, total: 10 }
    ]);
  });
  
  it("should throw an error on a failed fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    });

    await expect(fetchDangerIndex()).rejects.toThrow("Danger index fetch failed: 500 Internal Server Error");
  });
});
