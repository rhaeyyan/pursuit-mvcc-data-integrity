// Behavioral / black-box tests for src/lib/statenIslandPilot.ts (SPEC.md —
// "Staten Island pilot panel — data half only", PRD §3 P2 / PRD §7 residual
// risk retirement).
//
// Written BEFORE src/lib/statenIslandPilot.ts exists, per CLAUDE.md Rule 4
// and this SPEC's standard (non-SPIKE) ordering: Cypress writes failing
// tests first, Redwood implements against them. Expect this entire file to
// fail red on module resolution ("Cannot find module './statenIslandPilot'")
// until Redwood creates that file — a single-cause failure, not evidence of
// a flawed test.
//
// Contract under test comes verbatim from SPEC.md's "[SPEC] — Staten Island
// pilot panel" section (Inputs/Outputs, Query, Constraints, Edge Cases), not
// from reading any implementation (there isn't one yet).
//
// NAMING — statenIslandPilot.ts does not exist, so the exported names below
// are Cypress's judgment call, chosen to mirror this codebase's established
// convention (deaths.ts: DEATHS_SOQL / buildDeathsUrl / fetchDeathsPerYear):
//   SI_PILOT_SOQL              — pinned SoQL string constant
//   buildStatenIslandPilotUrl  — URL builder, zero args (fixed window+borough)
//   fetchStatenIslandPilot     — the fetch+validate function, zero args
//   avg2018Monthly, avgMayDec2019 — pure stats functions, take the full
//     validated SIPilotRow[] (24 rows) and internally select the relevant
//     months, per SPEC's Constraints ("computed by a pure function from the
//     validated 24 rows")
//   SIPilotRow, SIPilotStats, SIPilotResult — the exact type names pinned in
//     SPEC.md's Inputs/Outputs section
// Redwood must match these exactly, or this file's imports will not resolve.
// Flagged explicitly in the compliance report back to Cedar/Redwood.
//
// IMPORTANT — per the project's synthetic-fixture convention (see
// deaths.test.ts, percentChange.test.ts): the ok-path fetch-stub tests below
// use obviously synthetic collision counts (100 / 500 / 300), never the real
// Staten Island figures. The two pure-function unit tests for
// avg2018Monthly/avgMayDec2019 are the deliberate exception: per the
// dispatch instructions, they use row fixtures that sum to the SPEC's own
// verified-live totals (2018 sum 6,171 -> avg 514.25; May-Dec 2019 sum 2,170
// -> avg 271.25) — those totals come from SPEC.md's Query section, itself
// re-verified live per the mvcc-data skill discipline, not from Cypress's
// own arithmetic (NFR-4 applies to what Cypress asserts too).

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  SI_PILOT_SOQL,
  buildStatenIslandPilotUrl,
  fetchStatenIslandPilot,
  avg2018Monthly,
  avgMayDec2019,
  type SIPilotResult,
  type SIPilotRow,
} from "./statenIslandPilot";

const PINNED_CLAUSES = {
  select:
    "date_trunc_ym(crash_date) AS month, count(collision_id) AS collisions",
  where:
    "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2020-01-01T00:00:00' AND borough = 'STATEN ISLAND'",
  group: "date_trunc_ym(crash_date)",
  order: "month",
} as const;

const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// ---------------------------------------------------------------------------
// Fixture helpers — raw Socrata response shape.
// ---------------------------------------------------------------------------

type RawRow = { month: string; collisions: unknown };

// Socrata's actual date_trunc_ym() shape: a full floating-timestamp string,
// always the first of the month at midnight, with millisecond precision —
// NOT a bare "YYYY-MM" string. Parsing must not assume otherwise.
function rawMonth(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-01T00:00:00.000`;
}

// 24 rows, Jan 2018 - Dec 2019, ascending, with obviously-synthetic
// collision counts: 100/month for all of 2018, 500/month for Jan-Apr 2019
// (deliberately large distractor values), 300/month for May-Dec 2019.
function syntheticOkBody(): RawRow[] {
  const rows: RawRow[] = [];
  for (let m = 1; m <= 12; m++) {
    rows.push({ month: rawMonth(2018, m), collisions: "100" });
  }
  for (let m = 1; m <= 4; m++) {
    rows.push({ month: rawMonth(2019, m), collisions: "500" });
  }
  for (let m = 5; m <= 12; m++) {
    rows.push({ month: rawMonth(2019, m), collisions: "300" });
  }
  return rows;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: SIPilotResult,
): asserts result is Extract<SIPilotResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: SIPilotResult,
): asserts result is Extract<SIPilotResult, { status: "error" }> {
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

// ===========================================================================
// fetchStatenIslandPilot() — the ok path
// ===========================================================================

describe("fetchStatenIslandPilot() — the ok path", () => {
  it("returns exactly 24 ascending rows, Jan 2018..Dec 2019, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    assertOk(result);
    expect(result.rows).toHaveLength(24);
    expect(result.rows[0].month).toBe("2018-01");
    expect(result.rows[result.rows.length - 1].month).toBe("2019-12");
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].month > result.rows[i - 1].month).toBe(true);
    }
  });

  it("parses month via `.slice(0, 7)` on Socrata's raw floating-timestamp string — '2018-01-01T00:00:00.000' becomes '2018-01', never a bare-ISO assumption", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    assertOk(result);
    // Every row's month must be exactly 7 characters, "YYYY-MM" — proof the
    // raw ".000" millisecond-timestamp tail was stripped, not merely ignored
    // by a coincidental JSON.stringify round-trip.
    for (const row of result.rows) {
      expect(row.month).toMatch(/^\d{4}-\d{2}$/);
      expect(row.month.length).toBe(7);
    }
    expect(result.rows[0].month).toBe("2018-01");
    expect(result.rows[11].month).toBe("2018-12");
    expect(result.rows[12].month).toBe("2019-01");
  });

  it("casts `collisions` to `number` explicitly — never relies on JS coercion of the numeric-string payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    assertOk(result);
    for (const row of result.rows) {
      expect(typeof row.collisions).toBe("number");
      expect(Number.isInteger(row.collisions)).toBe(true);
    }
    expect(result.rows[0].collisions).toBe(100);
  });

  it("includes the exact pinned SoQL in the returned `soql` field (FR-8)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    assertOk(result);
    expect(result.soql).toBe(SI_PILOT_SOQL);
  });

  it("derives stats.avg2018Monthly and stats.avgMayDec2019 from the same rows returned, via the exported pure functions — not a second, independently-computed value", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    assertOk(result);
    expect(result.stats.avg2018Monthly).toBe(avg2018Monthly(result.rows));
    expect(result.stats.avgMayDec2019).toBe(avgMayDec2019(result.rows));
    // With this synthetic fixture (100/month all 2018; 500/month Jan-Apr
    // 2019 as a distractor; 300/month May-Dec 2019) the exact values are:
    expect(result.stats.avg2018Monthly).toBe(100);
    expect(result.stats.avgMayDec2019).toBe(300);
  });

  it("calls the Socrata endpoint exactly once (no retry loop on success)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchStatenIslandPilot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// fetchStatenIslandPilot() — the empty path (FR-10)
// ===========================================================================

describe("fetchStatenIslandPilot() — the empty path (FR-10)", () => {
  it("returns status: empty, distinct from an error, for a zero-row Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchStatenIslandPilot();

    expect(result.status).toBe("empty");
    expect(result.status).not.toBe("error");
  });
});

// ===========================================================================
// fetchStatenIslandPilot() — window completeness / contract failures
// (Edge Cases 1, 3, 4 — the monthly-grain extension of FR-11/trap 1)
// ===========================================================================

describe("fetchStatenIslandPilot() — window completeness / contract failures", () => {
  it("Edge Case 1: fails loud with error/contract — never a zero-fill — when a month in the 24-month window is absent, and names the specific missing month", async () => {
    const body = syntheticOkBody().filter(
      (row) => row.month !== rawMonth(2019, 7),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
    expect(result.reason).toMatch(/2019-07/);
  });

  it("Edge Case 1: names every missing month when more than one is absent", async () => {
    const body = syntheticOkBody().filter(
      (row) =>
        row.month !== rawMonth(2018, 3) && row.month !== rawMonth(2019, 11),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toMatch(/2018-03/);
    expect(result.reason).toMatch(/2019-11/);
  });

  it("Edge Case 3: fails loud with error/contract on a duplicate month that displaces a required month", async () => {
    const body = syntheticOkBody();
    // Duplicate Jan 2018 in place of what would have been the Feb 2018 row:
    // 24 rows total, but Feb 2018 is now missing and Jan 2018 appears twice.
    body[1] = { ...body[0] };
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("Edge Case 4: fails loud with error/contract when a row falls outside the Jan 2018 - Dec 2019 window", async () => {
    const body = [
      ...syntheticOkBody(),
      { month: rawMonth(2020, 1), collisions: "99" },
    ];
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a non-numeric string", "N/A"],
    ["a JSON number instead of a string", 44],
    ["a negative numeric string", "-5"],
    ["a decimal numeric string", "5.5"],
  ])(
    "fails loud with error/contract when `collisions` is %s for one month — never coerced to zero",
    async (_label, badValue) => {
      const body = syntheticOkBody().map((row) =>
        row.month === rawMonth(2019, 6)
          ? { ...row, collisions: badValue }
          : row,
      );
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      const result = await fetchStatenIslandPilot();

      assertError(result);
      expect(result.kind).toBe("contract");
      expect(result.reason).toBeTruthy();
    },
  );
});

// ===========================================================================
// fetchStatenIslandPilot() — upstream failures
// ===========================================================================

describe("fetchStatenIslandPilot() — upstream failures (Edge Case 5)", () => {
  it("returns error/upstream, never throwing, when the fetch itself rejects (network/DNS/timeout)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream and names the status code when Socrata responds 429", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 }),
    );

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toMatch(/429/);
  });

  it("returns error/upstream on a 5xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream, and never throws, when Socrata serves a non-JSON body on a 2xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>rate limited</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("does not retry in a loop on upstream failure — a single attempt, then fail loud", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await fetchStatenIslandPilot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the app token into the rendered `reason`", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "super-secret-token-value-should-not-leak");
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchStatenIslandPilot();

    assertError(result);
    expect(result.reason).not.toContain(
      "super-secret-token-value-should-not-leak",
    );
  });
});

describe("fetchStatenIslandPilot() — token is attribution-only (Edge Case 8 parity)", () => {
  it("still succeeds when SOCRATA_APP_TOKEN is unset — absence degrades throughput, not correctness", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "");
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchStatenIslandPilot();

    expect(result.status).toBe("ok");
  });
});

// ===========================================================================
// SI_PILOT_SOQL / buildStatenIslandPilotUrl() — the pinned query (Rule 4)
// ===========================================================================

describe("SI_PILOT_SOQL / buildStatenIslandPilotUrl() — the pinned query cannot drift (Rule 4, FR-8)", () => {
  it("SI_PILOT_SOQL contains every pinned clause verbatim", () => {
    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(SI_PILOT_SOQL).toContain(clause);
    }
  });

  it("SI_PILOT_SOQL is byte-identical to the exact pinned SoQL from SPEC.md's Query section", () => {
    expect(SI_PILOT_SOQL).toBe(
      [
        `$select=${PINNED_CLAUSES.select}`,
        `$where=${PINNED_CLAUSES.where}`,
        `$group=${PINNED_CLAUSES.group}`,
        `$order=${PINNED_CLAUSES.order}`,
      ].join("\n"),
    );
  });

  it("buildStatenIslandPilotUrl() targets the pinned dataset (h9gi-nx95) with no $limit, and every clause matches once decoded", () => {
    const url = buildStatenIslandPilotUrl();

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.has("$limit")).toBe(false);

    expect(url.searchParams.get("$select")).toBe(PINNED_CLAUSES.select);
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
    expect(url.searchParams.get("$group")).toBe(PINNED_CLAUSES.group);
    expect(url.searchParams.get("$order")).toBe(PINNED_CLAUSES.order);
  });

  it("the borough clause pins Staten Island, not another borough (trap 2 sibling check — a hardcoded literal, not a BoroughCode branch)", () => {
    expect(SI_PILOT_SOQL).toContain("borough = 'STATEN ISLAND'");
    expect(SI_PILOT_SOQL).not.toMatch(/borough = 'BRONX'/);
    expect(SI_PILOT_SOQL).not.toMatch(/borough = 'BROOKLYN'/);
  });

  it("keeps the displayed query (SI_PILOT_SOQL) and the sent request (buildStatenIslandPilotUrl()) mechanically in sync", () => {
    const url = buildStatenIslandPilotUrl();
    const decodedParamText = [...url.searchParams.values()].join(" ");

    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(SI_PILOT_SOQL).toContain(clause);
      expect(decodedParamText).toContain(clause);
    }
  });
});

// ===========================================================================
// avg2018Monthly() / avgMayDec2019() — pure functions, unit-tested directly
// (SPEC.md Constraints: "computed by a pure function from the validated
// 24 rows — never a typed-in literal"). Independent of any fetch/stub.
//
// Fixture sums to the SPEC's own verified-live totals (SPEC.md Query
// section): 2018 sum 6,171 -> avg 514.25; May-Dec 2019 sum 2,170 -> avg
// 271.25. Constructed here as a per-month row array that sums to those
// totals, not typed in as the rounded prose answer directly (NFR-4).
// ===========================================================================

// 12 months of 2018, deliberately unequal per-month values, summing to
// exactly 6,171 (514 * 11 + 517 = 5,654 + 517 = 6,171).
const ROWS_2018: SIPilotRow[] = [
  { month: "2018-01", collisions: 514 },
  { month: "2018-02", collisions: 514 },
  { month: "2018-03", collisions: 514 },
  { month: "2018-04", collisions: 514 },
  { month: "2018-05", collisions: 514 },
  { month: "2018-06", collisions: 514 },
  { month: "2018-07", collisions: 514 },
  { month: "2018-08", collisions: 514 },
  { month: "2018-09", collisions: 514 },
  { month: "2018-10", collisions: 514 },
  { month: "2018-11", collisions: 514 },
  { month: "2018-12", collisions: 517 },
];

// Jan-Apr 2019: large distractor values, deliberately far from the May-Dec
// average, so a function that wrongly folds them into avgMayDec2019 fails
// visibly rather than by a small, easy-to-miss margin.
const ROWS_2019_JAN_APR: SIPilotRow[] = [
  { month: "2019-01", collisions: 9999 },
  { month: "2019-02", collisions: 9999 },
  { month: "2019-03", collisions: 9999 },
  { month: "2019-04", collisions: 9999 },
];

// May-Dec 2019: 8 months, summing to exactly 2,170
// (271 * 7 + 273 = 1,897 + 273 = 2,170).
const ROWS_2019_MAY_DEC: SIPilotRow[] = [
  { month: "2019-05", collisions: 271 },
  { month: "2019-06", collisions: 271 },
  { month: "2019-07", collisions: 271 },
  { month: "2019-08", collisions: 271 },
  { month: "2019-09", collisions: 271 },
  { month: "2019-10", collisions: 271 },
  { month: "2019-11", collisions: 271 },
  { month: "2019-12", collisions: 273 },
];

const FULL_24_ROWS: SIPilotRow[] = [
  ...ROWS_2018,
  ...ROWS_2019_JAN_APR,
  ...ROWS_2019_MAY_DEC,
];

describe("avg2018Monthly() — pure function, unit-tested directly", () => {
  it("computes the exact 2018 monthly average (514.25) from the full validated 24-row array", () => {
    expect(avg2018Monthly(FULL_24_ROWS)).toBe(514.25);
  });

  it("ignores 2019 rows entirely — a distractor Jan-Apr 2019 block (9999/month) does not move the 2018 average", () => {
    const result = avg2018Monthly(FULL_24_ROWS);
    expect(result).toBeLessThan(1000); // sanity: nowhere near the distractor magnitude
    expect(result).toBe(514.25);
  });

  it("agrees when given only the 12 2018 rows (no 2019 rows present at all)", () => {
    expect(avg2018Monthly(ROWS_2018)).toBe(514.25);
  });

  it("does not round — 514.25 survives as an exact, unrounded float", () => {
    expect(Number.isInteger(avg2018Monthly(FULL_24_ROWS))).toBe(false);
  });
});

describe("avgMayDec2019() — pure function, unit-tested directly", () => {
  it("computes the exact May-Dec 2019 monthly average (271.25) from the full validated 24-row array", () => {
    expect(avgMayDec2019(FULL_24_ROWS)).toBe(271.25);
  });

  it("ignores Jan-Apr 2019 and all of 2018 — the large distractor blocks do not move the May-Dec 2019 average", () => {
    const result = avgMayDec2019(FULL_24_ROWS);
    expect(result).toBeLessThan(1000); // sanity: nowhere near the distractor magnitude
    expect(result).toBe(271.25);
  });

  it("agrees when given only the 8 May-Dec 2019 rows (no other months present at all)", () => {
    expect(avgMayDec2019(ROWS_2019_MAY_DEC)).toBe(271.25);
  });

  it("does not round — 271.25 survives as an exact, unrounded float", () => {
    expect(Number.isInteger(avgMayDec2019(FULL_24_ROWS))).toBe(false);
  });
});
