// Behavioral / black-box tests for src/lib/injuries.ts (FR-2, Task 3 —
// "Injuries per year: parameterize the data layer for a second series").
//
// Written BEFORE src/lib/injuries.ts (and the src/lib/socrata.ts transport it
// is built on) exist, per CLAUDE.md Rule 4 and this SPEC's standard
// (non-SPIKE) ordering: Cypress writes failing tests first, Redwood
// implements against them.
//
// Contract under test comes from SPEC.md's "[SPEC] — Injuries per year"
// section, not from reading any implementation (there isn't one yet). This
// file mirrors src/lib/deaths.test.ts's structure exactly, substituting the
// injuries aggregate/alias, per the dispatch instructions.
//
// IMPORTANT — per the dispatch instructions to Cypress: fixture values are
// deliberately synthetic (100, 200, ... 800), never the pinned Appendix A /
// mvcc-data-skill injuries column (61940, 61391, 44615, 51785, 51933, 54252,
// 54030, 49634). A passing test here must never be confusable with evidence
// that the live data is correct (NFR-4). The one-time diff of a live/stubbed
// response against those pinned figures is acceptance clause 6's job during
// Cypress's post-completion audit of Redwood's [COMPLETION-REPORT], not a
// unit-test fixture here — stubbing the pinned values into a mocked fetch and
// then asserting the parser echoes them back would be circular and would
// prove nothing about whether the *live* figures are correct.
//
// The four pinned SoQL clause values below are copied verbatim from SPEC.md's
// "Query" section (a Rule-4 frozen contract, re-verified live per the
// mvcc-data skill) — they are query-shape strings, not data figures, so they
// are exactly what Rule 4 says Cypress should test against.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  INJURIES_SOQL,
  buildInjuriesUrl,
  fetchInjuriesPerYear,
  type InjuriesResult,
  type InjuriesRow,
} from "./injuries";

const PINNED_CLAUSES = {
  select:
    "date_extract_y(crash_date) AS year, sum(number_of_persons_injured) AS injuries",
  where:
    "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'",
  group: "date_extract_y(crash_date)",
  order: "year",
} as const;

const PINNED_BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

// Obviously-synthetic fixture: small round numbers, never the real Appendix A
// / mvcc-data-skill injuries column.
const SYNTHETIC_YEARS = [
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;
const SYNTHETIC_INJURIES_STRINGS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
] as const;

type RawRow = { year: string | number; injuries: unknown };

function syntheticOkBody(): RawRow[] {
  return SYNTHETIC_YEARS.map((year, i) => ({
    year: String(year),
    injuries: SYNTHETIC_INJURIES_STRINGS[i],
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assertOk(
  result: InjuriesResult,
): asserts result is Extract<InjuriesResult, { status: "ok" }> {
  if (result.status !== "ok") {
    throw new Error(`expected status "ok", got ${JSON.stringify(result)}`);
  }
}

function assertError(
  result: InjuriesResult,
): asserts result is Extract<InjuriesResult, { status: "error" }> {
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

describe("fetchInjuriesPerYear() — the ok path", () => {
  it("returns exactly 8 ascending rows, 2018..2025, for a well-formed Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchInjuriesPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows.map((r: InjuriesRow) => r.year)).toEqual([
      ...SYNTHETIC_YEARS,
    ]);
    expect(result.rows.map((r: InjuriesRow) => r.injuries)).toEqual([
      100, 200, 300, 400, 500, 600, 700, 800,
    ]);
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].year).toBeGreaterThan(result.rows[i - 1].year);
    }
  });

  it("casts year and injuries to `number` explicitly — never relies on JS coercion of the string payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchInjuriesPerYear();

    assertOk(result);
    for (const row of result.rows) {
      expect(typeof row.year).toBe("number");
      expect(typeof row.injuries).toBe("number");
      expect(Number.isInteger(row.injuries)).toBe(true);
    }
  });

  it("accepts `year` as either a string or a JSON number (the schema's deliberate asymmetry) while still requiring `injuries` to be a string", async () => {
    const body = syntheticOkBody().map((row, i) =>
      i === 0 ? { ...row, year: SYNTHETIC_YEARS[0] } : row,
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchInjuriesPerYear();

    assertOk(result);
    expect(result.rows).toHaveLength(8);
    expect(result.rows[0].year).toBe(2018);
  });

  it("calls the Socrata endpoint exactly once (no retry loop on success)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    await fetchInjuriesPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchInjuriesPerYear() — the empty path (FR-10)", () => {
  it("returns status: empty, distinct from an error, for a zero-row Socrata reply", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const result = await fetchInjuriesPerYear();

    expect(result.status).toBe("empty");
    expect(result.status).not.toBe("error");
  });
});

describe("fetchInjuriesPerYear() — window completeness / contract failures (FR-11, trap 1)", () => {
  it("fails loud with error/contract — never a zero-fill — when a year in 2018-2025 is absent", async () => {
    const body = syntheticOkBody().filter((row) => row.year !== "2021");
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
    // The absent year must be named, not swallowed.
    expect(result.reason).toMatch(/2021/);
  });

  it("fails loud with error/contract on a duplicate year that displaces a required year", async () => {
    const body = syntheticOkBody();
    // Duplicate 2018 in place of what would have been the 2019 row: 8 rows,
    // but 2019 is now missing and 2018 appears twice.
    body[1] = { ...body[0] };
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it("fails loud with error/contract when more than 8 rows are returned (a year outside the window leaked in)", async () => {
    const body = [...syntheticOkBody(), { year: "2026", injuries: "99" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["a non-numeric string", "N/A"],
    ["a JSON number instead of a string", 400],
    ["a negative numeric string", "-5"],
    ["a decimal numeric string", "5.5"],
  ])(
    "fails loud with error/contract when `injuries` is %s for one year — never coerced to zero",
    async (_label, badValue) => {
      const body = syntheticOkBody().map((row) =>
        row.year === "2022" ? { ...row, injuries: badValue } : row,
      );
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      const result = await fetchInjuriesPerYear();

      assertError(result);
      expect(result.kind).toBe("contract");
      expect(result.reason).toBeTruthy();
    },
  );

  it("fails loud with error/contract when a year's `injuries` key is entirely absent from the row — the exact number_of_persons_injured dropout shape (trap 1)", async () => {
    const body = syntheticOkBody().map((row) => {
      if (row.year !== "2023") return row;
      const { year } = row;
      return { year } as RawRow;
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("contract");
    expect(result.reason).toBeTruthy();
  });
});

describe("fetchInjuriesPerYear() — upstream failures", () => {
  it("returns error/upstream, never throwing, when the fetch itself rejects (network/DNS/timeout)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("returns error/upstream and names the status code when Socrata responds 429", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 }),
    );

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
    expect(result.reason).toMatch(/429/);
  });

  it("returns error/upstream on a 5xx response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await fetchInjuriesPerYear();

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

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.kind).toBe("upstream");
  });

  it("does not retry in a loop on upstream failure — a single attempt, then fail loud", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await fetchInjuriesPerYear();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the app token into the rendered `reason`", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "super-secret-token-value-should-not-leak");
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchInjuriesPerYear();

    assertError(result);
    expect(result.reason).not.toContain(
      "super-secret-token-value-should-not-leak",
    );
  });
});

describe("fetchInjuriesPerYear() — token is attribution-only (Edge Case 8)", () => {
  it("still succeeds when SOCRATA_APP_TOKEN is unset — absence degrades throughput, not correctness", async () => {
    vi.stubEnv("SOCRATA_APP_TOKEN", "");
    fetchMock.mockResolvedValueOnce(jsonResponse(syntheticOkBody()));

    const result = await fetchInjuriesPerYear();

    expect(result.status).toBe("ok");
  });
});

describe("FR-8 invariant — INJURIES_SOQL and buildInjuriesUrl() cannot drift apart", () => {
  it("INJURIES_SOQL is built from the pinned, frozen clauses (Rule 4) — every clause value is present verbatim", () => {
    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(INJURIES_SOQL).toContain(clause);
    }
  });

  it("buildInjuriesUrl() targets the pinned dataset with no $limit, and every clause is present in its query string, once decoded", () => {
    const url = buildInjuriesUrl();

    expect(url.origin + url.pathname).toBe(PINNED_BASE_URL);
    expect(url.searchParams.has("$limit")).toBe(false);

    // URLSearchParams.get() decodes regardless of the encoding scheme chosen
    // (percent-encoding vs '+' for space), so this does not lock in *how*
    // buildInjuriesUrl() encodes — only that the decoded values match.
    expect(url.searchParams.get("$select")).toBe(PINNED_CLAUSES.select);
    expect(url.searchParams.get("$where")).toBe(PINNED_CLAUSES.where);
    expect(url.searchParams.get("$group")).toBe(PINNED_CLAUSES.group);
    expect(url.searchParams.get("$order")).toBe(PINNED_CLAUSES.order);
  });

  it("keeps the displayed query (INJURIES_SOQL) and the sent request (buildInjuriesUrl()) mechanically in sync", () => {
    const url = buildInjuriesUrl();
    const decodedParamText = [...url.searchParams.values()].join(" ");

    for (const clause of Object.values(PINNED_CLAUSES)) {
      expect(INJURIES_SOQL).toContain(clause);
      expect(decodedParamText).toContain(clause);
    }
  });

  it("INJURIES_SOQL's $select clause aggregates number_of_persons_injured, never number_of_persons_killed (does not silently reuse the deaths aggregate)", () => {
    expect(INJURIES_SOQL).toContain("sum(number_of_persons_injured)");
    expect(INJURIES_SOQL).not.toContain("number_of_persons_killed");
  });
});
