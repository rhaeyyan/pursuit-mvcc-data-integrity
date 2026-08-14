// T5 contract tests for fetchDangerIndex() — SPEC.md, [SPEC] — T5 (wave 1).
//
// Written in the TDD red phase against an implementation that carried both
// defects (no 2018-2025 window, $group on bare `latitude, longitude`) and
// exported no DANGER_INDEX_SOQL. T5 landed on 2026-08-14 and these went green;
// they now stand as the regression pin for both defects.
//
// Behavioral / black-box per CLAUDE.md Rule 4: every assertion is either on the
// URL that was sent or on the shape that came back. Nothing here reaches into
// fetch plumbing, and no test touches the live network.
//
// Fixture provenance: the stub rows below are the actual Socrata probe output
// recorded in SPEC.md's "Verification performed before approval (2026-08-14)"
// section — grid cells 406960/-739846 = 589, 406757/-738969 = 478, and
// 406087/-740381 = 476. They are not derived here (NFR-4); this file only casts
// and compares them.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DANGER_INDEX_SOQL, fetchDangerIndex } from "./dangerIndexFetcher";
import { buildYearlySoql } from "./socrata";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// The pinned analysis window (mvcc-data: fixed at 2018-2025). T5 requires this
// text to arrive by importing socrata.ts's CRASH_WINDOW_WHERE rather than being
// retyped, so a second copy cannot drift.
const WINDOW_START = "crash_date >= '2018-01-01T00:00:00'";
const WINDOW_END = "crash_date < '2026-01-01T00:00:00'";

const EXPECTED_GROUP = "floor(latitude * 10000), floor(longitude * 10000)";
const EXPECTED_ORDER = "total DESC, lat_e4, lon_e4";
const EXPECTED_LIMIT = "1000";

// Probe row for the cell the two defects were splitting. Every value is a
// string, as Socrata sends every numeric (mvcc-data, "Verified fields").
const TOP_CELL = {
  lat_e4: "406960",
  lon_e4: "-739846",
  total: "589",
  lat_c: "40.6960330054329372",
  lon_c: "-73.9845311602716469",
} as const;

const SECOND_CELL = {
  lat_e4: "406757",
  lon_e4: "-738969",
  total: "478",
  lat_c: "40.6757214410000000",
  lon_c: "-73.8969120000000000",
} as const;

// Today's incorrect #1, which the windowed + grid-merged query drops to third.
const THIRD_CELL = {
  lat_e4: "406087",
  lon_e4: "-740381",
  total: "476",
  lat_c: "40.6087450000000000",
  lon_c: "-74.0381100000000000",
} as const;

const FAKE_TOKEN = "test-token-not-a-real-credential";

function jsonResponse(body: unknown, status = 200, statusText = ""): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "content-type": "application/json" },
  });
}

function normalize(clause: string): string {
  return clause.replace(/\s+/g, " ").trim();
}

let fetchMock: ReturnType<typeof vi.fn>;

function nthCall(index: number): unknown[] {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error(`fetch was not called ${index + 1} time(s)`);
  }
  return call;
}

function sentUrl(index = 0): URL {
  return new URL(String(nthCall(index)[0]));
}

function sentHeaders(index = 0): Headers {
  const init = nthCall(index)[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

function param(name: string, index = 0): string {
  return normalize(sentUrl(index).searchParams.get(name) ?? "");
}

function stubBody(body: unknown): void {
  fetchMock.mockResolvedValue(jsonResponse(body));
}

// What the fetcher SENDS is a separate contract from what it does with what
// comes back, so the query assertions must not be hostage to the response
// parsing. Without this, every $where/$group failure below would surface as
// whatever the schema happened to reject first, and the diagnostic would point
// at the wrong defect.
async function sendRequest(): Promise<void> {
  await fetchDangerIndex().catch(() => undefined);
}

describe("fetchDangerIndex()", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SOCRATA_APP_TOKEN", FAKE_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("the query it sends (FR-8, NFR-4)", () => {
    // (a)
    it("constrains the aggregation to the pinned 2018-2025 window", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const where = param("$where");
      expect(where).toContain(WINDOW_START);
      expect(where).toContain(WINDOW_END);
      // The window is added to the coordinate guards, not swapped for them.
      expect(where).toContain("latitude IS NOT NULL");
      expect(where).toContain("longitude IS NOT NULL");
      expect(where).toContain("latitude != 0");
      expect(where).toContain("longitude != 0");
    });

    // FORCES 3: one definition of the window. socrata.ts renders the same
    // constant into every yearly metric; if the danger index retypes it rather
    // than importing it, the two drift apart the first time either is edited
    // and nothing else in the suite would notice.
    it("shares socrata.ts's window text rather than retyping it", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const yearlyWhere = normalize(
        buildYearlySoql("count(collision_id)", "collisions")
          .split("\n")
          .find((line) => line.startsWith("$where="))
          ?.slice("$where=".length) ?? "",
      );
      // Guard the guard: an empty extraction would make toContain() vacuous.
      expect(yearlyWhere).toContain(WINDOW_START);
      expect(param("$where")).toContain(yearlyWhere);
    });

    // (b) — the load-bearing one. Grouping on the raw floats is the defect:
    // 40.696033 and 40.6960346 are ~18cm apart and split into separate rows,
    // so one intersection reports as several and every rank is wrong.
    it("groups on the rounded coordinate grid, never on bare latitude/longitude", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const group = param("$group");
      const terms = group.split(",").map((term) => term.trim());
      expect(terms).not.toContain("latitude");
      expect(terms).not.toContain("longitude");
      expect(group).toBe(EXPECTED_GROUP);
    });

    it("selects the grid key, the count, and the SoQL-computed centroid", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const select = param("$select");
      expect(select).toContain("floor(latitude * 10000) AS lat_e4");
      expect(select).toContain("floor(longitude * 10000) AS lon_e4");
      expect(select).toContain("count(collision_id) AS total");
      expect(select).toContain("avg(latitude) AS lat_c");
      expect(select).toContain("avg(longitude) AS lon_c");
      // Exactly those five, so no extra aggregate rides along unnoticed.
      expect(select.split(",")).toHaveLength(5);
    });

    // (g) — carried over from the deleted __tests__/dangerIndexFetcher.test.ts,
    // plus the tiebreaks T5 adds so the 1,000-row boundary is reproducible.
    it("keeps $limit at 1000 and orders by total DESC with stable tiebreaks", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      expect(sentUrl().searchParams.get("$limit")).toBe(EXPECTED_LIMIT);
      expect(param("$order")).toBe(EXPECTED_ORDER);
    });

    it("requests the h9gi-nx95 crashes endpoint", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const url = sentUrl();
      expect(`${url.origin}${url.pathname}`).toBe(BASE_URL);
    });

    // (f) — the FR-8 anti-drift pin. The displayed query and the sent query are
    // built from the same clause constants, so they cannot disagree.
    it("exports DANGER_INDEX_SOQL carrying the same $where and $group the request sends", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      const displayed = normalize(DANGER_INDEX_SOQL);
      expect(displayed).toContain(param("$where"));
      expect(displayed).toContain(param("$group"));
    });
  });

  describe("the shape it returns (FR-11, NFR-4)", () => {
    // (h)
    it("renames lat_c/lon_c to latitude/longitude and casts every field explicitly", async () => {
      stubBody([TOP_CELL]);

      const [row] = await fetchDangerIndex();

      expect(Object.keys(row).sort()).toEqual([
        "lat_e4",
        "latitude",
        "lon_e4",
        "longitude",
        "total",
      ]);
      // lat_c/lon_c are the wire names only; DangerMap.tsx reads
      // latitude/longitude and stays out of T5's scope because of this rename.
      expect(row).not.toHaveProperty("lat_c");
      expect(row).not.toHaveProperty("lon_c");

      // Socrata sends strings; the contract is numbers, cast explicitly.
      expect(typeof row.latitude).toBe("number");
      expect(typeof row.longitude).toBe("number");
      expect(typeof row.total).toBe("number");
      expect(row).toMatchObject({
        lat_e4: 406960,
        lon_e4: -739846,
        total: 589,
        latitude: Number(TOP_CELL.lat_c),
        longitude: Number(TOP_CELL.lon_c),
      });
    });

    // (c) — the merge itself is Socrata's job, pinned by (b). What this pins is
    // that the merged cell survives parsing intact: the summed count is cast,
    // not recomputed, and the marker keeps avg()'s centroid.
    it("returns one row per grid cell with the summed total and the avg() centroid", async () => {
      stubBody([TOP_CELL]);

      const rows = await fetchDangerIndex();

      expect(rows).toHaveLength(1);
      expect(rows[0].total).toBe(589);
      expect(rows[0].latitude).toBe(Number(TOP_CELL.lat_c));
      expect(rows[0].longitude).toBe(Number(TOP_CELL.lon_c));
      // NFR-4: the marker is Socrata's centroid, never the floor key divided
      // back out — that corner (40.696) is an artifact of the bucketing and
      // would be a caller-computed figure.
      expect(rows[0].latitude).not.toBe(Number(TOP_CELL.lat_e4) / 10000);
      expect(rows[0].longitude).not.toBe(Number(TOP_CELL.lon_e4) / 10000);
    });

    it("preserves Socrata's total DESC ordering without re-sorting client-side", async () => {
      stubBody([TOP_CELL, SECOND_CELL, THIRD_CELL]);

      const rows = await fetchDangerIndex();

      expect(rows.map((row) => row.total)).toEqual([589, 478, 476]);
    });

    // Edge case 3: zero rows is an empty array, not a synthetic row.
    it("returns an empty array for a zero-row response", async () => {
      stubBody([]);

      await expect(fetchDangerIndex()).resolves.toEqual([]);
    });
  });

  describe("fail-loud contract (FR-11, trap 1)", () => {
    // (d) — each of these pairs a control against the failure case, so `total`
    // (or a coordinate) is the only variable. Without the control a throw could
    // come from anywhere in the row and the test would pass for a wrong reason.
    it("throws when a row's total is absent — never a silent zero", async () => {
      stubBody([TOP_CELL]);
      await expect(fetchDangerIndex()).resolves.toHaveLength(1);

      const withoutTotal: Record<string, string> = { ...TOP_CELL };
      delete withoutTotal.total;
      stubBody([withoutTotal]);

      await expect(fetchDangerIndex()).rejects.toThrow();
    });

    // (e) — the z.coerce.number() regression guard. It looks redundant against
    // (d) and is not: z.coerce.number() maps null to 0, which is trap 1
    // (absent-key-as-zero) wearing Zod syntax. A zero here fabricates a safe
    // intersection, the exact class of failure this product exists to expose.
    it("throws when a row's total is null — z.coerce.number() would make it 0", async () => {
      stubBody([TOP_CELL]);
      await expect(fetchDangerIndex()).resolves.toHaveLength(1);

      stubBody([{ ...TOP_CELL, total: null }]);

      await expect(fetchDangerIndex()).rejects.toThrow();
    });

    it("throws on a non-numeric total rather than coercing it", async () => {
      for (const badTotal of ["", "abc"]) {
        stubBody([{ ...TOP_CELL, total: badTotal }]);
        await expect(fetchDangerIndex()).rejects.toThrow();
      }
    });

    it("throws when a coordinate is absent or null", async () => {
      stubBody([TOP_CELL]);
      await expect(fetchDangerIndex()).resolves.toHaveLength(1);

      const withoutLatC: Record<string, string> = { ...TOP_CELL };
      delete withoutLatC.lat_c;
      stubBody([withoutLatC]);
      await expect(fetchDangerIndex()).rejects.toThrow();

      stubBody([{ ...TOP_CELL, lon_c: null }]);
      await expect(fetchDangerIndex()).rejects.toThrow();

      stubBody([{ ...TOP_CELL, lat_e4: null }]);
      await expect(fetchDangerIndex()).rejects.toThrow();
    });

    // Edge case 1: the throw message danger-index/error.tsx (FR-10) sits behind.
    it("throws with the status and statusText on a non-ok response", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(null, 500, "Internal Server Error"),
      );

      await expect(fetchDangerIndex()).rejects.toThrow(
        "Danger index fetch failed: 500 Internal Server Error",
      );
    });

    // Zero-Trust: a Socrata error body is untrusted input, not a row array.
    it("throws when the body is not a JSON array", async () => {
      stubBody({ error: true, message: "query.soql.no-such-column" });

      await expect(fetchDangerIndex()).rejects.toThrow();
    });
  });

  describe("token handling (NFR-2, Rule 3)", () => {
    it("sends the app token as a header and never in the request URL", async () => {
      stubBody([TOP_CELL]);

      await sendRequest();

      expect(sentHeaders().get("X-App-Token")).toBe(FAKE_TOKEN);
      expect(sentUrl().toString()).not.toContain(FAKE_TOKEN);
    });

    it("still issues the request when the token is unset", async () => {
      vi.stubEnv("SOCRATA_APP_TOKEN", "");
      stubBody([TOP_CELL]);

      await expect(fetchDangerIndex()).resolves.toHaveLength(1);
      expect(sentHeaders().has("X-App-Token")).toBe(false);
    });
  });
});
