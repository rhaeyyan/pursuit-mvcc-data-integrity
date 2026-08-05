# Active SPEC

**Status:** approved by the human → dispatched to Cypress (tests first), then Redwood
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-05
**Executing agent:** Redwood · **Tests first:** Cypress · **Audit:** Cypress (standard order —
not the SPIKE ordering override the two prior SPECs used)

This is **Task 1** of a two-task walking-skeleton split. The full slice (data + Route Handler +
page + a `'use client'` Recharts component + its CSS) is 6+ files, over Rule 5's 5-file cap, and
none of the six qualifies as generator-output-class the way the scaffold's exemption did. Rather
than spend another bounded exemption, Cedar split the work on the agent boundary: this task builds
the data path and the NFR-3-mandated accessible table (Redwood, 5 files, zero Recharts, zero CSS);
**Task 2** (pre-declared at the bottom of this file, not dispatched yet) adds the chart over that
table (Magnolia, ~3 files), once this task closes and is audited. Human-approved via plan mode on
2026-08-05.

---

## Standing clauses that bind this and every subsequent SPEC

Archived with the SPECs that introduced them, restated here because they are live obligations:

- **Amendment 3(b) — acceptance-by-command must record `node -v`**, and the recorded version must
  satisfy `engines.node`. A gate that ran on an unverified platform produced an unverified result;
  unverified is not PASS. Costs no file budget; not optional in any SPEC.
- **Amendment 3(c) — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Amendment 3(d) — `eslint@^9` is required.** The binding constraint is
  `eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes eslint 10 — *not* `eslint-config-next`,
  which is permissive and decides nothing. Check that package first before evaluating eslint 10.
- **Amendment 3(e) — `vitest.config.ts` → `vitest.config.mts` is AUTHORIZED**, batched with
  Cypress's first `setupFiles` edit in **this task's Phase B** (one edit, not two). It renames an
  already-enumerated item, so it costs no new file slot in either agent's budget. Of its two
  required checks, the first is already pre-discharged — a root `.mts` sits outside
  `tsconfig.include` by construction. **The second still needs doing:** `eslint.config.mjs`
  declares no explicit `files` patterns and inherits `eslint-config-next`'s, so whether `.mts` is
  linted is an unverified inherited default. Verify with `eslint --debug` or a deliberate error
  before assuming coverage.
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) the mechanism is the *only* thing that catches the named failure, and (ii) no existing
  enumerated file, hook, CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`. If CI lands and can
  pin (`actions/setup-node` with `node-version-file: .nvmrc`, or Vercel reading `engines.node`),
  the trigger is **retired** — fixing the platform strictly dominates failing on it.

## Carried forward — owed, not part of this task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it,
  and this task does not touch it either.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all 450
  installed packages, so this is a documentation gap, not an open risk).

---

## [SPEC] — Walking skeleton Task 1: deaths per year, live from Socrata

- **Objective**: Render the eight yearly traffic-death figures for 2018–2025 on `/`, produced by a
  single live server-side SoQL aggregation, with the exact query displayed beside them and a
  defined error state when any year is absent. Three layers, one metric: a server-only data module
  that owns the query and its validation, a Route Handler that exposes it as the tested JSON
  contract, and a Server Component page that renders it as a semantic table. No chart, no Recharts,
  no CSS, no second metric.

- **Requirement**: **FR-1 [P0]** (deaths per year 2018–2025 from `sum(number_of_persons_killed)`
  grouped by `date_extract_y(crash_date)`) — the one metric in scope. Also satisfies **FR-8 [P0]**
  (display the exact SoQL), **FR-10 [P0]** (defined empty/error state), **FR-11 [P0]** (strings
  cast explicitly; absent/null core aggregate triggers FR-10, never a silent zero), **NFR-1** (ISR
  caching of an immutable historical aggregate), **NFR-2** (token read server-side only), **NFR-3**
  (the screen-reader-accessible table twin, built before the chart it will twin), **NFR-4** (every
  figure from SoQL aggregation).
  Explicitly **not** in scope: FR-2 (injuries), FR-3 (collisions, dashed + labelled), FR-4 (%
  change), FR-9 (caveats), FR-12 (casualty-filtered repair), FR-13 (policy-date markers), and all
  of the severable FR-5–7 arrest group. Per Rule 6, everything else grows from this slice.

- **Inputs/Outputs**:
  - *Input*: the completed toolchain on a clean tree; `SOCRATA_APP_TOKEN` in a gitignored `.env`
    (create it locally from `.env.example`; never committed, never printed).
  - *Step 0, before anything else* (Amendment 3(b), binding): run and record `node -v` and
    `npm -v`. `node -v` must satisfy `engines.node` (`>=22.22.2`); on this machine that is
    `v22.23.2`. If it prints a v20, halt and re-enter through a fresh shell in the project root. Do
    not `fnm use` around it. Then run and record `npm view zod engines` and
    `npm view zod peerDependencies`. Cypress established on 2026-08-05 that `zod` declares **no**
    `engines` field at all — recording "none declared" is the result, not permission to skip the
    command.
  - *Output 1 — `src/lib/deaths.ts`* (server-only by construction; never imported by a
    `'use client'` module). Exports:
    - The four SoQL clause constants, verbatim as pinned under **Query** below.
    - `DEATHS_SOQL: string` — the human-readable query for FR-8, assembled from those same
      constants. Not a retyped copy: **built from the constants, so the displayed text and the
      sent request cannot drift.**
    - `buildDeathsUrl(): URL` — the request URL, encoded with `URLSearchParams` from those same
      constants. No hand-rolled `encodeURIComponent` concatenation.
    - `fetchDeathsPerYear(): Promise<DeathsResult>`.
  - *The result type* (a plain discriminated union; see Design Pattern for why this is not a
    "pattern"):

    ```ts
    export type DeathsRow = { year: number; deaths: number };

    export type DeathsResult =
      | { status: "ok"; soql: string; rows: DeathsRow[] }          // exactly 8 rows, 2018..2025
      | { status: "empty"; soql: string }                          // FR-10: zero rows returned
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };
    ```

    `reason` is a human-readable diagnostic naming what failed (e.g. `"no aggregate returned for
    2024"`, `"Socrata responded 429"`). It is rendered to the user; it must never contain the
    token.
  - *Output 2 — `src/app/api/deaths/route.ts`*: `export async function GET()`, calling
    `fetchDeathsPerYear()` and mapping the union onto HTTP:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

    The two error codes are distinguished on purpose: 502 means Socrata failed us; 422 means
    Socrata answered and the answer violated the pinned contract. Those demand different responses
    from a human, so they must be different codes.
  - *Output 3 — `src/app/page.tsx`*: an `async` Server Component that awaits
    `fetchDeathsPerYear()` **directly** (see Intellectual Control for why it does not re-fetch its
    own Route Handler) and renders:
    - an `<h1>` and one sentence of neutral framing — correlation language only, no causal claim;
    - on `ok`: a `<table>` with a `<caption>`, `<th scope="col">` on Year and Deaths, one `<tr>`
      per year, ascending;
    - on `empty` / `error`: a visible, non-decorative message stating that no figures could be
      produced and why (`reason`). **Never an empty table, never a rendered zero, never a crash.**
    - in all three states: a `<details>` disclosure labelled "SoQL query" containing
      `DEATHS_SOQL` in a `<pre><code>` (FR-8). It renders in the error states too — the query is
      most useful precisely when it failed.
  - *Acceptance, by command, with `node -v` recorded beside the results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` recorded — one deduped entry, resolved version `4.x`.
    3. `npm run dev`, then `curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/deaths` →
       200, and `curl -s localhost:3000/api/deaths` → `status: "ok"` with exactly 8 rows.
    4. `/` renders eight rows and the query disclosure.
    5. `npm audit` run; anything high or critical reported (not auto-fixed).
    6. **The live response body is pasted verbatim into the `[COMPLETION-REPORT]`.** Cypress diffs
       it against PRD Appendix A's Deaths column. Redwood does not perform that comparison and
       does not state whether the numbers "look right" — it transports them. (NFR-4: the figure is
       compared, never authored.)
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` shows the name in exactly three places
       and a **value in none**.

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`.

  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when the variable is non-empty.

  **Expected response shape** — a JSON array of exactly 8 objects, ascending by year, every
  numeric field a **string** (verified live 2026-08-03, re-verified 2026-08-04):

  ```json
  [{ "year": "2018", "deaths": "..." }, ... 8 entries through "2025" ]
  ```

  **Zod schema, and its deliberate asymmetry.** `deaths` is `z.string().regex(/^\d+$/)` — strict,
  because that is where the integrity claim lives and because the skill's contract says every
  numeric field arrives as a string. `year` accepts `z.union([z.string(), z.number()])` and is
  normalized, because a year cannot be silently wrong in a way that fabricates a safety
  improvement; only the measure can. Cast with `Number(...)` **after** the regex passes. Do not use
  `z.coerce`, `parseInt` on unvalidated input, `Number()` on a value that has not been asserted, or
  any `?? 0` / `|| 0` / `Number(x) || 0` anywhere in the parse path.

  **No `$limit`, on purpose.** The 1,000-row default is irrelevant once `$group` collapses the
  response to 8 rows, and adding `$limit=8` would silently *truncate* a drifted response where the
  validator's exact-eight-years assertion would instead *catch* it. The stronger check wins.

  **Do not alter any clause.** If Socrata rejects alias ordering (`$order=year`), or any clause
  errors, **halt and request a revised `[SPEC]` from Cedar.** Do not repair the query in place.

- **Design Pattern**: **none — simple case.** Variance analysis per Rule 8: the fixed 2018–2025
  window and the dataset ID are stable; the axis that genuinely varies is the *set of series*.
  Today there is exactly one series, so there is nothing to encapsulate — a Strategy, a series
  registry, or a provider here would be an abstraction with one implementation, the unearned-
  pattern failure Rule 8 names. `composition-patterns` was consulted: the only component authored
  is a Server Component rendering a table, with no boolean props, no compound structure, and no
  shared state, so all four of its rule categories presuppose a component this task does not
  create. The `DeathsResult` discriminated union is **not** a pattern claim — it is a return type,
  chosen so FR-10's error state is a rendering branch rather than a `try`/`catch` straddling the
  server boundary. Write the lib so a second series would be a second call, and then **stop**; do
  not parameterize in advance. See Tipping Point.

- **UI Scope**: **structural** — `src/app/page.tsx` is replaced outright and the page's DOM is
  created here. But **no visual design is in scope**: no CSS module, no colors, no spacing, no
  layout system. Semantic HTML inheriting `globals.css` only. All styling, and the chart itself,
  belong to Magnolia's follow-on SPEC (Task 2, below). Redwood must not open a stylesheet.

- **Intellectual Control**:
  - *Why the page imports the lib directly instead of fetching its own Route Handler over HTTP.*
    Self-fetching requires an absolute URL the server does not portably know (it becomes
    `VERCEL_URL` juggling in production and `localhost:3000` guesswork locally), fails during
    `next build` when the page is prerendered and no server is listening, adds a full HTTP round
    trip inside a single process against NFR-1's caching budget, and yields two caching layers to
    reason about instead of one. Importing the module is in-process, prerenders cleanly, and puts
    the `revalidate` policy in exactly one place. The token is equally server-side in both designs,
    so the self-fetch buys nothing it costs.
  - *Then why does the Route Handler exist at all, if the page does not call it?* Two reasons,
    neither decorative. **NFR-2 names the Route Handler as the mechanism** for token handling and
    the Stack table names Route Handlers as the data-access layer — a PRD-level choice not to be
    reinterpreted away. And Rule 4's testing doctrine says the behavioral test target for data work
    is "a Route Handler's JSON response shape given a stubbed Socrata reply": the endpoint is what
    Cypress can black-box and what a human can `curl` when the page looks wrong. It is the
    inspectable, tested face of the same function the page renders — not a parallel path that
    could disagree with it, because there is only one query string, one schema, and one validator,
    in one module, imported by both.
  - *Why the shared function is a separate file rather than an export from `route.ts`.* Next's App
    Router treats `route.ts` as a special module and validates its exports; a non-HTTP-method
    export is a type error in the generated `.next/types`, so
    `import { fetchDeathsPerYear } from './api/deaths/route'` is not merely ugly, it does not
    typecheck. It would also couple the page's import path to a URL path, so moving the endpoint
    would break the page. The lib file is not a layer added for symmetry; it is the only place the
    shared function can legally live.
  - *Why the table before the chart.* NFR-3 requires the table regardless, and CLAUDE.md is
    explicit that even a two-line chart is not perceivable without it. Built first, it is the data
    surface the chart must agree with; built second, it becomes a chore appended to a chart that
    already looks finished. The `dataviz` form heuristic was checked and does **not** argue for a
    stat tile here: FR-1 asks for deaths *per year* across eight years, which is a line chart's
    job — that chart arrives in Magnolia's SPEC, over this table, unchanged.
  - *Why this will not break at scale.* The whole surface is one module with four exported symbols
    and no cross-file state. The only coupling is deliberate and load-bearing: `DEATHS_SOQL` and
    `buildDeathsUrl()` are derived from the same four constants, so FR-8's displayed query is
    mechanically the query that was sent. Cypress can assert that invariant directly — every clause
    in the displayed string appears, encoded, in the built URL — which is what keeps FR-8 honest
    after the fourth series exists.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` is read **only** inside
     `src/lib/deaths.ts`. Never a `NEXT_PUBLIC_` name; never in a module carrying a `'use client'`
     directive; never logged, never echoed into `reason`, never written to a fixture or a commit.
     `guard-data-integrity.sh` blocks the first two mechanically. None of the three files created
     here may ever gain a `'use client'` directive.
  2. **No figure may be authored — and the hook will not catch you here.**
     `guard-data-integrity.sh` pins 26 six-digit literals (collisions, injuries, casualty-filtered).
     The deaths values are three digits and are **deliberately absent from that list**, because a
     pattern matching them would fire on every ordinary small number. So for *this* task the
     mechanical net does not exist. No deaths figure may appear as a literal in `src/**` — not as a
     fallback, not as a placeholder, not in a comment, not in a default value, not in a "temporary"
     mock. If the fetch fails, the page shows the error state; it does not show a remembered
     number.
  3. **The query is frozen** (Rule 4). No clause may be edited, reordered, extended, or "fixed."
     Any Socrata rejection is a halt and a request for a revised SPEC, not a local repair.
  4. **No zero-coercion, anywhere** (FR-11, trap 1). An absent key, a `null`, or a non-matching
     string for `deaths` in any year of the window produces `status: "error"`, `kind: "contract"`.
     `sum()` over a group whose rows are all null returns *no key at all* — that is the exact shape
     the confirmed post-2026-05-05 dropout takes, and coercing it to 0 would fabricate a safety
     improvement. There is no acceptable default value for a missing fatality count.
  5. **One new dependency: `zod@^4`**, authorized here under Rule 9 because FR-11's boundary
     validation is its first real consumer. `zod@4.4.3` is already in the tree transitively via
     `eslint-config-next → eslint-plugin-react-hooks` marked `dev: true`; declaring it as a direct
     production dependency is the deliberate pin the ledger asked for, not a silent dedupe against
     a lint plugin's transitive pick. Record `npm ls zod` after install; if it resolves below 4,
     halt. Import from the package root (`import { z } from "zod"`), not `zod/v3`.
  6. **`recharts` is NOT installed here.** It has no consumer in this task, and installing a
     dependency ahead of the requirement that justifies it is precisely the Rule 9 accounting the
     scaffold SPEC protected. It is pre-authorized for Magnolia's follow-on SPEC (Task 2) at
     `recharts@^3` (3.10.1, `engines.node >= 18`, already discharged in the scaffold's Amendment 1
     table). Do not helpfully add it.
  7. **No CSS, no chart, no client component.** No `.module.css` authored or edited; `globals.css`
     untouched; no `'use client'` file created.
  8. **Files not to touch**: `vitest.config.ts`/`.mts` (Cypress's, per Amendment 3(e) — see
     Ordering), `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`,
     `globals.css`, `.claude/**`, `README.md`, `.gitignore`, `docs/**`.
  9. **`src/app/page.module.css` is left orphaned, by decision.** Replacing `page.tsx` strips its
     only importer, along with the `next/image` references to `public/next.svg` and `vercel.svg`.
     Deleting them would spend a file slot on cleanup that Magnolia's SPEC will either repurpose or
     remove with context this task does not have. Cypress should not flag the orphan; Redwood
     should not spend a slot on it.
  10. **Caching (NFR-1)**: the Socrata `fetch` carries `next: { revalidate: 86400 }`. One cache
      policy, stated once, in the lib — inherited by both the page's prerender and the Route
      Handler. Do **not** add `export const dynamic = "force-dynamic"`. Do not add a second,
      route-segment-level cache directive; if Next 16 warns about the fetch-level option, report it
      rather than layering a second mechanism on top.
  11. **Bound the request**: `AbortSignal.timeout(10_000)` on the fetch. An unbounded call to a
      third-party API inside a prerender can hang `next build` indefinitely.
  12. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  13. `npm audit` after install; report high/critical, do not `audit fix --force`.

- **Edge Cases**:
  1. **Network failure, DNS failure, or timeout** → `error`/`upstream`, 502, page error state.
  2. **Non-2xx from Socrata** (including **429 rate limit** and 5xx) → `error`/`upstream` with the
     status code named in `reason`. Do not retry in a loop; a single attempt, then fail loud (Rule
     4: cap every autonomous loop — the cap here is one).
  3. **Response is not JSON** (Socrata serves HTML for some error and throttle pages) → check the
     content type / guard the parse; `error`/`upstream`. Never `JSON.parse` a body blind.
  4. **Zero rows returned** → `status: "empty"`, HTTP 200, distinct user-facing message from a
     failure. "We got an answer and it was empty" and "we could not get an answer" are different
     facts, and FR-10 requires the state to be *defined*, not merely non-crashing.
  5. **A year in 2018–2025 is missing from the response** → `error`/`contract`, 422, `reason`
     naming the missing year. **Never zero-fill.** This is trap 1 and the single most likely real
     failure.
  6. **`deaths` present but `null`, empty string, non-numeric, or a JSON number instead of a
     string** → `error`/`contract` naming the year and the offending value's type. If this
     reproduces against the live feed, **halt and request a revised SPEC** — a type change in the
     feed is a contract change, and widening the schema on Redwood's own authority is exactly what
     Rule 4 forbids.
  7. **More than 8 rows, a duplicate year, or a year outside the window** → `error`/`contract`. Any
     of the three means the `$where` or `$group` no longer means what the SPEC says it means.
  8. **`SOCRATA_APP_TOKEN` is unset or empty** → **do not fail.** Omit the header entirely, emit
     one server-side warning, and proceed. The token is a rate-limit attribution token, not an
     authorization secret (CLAUDE.md § Recorded decisions), so its absence degrades throughput, not
     correctness — and hard-failing would mean a fresh clone can never see the skeleton at all.
     **Never** send the literal header value `undefined` or `null`.
  9. **The live 2025 figure has moved materially from the pinned 229.** Do not adjust anything, do
     not annotate, do not "sanity-correct." Report the observed value in the `[COMPLETION-REPORT]`;
     `/verify-figures` is the mechanism and PRD §7 already names the two-year-average fallback as
     the response. This is a finding, not a bug.
  10. **The Route Handler test cannot construct a Web `Request`/`Response` under the `jsdom`
      environment.** This is the scaffold SPEC's own named first tipping point arriving. The
      surgical resolution is a per-file `// @vitest-environment node` docblock in the route test,
      which costs no file; splitting `vitest.config` into Vitest `projects` is the escalation if a
      second such file appears. Cypress's call, in Cypress's budget — flagged here so it is not
      rediscovered at test-writing time.

- **Files** (max 5):
  1. **`package.json`** — add `zod@^4` to `dependencies`. No new scripts (the count stays 7 of the
     8-script tipping point).
  2. **`package-lock.json`** — install artifact; committed, per the scaffold SPEC.
  3. **`src/lib/deaths.ts`** — *new.* The four clause constants, `DEATHS_SOQL`, `buildDeathsUrl()`,
     the Zod schema, the pure year-coverage validator, `fetchDeathsPerYear()`, and the
     `DeathsResult` type. The only file in the repo that reads the token. Earns its own file
     because `route.ts` cannot legally export it (see Intellectual Control).
  4. **`src/app/api/deaths/route.ts`** — *new.* `GET` only; the union-to-HTTP mapping above. The
     black-box contract Cypress tests and a human curls.
  5. **`src/app/page.tsx`** — *replaced.* Server Component: heading, one neutral sentence, the
     accessible table, the FR-8 query disclosure, the FR-10 error/empty states.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger. This SPEC does not touch that file, so per the ledger's own rule they stay with
  the next SPEC that does. They do not block the skeleton.

  **The 7th-file test does not apply** — this budget is not spent, it is *sized*. Five files, five
  used. If Redwood believes a sixth is required, halt and request a revision; state which named
  failure the sixth file is the only thing that catches, and which of the five cannot carry it.

- **Tipping Point**: this is one module, one endpoint, one page, and it stays reviewable while it
  is. Decompose when **any one** trips:
  - **`src/lib/deaths.ts` gains a second series (FR-2 injuries).** That series differs only in the
    `$select` aggregate, so *parameterize* — one function taking the aggregate expression. Do not
    build the abstraction now for a caller that does not exist.
  - **A third distinct query *shape* arrives** — FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key rather than the aggregate. Parameterizing stops paying there.
    **That is where a Strategy (or a small series registry) is finally earned**, and where the SPEC
    introducing it must say so explicitly. Shorthand: *parameterize at two, encapsulate at three.*
  - **A second Route Handler appears.** The token read, header assembly, timeout, cache policy, and
    content-type guard are shared infrastructure the moment there are two callers — extract
    `src/lib/socrata.ts` then, leaving `deaths.ts` holding only the query and its validation. This
    is the near-certain first trip.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section**, or exceeds ~150
    lines. Decompose into components then — and that is also the moment to re-read
    `ARCHITECTURE.md`'s revisit trigger in CLAUDE.md § Project Layout.
  - **`src/lib/deaths.ts` exceeds ~120 lines or exports a second fetch function** → split the
    schema and validator into their own module.

**Ordering** (standard `[SPEC]`, no override): **Cypress writes failing tests first**, then
Redwood implements. Cypress's own budget — not Redwood's five — covers the test files and, per
**Amendment 3(e)**, the authorized `vitest.config.ts` → `vitest.config.mts` rename batched with
adding `setupFiles`. That rename costs **no file slot in either agent's budget**; it renames an
already-enumerated item, and Cypress must edit that file anyway. Redwood must not perform it, must
not duplicate it, and must not contest it. Of its two required checks, the first is pre-discharged
(a root `.mts` sits outside `tsconfig.include` by construction). **The second is still owed at
rename time:** `eslint.config.mjs` declares no explicit `files` patterns and inherits
`eslint-config-next`'s, so whether `.mts` is linted is an unverified default — verify with
`eslint --debug` or a deliberate error before assuming coverage.

**Test guidance for Cypress** (behavioral, per Rule 4 — the JSON response shape given a stubbed
Socrata reply, not the fetch plumbing): assert the `ok` path, the `empty` path, the missing-year
contract failure, the null-`deaths` contract failure, the non-2xx upstream failure, and the FR-8
invariant that every clause in `DEATHS_SOQL` appears encoded in `buildDeathsUrl()`. **Stub
responses must use obviously synthetic values (11, 22, 33…), never PRD Appendix A's real deaths
column** — a passing test must never be confusable with evidence that the live data is correct.
Add an `axe-core` assertion on the rendered table for NFR-3.

**Background/reference resources (Constraint of Three)**:
1. `.claude/skills/mvcc-data/SKILL.md` — the dataset contract: the FR-1 query pattern, trap 1
   (absent-key-as-zero), trap 5 (the 1,000-row default), and the string-typing rule.
2. `.claude/hooks/guard-data-integrity.sh` — what is mechanically caught, and specifically what is
   **not** (Constraint 2).
3. `docs/project-mvcc-data.md` lines 197–217 — FR-1, FR-8, FR-10, FR-11 and NFR-1–4, verbatim.

## [FORCES]

1. **Fail loud > render something** — an absent fatality aggregate must reach the user as an
   error, never as a zero. A silent zero here would manufacture the exact safety improvement this
   product exists to disprove.
2. **One source of truth for the query > convenient duplication** — the displayed SoQL (FR-8) and
   the sent request are derived from the same four constants, so they cannot drift, and the
   invariant is machine-assertable rather than maintained by care.
3. **In-process composition > an HTTP round trip to ourselves** — the page imports the shared
   function; the Route Handler is the tested, inspectable face of that same function, not a second
   path that could disagree with it.
4. **Traceability of dependencies > installing what we will obviously need** — `zod` arrives with
   FR-11, which needs it; `recharts` waits for the chart that needs it.
5. **Simplicity > Pattern purity.**

---

## Task 2 — pre-declared, NOT dispatched (Magnolia, ~3 files)

Drafted in full after Task 1's Cypress audit PASS, not now. Sketch, so the pair can be reasoned
about together: install `recharts@^3`; add `src/components/DeathsChart.tsx` (`'use client'`,
single line series, 2px stroke, round join/cap, ≥8px end markers, hairline gridlines, direct
end-of-line label, `prefers-reduced-motion` respected) plus its CSS module; edit `src/app/page.tsx`
to mount the chart inside a `<figure>` whose table-view toggle reveals the table Task 1 already
built. UI Scope: structural. It touches `src/app/page.tsx`, which Task 1 also touches — the two
are **strictly sequential, not parallel worktrees.**
