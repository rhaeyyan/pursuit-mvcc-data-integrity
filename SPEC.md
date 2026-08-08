# Active SPEC

**Phase 3 of 6** — FR-6/FR-7. Cedar, 2026-08-07. Awaiting HITL approval before Cypress dispatch.

Phases 1 (borough vocabulary + `socrata.ts` transport) and 2 (crash-metric wrapper propagation)
are closed and archived in `ARCHIVED_SPECS.md`. This phase gives `arrests.ts` the same optional
`borough?: BoroughCode` capability, composed against `arrest_boro` via `boroughs.ts`'s pinned
`arrestsBoroughWhere()`. Cedar read `arrests.ts`/`arrests.test.ts` directly rather than assuming
Phase 2 parity — the phase table's 1-impl/1-test estimate holds, but the shape genuinely differs
in two ways named explicitly below: `arrests.ts` has no shared transport to forward into, so the
composition is written once inside this file (the severability cost PRD §5.2 already priced in);
and only `fetchArrestsPerYear` is exported, so this phase widens one public signature, not two.
Phase 2's positional-argument trap cannot recur here — `arrests.ts` has no `extraWhere` slot.
Cedar also flagged two pre-existing `arrests.test.ts` assertions whose *titles* this phase makes
stale (the "exactly one of X" test-staleness shape hit four times already this project), with the
exact fix named so Cypress doesn't have to rediscover it.

---

```markdown
[SPEC]
- **Objective**: Widen `fetchArrestsPerYear` in `src/lib/arrests.ts` to accept an optional,
  type-closed `borough?: BoroughCode`, composing it onto the fixed window-AND-offense `$where`
  via `boroughs.ts`'s pinned `arrestsBoroughWhere()` — never a locally re-derived Bronx/Brooklyn
  mapping. No caller passes one yet (Phase 4's job). `ARRESTS_SOQL` and every currently-rendered
  figure must stay byte-for-byte unchanged.

- **Requirement**: FR-6 [P1] — extends the borough-filter capability to the fifth metric, so
  Phase 4 can wire one picker across all five series rather than four. Also serves NFR-2 (a
  `BoroughCode` is the only type that can reach this file's `$where`; nothing here ever handles a
  raw string) and NFR-4 (no new figure, count, or literal introduced — this phase moves no data).

- **Inputs/Outputs**:
  - `fetchArrestsPerYear(borough?: BoroughCode): Promise<ArrestsResult>` — the only exported
    signature that widens. `ArrestsResult`/`ArrestsRow` are unchanged (still `import type` only
    from `socrata.ts`).
  - `ARRESTS_SOQL: string` — unchanged export, unchanged value. Must be produced by a zero-arg
    call into whatever internal builder this task adds (mirroring Phase 1/2's "each still
    computed by a zero-borough call at module load" pattern), so byte-identity is guaranteed by
    construction rather than by two independently-typed strings that could drift.
  - **Not part of this task's exported surface**: `buildArrestsUrl` is currently module-private
    (confirmed by reading the file — no `export` keyword). It needs the same optional-borough
    widening internally so `fetchArrestsPerYear` can forward to it, but it does not need to
    become exported, and Cypress's tests (per `arrests.test.ts`'s own header comment, "no
    buildXUrl() export assumed") already exercise this only through `fetchArrestsPerYear()` and
    the stubbed `fetch` call's own arguments — the black-box surface, not an internal name.
  - Illustrative shape (internal names are Redwood's to choose; only the exported signature and
    `ARRESTS_SOQL`'s value are contractual):
    ```ts
    import { arrestsBoroughWhere, type BoroughCode } from "./boroughs";

    function whereClause(borough?: BoroughCode): string {
      const parts = [WHERE_CLAUSE]; // unchanged: window AND (five-category offense OR-group)
      if (borough) parts.push(arrestsBoroughWhere(borough));
      return parts.join(" AND ");
    }

    function buildArrestsSoql(borough?: BoroughCode): string {
      return [
        `$select=${SELECT_CLAUSE}`,
        `$where=${whereClause(borough)}`,
        `$group=${GROUP_CLAUSE}`,
        `$order=${ORDER_CLAUSE}`,
      ].join("\n");
    }

    export const ARRESTS_SOQL = buildArrestsSoql(); // unchanged value — zero-arg call

    function buildArrestsUrl(borough?: BoroughCode): URL {
      const url = new URL(BASE_URL);
      url.searchParams.set("$select", SELECT_CLAUSE);
      url.searchParams.set("$where", whereClause(borough));
      url.searchParams.set("$group", GROUP_CLAUSE);
      url.searchParams.set("$order", ORDER_CLAUSE);
      return url;
    }

    export async function fetchArrestsPerYear(
      borough?: BoroughCode,
    ): Promise<ArrestsResult> {
      const soql = buildArrestsSoql(borough);
      const url = buildArrestsUrl(borough);
      // ...unchanged fetch/parse/coverage-check body, now closed over `soql`/`url` above
      // instead of the current fixed `ARRESTS_SOQL`/`buildArrestsUrl()`.
    }
    ```
  - No new type introduced; `BoroughCode` is imported from `./boroughs`, never redefined. No new
    exported constant (a per-borough `ARRESTS_SOQL_BROOKLYN` or similar is explicitly **not**
    this phase's job — Constraint 3).

- **Query** (dataset `8h9b-rp9u`, unchanged `$select`/`$group`/`$order`): this task pins the
  borough-filtered `$where` shape, sending no request shape Phase 1/`mvcc-data` haven't already
  verified field-by-field:
  ```
  $where=arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00'
    AND (ofns_desc = 'VEHICLE AND TRAFFIC LAWS'
      OR ofns_desc = 'OTHER TRAFFIC INFRACTION'
      OR ofns_desc = 'INTOXICATED & IMPAIRED DRIVING'
      OR ofns_desc = 'INTOXICATED/IMPAIRED DRIVING'
      OR ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE')
    AND arrest_boro = '<arrestsValue>'
  ```
  `<arrestsValue>` is one of the five pinned, live-verified single-letter codes from `boroughs.ts`
  / the `mvcc-data` skill: `B`=Bronx, `K`=Brooklyn, `M`=Manhattan, `Q`=Queens, `S`=Staten Island
  — trap 2, `B` is **not** Brooklyn. `$select`/`$group`/`$order` are unchanged from the frozen
  `ARRESTS_SOQL` contract. Expected response shape is unchanged: a JSON array of up to 8
  `{ year: string | number, arrests: string }` objects; `ok` still requires exactly 8 rows,
  2018–2025 (FR-11's coverage check is not relaxed for a borough-filtered query — Constraint 4).
  Byte-identity requirement carried over from Phases 1–2: calling `fetchArrestsPerYear()` with
  **zero** arguments (or `fetchArrestsPerYear(undefined)`) must produce a request and a `soql`
  value identical to today's — the one thing the widened test file must assert before asserting
  anything about the borough path.

- **Design Pattern**: none — simple case. Phase 1 already earned and paid for the one axis of
  variation (borough as an AND-ed conjunct); this phase pays that same small, already-justified
  cost a second time, on the arrests side, because `arrests.ts` is a deliberately separate
  transport (severability, PRD §5.2) — not because a second axis of variation exists here. A
  Strategy or Decorator would wrap a single forwarded parameter — pure ceremony, identical to
  Phase 2's reasoning.

- **Intellectual Control**:
  1. `borough` stays typed `BoroughCode` end-to-end from `boroughs.ts` through
     `fetchArrestsPerYear`; this file never widens it to `string`, so a raw URL value still
     cannot reach this `$where` without `parseBoroughParam` first (Phase 4's call site,
     unaffected here).
  2. Composition, never re-derivation: `arrests.ts` calls the imported `arrestsBoroughWhere()`
     for the borough fragment and never re-implements the Bronx/Brooklyn mapping or the
     trust-boundary parsing — `boroughs.ts` remains the single place that knows both, exactly as
     it already is for the four crash wrappers (Phase 2's Intellectual Control 2). Writing a
     second, arrests-side `arrest_boro` mapping table would reopen the trap-2 risk Phase 1 closed.
  3. Unlike the four crash wrappers, `arrests.ts` has no shared `fetchYearlyMetric`/
     `buildYearlyUrl` to forward into — the window-AND-offense-AND-borough composition has to be
     written once, inside this file, mirroring the *shape* `socrata.ts` already proved (an
     optional trailing conjunct AND-ed onto a fixed base) without sharing code with it. This is
     the same severability cost FR-5's original SPEC named and accepted for the fetch/validate
     scaffold (~130 duplicated lines) — paid a second, smaller time here, not a new decision.
  4. Only `fetchArrestsPerYear`'s exported signature needs to widen. `buildArrestsUrl` stays
     module-private (it already is today); no new export is added to this file's public surface
     beyond the one new optional parameter on the one function already exported.
  5. It won't break at scale because nothing here scales: one call site, one forwarded parameter,
     one new internal composition function, paid once — not four times, since this is a single
     file, not four wrapper files.

- **Constraints**:
  1. No new dependencies (Rule 9).
  2. Byte-identity: `ARRESTS_SOQL` — still computed by a zero-borough call at module load — and
     the output of a zero-argument `fetchArrestsPerYear()` call (`status`, `soql`, `rows`) must
     remain identical to today's. This is a frozen FR-8 contract already displayed on the page.
  3. No new exported constant, type, or per-borough SOQL string. A borough-filtered query's
     `soql` is obtained by *calling* `fetchArrestsPerYear(code)` and reading `result.soql` —
     never by pre-computing and exporting a second frozen string per borough.
  4. The existing 8-year `validateYearCoverage` check is not relaxed for a borough-filtered call,
     now or later. A borough-year that genuinely returns no rows is an FR-11 error state.
  5. `arrests.ts` still never imports `./socrata` as a value (only `import type`, unchanged from
     FR-5's SPEC). It **may** import `./boroughs` as both a value (`arrestsBoroughWhere`) and a
     type (`BoroughCode`) — expected and intended; `boroughs.ts`'s own header states every caller
     gets both literal tables from that one module.
  6. The literal substring `arrest_boro` must never appear inline in `arrests.ts`'s own source —
     the field name is composed only by calling the imported `arrestsBoroughWhere()`. This keeps
     the Bronx/Brooklyn mapping singular in `boroughs.ts` (Constraint 2 restated) and keeps
     `arrests.test.ts`'s existing grep for that literal mechanically meaningful (see Edge Case 8
     for why its *title* still needs Cypress's attention even though the assertion itself holds).
  7. `src/app/page.tsx`, `src/app/api/arrests/route.ts`, and every component remain out of this
     phase's budget and must not be edited — no caller passes a borough yet (Phase 4's job).
  8. No figure, count, or percentage literal anywhere in this file (Rule 1 / NFR-4) — unchanged
     from today, this phase adds none.
  9. This phase does not touch `src/lib/socrata.ts`, `src/lib/boroughs.ts`, or any of the four
     crash wrappers (Phases 1–2, closed) — zero coupling maintained, severability (PRD §5.2)
     preserved exactly as FR-5's original SPEC intended.
  10. Constraint of Three: this SPEC cites three background resources — Phase 2's `SPEC.md`
      entry (the pattern precedent), `src/lib/boroughs.ts`, and `src/lib/arrests.ts` itself (read
      directly, current state) — no more.

- **Edge Cases**:
  1. `borough` omitted on `fetchArrestsPerYear()` → output byte-identical to today, and
     `ARRESTS_SOQL` (still a zero-arg call) stays byte-identical (Constraint 2's proof
     obligation).
  2. Composition order fixed: window AND (the five-category offense OR-group) AND borough —
     borough is always appended *after* the existing parenthesized offense clause, never
     interleaved inside it, never placed before it. Mirrors Phase 1/2's pinned order exactly.
  3. A borough-filtered query returning zero rows → the existing FR-10 `empty` branch, unchanged;
     no new branch for "filtered and empty" vs. "unfiltered and empty."
  4. **No positional-argument trap analogous to Phase 2's Edge Case 4 exists here.** `arrests.ts`
     has exactly one variable clause — the offense filter is a fixed constant, not a parameter —
     so `fetchArrestsPerYear` widens directly from zero parameters to one optional parameter.
     There is no `extraWhere`-shaped third slot for `borough` to be silently shifted into. Named
     explicitly so Cypress does not write a test for a trap this file's actual shape cannot
     produce.
  5. Calling `fetchArrestsPerYear(code)` with a valid `BoroughCode` before Phase 4 exists → fully
     functional and testable in isolation; simply unreachable from the rendered page until
     Phase 4 lands (mirrors Phase 2 Edge Case 5).
  6. The `$limit` default (trap 5) stays untouched — still 8-row server-side aggregation, no
     pagination introduced by adding a filter conjunct.
  7. Trap 4 survives composition unchanged: both `ofns_desc` spellings (`INTOXICATED & IMPAIRED
     DRIVING`, `INTOXICATED/IMPAIRED DRIVING`) must still independently appear, verbatim, in both
     the zero-borough `ARRESTS_SOQL` (existing test, must keep passing unmodified) and in a
     borough-filtered `$where` (new assertion this phase's test file adds).
  8. **Two pre-existing `arrests.test.ts` assertions describe a state this phase legitimately
     changes and need Cypress's correction, not a silent leave-as-is** — the same "exactly one of
     X" staleness shape already caught four times this session (`MetricSection.test.tsx`,
     `YearlyLineChart.test.tsx` twice, `repairedCollisions.test.ts`):
     - The test titled *"FR-6 out-of-scope: arrest_boro never appears in ARRESTS_SOQL — FR-6 is
       explicitly not part of this task"* (currently `expect(ARRESTS_SOQL).not.toContain
       ("arrest_boro")`). The assertion still holds by construction — `ARRESTS_SOQL` is still the
       frozen zero-borough default — but the title is no longer accurate now that FR-6 is being
       built in this very file. Retitle to state the real invariant (the frozen zero-arg constant
       never carries a borough filter), not "FR-6 is out of scope."
     - The combined demographic-exclusion test (`expect(source).not.toMatch(/arrest_boro/)` bundled
       with `perp_race`/`perp_sex`/`age_group`). The three demographic fields remain permanently,
       absolutely excluded (PRD §6) and that part must not weaken. `arrest_boro` should be split
       into its own assertion, re-scoped to what's actually true and still worth guarding per
       Constraint 6: the literal substring never appears inline in `arrests.ts`'s own source
       (composition happens only via the imported `arrestsBoroughWhere`) — a real invariant, just
       no longer a "permanent exclusion" claim.

- **Files** (max 5 — one used, matching the phase table exactly):
  1. **`src/lib/arrests.ts`** — *edited.* Add the `./boroughs` import; widen `fetchArrestsPerYear`
     to accept `borough?: BoroughCode`; add the internal where/soql/url composition. Estimated
     ~15–20 lines — larger than Phase 2's ~4 lines per wrapper because this file has no shared
     transport to forward into and must write its own composition function (Intellectual Control
     3).

  **Cypress's budget for this phase (1 file, dispatched first, matching the phase table's "1
  test"):** `src/lib/arrests.test.ts` — edited additive-only for the new borough-path assertions,
  plus the two corrections named in Edge Case 8 (retitle/re-scope, not a weakening — every
  existing assertion not touched by Edge Case 8 must still pass unmodified, the byte-identity
  proof for this phase). New assertions: (a) a borough-supplied call produces the exact composed
  `$where` from this SPEC's Query section, for at least one borough code, inspected via the
  stubbed `fetch` call's own arguments (mirroring how the file's existing FR-8 tests already work
  — no `buildArrestsUrl` export assumed); (b) the zero-borough call's `soql`/URL output is
  unchanged (explicit regression pin); (c) both `ofns_desc` spellings still appear in a
  borough-filtered `$where`, not just the unfiltered one.

  **Not in this budget, and not owed by this phase:** `src/lib/boroughs.ts` (Phase 1, closed,
  `arrestsBoroughWhere` already fully tested in `boroughs.test.ts`), `src/lib/socrata.ts` and the
  four crash wrappers (Phases 1–2, closed), `page.tsx` / the picker / `api/arrests/route.ts`
  (Phase 4), any FR-7 file (Phases 5–6). **If Redwood believes a second file is required, halt
  and request a revision naming it.**

- **Tipping Point**: revisit if a second internal caller inside `arrests.ts` ever needs to vary
  `$group`/`$order`, or if the borough-composition logic written here needs to be duplicated a
  third time for `arrestsSocrata.ts` (Phase 5a's planned coverage-query extraction) — at that
  point extract just the borough-composition helper (not the whole fetch/validate scaffold, which
  Phase 5a's own Tipping Point already earned its own copy of per the FR-6/FR-7 replanning note)
  into a tiny shared utility both `8h9b-rp9u` files import. Not earned yet: Phase 5a's scope
  (coverage denominator) has not been shown to need a borough filter, so this is a named
  possibility, not a pre-built abstraction. `arrests.ts`'s original Tipping Point (a second
  `8h9b-rp9u` caller needing the whole transport) is unaffected by this phase and stays tracked
  where FR-5's SPEC left it.
```

```
[FORCES]
1. Byte-identical unfiltered output (`ARRESTS_SOQL`, zero-arg `fetchArrestsPerYear()`) > any
   cleanup of `arrests.ts` while it is open — a frozen FR-8 contract is already on the page.
2. Compose via `boroughs.ts`, never re-derive the mapping > convenience — `arrests.ts` gets no
   local copy of the Bronx/Brooklyn mapping or the trust-boundary parsing (trap 2).
3. Mirror Phase 1/2's composition shape (fixed base AND-ed with one optional conjunct) > inventing
   a new style for the arrests side, so the borough capability reads the same way across all five
   metrics even though `arrests.ts` stays structurally self-contained (severability, PRD §5.2).
4. Simplicity > Pattern purity.
```

---

## Remaining phases (sketches only — full SPECs come from Cedar as each lands)

| # | Closes | Impl | Test | Agent |
|---|---|---|---|---|
| 1 | ~~FR-6 vocabulary + transport~~ CLOSED | 2 | 2 | Redwood |
| 2 | ~~FR-6 crash-metric propagation~~ CLOSED | 4 | 4 | Redwood |
| **3** | **FR-6 arrests propagation (this phase)** | 1 | 1 | Redwood |
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
