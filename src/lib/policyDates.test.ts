// Behavioral / black-box tests for src/lib/policyDates.ts (SPEC.md — FR-13,
// "Mark the two documented NYPD reporting-policy dates ... and extract the
// two dates into a shared, reusable data module").
//
// Written BEFORE src/lib/policyDates.ts exists, per CLAUDE.md Rule 4 and this
// SPEC's standard (non-SPIKE) ordering: Cypress writes failing tests first,
// Magnolia implements against them. This file must fail red against the
// current tree on module resolution alone (`./policyDates` does not exist
// yet) — a clean single-cause failure, not a mistaken assertion.
//
// The two pinned values below are copied verbatim from SPEC.md's Inputs/
// Outputs section (a Rule-4-adjacent frozen contract for FR-13, though these
// specific two literals are declared out of NFR-4's scope by the SPEC's own
// Query section: they are static, already-verified historical facts, not a
// Socrata aggregate). Independently re-verified against the mvcc-data
// skill's "The documented cause" section before writing this file — the
// skill and SPEC.md agree: Staten Island pilot 2019-03-18, citywide
// 2020-04-06.
//
// This file intentionally hardcodes the expected values rather than deriving
// them from anything — there is nothing to derive them from; they are the
// single source of truth this module exists to establish.

import { describe, expect, it } from "vitest";

import { POLICY_DATE_MARKERS, type PolicyDateMarker } from "./policyDates";

describe("POLICY_DATE_MARKERS", () => {
  it("is an array of exactly 2 markers", () => {
    expect(POLICY_DATE_MARKERS).toHaveLength(2);
  });

  it("pins the Staten Island pilot marker first, exactly: { year: 2019, isoDate: '2019-03-18', label: 'Staten Island pilot begins' }", () => {
    expect(POLICY_DATE_MARKERS[0]).toEqual({
      year: 2019,
      isoDate: "2019-03-18",
      label: "Staten Island pilot begins",
    });
  });

  it("pins the citywide marker second, exactly: { year: 2020, isoDate: '2020-04-06', label: 'Citywide policy takes effect' }", () => {
    expect(POLICY_DATE_MARKERS[1]).toEqual({
      year: 2020,
      isoDate: "2020-04-06",
      label: "Citywide policy takes effect",
    });
  });

  it("pins the entire array in one shot, in order — no third marker, no reordering", () => {
    expect(POLICY_DATE_MARKERS).toEqual([
      {
        year: 2019,
        isoDate: "2019-03-18",
        label: "Staten Island pilot begins",
      },
      {
        year: 2020,
        isoDate: "2020-04-06",
        label: "Citywide policy takes effect",
      },
    ]);
  });

  it("asserts each pinned field individually with toBe, not just structurally with toEqual — catches a type coercion (e.g. year as a string) toEqual's looser equality could miss", () => {
    const [statenIsland, citywide] = POLICY_DATE_MARKERS;

    expect(statenIsland.year).toBe(2019);
    expect(statenIsland.isoDate).toBe("2019-03-18");
    expect(statenIsland.label).toBe("Staten Island pilot begins");

    expect(citywide.year).toBe(2020);
    expect(citywide.isoDate).toBe("2020-04-06");
    expect(citywide.label).toBe("Citywide policy takes effect");
  });

  it("orders markers chronologically by year, ascending — the visual/text layers both assume this order", () => {
    for (let i = 1; i < POLICY_DATE_MARKERS.length; i++) {
      expect(POLICY_DATE_MARKERS[i].year).toBeGreaterThan(
        POLICY_DATE_MARKERS[i - 1].year,
      );
    }
  });

  // Secondary, belt-and-suspenders runtime shape check per the dispatch
  // instructions — `tsc --noEmit` is the primary contract for
  // `PolicyDateMarker`'s shape; this only confirms the *values* actually
  // conform to it at runtime (e.g. a bug that assigns `label` where `isoDate`
  // belongs would compile fine but fail this).
  it("every marker has exactly the PolicyDateMarker shape: numeric year, string isoDate matching YYYY-MM-DD, non-empty string label", () => {
    for (const marker of POLICY_DATE_MARKERS) {
      const keys = Object.keys(marker).sort();
      expect(keys).toEqual(["isoDate", "label", "year"]);

      expect(typeof marker.year).toBe("number");
      expect(Number.isInteger(marker.year)).toBe(true);

      expect(typeof marker.isoDate).toBe("string");
      expect(marker.isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(typeof marker.label).toBe("string");
      expect(marker.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("each marker's isoDate falls within its own pinned year — the axis-tick year and the day-precision label can never silently drift apart", () => {
    for (const marker of POLICY_DATE_MARKERS) {
      expect(marker.isoDate.startsWith(String(marker.year))).toBe(true);
    }
  });

  it("compiles as a readonly PolicyDateMarker[] usable at a type-level without a cast — a TypeScript-only guard belt-and-suspenders to the runtime checks above", () => {
    // This line only needs to typecheck (`npm run typecheck`); if
    // POLICY_DATE_MARKERS were typed as e.g. `PolicyDateMarker[]` without
    // `readonly`, a `.push(...)` here would still compile and this comment
    // would be a lie — so the meaningful assertion is `tsc --noEmit` staying
    // clean on this file, not anything runtime-observable here.
    const typed: readonly PolicyDateMarker[] = POLICY_DATE_MARKERS;
    expect(typed).toBe(POLICY_DATE_MARKERS);
  });
});
