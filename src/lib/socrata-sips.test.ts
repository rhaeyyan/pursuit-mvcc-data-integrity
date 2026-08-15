import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDynamicSIPs } from "./socrata-sips";

global.fetch = vi.fn();

describe("fetchDynamicSIPs Adapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch from both endpoints and normalize Corridors and Intersections into SIPObjects", async () => {
    // Mock successful fetch responses
    const mockCorridors = [
      {
        project_id: "CORR-001",
        project_name: "Corridor A",
        borough: "Brooklyn",
        the_geom: {
          type: "MultiLineString",
          coordinates: [[[-73.9, 40.7], [-73.8, 40.6]]]
        },
        project_completion_date: "2023-01-15T00:00:00.000"
      }
    ];

    const mockIntersections = [
      {
        project_id: "INT-001",
        project_name: "Intersection B",
        borough: "Queens",
        the_geom: {
          type: "MultiPoint",
          coordinates: [[-73.7, 40.8]]
        },
        project_completion_date: "2023-05-20T00:00:00.000"
      }
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("if4c-w48d")) {
        return {
          ok: true,
          json: async () => mockCorridors,
        } as Response;
      }
      if (urlStr.includes("shr7-eqdc")) {
        return {
          ok: true,
          json: async () => mockIntersections,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await fetchDynamicSIPs();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);

    // Corridor assertion
    expect(result[0]).toEqual(expect.objectContaining({
      name: "Corridor A",
      borough: "Brooklyn",
      latitude: 40.7, // First coordinate pair, 2nd element
      longitude: -73.9, // First coordinate pair, 1st element
      completionDate: "2023-01-15T00:00:00.000"
    }));
    // Require a generated or mapped ID
    expect(result[0].id).toBeDefined();

    // Intersection assertion
    expect(result[1]).toEqual(expect.objectContaining({
      name: "Intersection B",
      borough: "Queens",
      latitude: 40.8,
      longitude: -73.7,
      completionDate: "2023-05-20T00:00:00.000"
    }));
  });

  it("should map missing borough to 'N/A'", async () => {
    const mockCorridors = [
      {
        project_name: "No Borough Corridor",
        the_geom: {
          type: "MultiLineString",
          coordinates: [[[-73.9, 40.7], [-73.8, 40.6]]]
        },
        project_completion_date: "2023-01-15T00:00:00.000"
      }
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("if4c-w48d")) {
        return { ok: true, json: async () => mockCorridors } as Response;
      }
      if (urlStr.includes("shr7-eqdc")) {
        return { ok: true, json: async () => [] } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await fetchDynamicSIPs();
    expect(result[0].borough).toBe("N/A");
  });

  it("should correctly extract latitude and longitude from complex geometry structures", async () => {
    const mockIntersections = [
      {
        project_name: "Complex Geometry Intersection",
        borough: "Bronx",
        the_geom: {
          type: "MultiPoint",
          coordinates: [[-73.85, 40.85]]
        },
        project_completion_date: "2022-11-10T00:00:00.000"
      }
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("if4c-w48d")) return { ok: true, json: async () => [] } as Response;
      if (urlStr.includes("shr7-eqdc")) return { ok: true, json: async () => mockIntersections } as Response;
      return { ok: false, status: 404 } as Response;
    });

    const result = await fetchDynamicSIPs();
    expect(result[0].latitude).toBe(40.85);
    expect(result[0].longitude).toBe(-73.85);
  });
});
