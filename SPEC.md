# Active SPEC

**Phase 1 of 6** — FR-6/FR-7. Cedar, 2026-08-07. Awaiting HITL approval before Cypress dispatch.

Preceded by a `/grill-me` round that settled four decisions (URL search param wiring; all five
series in scope; one page-level FR-7 banner; FR-7 figures computed live). Full phase plan and the
reasoning behind the cuts are in the session transcript and summarised in `SESSION_STATE.md`.

## Verification probe — RUN 2026-08-07, PASS

Cedar made Phase 1 non-closable until the borough spellings were confirmed by live query rather
than typed from recollection. Result:

- **Five literals confirmed exactly as pinned**, uppercase: `BRONX`, `BROOKLYN`, `MANHATTAN`,
  `QUEENS`, `STATEN ISLAND`.
- **Unpopulated rows arrive as an absent `borough` key** — not `null`, not `""`. The probe's sixth
  bucket was `{"rows": "343448"}` with no `borough` field. This is trap 1 (Socrata omits keys)
  appearing in a new place, and it is why Q7 enumerates the five values positively instead of
  using `IS NOT NULL`.

Two Phase 5 risks were also retired early, since both were cheap and read-only:

- **`borough IN (...)` works** against `h9gi-nx95` — returns 8 rows. Cedar's pre-authorised
  five-way `OR` fallback is **not needed**.
- **The derived coverage rates reproduce the pins**: 2018 → 64.4%, 2025 → 80.1%. Window
  unpopulated share derives to **32.9%** (FR-7's PRD text says "~30%"; the banner must show the
  derived figure, not the prose approximation). 2019 → 64.8% independently reproduces the
  `mvcc-data` skill's Staten Island natural-experiment note.

## HITL decisions — approved 2026-08-07

1. **Invalid `?borough=` → citywide figures plus a visible, named rejection.** Cedar's §2b
   adopted as written: correct unfiltered page, a `role="status"` notice naming the rejected
   value and the five valid codes, picker showing "All boroughs", no FR-7 banner. Not FR-10's
   error state (no figure is absent) and never a silent fallback (the URL and the page must not
   disagree silently).
2. **`arrest_boro` coverage WILL be measured — Cedar's §2c recommendation was overridden.** The
   banner is to speak to all five filtered series, not four. Consequences Cedar must now re-plan,
   and which are *not* covered by the sketches below: this adds a second `8h9b-rp9u` caller, which
   **trips `arrests.ts`'s recorded Tipping Point**, and it widens FR-7 past its literal PRD text
   (line 203 names only the collisions field). **Phases 1–4 are unaffected** — the decision lands
   wholly in Phases 5–6, and `BOROUGH_CODES` + `BOROUGHS[code].arrestsValue` already expose
   everything an arrests-coverage query needs, so no Phase 1 contract changes.
3. **The absolute-assertion ADR is deferred until after FR-6/FR-7 lands** — not skipped. Cedar was
   explicit it is not owed by this work.
4. **Phase 1 approved for dispatch.** Cypress writes failing tests first; Redwood implements only
   against red.

---

```markdown
[SPEC]
- **Objective**: Introduce the pinned borough vocabulary as a pure, exhaustively tested module,
  and widen `socrata.ts`'s yearly-metric transport to accept an optional, type-closed borough
  code. No caller passes one yet; the rendered page must be byte-for-byte unchanged.

- **Requirement**: FR-6 [P1] (the pinned `B`→BRONX / `K`→BROOKLYN / `M`→MANHATTAN /
  `Q`→QUEENS / `S`→STATEN ISLAND mapping, and the ability to express a borough-filtered
  query at all). Also serves NFR-2 (untrusted input never reaches a SoQL string) and
  NFR-4 (no figure inferred).

- **Inputs/Outputs**:

  `src/lib/boroughs.ts` — new, pure, zero I/O, zero imports beyond types. Exports:

  ```ts
  export const BOROUGH_CODES = ["B", "K", "M", "Q", "S"] as const;
  export type BoroughCode = (typeof BOROUGH_CODES)[number];

  export type BoroughEntry = {
    label: string;        // display name, e.g. "Brooklyn"
    crashesValue: string; // the h9gi-nx95 `borough` literal, e.g. "BROOKLYN"
    arrestsValue: string; // the 8h9b-rp9u `arrest_boro` literal, e.g. "K"
  };
  export const BOROUGHS: Record<BoroughCode, BoroughEntry>;

  export type BoroughParam =
    | { status: "none" }
    | { status: "ok"; code: BoroughCode }
    | { status: "invalid"; received: string };

  export function parseBoroughParam(
    raw: string | string[] | undefined,
  ): BoroughParam;

  export function crashesBoroughWhere(code: BoroughCode): string; // borough = 'BROOKLYN'
  export function arrestsBoroughWhere(code: BoroughCode): string; // arrest_boro = 'K'
  ```

  `BOROUGHS` is pinned exactly as (label / crashesValue / arrestsValue):
  `B` → Bronx / BRONX / B; `K` → Brooklyn / BROOKLYN / K; `M` → Manhattan / MANHATTAN / M;
  `Q` → Queens / QUEENS / Q; `S` → Staten Island / STATEN ISLAND / S.

  `arrestsValue` is stored explicitly and never derived from the key. That it equals the key
  is a coincidence of this dataset's encoding, not a rule; writing `arrest_boro = '${code}'`
  would silently break under any future re-coding. Storing it also puts `K`→BROOKLYN and
  `K`→K on adjacent lines, which is exactly the documentation trap 2 needs.

  `parseBoroughParam` behaviour, exhaustive:

  | Input | Result |
  |---|---|
  | `undefined` | `{ status: "none" }` |
  | `""` / whitespace only | `{ status: "none" }` |
  | `"K"`, `"k"`, `" k "` | `{ status: "ok", code: "K" }` |
  | `"BROOKLYN"`, `"Kings"`, `"zz"`, `"1"` | `{ status: "invalid", received: <trimmed, ≤24 chars> }` |
  | `["K","M"]` (repeated param) | `{ status: "invalid", received: "K, M" }` |
  | `["K"]` (single-element array) | `{ status: "invalid", received: "K" }` — arrays are ambiguous by construction |

  `src/lib/socrata.ts` — edited. `whereClause`, `buildYearlySoql`, `buildYearlyUrl`, and
  `fetchYearlyMetric` each gain a **fourth** optional parameter `borough?: BoroughCode`,
  after `extraWhere`. Nothing else in the file changes.

- **Query**: this task sends no new request; it changes how one `$where` string is assembled.
  Pinned composition order — **window AND extraWhere AND borough**, single spaces, no added
  parentheses around the window or the borough fragment (`extraWhere` arrives pre-parenthesised
  by its caller, as `repairedCollisions.ts` already does):

  ```
  crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
    [AND <extraWhere>] [AND borough = '<crashesValue>']
  ```

  Byte-identity requirement: with `borough` absent or `undefined`, every one of
  `DEATHS_SOQL` / `INJURIES_SOQL` / `COLLISIONS_SOQL` / `REPAIRED_COLLISIONS_SOQL` must be
  **string-equal to its current value**. These are frozen contracts already displayed under FR-8.

  **Verification probe — this phase does not close until it has been run** (Bash, once,
  by the orchestrator or Redwood; it is a read-only enumeration, not a figure):

  ```
  https://data.cityofnewyork.us/resource/h9gi-nx95.json
    ?$select=borough, count(collision_id) AS rows
    &$where=crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
    &$group=borough
    &$order=borough
  ```

  It must confirm (a) the five literal spellings above, exactly, uppercase; and (b) how
  unpopulated rows are represented — an absent bucket, a `null`, or an empty string. Record
  (b) in `SESSION_STATE.md`: Phase 5's numerator depends on it. **Any spelling mismatch is a
  halt and a request for a revised SPEC, not a local repair** — the five literals in `BOROUGHS`
  are dataset facts confirmed by query, and must never be typed from anyone's recollection,
  mine included.

  > **Orchestrator note, 2026-08-07:** this probe has been run. Both (a) and (b) are answered
  > above under "Verification probe"; the gate is satisfied and no spelling mismatch exists.

- **Design Pattern**: none — simple case. Full reasoning in §2a of the plan; in short, FR-6
  adds one more AND-ed conjunct to the axis `socrata.ts` already parameterises, the composition
  operator is always `AND`, and the fragment vocabulary is closed. A Strategy would encapsulate
  a single `&&`. The genuine new force is a trust boundary, answered by a closed union type.

- **Intellectual Control**:
  1. `borough` is typed `BoroughCode`, never `string`. A value from a URL cannot reach the
     `$where` clause without passing `parseBoroughParam` first, and the compiler enforces it —
     SoQL injection is unrepresentable rather than merely guarded against.
  2. The mapping lives in one pure module with no I/O, so trap 2 (`B` is the Bronx) is settled
     in a file that can be exhaustively tested in milliseconds with zero mocking — and is
     asserted once, not re-derived at five call sites.
  3. Two datasets, two literal vocabularies, one code vocabulary. `boroughs.ts` is the only
     place that knows `K` means `'BROOKLYN'` here and `'K'` there.
  4. It won't break at scale because it does not scale: the set is five, fixed by the geography
     of New York City.

- **Constraints**:
  1. No new dependencies (Rule 9). No new npm package is needed or authorised for this phase.
  2. `src/lib/boroughs.ts` must not import `socrata.ts` (one-way dependency: `socrata.ts` →
     `boroughs.ts`), must perform no I/O, and must not read `process.env` — `arrests.test.ts`'s
     "no lib file other than socrata.ts and arrests.ts reads process.env" assertion stays true
     and must not be touched.
  3. No behaviour change to any rendered output. `src/app/page.tsx`, the five `src/app/api/*`
     Route Handlers, and every component are **out of this phase's budget and must not be
     edited**; all existing callers keep working via the optional parameter.
  4. No figure, count, or percentage anywhere in either file (Rule 1 / NFR-4).
  5. `validateYearCoverage`'s 8-year requirement is **not** relaxed for filtered queries, now
     or later. A borough-year that genuinely returns no rows is an FR-11 error state, never a
     gap and never a zero.

- **Edge Cases**:
  1. `borough` present, `extraWhere` absent → window AND borough. No stray `AND`, no double space.
  2. Both present → window AND extraWhere AND borough, in that order.
  3. Both absent → the current string, byte-identical.
  4. `parseBoroughParam` given a `string[]` → invalid, never first-wins.
  5. `received` on the invalid branch is trimmed and truncated to 24 characters. It is a display
     string only; it must never be interpolated into SoQL, a URL, or a fetch. (React escapes it
     on render, so this is a layout guard, not an XSS one.)
  6. A filtered query returning zero rows → the existing FR-10 `empty` branch, unchanged.
  7. The `$limit` default (trap 5) is untouched: these queries stay server-aggregated to 8 rows.

- **Files** (max 5 — two used):
  1. **`src/lib/boroughs.ts`** — *new.* The five exports above. Expected ~50 lines.
  2. **`src/lib/socrata.ts`** — *edited.* One import, one widened private helper, three widened
     signatures. No other change; the token read, fetch, Zod validation, and coverage check are
     untouched.

  **Cypress's budget for this phase (2 files, dispatched first):**
  `src/lib/boroughs.test.ts` (new) and `src/lib/socrata.test.ts` (edited — additive only; every
  existing assertion must still pass unmodified, and that is itself the byte-identity proof).

  **Not in this budget, and not owed by this phase:** the four crash wrappers (Phase 2),
  `arrests.ts` and its two stale assertions (Phase 3), `page.tsx` / the picker (Phase 4), FR-7
  in any form (Phases 5–6), the `result.soql` swap (Phase 4), the five Route Handlers (no phase).
  **If Redwood believes a third file is required, halt and request a revision naming it.**

- **Tipping Point**: `socrata.ts`'s new one, replacing the retired FR-12 note — revisit when
  **either** a third orthogonal filter axis appears, **or** a caller needs to vary `$group`,
  `$order`, or the dataset ID. Neither is expressible by AND-ing a conjunct, and either earns a
  query builder. `boroughs.ts`'s own: a sixth entry, or a third dataset needing a third literal
  column, at which point the flat record should become a per-dataset lookup.
```

```
[FORCES]
1. Type-closed vocabulary > string parameters — the borough value's origin is a URL search
   param, and the only durable defence against SoQL injection is making the unsafe state
   unrepresentable rather than validated-at-each-call-site.
2. Byte-identical unfiltered output > any cleanup of socrata.ts while it is open — four
   frozen FR-8 contracts are already on the page; a "tidier" clause builder that shifts one
   space is a regression.
3. One pinned mapping table > five correct call sites — trap 2 (`B` is the Bronx) has to be
   wrong in only one place to be wrong everywhere, so it gets exactly one place.
4. Simplicity > Pattern purity.
```

---

## Remaining phases (sketches only — full SPECs come from Cedar as each lands)

| # | Closes | Impl | Test | Agent |
|---|---|---|---|---|
| 1 | FR-6 vocabulary + transport | 2 | 2 | Redwood |
| 2 | FR-6 crash-metric propagation | 4 | 4 | Redwood |
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
