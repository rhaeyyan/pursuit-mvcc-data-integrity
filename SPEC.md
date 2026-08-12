# Active SPEC

[SPEC]

- **Objective**: Fetch and expose the Staten Island pilot panel's data — the monthly Staten
  Island collision count for 2018–2019, the one pre-COVID window that isolates the reporting-policy
  effect from the pandemic confound. This is the **data half only** (fetch, validate, derive, HTTP
  contract); the chart/UI half is a deliberate follow-up SPEC, mirroring this project's own
  precedent of splitting FR-3 into a data half and a chart half when scope was tight
  (`ARCHIVED_SESSIONS.md`, "FR-3's data half").

- **Requirement**: PRD §3, Open-data student/analyst persona, **P2**: "As an analyst, I want to
  see the Staten Island pilot window on its own, so that I can evaluate the reporting-change
  effect in the one period not confounded by the pandemic." Out of scope for the initial P0/P1
  build per PRD §5.3's own framing, legitimate now that v1 (all FRs, NFR-1's post-deploy gap) is
  closed. Directly retires the residual item in PRD §7's top risk row: "Residual risk is one of
  *magnitude*, not direction" — this SPEC turns that from a qualitative claim into a queried number.

- **Inputs/Outputs**:
  - New self-contained module `src/lib/statenIslandPilot.ts` (see Intellectual Control for why
    this is not an extension of `socrata.ts`).
  - New Route Handler `src/app/api/staten-island-pilot/route.ts`.
  - Output shape:
    ```ts
    type SIPilotRow = { month: string; collisions: number }; // month = "YYYY-MM", Jan 2018..Dec 2019, 24 rows
    type SIPilotStats = { avg2018Monthly: number; avgMayDec2019: number }; // both derived, never literals
    type SIPilotResult =
      | { status: "ok"; soql: string; rows: SIPilotRow[]; stats: SIPilotStats }
      | { status: "empty"; soql: string }
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };
    ```

- **Query**: **Verified live against Socrata during this SPEC's own drafting** (Rule 1 — a query
  fact is never handed off from recollection, even one this basic). Exact SoQL, pinned:
  ```
  $select=date_trunc_ym(crash_date) AS month, count(collision_id) AS collisions
  $where=crash_date >= '2018-01-01T00:00:00' AND crash_date < '2020-01-01T00:00:00' AND borough = 'STATEN ISLAND'
  $group=date_trunc_ym(crash_date)
  $order=month
  ```
  Confirmed live: returns exactly 24 rows, one per calendar month Jan 2018–Dec 2019, no gaps.
  **The `month` value arrives as `"2018-01-01T00:00:00.000"` — a full floating-timestamp string,
  not `"YYYY-MM"`.** Parse via `month.slice(0, 7)`; do not assume ISO-bare-month shape. `collisions`
  arrives as a numeric string (`"487"`), cast per the project's standing string-casting rule.
  Verified totals **match Appendix A exactly**: 2018 sum = 6,171; 2019 sum = 3,650; Mar/Apr 2019 =
  370/217; May–Dec 2019 average = 271.25 (≈271, matches the pinned "~271"). Any Redwood
  implementation must reproduce these on a fresh query — a mismatch is the finding, not a bug to
  silently absorb (skill: "if a query disagrees with this file, the discrepancy is the finding").
  **Rule 4 applies: this exact SoQL may not be edited, reordered, or extended without a new SPEC.**

- **Design Pattern**: none — simple case. Fixed window (2018–2019), fixed borough (Staten Island),
  fixed grouping. No variance to encapsulate.

- **UI Scope**: N/A — this task has no UI component.

- **Intellectual Control**:
  1. **Why a new module, not an extension of `socrata.ts`.** `socrata.ts`'s own header is explicit
     that `$group`/`$order` "stay fixed internal constants... that generality remains unearned,"
     and its `EXPECTED_YEARS`/`validateYearCoverage` machinery is hard-wired to an 8-row annual
     shape (2018–2025). This panel needs a 24-row *monthly* shape over a *2018–2019* window with a
     *fixed, non-optional* borough — three simultaneous deviations from `socrata.ts`'s contract.
     Bending that file to cover both shapes would be exactly the premature-generality Rule 8 warns
     against. The precedent is `arrestsSocrata.ts`, whose own header calls itself "a deliberately
     self-contained sibling module, not a `socrata.ts` caller" for the same reason (different
     dataset, different shape) — this module follows that same choice for a different reason
     (same dataset, incompatible shape).
  2. **Why `date_trunc_ym`, not `date_extract_m`.** `date_extract_m` alone returns 1–12 and would
     collide January 2018 with January 2019 in the same `$group` bucket — silently wrong for a
     series that crosses a year boundary. `date_trunc_ym` includes the year, confirmed correct by
     the live probe above.
  3. **Why the borough is a hardcoded literal, not a `BoroughCode` parameter.** This panel's entire
     premise *is* Staten Island — PRD's own language calls it "the Staten Island pilot panel." A
     parameterized borough would imply the other four boroughs have an equivalent pilot window;
     they don't (only Staten Island got the 2019-03-18 early pilot). Parameterizing an axis with
     exactly one valid value is complexity with no corresponding requirement.
  4. **Why the derived stats live beside the fetcher instead of in a fifth file.** `percentChange.ts`
     is a precedent for keeping pure derivation separate from fetch code, but that precedent exists
     because percent-change is shared across *five* metrics. `avg2018Monthly`/`avgMayDec2019` are
     single-use, single-caller pure functions with no reuse case — splitting them out would be the
     same unearned generality Rule 8 warns against, just in the opposite direction. Keep them
     exported and independently unit-testable in the same file (Cypress should unit-test the pure
     stats functions directly and behaviorally/stub-test the fetch path — Rule 4's "no brittle unit
     tests that lock in implementation" concerns fetch plumbing, not a pure arithmetic function).

- **Constraints**:
  - No new dependencies (Rule 9).
  - Never coerce a missing month to `0` collisions — extends FR-11/trap-1's fail-loud discipline to
    the monthly grain this SPEC introduces. A missing month is a `status: "error"`, `kind:
    "contract"` result, exactly like a missing year in `socrata.ts`.
  - `avg2018Monthly`/`avgMayDec2019` must be computed by a pure function from the validated 24 rows
    — never a typed-in literal, even though this SPEC's own verification confirms what they'll
    equal (NFR-4/Rule 1: your own arithmetic while drafting a SPEC is not a source either).
  - Route Handler follows the exact ok/empty/error → 200/200/502-or-422 mapping already established
    in `src/app/api/deaths/route.ts` — no new HTTP contract shape to learn.

- **Edge Cases**:
  1. A month in the 24-month window returns no rows from Socrata (SQL `GROUP BY` omits empty
     groups entirely — this is the same absent-key shape as trap 1, not a new risk) → `status:
     "error"`, name the specific missing month(s).
  2. Zero rows total → FR-10's `status: "empty"`.
  3. Duplicate month in the response → `status: "error"`, contract violation (mirrors
     `socrata.ts`'s `validateYearCoverage` duplicate check).
  4. A row outside the Jan 2018–Dec 2019 window → `status: "error"` (mirrors the existing
     out-of-window check).
  5. Socrata network/timeout/non-2xx/non-JSON failures → `status: "error"`, `kind: "upstream"`,
     matching `socrata.ts`'s existing handling exactly (reuse that logic's shape; it is proven).

- **Files** (4 — one slot of headroom against the cap of 5):
  1. `src/lib/statenIslandPilot.ts` — SoQL builder, fetch + validate, `avg2018Monthly` /
     `avgMayDec2019` pure derivation functions.
  2. `src/lib/statenIslandPilot.test.ts` — Cypress's tests: behavioral/stubbed tests for the fetch
     path (ok/empty/error, the absent-month fail-loud case), plain unit tests for the two pure
     stats functions.
  3. `src/app/api/staten-island-pilot/route.ts` — black-box HTTP contract, mirroring
     `src/app/api/deaths/route.ts`'s status-to-HTTP-code mapping exactly.
  4. `src/app/api/staten-island-pilot/route.test.ts` — Cypress's tests, mirroring
     `src/app/api/deaths/route.test.ts`'s structure.

- **Tipping Point**: if a second borough-specific natural-experiment window is ever requested
  (unlikely — Staten Island is the only borough with a documented early pilot date), extract a
  shared monthly-transport helper analogous to `socrata.ts`'s yearly one at that point, not before.
  The chart/UI half consuming this data is the next SPEC, not a trigger for revising this one.

## Acceptance criteria

Tests first (Cypress), then implementation (Redwood). Per Amendment 3(b), **record `node -v`
beside every result; it must read v22.x.** Prefix every command:
```
export NVM_DIR="$HOME/.nvm"; . /usr/local/opt/nvm/nvm.sh; nvm use >/dev/null
```
Baseline verified 2026-08-11 immediately before this SPEC: **570/570 in 22 files, `tsc --noEmit`
clean, `eslint .` 0 errors / 2 known pre-existing warnings.**

1. Full suite green — 570 plus whatever Cypress's new tests add; state the new total.
2. A live (unstubbed) run of the pinned query reproduces the verified totals above (2018 sum
   6,171; 2019 sum 3,650; Mar/Apr 2019 370/217; May–Dec 2019 average ≈271) — this is the
   non-closable check from this project's own FR-6 Phase 1 precedent; a mismatch blocks close-out
   pending Cedar review, it is not something to quietly adjust.
3. `tsc --noEmit` clean; `eslint .` 0 errors, allowing only the 2 known pre-existing warnings.
4. `GET /api/staten-island-pilot` returns the ok-shape JSON (200) on a live call, matching the
   Route Handler contract exactly.
5. No SoQL/dataset/clause was altered from what's pinned above (Rule 4 self-check).

[FORCES]

1. **Match the existing contract shape > invent a new one.** The Route Handler's ok/empty/error →
   200/200/502-or-422 mapping and `socrata.ts`'s upstream-failure handling are proven; reuse their
   shape rather than redesigning either.
2. **A verified query beats a recalled one.** This SPEC's query was run live during drafting, not
   pulled from the skill's Appendix A summary — Rule 1 grades the verification, not the outcome.
3. Simplicity > Pattern purity.
