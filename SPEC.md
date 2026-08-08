# Active SPEC

**Phase 2 of 6** — FR-6/FR-7. Cedar, 2026-08-07. Awaiting HITL approval before Cypress dispatch.

Phase 1 (borough vocabulary + `socrata.ts` transport) closed and is archived in
`ARCHIVED_SPECS.md`. This phase propagates the same optional `borough?: BoroughCode` parameter
through the four crash-metric wrapper modules. Cedar read all four wrapper files directly rather
than trusting the phase-table estimate; the table's guess (4 impl / 4 test files) held exactly,
no deviation.

---

```markdown
[SPEC]
- **Objective**: Widen `fetchDeathsPerYear`, `fetchInjuriesPerYear`, `fetchCollisionsPerYear`,
  `fetchRepairedCollisionsPerYear` (and their sibling `buildXUrl` functions) to accept an
  optional, type-closed `borough?: BoroughCode`, forwarding it unchanged to the now-widened
  `socrata.ts` transport. No caller passes one yet (Phase 4's job). The four frozen SOQL
  constants and every currently-rendered figure must stay byte-for-byte unchanged.

- **Requirement**: FR-6 [P1] — extends the borough-filter capability from the shared transport
  (Phase 1) to the four public entry points a Route Handler actually calls. Also serves NFR-2
  (a `BoroughCode` is the only type that can reach `$where`; no caller here ever handles a raw
  string) and NFR-4 (no new figure, count, or literal introduced — this phase moves no data).

- **Inputs/Outputs**:

  Each of the four files gains one import and widens two exported function signatures. Pattern,
  shown for `deaths.ts` (the other three are structurally identical modulo aggregate/alias/
  extraWhere):

  ```ts
  import { type BoroughCode } from "./boroughs";

  // unchanged — zero-arg call, byte-identical output (Constraint 2)
  export const DEATHS_SOQL = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);

  export function buildDeathsUrl(borough?: BoroughCode): URL {
    return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, undefined, borough);
  }

  export function fetchDeathsPerYear(
    borough?: BoroughCode,
  ): Promise<DeathsResult> {
    return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS, undefined, borough);
  }
  ```

  `injuries.ts` and `collisions.ts` follow the identical pattern (their own `AGGREGATE_EXPR`/
  `FIELD_ALIAS`, `extraWhere` position also `undefined`).

  `repairedCollisions.ts` differs only in that its `extraWhere` position is already occupied by
  its own frozen `EXTRA_WHERE` constant — `borough` becomes the *fifth* logical value flowing
  through the *fourth* positional parameter, unchanged in position:

  ```ts
  export function buildRepairedCollisionsUrl(borough?: BoroughCode): URL {
    return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, borough);
  }

  export function fetchRepairedCollisionsPerYear(
    borough?: BoroughCode,
  ): Promise<RepairedCollisionsResult> {
    return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE, borough);
  }
  ```

  No new type is introduced; `BoroughCode` is imported, never redefined. No new exported
  constant (a per-borough `DEATHS_SOQL_BROOKLYN` or similar is explicitly **not** this phase's
  job — see Constraints 3 and Edge Case 5).

- **Query**: this task sends no new request shape and pins no new SoQL text — it makes the four
  already-pinned Phase-1 fragments reachable through four new call shapes. For Cypress's
  contract tests, the expected `$where` per metric when a borough **is** supplied is the
  composition already pinned in Phase 1 (`window AND extraWhere AND borough`), instantiated per
  wrapper:

  ```
  deaths / injuries / collisions  (extraWhere absent):
    crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
      AND borough = '<crashesValue>'

  repairedCollisions  (extraWhere = the casualty filter):
    crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
      AND (number_of_persons_injured > 0 OR number_of_persons_killed > 0)
      AND borough = '<crashesValue>'
  ```

  `<crashesValue>` is one of the five pinned, live-verified uppercase literals from the
  `mvcc-data` skill / `boroughs.ts` (`BRONX`, `BROOKLYN`, `MANHATTAN`, `QUEENS`,
  `STATEN ISLAND` — trap 2: `B` is the Bronx). Expected response shape is the existing
  `YearlyMetricResult<K>` union, unchanged — `ok` still requires exactly 8 rows, 2018–2025
  (FR-11's coverage check is not relaxed for a filtered query; see Constraints 4). Byte-identity
  requirement carried over from Phase 1: calling any of the eight functions with **zero**
  arguments (or `fetchXPerYear(undefined)`) must produce a request and a `soql` value identical
  to today's. This is the one thing every one of the four new test files must assert before
  asserting anything about the borough path.

- **Design Pattern**: none — simple case. Phase 1 already earned and paid for the one axis of
  variation (borough as an optional `AND`-ed conjunct); this phase does not introduce a second
  axis, it only threads the same value through four more call sites. A Strategy or Decorator
  here would wrap a single forwarded parameter — pure ceremony.

- **Intellectual Control**:
  1. `borough` stays typed `BoroughCode` end-to-end from `boroughs.ts` through every wrapper to
     `socrata.ts`; no wrapper widens it to `string`, so a raw URL value still cannot reach a
     `$where` clause without passing `parseBoroughParam` first (that call site is Phase 4's,
     unaffected here).
  2. Every wrapper forwards, it never re-implements. None of the four files gains its own
     borough-to-literal mapping, its own `AND` composition, or its own validation — `boroughs.ts`
     and `socrata.ts` remain the only two places that know those things, per Phase 1's
     Intellectual Control 2–3. Adding a fifth mapping table here would be exactly the trap-2 risk
     Phase 1 closed, reopened.
  3. The four wrappers stay structurally identical to each other (mirroring how
     `socrata.test.ts` already documents that deaths/injuries/collisions/repairedCollisions share
     one shape) — a reviewer who reads `deaths.ts`'s diff has read all four.
  4. It won't break at scale because nothing here scales: four call sites, one forwarded
     parameter, zero new branches.

- **Constraints**:
  1. No new dependencies (Rule 9).
  2. Byte-identity: `DEATHS_SOQL`, `INJURIES_SOQL`, `COLLISIONS_SOQL`, `REPAIRED_COLLISIONS_SOQL`
     — each still computed by a zero-borough call at module load — must remain string-equal to
     their current values. These are frozen FR-8 contracts already displayed on the page.
  3. No new exported constant, type, or per-borough SOQL string in any of the four files. A
     borough-filtered query's `soql` is obtained by *calling* `fetchXPerYear(code)` and reading
     `result.soql` (already computed correctly by the widened `fetchYearlyMetric`, unchanged
     since Phase 1) — never by pre-computing and exporting a second frozen string per borough.
  4. `validateYearCoverage`'s 8-year requirement is not relaxed for a borough-filtered call, now
     or later. A borough-year that genuinely returns no rows is an FR-11 error state.
  5. `src/app/page.tsx`, all five `src/app/api/*` Route Handlers, and every component remain out
     of this phase's budget and must not be edited. Every existing zero-argument call site
     (Route Handlers, existing tests) keeps working unmodified via the optional parameter.
  6. No figure, count, or percentage literal anywhere in any of the four files (Rule 1 / NFR-4) —
     unchanged from today, this phase adds none.
  7. Constraint of Three: this SPEC cites three background resources — Phase 1's `SPEC.md`
     entry, `src/lib/socrata.ts`, `src/lib/boroughs.ts` — no more.

- **Edge Cases**:
  1. `borough` omitted on all four `fetchXPerYear`/`buildXUrl` calls → output byte-identical to
     today (Constraint 2's proof obligation).
  2. `repairedCollisions.ts` with both `EXTRA_WHERE` and `borough` supplied → composition order
     is window AND casualty-filter AND borough, per Phase 1's pinned order — never borough before
     the casualty filter.
  3. A filtered query returning zero rows → the existing FR-10 `empty` branch, unchanged; no new
     branch is added for "filtered and empty" vs. "unfiltered and empty".
  4. TypeScript positional-parameter mechanics: `deaths.ts`/`injuries.ts`/`collisions.ts` must
     pass `undefined` explicitly for the (now-skipped) third `extraWhere` position when forwarding
     `borough` as the fourth argument — omitting it would shift `borough` into the `extraWhere`
     slot and silently corrupt the `$where` clause. This is the one mechanical mistake this phase
     is most likely to make; Cypress's test for each of the three simple wrappers must assert the
     `$where` clause has no fifth phantom `AND undefined` and no borough value living where
     `extraWhere` should be.
  5. Calling `fetchXPerYear(code)` with a valid `BoroughCode` but before Phase 4 exists → fully
     functional and testable in isolation (this is the point of a walking-skeleton-style
     propagation phase); simply unreachable from the rendered page until Phase 4 lands.
  6. The `$limit` default (trap 5) stays untouched — still 8-row server-side aggregation, no
     pagination introduced by adding a filter conjunct.

- **Files** (max 5 — four used, matching the phase table exactly, confirmed by reading each file
  rather than assumed):
  1. **`src/lib/deaths.ts`** — *edited.* Widen `buildDeathsUrl`, `fetchDeathsPerYear`. ~4 lines.
  2. **`src/lib/injuries.ts`** — *edited.* Widen `buildInjuriesUrl`, `fetchInjuriesPerYear`.
     ~4 lines.
  3. **`src/lib/collisions.ts`** — *edited.* Widen `buildCollisionsUrl`, `fetchCollisionsPerYear`.
     ~4 lines.
  4. **`src/lib/repairedCollisions.ts`** — *edited.* Widen `buildRepairedCollisionsUrl`,
     `fetchRepairedCollisionsPerYear`. ~4 lines.

  **Cypress's budget for this phase (4 files, dispatched first, matching the phase table's "4
  test"):** `src/lib/deaths.test.ts`, `src/lib/injuries.test.ts`, `src/lib/collisions.test.ts`,
  `src/lib/repairedCollisions.test.ts` — each edited additive-only. Every existing assertion in
  all four must still pass unmodified (that is the byte-identity proof for this phase, mirroring
  how Phase 1 used `socrata.test.ts`'s untouched assertions the same way). New assertions per
  file: (a) a borough-supplied call produces the exact composed `$where` from this SPEC's Query
  section, for at least one borough code per file; (b) the zero-borough call's `soql`/URL output
  is unchanged (explicit regression pin, not just reliance on old tests still passing); (c) the
  positional-argument trap in Edge Case 4 is directly asserted for the three non-repaired
  wrappers (no phantom `AND undefined`, no borough literal landing in the `extraWhere` slot).

  **Not in this budget, and not owed by this phase:** `src/lib/boroughs.ts` / `socrata.ts`
  (Phase 1, closed), `arrests.ts` (Phase 3), `page.tsx` / the picker / all five Route Handlers
  (Phase 4), any FR-7 file (Phases 5–6). **If Redwood believes a fifth file is required, halt and
  request a revision naming it.**

- **Tipping Point**: revisit if a fifth crash-metric wrapper is ever added needing this same
  widening — at that point, hand-editing a fifth near-identical file stops being the cheap option
  and a small factory (`makeYearlyMetricWrapper(aggregateExpr, fieldAlias, extraWhere?)`)
  returning `{ SOQL, buildUrl, fetchPerYear }` earns its keep. Not earned at four. Composition
  order itself (window AND extraWhere AND borough) and any need to vary `$group`/`$order`/dataset
  ID remain `socrata.ts`'s own Tipping Point (Phase 1, unchanged) — this phase does not touch it.
```

```
[FORCES]
1. Byte-identical unfiltered output > any cleanup of the four wrapper files while they are
   open — four frozen FR-8 contracts (DEATHS_SOQL etc.) are already on the page; this phase's
   only job is additive forwarding, not tidying.
2. Forward, never re-implement > convenience — no wrapper gets its own copy of the
   borough-to-literal mapping or the AND-composition rule; both stay singular in `boroughs.ts`
   and `socrata.ts` per Phase 1.
3. One shared shape across all four wrappers > four independently-reasoned diffs — keeps the
   review and the test structure mechanically comparable, the same way the four existing wrapper
   files already mirror each other's shape.
4. Simplicity > Pattern purity.
```

---

## Remaining phases (sketches only — full SPECs come from Cedar as each lands)

| # | Closes | Impl | Test | Agent |
|---|---|---|---|---|
| 1 | ~~FR-6 vocabulary + transport~~ CLOSED | 2 | 2 | Redwood |
| **2** | **FR-6 crash-metric propagation (this phase)** | 4 | 4 | Redwood |
| 3 | FR-6 arrests propagation | 1 | 1 | Redwood |
| 4 | **FR-6 closed** — UI, end-to-end | 3 | 2 | Magnolia |
| **5a** | structural only — no FR | 2 | 1 | **Banyan** |
| **5b** | FR-7 coverage data (both fields) | 1 | 1 | Redwood |
| 6 | **FR-7 closed** — banner | 3 | 2 | Magnolia |

The 3 | 4 cut is the forced one: Phases 1–3 are each provably invisible (every caller still
defaults to no borough), and Phase 4 is the single switch-on. Shipping the picker before arrests
propagates would render four panels reading "Brooklyn" beside a fifth silently still citywide —
the mislabelled-figure failure this product exists to criticise.

## Phases 5–6 revised (Cedar, 2026-08-07) after the `arrest_boro` override

**Phase 5 split in two, and the `arrests.ts` extraction is now earned — Cedar reversed its own
§2c hypothesis on new evidence.** It had guessed a coverage query would need too little of
`arrests.ts` to justify extraction. The deciding fact it did not have then: **the arrests coverage
denominator must be the arrests panel's own row set**, so it needs the trap-4 five-spelling
`ofns_desc` clause — not merely the fetch scaffold. Declining extraction would therefore mean a
*third* copy of the fetch pipeline **and a second copy of the offence list**, whose silent
divergence no test would catch and which would leave the banner describing a row set the page never
shows. Extraction is the cheaper option, not the more expensive one.

- **`src/lib/arrestsSocrata.ts` is `8h9b-rp9u`-only and is never merged into `socrata.ts`.** §2a's
  own stated trigger ("a caller needing to vary the dataset ID") has fired, but **PRD §5.2
  outranks it**: coupling four P0 metrics to a droppable P1 feature is exactly what severability
  exists to prevent. Two parallel transports, mirroring `socrata.ts` : `deaths.ts`.
- **The offence clause stays in `arrests.ts`** as an exported `ARRESTS_OFFENCE_WHERE`, imported by
  the coverage module. It is FR-5's *metric definition*, not a property of the dataset.
- **Next Tipping Point, so the pre-commitment does not rot twice:** a third Socrata dataset, or a
  caller on either transport needing to vary `$group`/`$order` — at which point three copies can no
  longer be defended by severability and a single parameterised transport wins.
- **Phase 1 needs no change; Cypress was not halted.** The `IN (...)` enumeration is a *set*
  predicate over all five codes, so it is an ordinary `extraWhere` fragment, not the single-code
  `borough?: BoroughCode` parameter. Phase 1's exports are used, not extended.

**The honesty problem the override creates, and its six mechanically-checkable rules.** Two
coverage rates from differently-collected fields, shown together, invite the inference that one
dataset is "better" or that the gap says something about the roads. Cedar's constraints: no shared
visual frame (no two-row table, no paired tiles, no common header); ordered by consequence not
symmetry (collisions block leads with full detail, arrests is one sentence); a greppable
forbidden-vocabulary list (*better, worse, higher, lower, compared to, unlike, whereas, only*) with
**no computed difference or ratio between the two figures existing in the code at all** — if it is
never computed it cannot leak; one explicit non-comparability sentence placed *between* the blocks
so it is read before the second figure; coverage-is-not-validity pointed at `Caveats.tsx` rather
than restated; and a `<details>` disclosure carrying all 8 rows per field plus Q6–Q9, because two
endpoints 16 points apart read as a jump when the real shape is slow creep then a 2024→2025 step.
Independent per-field status: an arrests-coverage fetch error must not silence the collisions
warning, and a missing figure must never silence a warning at all.

**Pinned derivation detail that must not be left incidental:** `windowUnpopulatedShare` is
**row-weighted** (`1 − Σattributed/Σtotal` = 32.9%), *not* the mean of the eight yearly rates
(~31.8%). The two differ by ~1.1pp, so the choice is explicit in code and in the test.

**Flagged: the fifth instance of the recurring bug shape.** `arrests.test.ts:527-535` asserts that
no `src/lib/` file but `socrata.ts` and `arrests.ts` reads `process.env` — Phase 5a's new transport
makes that false. Discipline: widen the allow-list to name `arrestsSocrata.ts` **explicitly**,
never loosen it to a directory glob and never delete it; the point of the test is that the
token-reading set stays small and enumerated. Same for `:537-548`'s `readFileSync` scan — re-point
it, keep the three demographic exclusions absolute, and add a mirror assertion so the new file
cannot acquire a `perp_race`/`perp_sex`/`age_group` reference either.
