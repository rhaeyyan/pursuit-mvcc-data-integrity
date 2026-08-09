// Dedicated transport module for NYPD Arrests Data Historic (dataset 8h9b-rp9u).
// Encapsulates Socrata HTTP request execution, authentication, timeout,
// content-type check, error mapping, and 2018-2025 coverage validation.

import { z } from "zod";

import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";

export const BASE_URL = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";

const EXPECTED_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const YearSchema = z.union([z.string(), z.number()]);
const ArrestsValueSchema = z.string().regex(/^\d+$/);

function normalizeYear(year: string | number): number {
  return typeof year === "number" ? year : Number(year);
}

function describeYear(raw: unknown): string {
  const rawYear = (raw as Record<string, unknown> | null | undefined)?.year;
  return typeof rawYear === "string" || typeof rawYear === "number"
    ? String(rawYear)
    : "an unknown year";
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "missing";
  if (typeof value === "string" && value === "") return "an empty string";
  return typeof value;
}

function parseArrestsRow<K extends string>(
  raw: unknown,
  fieldAlias: K,
): { row: YearlyMetricRow<K> } | { error: string } {
  const yearParsed = YearSchema.safeParse(
    (raw as Record<string, unknown> | null | undefined)?.year,
  );
  if (!yearParsed.success) {
    return { error: `invalid year value for ${describeYear(raw)}` };
  }

  const rawValue = (raw as Record<string, unknown> | null | undefined)?.[
    fieldAlias
  ];
  const valueParsed = ArrestsValueSchema.safeParse(rawValue);
  if (!valueParsed.success) {
    return {
      error: `invalid ${fieldAlias} value for ${describeYear(raw)} (${describeValue(rawValue)})`,
    };
  }

  return {
    row: {
      year: normalizeYear(yearParsed.data),
      [fieldAlias]: Number(valueParsed.data),
    } as YearlyMetricRow<K>,
  };
}

function validateYearCoverage<K extends string>(
  rows: YearlyMetricRow<K>[],
): string | null {
  if (rows.length > EXPECTED_YEARS.length) {
    return `expected ${EXPECTED_YEARS.length} yearly rows, got ${rows.length}`;
  }

  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.year)) {
      return `duplicate row for year ${row.year}`;
    }
    seen.add(row.year);
  }

  const missing = EXPECTED_YEARS.filter((year) => !seen.has(year));
  if (missing.length > 0) {
    return `no aggregate returned for ${missing.join(", ")}`;
  }

  const outOfWindow = [...seen].filter(
    (year) => !EXPECTED_YEARS.includes(year),
  );
  if (outOfWindow.length > 0) {
    return `unexpected year(s) outside 2018-2025: ${outOfWindow.join(", ")}`;
  }

  return null;
}

export async function fetchArrestsQuery<K extends string>(
  soql: string,
  url: URL,
  fieldAlias: K,
): Promise<YearlyMetricResult<K>> {
  const token = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-App-Token"] = token;
  } else {
    // Edge Case 8: the token is a rate-limit attribution token, not an
    // authorization secret. Its absence degrades throughput, never
    // correctness, so this is a warning, not a failure.
    console.warn(
      `SOCRATA_APP_TOKEN is unset; requesting Socrata (${fieldAlias}) without rate-limit attribution.`,
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86400 },
    });
  } catch {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "the request to Socrata failed (network error or timeout)",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: `Socrata responded ${response.status}`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "Socrata responded with a non-JSON body",
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      status: "error",
      soql,
      kind: "upstream",
      reason: "Socrata's response body could not be parsed as JSON",
    };
  }

  if (!Array.isArray(body)) {
    return {
      status: "error",
      soql,
      kind: "contract",
      reason: "Socrata's response was not a JSON array of yearly aggregates",
    };
  }

  if (body.length === 0) {
    return { status: "empty", soql };
  }

  const rows: YearlyMetricRow<K>[] = [];
  for (const raw of body) {
    const parsed = parseArrestsRow(raw, fieldAlias);
    if ("error" in parsed) {
      return { status: "error", soql, kind: "contract", reason: parsed.error };
    }
    rows.push(parsed.row);
  }

  const coverageError = validateYearCoverage(rows);
  if (coverageError) {
    return { status: "error", soql, kind: "contract", reason: coverageError };
  }

  rows.sort((a, b) => a.year - b.year);

  return { status: "ok", soql, rows };
}
