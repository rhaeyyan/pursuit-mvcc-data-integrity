# Active SPEC

**Status:** approved by the human via plan mode → dispatched to Cypress (tests first), then
Magnolia
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06
**Executing agent:** Magnolia · **Tests first:** Cypress · **Audit:** Cypress (standard order)

This is **Task 2**, the second and final task of the walking-skeleton split declared in Task 1's
SPEC. Task 1 (closed 2026-08-06, Cypress PASS) built the data path, the Route Handler, and the
NFR-3 accessible table. This task mounts the chart over that table and stops. It adds **zero new
queries, zero new fetches, and zero new metrics** — it is a pure rendering layer over the
already-fetched, already-validated `DeathsRow[]`.

The pre-dispatch sketch that stood here was written by Cedar before Task 1 existed and is
superseded in three places: the file count is 5 (not ~3), the `<figure>` lives inside the chart
component (not in `page.tsx`), and the table-view **toggle** the sketch assumed is deliberately
**not** built.

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
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) the mechanism is the *only* thing that catches the named failure, and (ii) no existing
  enumerated file, hook, CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`. If CI lands and can
  pin (`actions/setup-node` with `node-version-file: .nvmrc`, or Vercel reading `engines.node`),
  the trigger is **retired** — fixing the platform strictly dominates failing on it.
- **`vitest.config.mts` exists and lints correctly.** Amendment 3(e)'s rename is done; both its
  required checks passed. Nothing further owed.
- **`@/*` path-alias imports don't resolve under Vitest.** `tsconfig.json`'s `paths` map is
  honored by `tsc`/`next build` but `vitest.config.mts` has no matching `resolve.alias`/
  `tsconfig-paths` plugin. **Binding on this task:** every file created or edited here is
  test-covered, so every import in `src/components/DeathsChart.tsx` and `src/app/page.tsx` is
  **relative** (`../lib/deaths`, `../components/DeathsChart`). An `@/` import will typecheck and
  build and then fail only under Vitest — the most expensive way to find it. Adding
  `vite-tsconfig-paths` is a new dependency and therefore Cedar's call in a future SPEC, not a
  workaround available here.
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** Next 16's `generate-agent-files.js` appends
  a `<!-- BEGIN:nextjs-agent-rules -->` block on every dev/build run. `CLAUDE.md` is off-limits to
  every SPEC and this block carries no project decision — `git checkout -- CLAUDE.md` after any
  `dev`/`build` run, don't commit it and don't try to suppress it as a fix. This task runs both
  commands, so it *will* happen; confirm a clean `git status` for that path before reporting.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. **This task adds a second item to that SPEC's list:** record `/`'s First Load
  JS after Recharts lands and hold it against NFR-1's caching budget (Constraint 12).
- **`src/app/page.module.css` is orphaned for the second time, now with an expiry.** Task 1 left it
  unimported and deferred the decision to "Magnolia's SPEC" — this is that SPEC, and the decision
  is **leave it, delete it in the next SPEC that touches page-level layout** (realistically FR-9's
  caveats section or the first real layout pass). Reasoning is in this SPEC's § Files. It is now a
  tracked debt with a named owner rather than an inherited silence; if that SPEC lands without
  removing it, Cypress should flag the miss.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all
  installed packages, so this is a documentation gap, not an open risk).

---

## [SPEC] — Walking skeleton Task 2: the deaths-per-year line chart

- **Objective**: Render the eight yearly traffic-death figures Task 1 already fetches as a single
  line series, mounted directly above the existing table on `/`, inside a `<figure>` the chart
  component owns. One series, one `<figure>`, one new component and its stylesheet. **No new data
  access of any kind**: no `fetch`, no Route Handler, no SoQL, no second metric, no borough filter,
  no percentage change. The chart consumes the exact `DeathsRow[]` the Server Component already has
  in hand and renders it without sorting, filtering, formatting, interpolating, or re-deriving a
  single value.

- **Requirement**: **FR-1 [P0]** — the deaths-per-year series, now *displayed as a chart* rather
  than only as a table. Also satisfies, or holds intact, **NFR-3** (WCAG 2.2 AA: the chart's data
  remains available as the screen-reader-accessible table Task 1 built; `prefers-reduced-motion`
  respected; AA contrast on every stroke and label), **NFR-4** (no displayed figure is computed,
  rounded, or re-derived here — the chart plots the array it is handed), **NFR-5** (correlation
  language only in the new caption copy; the dashed-stroke treatment stays *reserved* — Constraint
  5), and **NFR-6** (Recharts renders SVG; no browser-specific API is introduced). Explicitly
  **not** in scope: FR-2 (injuries), FR-3 (collisions, dashed + inline-labelled), FR-4 (% change),
  FR-9 (caveats), FR-12 (casualty-filtered repair), FR-13 (policy-date reference markers), and the
  whole severable FR-5–7 arrest group. FR-8's query disclosure and FR-10/FR-11's empty and error
  states are Task 1's and must survive this task byte-for-byte in behavior.

- **Inputs/Outputs**:

  - *Input*: a clean tree with Task 1 merged; `SOCRATA_APP_TOKEN` in a gitignored `.env`.

  - *Step 0, before anything else* (Amendment 3(b), binding): run and record `node -v` and
    `npm -v`. `node -v` must satisfy `engines.node` (`>=22.22.2`); on this machine that is
    `v22.23.2`. If it prints a v20, halt and re-enter through a fresh shell in the project root.
    Then, **before installing anything**, run and record:
    - `npm view recharts version` — the current 3.x release.
    - `npm view recharts engines` — its `node` range must admit the recorded `node -v`.
    - `npm view recharts peerDependencies` — its `react` range must admit `react@19.2.8`.

    The scaffold SPEC's Amendment 1 table discharged `recharts@^3` (3.10.1, `engines.node >= 18`)
    on 2026-08-04. That was two days and an unknown number of releases ago, and a pre-authorization
    is not a substitute for a fact. **Re-verify; do not cite the old table as evidence.** If either
    range excludes this platform, **halt and request a revised `[SPEC]`** — a dependency that does
    not fit the platform is Cedar's problem under Rule 9, not something to work around locally.

  - *Output 1 — `src/components/DeathsChart.tsx`* (**new**, `'use client'`). Exports:

    ```ts
    import type { DeathsRow } from "../lib/deaths";

    export type DeathsChartProps = { rows: DeathsRow[] };

    export function DeathsChart({ rows }: DeathsChartProps): React.JSX.Element;
    ```

    One prop. Not optional, not nullable, no defaults, no boolean flags, no options object, no
    `className` passthrough, no width/height escape hatch. `rows` is the same array `page.tsx`
    already destructures for the table, so the chart and the table are provably plotting and
    listing the same objects — not two reads of one source that could drift.

    **The `import type` keyword is load-bearing, not stylistic.** `src/lib/deaths.ts` is the only
    module in the repo that reads `SOCRATA_APP_TOKEN`. A *value* import of it from a `'use client'`
    module would pull it into the client graph and ship the token read to every visitor — the exact
    NFR-2 failure `guard-data-integrity.sh` exists to catch, except the hook's check-2 only fires on
    a literal `process.env.*TOKEN` in the client file itself and would **not** catch this. A
    type-only import is erased at compile time and cannot. See Constraint 1 for the grep that does
    catch it.

    Rendered structure (this is the contract; the JSX shape is Magnolia's):

    ```html
    <figure class="figure">
      <div class="plot" role="img"
           aria-label="Line chart of NYC traffic deaths per year from 2018 to 2025.">
        <!-- ResponsiveContainer > LineChart > CartesianGrid, XAxis, YAxis, Line -->
      </div>
      <figcaption class="caption">
        NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the table below.
      </figcaption>
    </figure>
    ```

  - *Output 2 — `src/components/DeathsChart.module.css`* (**new**). Owns **every colour value in
    this task.** `DeathsChart.tsx` contains no colour literal at all — see Constraint 4. Tokens,
    with the light value first and the `prefers-color-scheme: dark` value second, scoped to
    `.figure` and mirroring the pattern `globals.css` already uses:

    | Token | Light | Dark | Role (dataviz) |
    |---|---|---|---|
    | `--chart-series-1` | `#2a78d6` | `#3987e5` | categorical slot 1 — the deaths line and its markers |
    | `--chart-grid` | `#e1e0d9` | `#2c2c2a` | hairline gridline, one step off surface |
    | `--chart-rule` | `#c3c2b7` | `#383835` | axis line |
    | `--chart-ink` | `#52514e` | `#c3c2b7` | secondary ink — axis ticks, the "Deaths" label, the end label |

    The marker's 2px ring uses **`var(--background)`**, the token `globals.css` already defines
    (`#ffffff` / `#0a0a0a`) — the chart's surface *is* the page's surface, so the ring is defined
    against the real thing rather than a second near-white that would show as a seam.

  - *Output 3 — `src/app/page.tsx`* (**edited, minimally**). Exactly two changes:
    1. `import { DeathsChart } from "../components/DeathsChart";`
    2. `<DeathsChart rows={result.rows} />` rendered **only** in the `result.status === "ok"`
       branch, **immediately above the existing `<table>`** — the insertion seam Task 1 left after
       the intro `<p>`.

    Nothing else moves. The `<h1>`, the intro paragraph, the `<table>` and its caption and headers,
    the `role="status"` empty message, the `role="alert"` error message, and the `<details>` FR-8
    disclosure are all untouched, so every assertion in the existing `src/app/page.test.tsx`
    continues to describe live behavior. `page.tsx` gains no `className`, no CSS-module import, and
    no `'use client'` directive — it stays a Server Component with zero styling, exactly as Task 1
    specified. **This is why the `<figure>` lives inside the component and not on the page:** the
    caption and layout are the chart's concern, they need the chart's stylesheet, and putting them
    in `page.tsx` would drag a CSS-module import into a file that has deliberately never had one.

  - *Acceptance, by command, with `node -v` recorded beside every result*:
    1. Step 0's four `npm view` / version recordings, above.
    2. `npm install recharts@^3` (or the exact 3.x pinned by Step 0). Then `npm ls recharts` —
       record it; expect one deduped 3.x entry.
    3. `npm audit` — report anything high or critical. Do **not** run `audit fix --force`.
    4. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    5. From the `npm run build` output, **record `/`'s First Load JS**. No threshold is set here
       and none may be invented: the number is evidence for the deploy SPEC's NFR-1 check, which
       owns the budget. Report it; do not react to it.
    6. `npm run dev`, then load `/` and look at it — in light mode and in dark mode (OS setting),
       at a desktop width and at a 320px width. Confirm: the line renders, the y-axis starts at 0,
       all eight markers are visible, the end label is not clipped, no horizontal scrollbar
       appears, and both modes are legible. The `dataviz` procedure's step 7 is "render it and look
       at it"; the validator checks colour, not layout. Then `git checkout -- CLAUDE.md` and
       confirm `git status` is clean for that path.
    7. **Palette validation, recorded.** Load the bundled `dataviz` skill, note its base directory,
       and run its validator against **this project's actual surfaces**, both modes:
       - `node <dataviz-base>/scripts/validate_palette.js "#2a78d6" --mode light --surface "#ffffff"`
       - `node <dataviz-base>/scripts/validate_palette.js "#3987e5" --mode dark --surface "#0a0a0a"`

       Record the resolved path and the full output. If a flag name differs, run the script's
       `--help` and record what it actually accepts — the requirement is *the recorded output of
       the real tool*, not a particular command string. The skill's non-negotiable is "never
       eyeball whether a palette is safe — run the script"; Cedar's contrast arithmetic in §
       Intellectual Control is orientation only and is **not** the evidence. If a check FAILs, halt
       and request a revised `[SPEC]` with the failing output attached — do not re-pick a hue
       locally.
    8. **The no-authored-figure grep**, run by Magnolia on its own work and again by Cypress:
       `git grep -nE '(^|[^0-9.])(229|231|244|268|269|280|290|297)([^0-9]|$)' -- src ':!*test*'` →
       zero hits. See Constraint 3 for why this grep, and not the hook, is the net here.
    9. **The client-boundary greps**, all three expected empty:
       - `git grep -n 'process\.env' -- src/components` → no hits.
       - `git grep -n '@/' -- src/components src/app/page.tsx` → no hits.
       - `git grep -n 'lib/deaths' -- src/components` → exactly one hit, and it begins
         `import type`.

- **Query**: **none — this task issues no query and touches no query.** It adds no `fetch`, no
  dataset ID, no `$select`/`$where`/`$group`/`$order`, and no new Route Handler. Every figure it
  displays arrives as the `rows` prop, already produced by Task 1's pinned SoQL aggregation,
  already validated by `src/lib/deaths.ts`'s Zod schema and year-coverage check. `src/lib/deaths.ts`,
  `src/app/api/deaths/route.ts`, and `DEATHS_SOQL` are **read-only to this task** — Magnolia may
  not edit, extend, re-export, or "helpfully tidy" any of them. FR-8's disclosure already renders
  the query in all three states and needs nothing from this task.

- **Design Pattern**: **none — simple case.** Variance analysis per Rule 8: the fixed 2018–2025
  window and the dataset ID are stable, and the axis that genuinely varies — the *set of series*
  rendered — still has exactly one member today. A chart-type Strategy, a series registry, a
  `<Chart>`/`<Chart.Line>` compound component, or a config-object prop would each be an abstraction
  with one implementation, which is the unearned-pattern failure Rule 8 names. `composition-patterns`
  was consulted and its highest-priority rule is the one that decides the prop signature:
  `architecture-avoid-boolean-props` — hence a single `rows: DeathsRow[]`, not
  `{ data, showGrid, showLegend, variant }`. Its `patterns-explicit-variants` rule pre-answers the
  next question too: when FR-2's injuries series arrives, the answer is an explicit second
  component or an explicit `series` prop *introduced by that SPEC*, never a `showInjuries` boolean
  bolted onto this one. Task 1's Tipping Point already fixed where encapsulation is earned —
  *parameterize at two, encapsulate at three* — and pinned "three" to a third distinct **query
  shape**. This task adds **zero** query shapes, so it moves that counter not at all.

- **UI Scope**: **structural.** New DOM enters the page: a `<figure>`, a `role="img"` plot
  wrapper, a `<figcaption>`, and an SVG subtree that did not exist before. A new component and a
  new stylesheet are created. This is not a restyle of an existing layout, and Magnolia should not
  treat it as one — but it is also **bounded**: the only structural change to `page.tsx` is the
  single element inserted at the seam. Restyling the `<h1>`, the intro paragraph, the table, the
  error states, or the `<details>` disclosure is **out of scope** and would be a silent re-scope of
  a file Task 1 owns. Page-level layout and typography belong to a later SPEC.

- **Intellectual Control**:

  - *Why the chart takes `DeathsRow[]` and nothing else.* The alternative shapes each buy a
    problem. A config object (`{ data, height, colors }`) is the boolean-prop failure wearing a
    different hat: every future need becomes a new key, and the component's contract becomes
    unreadable without reading its body. Passing the whole `DeathsResult` union would force the
    chart to re-branch on `status`, duplicating the decision `page.tsx` already makes and creating
    a second place where the error state could be got wrong. Fetching its own data would be a
    client-side `fetch` — the token is server-side only, the Route Handler exists precisely so the
    page needn't do this, and it would ship a loading state, a second cache, and an error path for
    data the server already had in memory. `rows` is the narrowest thing that suffices, and it is
    serializable, which the server→client boundary requires.
  - *Why the figure and caption live in the component rather than the page.* Three reasons, in
    priority order. **Ownership:** the caption describes the chart, so it belongs with the chart,
    and the same stylesheet that themes the marks themes the caption. **Diff surface:** `page.tsx`'s
    change becomes an import and one element, so Task 1's existing tests keep testing what they
    were written to test instead of being rewritten around a restructure. **Boundary hygiene:** a
    CSS-module import in `page.tsx` would be the first styling that file has ever carried, against
    Task 1's explicit "Redwood must not open a stylesheet" line; keeping it out preserves a clean
    server/presentation split that a later layout SPEC can build on rather than unwind.
  - *Why the y-axis must start at zero, and why this is an integrity requirement and not taste.*
    The deaths series runs roughly 229–297 across eight years. On an auto-fitted axis those figures
    fill the plot and the line reads as a mountain range — a dramatic rise and a dramatic collapse.
    Zero-based, the same data reads as what it is: **essentially flat**. The product's entire thesis
    is that *deaths barely moved while recorded collisions fell 63%*; a truncated axis would have
    the flagship chart visually contradict the argument the page makes in prose, and would do it
    through a rendering default nobody chose. This is NFR-5 (honesty of presentation) expressed as
    geometry, and it is not negotiable at implementation time. The same reasoning forbids
    `type="monotone"`: a spline draws values *between* the yearly aggregates that no query produced,
    which is a language-model-free way of putting an invented figure on the page. `type="linear"`
    connects measured points and asserts nothing between them.
  - *Why no hover layer, when the `dataviz` skill ships one by default.* The skill's own stated
    rationale for the tooltip is that a reader must be able to get a value off the chart, and its
    own hard rule is "tooltips enhance, they never gate — every value a tooltip shows is also
    reachable without it." Here, **every** value is already reachable without it: eight rows sit in
    a permanent table directly below the figure, and the endpoint is directly labelled on the line.
    A tooltip would add a WCAG 2.2 §1.4.13 obligation (dismissible / hoverable / persistent), a
    keyboard-parity obligation, a themed tooltip surface in both modes (Recharts' default is a
    white box that is unreadable on the dark surface), and a cursor treatment — for zero
    information gain over the table. That is ceremony, and the walking-skeleton rule says build the
    thinnest slice that works. It stops being ceremony the moment a **second series** lands: with
    two lines and no per-point labels, "one tooltip, every series" becomes the only reasonable way
    to read a crossing, and the crosshair earns itself. That trigger is written into the Tipping
    Point so the deferral expires on a condition rather than on someone remembering.
  - *Why the chart is `role="img"` and the table stays the accessible representation.* An
    unlabelled `<svg>` is announced as nothing useful; Recharts' own `accessibilityLayer` is the
    other option and it takes `role="application"` plus a bespoke keyboard model, which would
    create a *second* accessible representation of the same eight numbers that could disagree with
    the table and would need its own AT testing to trust. One representation, tested, is worth more
    than two that might drift. So the plot wrapper carries `role="img"` and a short label that names
    the form and the window and deliberately **contains no figure at all** — a label reciting
    values would be a hand-maintained copy of the data, which is precisely the NFR-4 failure mode,
    and it would go stale the first time the feed revises. The `<figcaption>` then points explicitly
    at the table, so a screen-reader user reaches the numbers by following a stated route rather
    than by guessing that the table below is the same data.
  - *Why colour lives entirely in CSS and geometry entirely in props.* SVG presentation attributes
    do not resolve `var()`, so a hex passed as a Recharts prop cannot switch between light and dark.
    Splitting on that seam turns an annoyance into a rule with teeth: `DeathsChart.tsx` may contain
    **no colour literal**, which is a one-line grep, and every mode-dependent value therefore lives
    in one stylesheet where a reviewer can check contrast in a single place. It also draws the test
    boundary honestly — jsdom applies no CSS-module styles, so Cypress asserts what is genuinely
    assertable there (attributes, class names, structure, tick text) and colour is verified by the
    validator and by looking at the page, rather than by a test that only appears to check it.
  - *Why the test harness adapts to the component, and not the reverse.* jsdom has no
    `ResizeObserver` and reports zero-size elements, so `<ResponsiveContainer>` renders an empty
    chart there. The tempting fix is a `width`/`height` prop "for tests" — which is a
    production-visible escape hatch existing only to make a test pass, the first crack through
    which config props arrive. The harness is the right place to fix a harness limitation, so
    `vitest.setup.ts` stubs the observer and the dimensions (Cypress's file, Cypress's budget) and
    the component's contract stays clean.
  - *Why this will not break at scale.* The whole surface is one component with one prop, one
    stylesheet with four tokens, and a two-line mount. The chart cannot disagree with the table
    because they render the same array from the same render pass; it cannot disagree with the
    displayed SoQL because it never sees a query; and it cannot fabricate a figure because it
    performs no arithmetic — the only value it writes to the screen that the table doesn't is the
    end label, which is `rows[rows.length - 1].deaths` verbatim.

- **Constraints**:

  1. **The client boundary is absolute (NFR-2, Rule 3).** `src/components/DeathsChart.tsx` carries
     `'use client'` and must never read `process.env`, never import `src/lib/deaths.ts` as a value,
     and never receive a token by any route. The `DeathsRow` import is `import type` — the `type`
     keyword is required, not implied. `guard-data-integrity.sh` will **not** catch a value import
     here (its client check greps for `process.env.*TOKEN` in the file itself), so acceptance
     clause 9's three greps are the mechanism.
  2. **The query is frozen and is not this task's to touch** (Rule 4). No edit to
     `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, or `DEATHS_SOQL`. If the chart appears to
     need a differently shaped row, **halt and request a revised `[SPEC]`**; do not reshape the
     data in the component and do not add a transform step.
  3. **No figure may be authored, and the hook will not catch you here.**
     `guard-data-integrity.sh` pins 26 six-digit literals (collisions, injuries,
     casualty-filtered). The deaths values are three digits and are **deliberately absent** from
     that list, because a pattern matching them would fire on every ordinary small number —
     including `r={4}`, `strokeWidth={2}`, and `height={320}` in this very component. So for *this*
     task the mechanical net does not exist, exactly as it did not for Task 1. No deaths figure may
     appear anywhere in `src/**` outside test files — not as a fallback, a placeholder, a comment, a
     default, a `domain` bound, a tick array, or a "temporary" mock while the chart is wired up.
     Acceptance clause 8's grep is the net; run it before reporting, not after being asked.
  4. **`DeathsChart.tsx` contains no colour literal.** No `#rrggbb`, no `rgb()`, no named CSS
     colour, no `hsl()`. Colour-bearing props are either omitted (letting the stylesheet own them)
     or set to `"currentColor"`. Every hex in this task lives in `DeathsChart.module.css`.
     Mechanically checkable: `git grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|hsl\(' -- src/components/DeathsChart.tsx`
     → zero hits.
  5. **The dashed stroke is reserved and must not be spent here.** FR-3 assigns the
     dashed-stroke-plus-inline-label treatment to the **collisions** series, because that is the
     reporting-affected one. Deaths are the medical-examiner-mandated figure — the *least*
     discretionary series in the dataset and the reason it is the walking skeleton's metric. A
     dashed deaths line would mis-signal the product's central distinction before the collisions
     series even exists. The deaths line is **solid**, and Cypress asserts the absence of a dash
     pattern on it.
  6. **Zero-based y-axis, linear interpolation.** `domain={[0, "auto"]}` stated explicitly rather
     than inherited from a library default, and `type="linear"` on the `<Line>`. Neither may be
     changed to make the chart "more readable"; see Intellectual Control.
  7. **No animation at all.** `isAnimationActive={false}`. NFR-3 requires respecting
     `prefers-reduced-motion`; a chart with no motion satisfies that unconditionally and needs no
     media query, no state, and no branch. Entrance animation on a static historical aggregate is
     decoration, and it also makes the rendered DOM time-dependent, which makes tests flaky. Do not
     add a `@media (prefers-reduced-motion: reduce)` block for motion that does not exist.
  8. **Recharts' `accessibilityLayer` stays off.** See Intellectual Control; enabling it creates a
     second, untested accessible representation and a `role="application"` that fights the
     `role="img"` contract.
  9. **One new dependency: `recharts@^3`**, authorized here under Rule 9 because this is the first
     task with a chart to draw. Nothing else may be installed — not a Recharts plugin, not a colour
     library, not `clsx`, not a charting helper, not `vite-tsconfig-paths`. If something appears
     necessary, halt and request a revised `[SPEC]`.
  10. **Relative imports only** in both touched source files (standing clause above).
  11. **Files not to touch**: `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, any
      `*.test.ts(x)`, `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`,
      `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.module.css`,
      `.claude/**`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/**`, `SESSION_STATE.md`.
      `globals.css` is on that list deliberately: the four chart tokens have exactly one consumer
      today, and hoisting them to a global stylesheet before a second consumer exists is the same
      unearned-abstraction move Rule 8 rejects for patterns. The Tipping Point names when they move.
  12. **Performance is measured, not asserted (NFR-1).** Record `/`'s First Load JS from the build
      output. Do not add `next/dynamic`, a lazy boundary, a manual chunk split, or any other
      optimization on speculation — there is no measurement yet that justifies one, and the deploy
      SPEC owns the budget.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. **`npm audit` after install**; report high/critical, never `audit fix --force`.

- **Pinned rendered contract** (what Cypress asserts against the produced SVG — this, not a prop
  spelling, is the binding requirement):

  | Element | Pinned outcome |
  |---|---|
  | Line stroke | `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"` |
  | Line dash | **no** `stroke-dasharray`, or `0`/`none` — solid (Constraint 5) |
  | Line shape | straight segments between points (`type="linear"`); no spline |
  | Markers | one per row — `rows.length` of them, never a hardcoded 8 — radius ≥ 4 (≥8px across), `stroke-width="2"` for the surface ring |
  | Gridlines | horizontal only, 1px, solid, no dash pattern |
  | Y-axis | domain starts at 0; a `0` tick is rendered |
  | Y-axis label | the word **"Deaths"**, rendered **horizontally** with no rotation transform, near the top of the axis. Never `angle={-90}` — a rotated axis title is the least readable label on any chart, and the figcaption plus the table's `Deaths` column header already carry the unit |
  | X-axis | category scale over `year`; ticks `2018` and `2025` always present; interior ticks may be dropped by the library at narrow widths. Never a numeric scale — it invents fractional-year ticks like `2017.5` |
  | Direct label | **exactly one** value label, on the last point, positioned to its right, in `--chart-ink` (never the series colour — dataviz: text wears text tokens). Its text is `rows[rows.length - 1].deaths` verbatim: no `toLocaleString`, no separator, no rounding, no unit suffix |
  | Legend | **none.** dataviz is explicit that a single series needs no legend box — the caption already says what is plotted, and a one-swatch legend restates the title and costs space |
  | Tooltip / crosshair | **none** in this task (see Intellectual Control and the Tipping Point) |
  | Animation | none |
  | Container | `ResponsiveContainer` at `width="100%"`, `height={320}`; a fixed height reserves space so nothing shifts on hydration, and 320 includes the x-axis band rather than clipping it into a nested scroll |
  | Margin | right ≥ 48px so the end label has room and is never clipped; no `overflow: hidden` anywhere in the module |

  **Prop-name drift is Magnolia's to absorb, not to halt on.** The props implied above
  (`ResponsiveContainer`, `LineChart`, `CartesianGrid vertical={false}`, `XAxis dataKey="year"`,
  `YAxis domain={[0,"auto"]}`, `Line type="linear" dataKey="deaths" strokeWidth={2}
  isAnimationActive={false}`, a `dot` config carrying `r` and `strokeWidth`, and a custom label
  renderer that returns content only at the last index) are Cedar's intended means. If a name or
  signature differs in the installed `recharts@3.x`, use the equivalent that produces the **pinned
  rendered outcome** and record the substitution in the `[COMPLETION-REPORT]`. Rule 4's freeze
  covers queries, not library call signatures, so this needs no revision cycle. What *does* require
  a halt: an outcome in the table above that cannot be produced at all.

- **Deliberate deviations from the `dataviz` skill** (named here so they are decisions on the
  record, not drift):

  1. **No hover/tooltip layer**, which the skill ships by default on line charts. Argued in
     Intellectual Control; expires at the second series (Tipping Point).
  2. **Axis and label ink is the secondary step (`#52514e` / `#c3c2b7`), not the muted step
     (`#898781`).** The muted step measures roughly 3:1 against this project's surfaces, which is
     fine for chrome but short of WCAG 2.2 AA's 4.5:1 for text — and axis ticks are text. `axe-core`
     historically does not evaluate contrast inside SVG, so this would have passed the mechanical
     gate while failing the standard NFR-3 names. Where the project's own floor is stricter than a
     skill default, the floor wins.
  3. **The chart surface is the page background (`#ffffff` / `#0a0a0a`), not the skill's reference
     surfaces (`#fcfcfb` / `#1a1a19`).** This page has one plane; inserting a card surface *darker*
     than the page in light mode would invert the relationship the reference intends. `palette.md`'s
     own instruction covers this — "when you swap in your own palette, re-run against your own
     surfaces" — which is exactly what acceptance clause 7 does.

  Not deviations, recorded so they are not mistaken for oversights: no legend (the skill's rule for
  a single series), no texture (opt-in only), no stat tile (FR-1 is a time series over eight years —
  the form heuristic was checked in Task 1 and re-checked here, and the answer is still a line
  chart).

- **Edge Cases**:

  1. **`result.status` is `"empty"` or `"error"`** → the chart does not render **at all**. No empty
     axes, no zero baseline, no "no data" placeholder inside a `<figure>`, no skeleton. An axis
     drawn with no line is indistinguishable at a glance from a series that fell to nothing, which
     is the fabricated-safety-improvement failure in visual form. Task 1's `role="status"` and
     `role="alert"` messages remain the entire response, unchanged.
  2. **jsdom has no `ResizeObserver` and reports zero-size elements**, so `<ResponsiveContainer>`
     renders nothing under Vitest and every SVG assertion would vacuously fail. This is the
     equivalent of Task 1's Edge Case 10 arriving for the UI layer. Sanctioned resolution, in
     **Cypress's** budget and file (`vitest.setup.ts`, already enumerated as Cypress's): stub
     `globalThis.ResizeObserver` and override the element-dimension getters to a fixed plot size.
     Sanctioned fallback if that proves insufficient after one honest attempt: `vi.mock("recharts",
     …)` replacing **only** `ResponsiveContainer` with a fixed-size passthrough, leaving every other
     export real so the inner assertions stay genuine. **Not sanctioned:** adding width/height props
     to the component, or downgrading the assertions to "a `<figure>` exists".
  3. **A hydration warning or an SSR mismatch from `ResponsiveContainer`** (it cannot know a width
     on the server). If one appears, the sanctioned lever is Recharts' `initialDimension` on the
     container — recorded in the `[COMPLETION-REPORT]`. Not sanctioned: `next/dynamic` with `ssr:
     false`, which trades a warning for a layout shift and a blank frame, against NFR-1.
  4. **A row with `deaths: 0`.** Legal, and must render as a point on the baseline. Never filtered,
     never treated as missing, never made to look like an absent year. (Task 1's validator makes an
     *absent* year impossible to reach the chart — that path ends in the error state — but a genuine
     zero is data.)
  5. **`rows` in an unexpected order, or a length other than 8.** The chart renders `rows` in the
     order given and plots `rows.length` markers. It does **not** sort, re-sort, slice, pad, or
     assert a count — `src/lib/deaths.ts` already guarantees exactly eight ascending years, and
     duplicating that guarantee in the view creates a second place for it to be wrong. Concretely:
     no `EXPECTED_YEARS` array, no `.sort()`, no `.filter()`, no `.slice()` in this component.
  6. **Very narrow viewport (320px).** `ResponsiveContainer` at `width="100%"` with `min-width: 0`
     on the plot wrapper. The library may drop interior x-ticks; that is acceptable because the
     table lists every year. What is **not** acceptable: a clipped end label, a horizontal
     scrollbar, or `overflow: hidden` used to hide either (an anti-pattern the skill names
     explicitly — it crops characters and is worse than no label). Verified by eye in acceptance
     clause 6, not by assumption.
  7. **Dark mode.** Driven by `prefers-color-scheme` only, mirroring `globals.css`. This project
     has no theme toggle, so `palette.md`'s dual-scope `[data-theme]` guidance does not apply and a
     toggle must not be invented to match it.
  8. **`recharts@3.x` fails Step 0's engine or peer check** → halt, request a revised `[SPEC]`. Do
     not install with `--force` or `--legacy-peer-deps`.
  9. **`CLAUDE.md` is dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`. Expected, not a
     defect; never committed, never "fixed" at the source.
  10. **The live 2025 figure has moved from the pinned 229.** Not this task's concern to adjudicate
      and absolutely not this task's to correct — the chart plots what it is handed. If it is
      noticed, report it as a finding; `/verify-figures` is the mechanism and PRD §7 names the
      two-year-average fallback as the response.

- **Files** (max 5 — five used):

  1. **`package.json`** — add `recharts@^3` to `dependencies` (production: it renders the page).
     No new scripts; the count stays 7 against the 8-script tipping point.
  2. **`package-lock.json`** — install artifact; committed, per the scaffold SPEC.
  3. **`src/components/DeathsChart.tsx`** — *new.* `'use client'`; the `DeathsChartProps` type,
     the `<figure>`/`role="img"`/`<figcaption>` structure, the Recharts composition, and the
     last-point-only label renderer. Earns its own file because Recharts is client-only and
     `page.tsx` must stay a Server Component — this is the client boundary, and it is the only one.
  4. **`src/components/DeathsChart.module.css`** — *new.* The four tokens in both modes, the mark
     and text colours, and the figure's layout. Earns its own file because SVG presentation
     attributes cannot resolve `var()`, so mode-dependent colour has nowhere else to live; and
     co-locating it with the component (rather than extending `page.module.css` or `globals.css`)
     keeps the chart's theme in the chart's own scope until a second consumer exists.
  5. **`src/app/page.tsx`** — *edited.* One import, one element, inside the existing `ok` branch.
     Nothing else in the file changes.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger (this SPEC does not touch that file), and `src/app/page.module.css`.

  **On `page.module.css`, the decision this SPEC was asked to make.** Three options were weighed.
  *Repurpose it as the chart's stylesheet* — rejected: it is `src/app/page.module.css`, a
  page-scoped module, and the chart lives in `src/components/`; a component's styles belong beside
  the component, and the file's actual contents (`.ctas`, `.logo`, button hover states,
  `--font-geist-*` bindings) are scaffold furniture for a page that no longer exists, so
  "repurposing" means deleting 150 lines and writing new ones in a file with a misleading name.
  *Delete it* — rejected on budget: the deletion is the sixth file, and the **7th-file test**
  (which applies to any file beyond a sized budget) fails on limb (i): the orphan causes no failure
  that deletion is the only thing to catch. It is dead CSS that no bundle ships, because nothing
  imports it. *Leave it orphaned* — adopted, with the difference from Task 1 being that it is no
  longer deferred to an unnamed future: it is now in § Carried forward with an owner (the next SPEC
  that touches page-level layout) and a Cypress flag if that SPEC lands without it. A second silent
  inheritance would have been the drift ADR 0001 was written about.

  **If Magnolia believes a sixth file is required**, halt and request a revision naming (i) the
  specific failure the sixth file is the only thing that catches and (ii) which of the five cannot
  carry it.

- **Tipping Point**: this is one component, one prop, one stylesheet, and it stays reviewable
  while it is. Decompose or revise when **any one** trips:

  - **A second series lands (FR-2 injuries, or FR-3 collisions).** Three things become due in the
    same SPEC, and none of them may be retrofitted here in advance: a **legend** (dataviz: mandatory
    at ≥2 series, because identity must never rest on colour-matching alone), the **crosshair +
    tooltip** layer deferred above (with its §1.4.13 and keyboard-parity obligations), and FR-3's
    **dashed stroke plus inline "affected by reporting decline" label** on the collisions series
    specifically. That is also the moment the component stops being `DeathsChart`: it takes an
    explicit series list, gets renamed, and the four colour tokens move from the module to
    `globals.css` because they finally have two consumers.
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key). Inherited unchanged from Task 1: *parameterize at two, encapsulate
    at three* — that is where a Strategy or a small series registry is finally earned. This task
    moves the counter by zero.
  - **`DeathsChart.tsx` exceeds ~130 lines, or its custom label renderer grows a second case** (e.g.
    also labelling the extreme). Split the label renderer and the axis configuration into their own
    module then; a chart component that is mostly renderer callbacks has stopped being readable as
    a chart.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section, or exceeds ~150
    lines.** Inherited from Task 1: decompose into components, and re-read `ARCHITECTURE.md`'s
    revisit trigger in CLAUDE.md § Project Layout at the same time.
  - **A measured performance problem** — a real Lighthouse or Slow-4G number from the deploy SPEC,
    not a hunch about bundle size. `next/dynamic` around the chart is the documented lever, and it
    is to be pulled *after* a measurement, never before.
  - **A second component needs the chart tokens.** Hoist them to `globals.css` in that SPEC. Not
    before — one consumer is not a design system.

**Ordering** (standard `[SPEC]`, no override): **Cypress writes failing tests first**, then
Magnolia implements, then Cypress audits and emits the `[COMPLIANCE-REPORT]`. Cypress's own budget
— not Magnolia's five — covers `src/components/DeathsChart.test.tsx` (new), edits to
`src/app/page.test.tsx`, and the `vitest.setup.ts` jsdom stubs from Edge Case 2. Cypress installs
nothing; `package.json` is Magnolia's file, so Cypress's first run will fail on an unresolved
`recharts` import, which is the correct red.

**Test guidance for Cypress** (behavioral, per Rule 4 — assert the rendered output, not Recharts'
internals). Use an obviously synthetic 8-row fixture (`11, 22, 33 … 88`), **never** PRD Appendix
A's real deaths column: a passing test must never be confusable with evidence that the live data is
correct. Assertions worth writing:

- On `ok`: a `<figure>` exists; its `<figcaption>` names the window and points at the table; the
  plot wrapper exposes `role="img"` with a non-empty accessible name containing no digits other
  than the window years.
- Exactly `rows.length` data markers render (drive it off the fixture's length, not the literal
  8), each with radius ≥ 4 and a 2px ring.
- The series path carries `stroke-width="2"`, round cap and join, and **no** dash pattern.
- The y-axis renders a `0` tick — the zero-baseline assertion, which is the single most important
  test in this file.
- The x-axis renders `2018` and `2025`.
- Exactly one direct value label exists, its text equals the fixture's last `deaths` value (`88`)
  with no formatting applied, and it is not inside the y-axis tick group.
- A horizontal `Deaths` label exists with no rotation transform.
- The curve's `d` attribute is non-empty on the first synchronous render (no entrance animation).
- `axe-core` over the rendered `<figure>` → zero violations; and the existing whole-page axe
  assertion still passes with the chart mounted.
- On `empty` and on `error`: no `<figure>`, no `<svg>`, and Task 1's existing message and FR-8
  disclosure assertions still hold.
- Source-level greps (they are tests too, and they are the only net for three of the constraints):
  no colour literal in `DeathsChart.tsx`; no `process.env` under `src/components`; no `@/` import
  in either touched file; the sole `lib/deaths` reference under `src/components` is an `import
  type`; and the eight real deaths figures appear nowhere in non-test `src/**`.

**Background/reference resources (Constraint of Three)**. Two **skill loads** are mandatory and are
not reference items: **`mvcc-data`** (CLAUDE.md requires it before any chart that displays a figure
— trap 1 and the string-typing rule are what Task 1's validator implements upstream of this
component) and **`dataviz`** (required before the first line of chart code;
`references/marks-and-anatomy.md`, `references/palette.md`, and `references/anti-patterns.md` are
the three files that decide the mark spec, the hexes, and the failure catalog). The `dataviz` skill
is bundled, not vendored in this repo — there is no `.claude/skills/dataviz/` here, so its
validator's absolute path is session-dependent; record the resolved path when you run it. The
three reference items are:

1. `ARCHIVED_SPECS.md`, Task 1's `[SPEC]` — specifically its Constraint 2 (why the integrity hook
   does not cover three-digit deaths figures), its Constraint 9 (the `page.module.css` orphan
   decision this SPEC now closes), and its Tipping Point (which this task inherits unchanged).
2. `src/app/page.tsx` and `src/lib/deaths.ts` — the insertion seam, the `ok`/`empty`/`error`
   branches that must survive untouched, and the `DeathsRow` type. Read both; edit only the first,
   and only as specified.
3. `.claude/hooks/guard-data-integrity.sh` — what is mechanically caught (a `NEXT_PUBLIC_*` token
   name; `process.env.*TOKEN` inside a `'use client'` file; 26 six-digit pinned literals) and, more
   importantly, what is not (a value import of the token-reading module; any three-digit deaths
   figure).

## [FORCES]

1. **An honest axis > a dramatic one** — zero-based y, linear interpolation, no smoothing. The
   flagship chart of a data-integrity product may not owe its shape to a rendering default.
2. **An always-present accessible table > a toggle that hides one** — NFR-3 asks that the data *be
   available*, and unconditional availability is strictly stronger than availability behind a
   control. Nothing is built to satisfy a mental model the requirement does not contain.
3. **A pinned rendered contract > a pinned prop spelling** — Cypress asserts SVG attributes, so the
   requirement survives a library API Cedar cannot verify from here, and the test proves geometry
   rather than existence.
4. **The harness adapts to the component > a test-only prop on the component** — jsdom's missing
   `ResizeObserver` is fixed in `vitest.setup.ts`, never with a width prop that would live in
   production forever.
5. **One representation of the data, tested > two that might disagree** — the table is the
   accessible representation; the chart is `role="img"` with a label that recites no figures.
6. **Simplicity > Pattern purity.**

---

## What comes after this task

Not declared, not scoped, and deliberately not sketched here — Task 1's sketch of Task 2 had to be
rewritten from scratch two days later, which is the argument against pre-declaring the next one.
The open P0 work is FR-2 (injuries), FR-3 (collisions with the dashed + inline-label treatment),
FR-4 (% change per metric), FR-12 (the casualty-filtered repaired series), and FR-9 (caveats). FR-3
and FR-12 carry the product's actual thesis, and FR-3 is the first task that will trip this SPEC's
Tipping Point on all three counts at once.
