import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchLocalRawSeries, fetchLocalRepairedSeries } from "./localLedger";
import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";

const EXTRA_WHERE_REPAIRED =
  "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)";

const ZIP_CODE = "11101";

const PINNED_CLAUSES_RAW = {
  select:
    "date_extract_y(crash_date) AS year, count(collision_id) AS collisions",
  where: `crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00' AND zip_code = '${ZIP_CODE}'`,
  group: "date_extract_y(crash_date)",
  order: "year",
} as const;

const PINNED_CLAUSES_REPAIRED = {
  select:
    "date_extract_y(crash_date) AS year, count(collision_id) AS collisions",
  where: `crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00' AND ${EXTRA_WHERE_REPAIRED} AND zip_code = '${ZIP_CODE}'`,
  group: "date_extract_y(crash_date)",
  order: "year",
} as const;

const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const SYNTHETIC_COLLISIONS_STRINGS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
] as const;

type RawRow = { year: string | number; collisions: unknown };

function syntheticOkBody(): RawRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    collisions: SYNTHETIC_COLLISIONS_STRINGS[i],
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: YearlyMetricResult<"collisions">,
): asserts result is Extract<
  YearlyMetricResult<"collisions">,
  { status: "ok" }
> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: YearlyMetricResult<"collisions">,
): asserts result is Extract<
  YearlyMetricResult<"collisions">,
  { status: "error" }
> {
  if (result.status !== "error") {
    throw new Error(`expected status "error", got ${JSON.stringify(result)}`);
  }
}

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

describe("fetchLocalRawSeries() — the ok path", () => {
  it("returns exactly 8 ascending rows, 2018..2025, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchLocalRawSeries(ZIP_CODE);

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(
      result.rows.map((r: YearlyMetricRow<"collisions">) => r.year),
    ).toEqual([...SYNTHETIC_YEARS]);
    expect(
      result.rows.map((r: YearlyMetricRow<"collisions">) => r.collisions),
    ).toEqual([100, 200, 300, 400, 500, 600, 700, 800]);
  });

  it("sends the exact SoQL where clause including the exact string match for zip_code", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchLocalRawSeries(ZIP_CODE);
    assertOk(result);
    expect(result.soql).toContain(`$where=${PINNED_CLAUSES_RAW.where}`);
  });
});

describe("fetchLocalRepairedSeries() — the ok path", () => {
  it("sends the exact SoQL where clause including the exact string match for zip_code AND the repaired filter", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchLocalRepairedSeries(ZIP_CODE);
    assertOk(result);
    expect(result.soql).toContain(`$where=${PINNED_CLAUSES_REPAIRED.where}`);
  });
});

describe("FR-11 window completeness / contract failures (trap 1)", () => {
  it("fails loud with error/contract — never a zero-fill — when a year in 2018-2025 is absent", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchLocalRawSeries(ZIP_CODE);

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2021/);
  });

  it("fails loud with error/contract when `collisions` is missing for one year", async () => {
    const body = syntheticOkBody().map((row) => {
      if (row.year !== "2023") return row;
      const { year } = row;
      return { year } as RawRow;
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchLocalRawSeries(ZIP_CODE);

    assertError(result);
    expect(result.kind).toBe("contract");
  });
});
