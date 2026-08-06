# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why this task, not something else (Cedar's reasoning, recorded)

The open P0 backlog is FR-3 (collisions, dashed+labelled), FR-4 (% change, blocked on "each of
the three metrics" — PRD line 200), FR-9 (caveats, PRD line 205), FR-12 (casualty-filtered
repair, PRD line 208). FR-3's own text (PRD line 199) bundles two things a single SPEC can't
carry: a data-fetching task (the collision count itself) and a chart-redesign task (the
dashed-stroke-plus-inline-label treatment, which only means something once a chart exists). This
mirrors exactly the split CLAUDE.md names — a Redwood-only data slice now, the Magnolia
chart-redesign SPEC queued next.

Last time, FR-2 was chosen over FR-3 because Task 1's own Tipping Point had *pre-committed* to
the `socrata.ts` extraction as the smaller, lower-risk next step, and because bundling FR-3 then
would have forced the query-layer parameterization, the chart's Tipping-Point redesign, and the
dashed-stroke decision into one shot. That extraction is done. There is no equivalent smaller
alternative left on the backlog — FR-4 is explicitly blocked on this task, FR-9 is prose/caveats
work with no query to pin, and FR-12 needs this task's raw collisions series to compare against.
Re-evaluating fresh: the data half of FR-3 is now the correct next task on its own merits, not by
elimination. It is a near-exact mirror of the FR-2 pattern — a third one-line caller module over
`socrata.ts`'s already-generic transport, which FR-2's own Tipping Point named as the
*unremarkable* case ("a third yearly-aggregate metric with the same shape arrives... absorbed as
a third one-line caller module; no change to `fetchYearlyMetric` itself is expected"). It carries
none of the risk the socrata.ts extraction carried, and it unblocks FR-4 and FR-12 for the
backlog after next.

The chart-redesign half is deliberately **not** in this task. It is queued as the next SPEC,
which will need its own Cedar pass because it inherits `DeathsChart.tsx`'s Tipping Point on three
counts at once (legend, tooltip/crosshair, dashed stroke) — a genuinely different kind of
decision than this one.

---

```markdown
[SPEC] — Collisions per year: the raw reporting-affected series, data half only (FR-3)

- **Objective**: Add total recorded collisions per year (2018–2025) as a third,
  independently-fetched live SoQL aggregate, rendered on `/` as its own accessible table + FR-8
  query disclosure — mirroring FR-2's exact shape for a new metric, now trivially since
  `src/lib/socrata.ts`'s generic transport already exists. Because FR-3's literal text ties this
  specific series to a dashed-stroke *chart* treatment that cannot exist without a chart, this
  task also adds a plain, unstyled inline sentence next to the collisions table stating the
  series is reporting-affected — the one part of NFR-5's "in every rendering" clause that
  *can* be satisfied by a table (a label), as opposed to the part that structurally cannot (a
  stroke). No chart change: `DeathsChart.tsx`, its stylesheet, and its test are untouched.
  Redwood only — no Magnolia work in this task.

- **Requirement**: **FR-3 [P0]** (PRD line 199) — **partially satisfied by this task.** FR-3
  reads: "the system shall display recorded collision counts per year over the same window,
  visually distinguished as the reporting-affected series by a dashed stroke **and** an explicit
  inline label... never by color alone." This task satisfies the "display recorded collision
  counts" clause and the "explicit inline label" clause (via the table's adjacent note, argued
  below). It does **not** satisfy the "dashed stroke" clause — a table has no stroke to dash, and
  that requirement can only be met once the series is charted. FR-3 stays **open** until the
  follow-on Magnolia SPEC lands. Also satisfies **FR-8 [P0]** (display the exact SoQL, extended
  to a third, independently-pinned query), **FR-10 [P0]** (defined empty/error state, now
  required for a third metric independently), **FR-11 [P0]** (absent/null core aggregate →
  error, never a silent zero — trap 1 applies to the collision count exactly as it does to deaths
  and injuries), **NFR-1** (ISR caching inherited via the existing shared transport;
  strengthened by parallel fetching), **NFR-2** (token read stays confined to `socrata.ts`,
  which this task does not touch), **NFR-3** (a third screen-reader-accessible table), **NFR-4**
  (every figure from SoQL aggregation), and the **label** half of **NFR-5** for this rendering
  (the stroke half is inapplicable to a table and is not claimed here).
  Explicitly **not** in scope: the dashed-stroke chart treatment itself (next SPEC, Magnolia);
  **FR-4** (% change — still blocked: its text needs "each of the three metrics" *displayed*,
  which this task achieves, but FR-4 also needs a UI landing spot for the number, which belongs
  with the chart SPEC that finishes FR-3, not this one); **FR-9** (caveats section — separate);
  **FR-12** (casualty-filtered repair — now *unblocked* by this task's existence, since it needs
  a raw collisions series to compare against, but changes the `$where` shape and is its own SPEC
  with its own pinned query); **FR-13**; the severable FR-5–7 arrest group.

- **Inputs/Outputs**:
  - *Input*: a clean tree with FR-1/FR-2 merged; `SOCRATA_APP_TOKEN` in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must satisfy
    `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/lib/collisions.ts`* (new). FR-2's `injuries.ts` twin, unchanged pattern:
    ```ts
    import {
      buildYearlySoql,
      buildYearlyUrl,
      fetchYearlyMetric,
      type YearlyMetricResult,
      type YearlyMetricRow,
    } from "./socrata";

    const AGGREGATE_EXPR = "count(collision_id)";
    const FIELD_ALIAS = "collisions" as const;

    export const COLLISIONS_SOQL = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);
    export function buildCollisionsUrl(): URL {
      return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS);
    }
    export type CollisionsRow = YearlyMetricRow<"collisions">;
    export type CollisionsResult = YearlyMetricResult<"collisions">;
    export function fetchCollisionsPerYear(): Promise<CollisionsResult> {
      return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS);
    }
    ```
    `socrata.ts` is **read-only to this task** — no edit, no widening of `fetchYearlyMetric`'s
    parameter surface. This is the exact "third yearly-aggregate metric with the same shape"
    case FR-2's Tipping Point pre-named as absorbing with zero changes to the transport.
  - *Output 2 — `src/app/api/collisions/route.ts`* (new). `export async function GET()`,
    identical union-to-HTTP mapping as `api/deaths/route.ts` and `api/injuries/route.ts`:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

  - *Output 3 — `src/app/page.tsx`* (edited). Fetch all three metrics **in parallel**:
    `const [result, injuriesResult, collisionsResult] = await Promise.all([fetchDeathsPerYear(), fetchInjuriesPerYear(), fetchCollisionsPerYear()])`
    — not sequential `await`s (NFR-1). Below the existing injuries block, add an independent
    collisions block with the same three-branch shape:
    - `ok` → `<table><caption>NYC recorded collisions per year, 2018–2025</caption>` with
      `<th scope="col">Year</th><th scope="col">Collisions</th>`, then **immediately after the
      table, before the disclosure**, a plain `<p>` (no `className`, no styling — page.tsx stays
      zero-CSS per Task 2's standing constraint) with this verbatim text: *"This series is
      affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are
      recorded; it is not evidence of a comparable drop in real collisions."* This is the
      table-appropriate half of FR-3's inline-label requirement — see Intellectual Control for
      why this text and not the PRD's dashed-stroke example phrase.
    - `empty`/`error` → the same visible, non-decorative `role="status"`/`role="alert"` message
      pattern the other two metrics use, verbatim copy.
    - Disclosure: `<details><summary>SoQL query — collisions</summary><pre><code>{COLLISIONS_SOQL}</code></pre></details>`,
      unconditional (rendered regardless of status, matching FR-8's existing deaths/injuries
      pattern — a failed fetch still shows what was attempted).
    **All three metrics' branches are fully independent** — one failing must never suppress or
    alter another's render (established in FR-2; this task extends the same guarantee to a third
    metric). No change to the intro paragraph — its existing text already frames collisions as
    "the most discretionary figure (an officer decides whether to file)," which stays accurate
    and needs no rewording.

  - *Acceptance, by command, `node -v` recorded beside results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` and `npm ls recharts` — both unchanged (no install expected; if one becomes
       necessary, halt and request a revised SPEC per Rule 9).
    3. `npm run dev`; `curl -s localhost:3000/api/deaths` and `/api/injuries` unchanged, `status:
       "ok"`, 8 rows each; `curl -s localhost:3000/api/collisions` → `status: "ok"`, 8 rows.
    4. `/` renders the deaths chart/table, the injuries table, and the new collisions table plus
       its inline note, plus all three disclosures.
    5. **`git diff --stat` shows zero changes to `src/lib/deaths.test.ts`,
       `src/lib/injuries.test.ts`, `src/app/api/deaths/route.test.ts`, and
       `src/app/api/injuries/route.test.ts`.** If satisfying acceptance required editing any of
       these, report exactly which assertion broke and why — do not silently edit Cypress's
       files.
    6. The live `/api/collisions` response body pasted verbatim into the `[COMPLETION-REPORT]`.
       Cypress diffs it against the mvcc-data skill's pinned Collisions column and re-confirms
       deaths/injuries are unchanged. Redwood transports; it does not judge correctness (NFR-4).
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` — the token name still appears in
       exactly **one** source file (`socrata.ts`) plus `.env.example`, unchanged surface, value
       in none.
    8. `npm audit`; report high/critical (no install expected — hygiene check, not a response to
       new risk).
    9. **Report the final line count of `src/app/page.tsx`** beside the acceptance results and
       compare it explicitly to the ~150-line Tipping Point FR-2's SPEC named. The file was 112
       lines before this task; this addition is expected to land it near or over that line. This
       is not a blocking gate — report the number and flag it; do not silently decompose the file
       to dodge the number, and do not silently ignore it either.

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`. Same window,
  same `$where`/`$group`/`$order` as deaths and injuries — only the `$select` aggregate differs.

  **Collisions (new, pinned by this SPEC):**
  ```
  $select = date_extract_y(crash_date) AS year, count(collision_id) AS collisions
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  **Deaths and injuries clauses are unchanged — restated nowhere in code, verify against the
  live modules, do not re-derive.**

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when non-empty.

  **Expected response shape** — a JSON array of exactly 8 objects, ascending by year, every
  numeric field a string:
  ```json
  [{ "year": "2018", "collisions": "231564" }, ... 8 entries through "2025" ]
  ```

  **Pinned figures (mvcc-data skill, verified 2026-08-03)** — for Cypress's diff, never for a
  literal in `src/**`: Collisions 2018→2025: 231564, 211486, 112918, 110558, 103887, 96607,
  91316, 85546. Several of these are already in `guard-data-integrity.sh`'s 26 pinned-literal
  list (per Task 2's Constraint 3, the six-digit collisions/injuries/casualty-filtered figures
  are covered; the two 5-digit later years are not — do not treat partial mechanical coverage as
  license to be careless with the rest).

  **`count(collision_id)` chosen over `count(*)`:** `collision_id` is a verified, non-null
  primary-key field (mvcc-data skill), so the two are numerically equivalent here, but naming the
  counted field keeps the FR-8 disclosure self-documenting rather than relying on an implicit
  `*`. **If Socrata rejects this query as constructed, halt and request a revised SPEC — do not
  repair it in place.**

- **Design Pattern**: **none — simple case.** `composition-patterns` was consulted: its rule set
  (boolean-prop avoidance, compound components, explicit variants) targets client component
  props and none apply here — no new component, no boolean prop, no client boundary crossed.
  `collisions.ts` is the third one-line caller over `fetchYearlyMetric`, which FR-2's own Tipping
  Point named as the unremarkable case requiring zero change to the transport. The one duplication
  this task does introduce — a third near-identical table+disclosure JSX block in `page.tsx` — is
  not a composition-pattern violation (it's markup repetition, not prop proliferation) and is
  addressed as a named, deferred item below rather than an in-task extraction.

- **UI Scope**: N/A — no chart, no CSS, no client component. `page.tsx`'s new markup is plain
  semantic HTML inheriting `globals.css` only, exactly as FR-1/FR-2 specified.

- **Intellectual Control**:
  - *Why this genuinely only closes half of FR-3, and why that's the honest scoping rather than
    a shortcut.* FR-3's acceptance criterion is stroke-and-label, conjunctively. A table renders
    neither a stroke by definition, so no amount of care in this task can make FR-3 fully PASS —
    claiming otherwise would be the kind of drift ADR 0001 was written about. Recording FR-3 as
    "partially satisfied, stroke clause pending" is more honest than either closing it early or
    leaving it wholly unaddressed.
  - *Why the inline note uses different wording from FR-3's example phrase.* FR-3's PRD text
    gives "affected by reporting decline — see caveats" as an *example* (`e.g.,`), not verbatim
    required copy — and "see caveats" would point at FR-9's caveats section, which does not exist
    yet. A dangling reference to a nonexistent section is worse than a short self-contained
    sentence. The chosen text states the documented cause directly (mvcc-data skill: "this is
    documented policy, not inference — state it as cause"), which is stronger and more honest
    than a forward reference. When FR-9 lands, that SPEC may replace "This series is affected
    by..." with a cross-reference; that is FR-9's decision to make, not pre-empted here.
  - *Why NFR-5's "in every rendering" clause is honestly split.* NFR-5 says the collision series
    "shall carry FR-3's dashed-stroke-plus-label treatment in every rendering." A table is a
    rendering. The label component of that treatment is renderable in a table (it's just text);
    the stroke component structurally is not. Adding the label now and deferring the stroke to
    the chart SPEC is the closest honest approximation of "every rendering" available before a
    chart exists — omitting the label entirely until the chart lands would under-satisfy NFR-5
    for a rendering surface (the table) that exists today and is live on `/` today.
  - *Why the shared table+disclosure component is **not** extracted in this task, despite this
    being the third near-identical block.* FR-2's own Tipping Point named the trigger precisely:
    "`page.tsx` exceeds ~150 lines" or "holds more than one series plus FR-9's caveats section" —
    not "a third block appears." The caveats-section half of that compound trigger cannot fire
    (FR-9 doesn't exist), and the line-count half is a genuine "report and watch" item this SPEC
    surfaces (acceptance clause 9), not a "decompose now" mandate. Extracting a shared component
    here would restructure two already-tested, working blocks (deaths, injuries) under cover of a
    data-addition task — a bigger, riskier diff than this task's stated objective, and exactly
    the kind of unrequested scope a `[COMPLETION-REPORT]`'s Jevons's-Paradox check exists to
    catch. If the reported line count lands at or over ~150, that is the trigger for a dedicated
    follow-up (Banyan mechanical refactor, or a small Cedar SPEC) — named here, not executed here.
  - *Why FR-4 stays blocked even though "each of the three metrics" now technically exist.* FR-4
    needs a UI landing spot for a computed percentage — some element on the page that displays
    it. That's a rendering decision entangled with where the chart's legend/labels live, which is
    exactly what the next Magnolia SPEC is about to redesign. Building FR-4's display now risks
    building it twice: once against today's page shape, once against the post-chart-redesign
    shape.
  - *Why this will not break at scale.* `collisions.ts` knows nothing about deaths or injuries by
    name; `socrata.ts` remains untouched and un-widened. Adding a fourth yearly-aggregate metric
    with a matching shape costs one more five-line file, zero changes to the transport. The
    moment a metric needs a different `$where` or group key (FR-12, FR-6), the inherited Tipping
    Point says stop parameterizing and encapsulate instead — unchanged and un-triggered by this
    task.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` stays read **only**
     inside `src/lib/socrata.ts`. `collisions.ts` must not read it directly, never
     `NEXT_PUBLIC_`, never in a `'use client'` file (none of the touched/new files gain that
     directive).
  2. **No figure may be authored.** Several collisions values are already caught by
     `guard-data-integrity.sh`'s pinned list; rely on that but not *only* on it — no collisions,
     injuries, or deaths figure may appear as a literal anywhere in `src/**` outside test files,
     fallback, placeholder, comment, default, or "temporary" mock.
  3. **`COLLISIONS_SOQL` is pinned by this SPEC and frozen from this point forward** (Rule 4); a
     future SPEC revises it, not a local repair. `DEATHS_SOQL` and `INJURIES_SOQL` values are
     unchanged and unread by this task except for verification.
  4. **No zero-coercion, anywhere, for any of the three metrics** (FR-11, trap 1). An absent key,
     `null`, or a non-matching string for `collisions` in any year of the window produces
     `status: "error"`, `kind: "contract"` for *that metric only*.
  5. **No new dependency.** Zero install expected. If one genuinely becomes necessary, halt and
     request a revised SPEC (Rule 9).
  6. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are untouched.** No
     collisions series on the chart in this task — that is the deferred Magnolia follow-on.
  7. **No CSS authored or edited.** `globals.css`, `page.module.css` untouched; no `.module.css`
     created. The inline note paragraph carries no `className`.
  8. **Files not to touch**: `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
     `src/lib/socrata.ts`, `src/lib/deaths.ts`, `src/lib/injuries.ts`,
     `src/app/api/deaths/route.ts`, `src/app/api/injuries/route.ts`, `vitest.config.mts`,
     `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`,
     `src/app/layout.tsx`, `globals.css`, `page.module.css`, `.claude/**`, `CLAUDE.md`,
     `README.md`, `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  9. **`src/app/page.module.css` remains orphaned** — still owed to the next layout SPEC.
  10. **Caching (NFR-1)**: inherited `next: { revalidate: 86400 }` from `socrata.ts`, no second
      cache directive added.
  11. **Bound every request**: `AbortSignal.timeout(10_000)`, inherited from `socrata.ts`, no
      change.
  12. **Existing deaths and injuries tests survive unmodified** (Acceptance clause 5). If they
      don't, that's a real FAIL for Cypress's audit, not something to route around by editing
      them.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **Network failure/DNS/timeout, for collisions independently** → `error`/`upstream`; the
     other two metrics render normally if they succeeded.
  2. **Non-2xx (429, 5xx) from collisions** → `error`/`upstream` naming the status code. No retry
     loop (cap: one attempt, then fail loud).
  3. **Non-JSON response from collisions** → `error`/`upstream`, guarded by content-type check.
  4. **Zero rows for collisions** → `status: "empty"`, HTTP 200, independent of the other two
     metrics.
  5. **A year 2018–2025 missing from the collisions response** → `error`/`contract` naming the
     missing year. **Never zero-fill.**
  6. **A field present but `null`, empty string, non-numeric, or a JSON number instead of a
     string** → `error`/`contract` naming the year and the offending value's type.
  7. **More than 8 rows, a duplicate year, or an out-of-window year** → `error`/`contract`.
  8. **`SOCRATA_APP_TOKEN` unset or empty** → do not fail; omit the header, warn once per call
     (three warnings on one page load is acceptable and non-blocking).
  9. **Collisions `ok` while deaths and/or injuries are `empty`/`error`, or vice versa, in any
     combination.** All three branches render independently and correctly; new coverage this
     task must exercise — FR-2 only exercised two independent unions, this is the first
     three-way independence test.
  10. **The live 2025 figures (deaths 229, injuries 49,634, collisions 85,546) have moved.**
      Report as a finding in the `[COMPLETION-REPORT]`; do not adjust, annotate, or
      "sanity-correct." `/verify-figures` is the mechanism.
  11. **`CLAUDE.md` dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`; expected, never
      committed.
  12. **`page.tsx`'s line count lands at or over ~150** → report it prominently in the
      `[COMPLETION-REPORT]`; do not silently extract a shared component to stay under the
      threshold, and do not silently ignore it either (Acceptance clause 9, Intellectual Control).

- **Files** (max 5 — three used):
  1. **`src/lib/collisions.ts`** — *new.* `AGGREGATE_EXPR = "count(collision_id)"`,
     `FIELD_ALIAS = "collisions"`, `COLLISIONS_SOQL`, `buildCollisionsUrl()`, `CollisionsRow`,
     `CollisionsResult`, `fetchCollisionsPerYear()`. FR-2's `injuries.ts` twin.
  2. **`src/app/api/collisions/route.ts`** — *new.* `GET` only, identical union-to-HTTP mapping
     as the deaths and injuries routes.
  3. **`src/app/page.tsx`** — *edited.* Third parallel fetch; the new independent collisions
     block (table, inline note, disclosure); no other change.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects
  carried in the ledger; the deploy SPEC's Vercel/First-Load-JS obligations; `page.module.css`;
  any shared table+disclosure extraction (named above as deferred debt, not this task's to
  resolve).

  **If Redwood believes a fourth or fifth file is required**, halt and request a revision naming
  (i) the specific failure the extra file is the only thing that catches, and (ii) which of the
  three cannot carry it.

- **Tipping Point**: this is a third one-line caller module over an unmodified generic transport,
  one new Route Handler, and a page holding three independent series. Decompose or revise when
  **any one** trips:
  - **`page.tsx`'s line count is at or over ~150 after this task** (Acceptance clause 9). Split
    the table+disclosure markup into a small shared presentational component **then** — the
    trigger this task's own Intellectual Control section declines to act on preemptively.
  - **A fourth yearly-aggregate metric with the *same* shape arrives.** `socrata.ts` absorbs it
    as a fourth one-line caller module; no change to `fetchYearlyMetric` expected — inherited
    unchanged from FR-2.
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough
    filter). This task does **not** cross that boundary — same shape as deaths/injuries, only
    the aggregate expression differs. The counter Task 1 named ("parameterize at two, encapsulate
    at three") stays at two query *shapes*; this is the second metric-*count* trigger, not the
    shape trigger.
  - **`DeathsChart.tsx`'s own Tipping Point** (a second series lands, i.e. collisions or
    injuries wired into the chart) — inherited unchanged from Task 2's SPEC, and is **not**
    tripped by this task. It is the explicit trigger for the next Magnolia SPEC, which also
    closes the remainder of FR-3.
  - **FR-9 lands.** At that point, re-examine whether the inline note this task added should
    become a cross-reference into the caveats section rather than standalone prose.

[FORCES]

1. Honest partial closure of FR-3's data half > closing the whole requirement prematurely with a table that cannot carry a stroke.
2. Mirroring the proven FR-2 pattern exactly > inventing a new shape for a task that is structurally identical to one already shipped.
3. Simplicity > Pattern purity (deferring the third-block extraction rather than restructuring two working, tested blocks under cover of a data task).
```
