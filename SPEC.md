# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why this task, not FR-3 (Cedar's own reasoning, recorded)

The open P0 backlog after the walking skeleton and the subgroup-sum correction is FR-2 (injuries),
FR-3 (collisions, dashed + inline-label), FR-4 (% change), FR-9 (caveats), FR-12 (casualty-filtered
repair). FR-3 and FR-12 carry the product's actual thesis, and Task 2's own SPEC flagged FR-3 as
the task expected to trip the chart's Tipping Point on three counts at once (legend, tooltip,
dashed stroke). Cedar picked **FR-2 instead** for two reasons: FR-3's text requires the dashed-
stroke chart treatment, so it cannot be a Redwood-only data slice the way FR-1 was — it inherently
bundles a data task and a Magnolia chart-redesign task, and combining them into one SPEC was
explicitly ruled out. More load-bearing: **Task 1's own Tipping Point pre-committed to this exact
trigger** — "a second series (FR-2 injuries) → parameterize the fetch; a second Route Handler →
extract `src/lib/socrata.ts`." Executing that named refactor now, with injuries as the second
caller, is smaller and lower-risk than jumping straight to FR-3, which would force the query-layer
parameterization, the chart's Tipping-Point redesign, and the dashed-stroke design decision into
one shot. FR-3, FR-4 (needs all three metrics), FR-9, and FR-12 remain open backlog, explicitly out
of scope here.

---

```markdown
[SPEC] — Injuries per year: parameterize the data layer for a second series (FR-2)

- **Objective**: Add total persons injured per year (2018–2025) as a second, independently-fetched
  live SoQL aggregate, rendered on `/` as its own accessible table + FR-8 query disclosure —
  mirroring Task 1's exact shape for a new metric. In the same task, execute the refactor Task 1's
  own Tipping Point pre-committed to for this exact moment: extract the shared Socrata transport
  (token, headers, timeout, cache policy, content-type/array guards) into `src/lib/socrata.ts`, and
  parameterize the per-metric fetch on the `$select` aggregate expression and field alias, so
  `deaths.ts` and the new `injuries.ts` are both thin callers of one generic function rather than
  two copy-pasted modules. No chart change: `DeathsChart.tsx`, its stylesheet, and its test are
  untouched. Redwood only — no Magnolia work in this task.

- **Requirement**: **FR-2 [P0]** (injuries per year, `sum(number_of_persons_injured)` grouped by
  `date_extract_y(crash_date)`) — the one new metric in scope; its literal text asks only that the
  system "display" the figure, which a table satisfies, exactly as FR-1's literal text was already
  satisfied by Task 1 before Task 2's chart existed. Also satisfies **FR-8 [P0]** (display the exact
  SoQL, extended to a second, independently-pinned query), **FR-10 [P0]** (defined empty/error state,
  now required independently per metric), **FR-11 [P0]** (absent/null core aggregate → error, never
  a silent zero — trap 1 applies to `number_of_persons_injured` exactly as it does to
  `number_of_persons_killed`), **NFR-1** (ISR caching, inherited via the shared transport layer, and
  strengthened by parallel fetching — see Constraints), **NFR-2** (token read server-side only — this
  task *narrows* the token's reading surface from one file to one, by consolidating both metrics'
  transport into `socrata.ts`), **NFR-3** (a second screen-reader-accessible table), **NFR-4** (every
  figure from SoQL aggregation, no exception).
  Explicitly **not** in scope: **FR-3** (collisions, dashed + labelled — needs a Redwood data task
  *and* a Magnolia chart task; deliberately not combined here), **FR-4** (% change — its text asks
  for "each of the three metrics," so it stays blocked until collisions exists too), **FR-9**
  (caveats), **FR-12** (casualty-filtered repair — needs FR-3's raw collisions series to compare
  against), **FR-13**, and the severable FR-5–7 arrest group. Also **not** in scope: adding injuries
  as `DeathsChart`'s second line — that is the deliberately deferred Magnolia follow-on, and is what
  will trip Task 2's chart Tipping Point (legend, crosshair/tooltip, rename), not this task.

- **Inputs/Outputs**:
  - *Input*: a clean tree with Tasks 1–2 and the subgroup-sum correction merged; `SOCRATA_APP_TOKEN`
    in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must satisfy
    `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/lib/socrata.ts`* (new; server-only by construction; never imported by a
    `'use client'` module). Cedar's intended shape — implementation-detail flexibility is Redwood's
    to absorb, the pinned contract is listed below:
    ```ts
    export type YearlyMetricRow<K extends string> = { year: number } & Record<K, number>;

    export type YearlyMetricResult<K extends string> =
      | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[] }
      | { status: "empty"; soql: string }
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };

    export function buildYearlySoql(aggregateExpr: string, fieldAlias: string): string;
    export function buildYearlyUrl(aggregateExpr: string, fieldAlias: string): URL;
    export function fetchYearlyMetric<K extends string>(
      aggregateExpr: string,
      fieldAlias: K,
    ): Promise<YearlyMetricResult<K>>;
    ```
    `fetchYearlyMetric` takes **only** `aggregateExpr` and `fieldAlias` as parameters. The
    `$where`/`$group`/`$order` clauses (the fixed 2018–2025 window, `date_extract_y(crash_date)`,
    `year`) are **fixed internal constants inside this module, not parameters** — do not add a
    `whereClause` or `groupClause` parameter. That generality is unearned until a *third distinct
    query shape* arrives (FR-12's extra `$where`, or FR-6's group-key change); this task moves the
    "parameterize at two, encapsulate at three" counter to exactly two, no further. It performs: token
    read + header assembly (warn, don't fail, if absent — Edge Case 8), `fetch` with
    `AbortSignal.timeout(10_000)` and `next: { revalidate: 86400 }`, non-2xx → `error`/`upstream`
    naming the status code, content-type guard → `error`/`upstream`, safe JSON parse →
    `error`/`upstream`, array-shape guard → `error`/`contract`, zero-length → `status: "empty"`,
    per-row Zod validation against `{ year: string|number, [fieldAlias]: /^\d+$/ }` → `error`/
    `contract` naming the year and offending value's type (Trap 1: never coerce absence/null/non-match
    to 0), the same exact-8-year / no-duplicate / no-out-of-window coverage validator Task 1 built
    (ported, generic over `fieldAlias`), and ascending sort by year. If a fully generic Zod schema
    with a computed key proves awkward under strict TypeScript, the sanctioned fallback is: the
    function validates against a neutral `{ year, value }` shape internally and the per-metric caller
    (below) does a one-line `rows.map(r => ({ year: r.year, [fieldAlias]: r.value }))` rename. Either
    is acceptable; the outward `YearlyMetricRow<K>` shape is what's pinned.
  - *Output 2 — `src/lib/deaths.ts`* (edited, not replaced). Becomes a thin wrapper:
    `AGGREGATE_EXPR = "sum(number_of_persons_killed)"`, `FIELD_ALIAS = "deaths" as const`,
    `DEATHS_SOQL` and `buildDeathsUrl()` built by calling `buildYearlySoql`/`buildYearlyUrl` with
    those two constants, `DeathsRow`/`DeathsResult` as `YearlyMetricRow<"deaths">`/
    `YearlyMetricResult<"deaths">`, `fetchDeathsPerYear()` as a one-line call into
    `fetchYearlyMetric`. **`DEATHS_SOQL`'s string value must be byte-identical to today's** — this
    refactor changes *how* the string is built, never *what* it says (Rule 4: the freeze is on the
    query text, not the file's editability; this SPEC is Cedar's sanctioned exception to Task 2's
    "deaths.ts is read-only," which bound Magnolia only, not a future Redwood SPEC).
  - *Output 3 — `src/lib/injuries.ts`* (new). FR-2's twin of the above:
    `AGGREGATE_EXPR = "sum(number_of_persons_injured)"`, `FIELD_ALIAS = "injuries" as const`,
    exporting `INJURIES_SOQL`, `buildInjuriesUrl()`, `InjuriesRow`, `InjuriesResult`,
    `fetchInjuriesPerYear()`.
  - *Output 4 — `src/app/api/injuries/route.ts`* (new). `export async function GET()`, identical
    union-to-HTTP mapping as `api/deaths/route.ts`:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

  - *Output 5 — `src/app/page.tsx`* (edited). Fetch both metrics **in parallel**:
    `const [deathsResult, injuriesResult] = await Promise.all([fetchDeathsPerYear(), fetchInjuriesPerYear()])`
    — not sequential `await`s, per NFR-1. Below the existing deaths block (chart + table +
    disclosure, untouched), add an independent injuries block with the same three-branch shape
    (`ok` → `<table>` with `<caption>NYC traffic injuries per year, 2018–2025</caption>`,
    `<th scope="col">` Year/Injuries; `empty`/`error` → the same visible non-decorative message
    pattern) and its own `<details>` disclosure containing `INJURIES_SOQL`. **The two metrics'
    branches are fully independent** — deaths failing must never suppress or alter the injuries
    render, and vice versa (new edge case this task introduces; Task 1 never had two independent
    result unions on one page). Distinguish the two `<details>` summaries by text (e.g.
    `"SoQL query — deaths"` / `"SoQL query — injuries"`) so they're both reachable by accessible
    name; this changes the existing deaths disclosure's summary text from the current generic
    `"SoQL query"`, which Cypress's test-first pass must account for. Update the intro sentence to:
    *"Reported collisions, injuries, and deaths move very differently over this period; collisions
    are the most discretionary figure (an officer decides whether to file), injuries typically
    involve an ambulance or hospital record, and deaths are the least discretionary, the medical
    examiner's count."* — verbatim, not paraphrased; correlation language only, no causal claim
    (NFR-5).
  - *Acceptance, by command, `node -v` recorded beside results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` and `npm ls recharts` — both unchanged from before this task (no install step is
       expected; if one becomes necessary, halt and request a revised SPEC per Rule 9).
    3. `npm run dev`; `curl -s localhost:3000/api/deaths` still returns `status: "ok"`, 8 rows,
       unchanged; `curl -s localhost:3000/api/injuries` → `status: "ok"`, 8 rows.
    4. `/` renders both the deaths chart/table (unchanged) and the new injuries table, plus both
       disclosures.
    5. **`git diff --stat` shows zero changes to `src/lib/deaths.test.ts` and
       `src/app/api/deaths/route.test.ts`.** If satisfying the acceptance criteria required editing
       either, report exactly which assertion broke and why — do not silently edit Cypress's files.
    6. Both live response bodies pasted verbatim into the `[COMPLETION-REPORT]`. Cypress diffs the
       injuries body against the mvcc-data skill's pinned Injuries column and re-confirms Deaths is
       unchanged. Redwood transports; it does not judge correctness (NFR-4).
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` — the token name now appears in exactly
       **one** source file (`socrata.ts`) plus `.env.example`, a *smaller* surface than before this
       task (previously `deaths.ts`), and a value in none.
    8. `npm audit` run; report high/critical (no install expected, so this is a hygiene check, not
       a response to new risk).

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`. Same window as
  Task 1, only the aggregate differs.

  **Deaths (unchanged, restated for verification only — do not re-derive):**
  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  **Injuries (new, pinned by this SPEC):**
  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_injured) AS injuries
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when non-empty.

  **Expected response shape**, both endpoints — a JSON array of exactly 8 objects, ascending by
  year, every numeric field a string:
  ```json
  [{ "year": "2018", "injuries": "61940" }, ... 8 entries through "2025" ]
  ```

  **Pinned figures (mvcc-data skill, verified 2026-08-03)** — for Cypress's diff, never for a
  literal in `src/**`: Injuries 2018→2025: 61940, 61391, 44615, 51785, 51933, 54252, 54030, 49634.
  Unlike Task 1/2's deaths values (3-digit, a deliberate hook blind spot), **these injuries figures
  are already in `guard-data-integrity.sh`'s 26 pinned-literal list** — a real mechanical net exists
  for this task that didn't exist for deaths. Do not treat that net as license to be careless with
  the deaths side of this refactor, which remains unguarded.

  **Do not alter the deaths clauses' values.** If Socrata rejects the new injuries query as
  constructed, halt and request a revised SPEC — do not repair it in place.

- **Design Pattern**: **none — simple case**, but this task executes the *parameterization* step
  Task 1's own Tipping Point named ("parameterize at two, encapsulate at three"), which is ordinary
  generics over a two-field parameter object, not a GoF pattern. `composition-patterns` was
  consulted: its rule set targets React component props (boolean-prop proliferation, compound
  components), which don't govern a server-only data module — but its underlying principle (explicit,
  typed parameters over a hidden-branching config object) is exactly what `{aggregateExpr,
  fieldAlias}` is: two required, named, non-boolean parameters, no config object, no hidden branch.
  A Strategy or series registry remains unearned until a *third* distinct query shape arrives (FR-12
  or FR-6) — that SPEC is where "encapsulate" is due, not this one.

- **UI Scope**: N/A — no chart, no CSS, no client component. `page.tsx`'s new markup is plain
  semantic HTML inheriting `globals.css` only, exactly as Task 1's UI Scope specified for deaths.

- **Intellectual Control**:
  - *Why the transport extraction happens now, not later.* Task 1's own Tipping Point named "a
    second Route Handler appears" as the near-certain first trip and said the extraction is due
    *then*, not on a hunch beforehand. This task is that exact moment arriving — deferring it again
    would be the second silent inheritance ADR 0001 was written about, this time by Cedar's own
    hand.
  - *Why `fetchYearlyMetric` takes only the aggregate and alias, not the where/group/order.* Widening
    the parameter surface now, before a caller needs a different `$where` or group key, is exactly
    the unearned-abstraction failure Rule 8 rejects — it would pre-build for FR-12/FR-6 before either
    SPEC exists to justify the shape. Keeping the window and grouping as fixed constants inside
    `socrata.ts` means the function can only express "some yearly aggregate over the fixed 2018–2025
    window" — which is precisely and only what deaths and injuries both need today.
  - *Why `DeathsRow`/`DeathsResult` must stay structurally identical.* `DeathsChart.tsx` consumes
    `rows: DeathsRow[]` and reads `.deaths` by name (`dataKey="deaths"`, the end-label renderer,
    Task 2's pinned rendered contract). `YearlyMetricRow<"deaths">` is `{ year: number } &
    Record<"deaths", number>`, which TypeScript resolves to the exact same structural type as
    `{ year: number; deaths: number }` — so this refactor is invisible to every existing consumer and
    every existing test that doesn't reach into `deaths.ts`'s internals. That invisibility is the
    acceptance bar, not a nice-to-have: Constraint and Acceptance-clause 5 make it checkable
    (`git diff --stat` on the two existing test files must show nothing).
  - *Why the two per-metric fetches run in `Promise.all`, not sequential awaits.* NFR-1's 2.5s Slow-4G
    budget was set for one round trip; adding a second server-side fetch sequentially would add its
    full latency on top rather than overlapping it. Both requests are independent and cacheable
    (`revalidate: 86400`), so there is no ordering dependency to preserve.
  - *Why the two branches are independent rather than one combined error state.* Collapsing "deaths
    failed" and "injuries failed" into one shared error would hide a working metric behind an
    unrelated one's failure — the opposite of FR-10's "defined state," which this project has always
    scoped per-metric (Task 1's `DeathsResult` never referenced any other series).
  - *Why this will not break at scale.* `socrata.ts` knows nothing about deaths or injuries by name —
    it takes an aggregate expression and an alias and returns a generically-typed result. Adding a
    third yearly metric with a *matching* shape (same window, same group key, different aggregate)
    costs one new five-line file, zero changes to `socrata.ts`. The moment a metric needs a different
    `$where` or group key, the Tipping Point below says stop parameterizing and encapsulate instead —
    that boundary is named, not guessed at.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` is read **only** inside
     `src/lib/socrata.ts` after this task — `deaths.ts` and `injuries.ts` must not read it directly.
     Never `NEXT_PUBLIC_`; never in a `'use client'` file (none of the three touched/new files may
     ever gain that directive).
  2. **No figure may be authored.** Injuries values are already caught by
     `guard-data-integrity.sh`'s pinned list (unlike deaths); rely on that but do not rely on it
     *only* — no injuries or deaths figure may appear as a literal anywhere in `src/**` outside test
     files, fallback, placeholder, comment, default, or "temporary" mock.
  3. **`DEATHS_SOQL`'s string value is frozen** (Rule 4) — this refactor may change how it's
     assembled, never what it says. `INJURIES_SOQL` is pinned by this SPEC and frozen from this point
     forward; a future SPEC revises it, not a local repair.
  4. **No zero-coercion, anywhere, for either metric** (FR-11, trap 1). An absent key, `null`, or a
     non-matching string for `deaths` or `injuries` in any year of the window produces
     `status: "error"`, `kind: "contract"` for *that metric only*.
  5. **No new dependency.** Zero install expected — `zod@^4` and `recharts@^3.10.1` are already in
     the tree and sufficient. If the generic-Zod-schema approach genuinely requires a new package,
     halt and request a revised SPEC (Rule 9); do not add one silently.
  6. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are untouched.** No
     injuries series on the chart in this task — that is the deferred Magnolia follow-on.
  7. **No CSS authored or edited.** `globals.css`, `page.module.css` untouched; no `.module.css`
     created.
  8. **Files not to touch**: `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
     `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`,
     `src/app/layout.tsx`, `globals.css`, `page.module.css`, `.claude/**`, `CLAUDE.md`, `README.md`,
     `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  9. **`src/app/page.module.css` remains orphaned** — still owed to the next layout SPEC, per
     `SPEC.md`'s carried-forward note. Not this task's to resolve.
  10. **Caching (NFR-1)**: one `next: { revalidate: 86400 }` policy, stated once in `socrata.ts`,
      inherited by both metrics. Do not add `export const dynamic = "force-dynamic"` or a second
      cache directive.
  11. **Bound every request**: `AbortSignal.timeout(10_000)` on each fetch inside `socrata.ts`.
  12. **Existing deaths tests survive unmodified** (Acceptance clause 5). If they don't, that is a
      real FAIL for Cypress's audit, not something to route around by editing them.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **Network failure/DNS/timeout, for either metric independently** → that metric's
     `error`/`upstream`; the other metric renders normally if it succeeded.
  2. **Non-2xx (429, 5xx) from either metric** → `error`/`upstream` naming the status code. No retry
     loop (cap: one attempt, then fail loud).
  3. **Non-JSON response from either metric** → `error`/`upstream`, guarded by content-type check.
  4. **Zero rows for either metric** → `status: "empty"`, HTTP 200, independent of the other metric.
  5. **A year 2018–2025 missing from either metric's response** → `error`/`contract` naming the
     missing year and which metric. **Never zero-fill.**
  6. **A field present but `null`, empty string, non-numeric, or a JSON number instead of a string**
     → `error`/`contract` naming the year, the metric, and the offending value's type.
  7. **More than 8 rows, a duplicate year, or an out-of-window year, for either metric** →
     `error`/`contract`.
  8. **`SOCRATA_APP_TOKEN` unset or empty** → do not fail; omit the header, warn once per call (two
     warnings on one page load — from the two `fetchYearlyMetric` calls — is acceptable and
     non-blocking, not a defect to engineer around).
  9. **One metric `ok`, the other `empty` or `error`, on the same page render.** Both branches render
     independently and correctly; this is new coverage this task must exercise (Test guidance,
     below) — Task 1 never had two independent unions on one page.
  10. **The live 2025 figures (deaths 229, injuries 49,634) have moved.** Report as a finding in the
      `[COMPLETION-REPORT]`; do not adjust, annotate, or "sanity-correct." `/verify-figures` is the
      mechanism.
  11. **`CLAUDE.md` dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`; expected, never
      committed.

- **Files** (max 5 — five used):
  1. **`src/lib/socrata.ts`** — *new.* The generic transport + validation engine
     (`fetchYearlyMetric`, `buildYearlySoql`, `buildYearlyUrl`, `YearlyMetricRow`/
     `YearlyMetricResult`). The only file in the repo that reads the token after this task.
  2. **`src/lib/deaths.ts`** — *edited, not replaced.* Reduced to the four deaths-specific constants
     and thin re-exports over `socrata.ts`. `DEATHS_SOQL`'s value must not change.
  3. **`src/lib/injuries.ts`** — *new.* FR-2's twin of the reduced `deaths.ts`.
  4. **`src/app/api/injuries/route.ts`** — *new.* `GET` only, identical union-to-HTTP mapping as the
     deaths route.
  5. **`src/app/page.tsx`** — *edited.* Parallel fetch of both metrics; the new independent injuries
     block; the updated intro sentence (verbatim, above); the disambiguated disclosure summaries.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger; the deploy SPEC's Vercel/First-Load-JS obligations; `page.module.css`.

  **If Redwood believes a sixth file is required**, halt and request a revision naming (i) the
  specific failure the sixth file is the only thing that catches, and (ii) which of the five cannot
  carry it.

- **Tipping Point**: this is two thin per-metric modules over one generic transport function, one
  new Route Handler, and one page holding two independent series. Decompose or revise when **any
  one** trips:
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key). This is where "parameterize" stops paying and a Strategy or small
    series registry is finally earned — *that* SPEC must say so explicitly. This task moves the
    counter to exactly two; it does not cross three.
  - **A third yearly-aggregate metric with the *same* shape arrives** (a hypothetical future metric
    needing only a different `sum()`/`count()` expression). `socrata.ts` absorbs it as a third
    one-line caller module; no change to `fetchYearlyMetric` itself is expected.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section, or exceeds ~150
    lines.** Inherited unchanged from Task 1. This task roughly doubles the file (two metrics, no
    caveats yet); if it lands near or over 150 lines, split the table+disclosure markup into a small
    shared presentational component *at that point* — not preemptively here, since two near-identical
    blocks is still within Rule 8's "earned at three" tolerance for markup duplication.
  - **`src/lib/socrata.ts` exceeds ~120 lines or gains a second exported fetch function** with
    materially different transport behavior (e.g. pagination for a non-aggregated dataset like
    arrests) — split the pagination/offset concern into its own module rather than branching inside
    `fetchYearlyMetric`.
  - **Task 2's chart Tipping Point** (a second series lands on `DeathsChart`, i.e. this task's
    injuries data being wired into the chart) — inherited unchanged from Task 2's SPEC, and is
    **not** tripped by this task. It is the explicit trigger for the next Magnolia SPEC.

**Test guidance for Cypress** (behavioral, per Rule 4 — JSON response shape given a stubbed Socrata
reply, and the rendered page contract, not internal plumbing): assert `/api/injuries`'s `ok`,
`empty`, missing-year-contract, null-value-contract, and non-2xx-upstream paths, mirroring the
existing deaths route tests. Assert the FR-8 invariant for injuries (every clause in `INJURIES_SOQL`
appears encoded in `buildInjuriesUrl()`). **New, required coverage this task introduces:** a page-test
scenario where the deaths fetch mock resolves `ok` and the injuries fetch mock resolves `error` (and
the inverse), asserting each branch renders independently and correctly on the same page — the two
mocks must be discriminated by request URL (or by which SoQL each carries), not by call order. Assert
`git diff` shows zero changes to `src/lib/deaths.test.ts` and `route.test.ts` (a CI-checkable, not
just narrated, claim). Stub responses use obviously synthetic values, never the pinned Appendix A /
mvcc-data figures. Add an `axe-core` assertion on the new injuries table and both `<details>`
disclosures.

**Background/reference resources (Constraint of Three)**:
1. `.claude/skills/mvcc-data/SKILL.md` — the FR-2 query pattern (confirmed identical shape to FR-1),
   trap 1 applied to `number_of_persons_injured`, and the pinned Injuries column.
2. `ARCHIVED_SPECS.md`, Task 1's `[SPEC]` — specifically its Tipping Point (the "parameterize at
   two / second Route Handler → extract socrata.ts" clauses this task executes) and its Intellectual
   Control on why the page imports the lib directly rather than self-fetching its own Route Handler.
3. `.claude/hooks/guard-data-integrity.sh` — confirms injuries figures are already in the pinned
   6-digit-adjacent literal list (unlike deaths), so this task has a real mechanical net Task 1/2
   didn't have on the deaths side.

[FORCES]

1. **Executing a pre-committed refactor now > deferring it again** — Task 1's own Tipping Point
   named this exact trigger; doing it here rather than pushing it into a bigger, chart-bundled FR-3
   task keeps each SPEC's blast radius small and honors ADR 0001's "don't let a second silent
   inheritance happen."
2. **A narrow, two-parameter function > a config object anticipating future shapes** — `$where`/
   `$group` stay fixed constants until a third shape genuinely requires otherwise; building for FR-12
   or FR-6 before either SPEC exists is the unearned abstraction Rule 8 forbids.
3. **Two independent per-metric states > one combined error state** — a failing injuries fetch must
   never hide a working deaths series, or vice versa.
4. **Structural type compatibility > a clean-looking generic rename** — `DeathsRow`/`DeathsResult`
   must stay byte-identical in shape so `DeathsChart.tsx` and every existing test are unaffected by a
   refactor they have no reason to know occurred.
5. **Simplicity > Pattern purity.**
```
