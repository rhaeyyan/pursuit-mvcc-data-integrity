// Pure substitution logic for the PRD §7 risk mitigation: "commit a dated
// JSON snapshot ... as a documented fallback fixture" for when Socrata is
// rate-limited, slow, or down at demo time (SPEC.md). Kept out of
// socrata.ts/deaths.ts on purpose — those files are the frozen query
// contract (CLAUDE.md Rule 4); this is an orthogonal availability concern
// (what to render when transport fails), not a change to what a number
// means.
//
// withFallback() is a single pure function with one substitution rule: an
// upstream failure (Socrata unreachable) with a fixture available may be
// papered over; a contract violation (broken query, absent aggregate) or a
// genuinely empty result may never be, regardless of whether a fixture
// exists — see SPEC.md's Intellectual Control point 3 and Edge Cases 3-5.
// No mutation, no I/O, no Promise: matches percentChange.ts's precedent for
// this codebase's derived/pure modules.

import type { YearlyMetricResult, YearlyMetricRow } from "./socrata";

export type YearlyMetricResultWithSource<K extends string> =
  | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[]; source: "live" }
  | {
      status: "ok";
      soql: string;
      rows: YearlyMetricRow<K>[];
      source: "cache";
      asOf: string;
    }
  | { status: "empty"; soql: string }
  | {
      status: "error";
      soql: string;
      kind: "upstream" | "contract";
      reason: string;
    };

export function withFallback<K extends string>(
  live: YearlyMetricResult<K>,
  // `readonly` here (vs. the SPEC pseudocode's plain array) is a strictly
  // more permissive widening, never a narrowing: every mutable array a
  // caller could pass under the SPEC's literal signature is still
  // assignable here. It's required because a caller building a fixture with
  // `Object.freeze(rows)` produces a `readonly` array *type*, and this is a
  // pure function that must accept it without complaint.
  fixture: { asOf: string; rows: readonly YearlyMetricRow<K>[] } | undefined,
): YearlyMetricResultWithSource<K> {
  if (live.status === "ok") {
    return { ...live, source: "live" };
  }

  // Only an upstream failure (Socrata unreachable) with a fixture on hand is
  // eligible for substitution. A contract violation or an empty result falls
  // through to the final `return live` below, unchanged, on purpose — never
  // mask the exact failure mode this product exists to surface.
  if (live.status === "error" && live.kind === "upstream" && fixture) {
    return {
      status: "ok",
      soql: live.soql,
      // Copied, not aliased: the returned result must never share array
      // identity with the (possibly frozen) fixture input.
      rows: [...fixture.rows],
      source: "cache",
      asOf: fixture.asOf,
    };
  }

  return live;
}
