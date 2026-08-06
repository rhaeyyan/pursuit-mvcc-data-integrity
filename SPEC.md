# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Magnolia (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why small multiples, not a merged two-series chart (Cedar's correction, recorded)

The dispatch brief framed this task as "mount collisions as a second series on `DeathsChart.tsx`,"
which implies one shared-axis plot. Cedar rejected that outright rather than implementing it as
briefed. Deaths run 229–297; collisions run 85,546–231,564 — roughly an 800× spread. On one
zero-based linear axis, the deaths line would sit within ~0.15% of the axis height from zero:
visually indistinguishable from flat-at-zero. That erases the exact contrast (deaths essentially
flat, collisions cratering) that Task 2's Constraint 6 wrote the zero-based-axis rule to *protect*,
and it's `dataviz`'s own named anti-pattern #1 (dual/shared axes across incompatible scales invent
a correlation the data doesn't support; the prescribed fix is "two charts, small multiples, or index
both series to a common base"). This SPEC builds **two independently-scaled single-series charts**
instead — small multiples — each keeping its own zero-based axis.

That correction cascades cleanly: because each panel stays single-series, `dataviz`'s legend rule
("mandatory at ≥2 series in *one* plot") never fires, and the deferred tooltip/crosshair's original
justification (every value already reachable in the table below, and no series overlap so nothing
crosses) still holds — small multiples never let two lines cross. The three-way trigger the backlog
note (legend + tooltip + dashed stroke, all at once) was written against the merged-axis reading;
only the dashed-stroke trigger actually fires here.

**Component shape:** `DeathsChart.tsx` generalizes into `src/components/YearlyLineChart.tsx`, a
single-series line-chart component parameterized by explicit props (`fieldAlias`, `seriesLabel`,
`strokeStyle: "solid" | "dashed"`, `colorSlot: 1 | 2`, `ariaLabel`, `captionText`, optional `note`)
— mirroring `MetricSection<K>`'s already-established generic-over-`fieldAlias` shape, not a boolean
flag or config object. Two calls in `page.tsx` (deaths, collisions) replace the one. This is the
exact trigger Task 2's own Tipping Point pre-named ("a second series lands... the component stops
being `DeathsChart`... takes an explicit series list, gets renamed").

**Two copy sub-decisions, human-confirmed as proposed** (no change from the defaults below):
1. Deaths chart's `ariaLabel`/`captionText` stay byte-identical to Task 2's hardcoded strings, now
   passed explicitly as props instead of hardcoded internally.
2. Collisions chart reuses the identical reporting-policy sentence already shipped on the table
   (not a reworded chart-specific variant) — NFR-5's "in every rendering" reads most honestly as
   *the same claim*, not a paraphrase that could drift from it per rendering surface.

---

```markdown
[SPEC]
- **Objective**: Close FR-3's remaining chart half by adding recorded collisions per year as its
  own single-series, dashed-stroke, inline-labelled line chart — **not** a second `<Line>` merged
  onto `DeathsChart.tsx`'s axis. `DeathsChart.tsx` generalizes into
  `src/components/YearlyLineChart.tsx`, a parameterized single-series chart used twice: once for
  deaths (unchanged rendered output, solid, blue/slot-1) and once for collisions (new, dashed,
  orange/slot-2). The two charts are **small multiples**, not one two-series plot — see
  Intellectual Control for why a shared axis is rejected outright, not merely deferred.

- **Requirement**: **FR-3 [P0]** (PRD line 199) — closes the requirement fully. The data-half SPEC
  ("Collisions per year: the raw reporting-affected series") already satisfied the "display
  recorded collision counts" and "explicit inline label" clauses via the table; this task adds the
  "dashed stroke" clause FR-3 explicitly requires conjunctively with the label. Also: **NFR-3**
  (chart data stays available as the pre-existing accessible table; `role="img"` + `figcaption`
  pattern extended, not reinvented), **NFR-4** (no figure computed — both charts plot arrays
  already fetched and validated by `src/lib/socrata.ts`), **NFR-5** (the collision series now
  carries the dashed-stroke-plus-label treatment "in every rendering" — table and chart both;
  copy stays consistent between them, not reworded per surface), **NFR-6** (no new browser API).
  Explicitly **not** in scope: **FR-4** (% change — still blocked; see Tipping Point for why an
  indexed/percent view is a *different* component, not this one), **FR-9** (caveats section),
  **FR-13** (policy-date reference markers — a small-multiples design accommodates these more
  naturally later than a merged chart would have, but they are not added here), the severable
  FR-5–7 arrest group.

- **Inputs/Outputs**:

  **Phase 1 — Cypress (tests first, standard ordering).** This is new rendered behavior on a
  renamed component, so tests precede implementation per Rule 4.

  1. Rename `src/components/DeathsChart.test.tsx` → `src/components/YearlyLineChart.test.tsx`.
     Generalize its setup to `render(<YearlyLineChart {...deathsProps} />)` where `deathsProps`
     reproduces the **exact** current deaths configuration (`fieldAlias="deaths"`,
     `strokeStyle="solid"`, `colorSlot={1}`, the same synthetic 11/22/…/88 fixture, the same
     aria-label and caption strings passed as props instead of hardcoded). **Every existing pinned
     assertion in this file must keep passing unmodified in meaning** — the deaths configuration's
     rendered output does not change, only how its inputs arrive (props instead of internals).
     Add a new `describe("<YearlyLineChart> — collisions configuration (dashed)")` block, using an
     equally synthetic collisions fixture (never the real 231564/…/85546 column — same
     obviously-synthetic-number rule as the deaths fixture), asserting:
     - `strokeStyle="dashed"` produces a non-null, non-`"0"`, non-`"none"` `stroke-dasharray` on
       `.recharts-line-curve` (exact dash values are Magnolia's choice, not pinned here).
     - `colorSlot={2}` — assert via the rendered class/attribute the component actually uses to
       select the token (Magnolia's implementation choice; Cypress asserts the *effect*, e.g. that
       a distinct CSS custom property or class is present, not a literal hex — colour stays
       untestable-by-jsdom exactly as Task 2 established).
     - The `Legend: none` and `Tooltip: none` rows from Task 2's pinned contract still hold for
       **both** configurations (no `.recharts-legend-wrapper`, no tooltip DOM).
     - `note` renders as a second block inside `figcaption` only when provided; omitted (not an
       empty node) when absent — mirrors `MetricSection`'s `note !== undefined` pattern.
     - All of Task 2's marker/x-axis/y-axis/end-label/a11y assertions re-run against the collisions
       configuration too (parameterized test, not copy-pasted), proving genericity rather than
       assuming it.
     - Source-level greps (Constraint block, generalized): Constraint 1's grep changes from
       "exactly one `lib/*` type-only hit" to **"every `lib/socrata` reference under
       `src/components` is `import type`"** — `MetricSection.tsx` already has one such import, this
       task adds a second in `YearlyLineChart.tsx`, so the expected count is now **2**, both
       `import type`. Constraint 3's pinned-figure grep extends to also forbid the eight real
       collisions figures (231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546) as literals
       anywhere in non-test `src/**`, alongside the existing deaths-figure pattern.
  2. Update `src/app/page.test.tsx`: the `vi.mock("../components/DeathsChart", …)` becomes
     `vi.mock("../components/YearlyLineChart", …)`; the stub differentiates calls by
     `props.fieldAlias` (e.g. `data-testid={`yearly-chart-${props.fieldAlias}`}`). Update every
     assertion currently keyed to "`DeathsChart` called once / not called" to check the **deaths**
     instantiation specifically, and add the parallel set for the **collisions** instantiation:
     called once positioned immediately before the collisions table when `collisionsResult.status
     === "ok"`; never called when `"empty"`/`"error"`; and — this is the independence guarantee
     already established for the three `MetricSection` blocks, now extended to charts — **a
     collisions failure must never suppress the deaths chart, and vice versa**. Update the
     `DeathsChartProps` type import to whatever `YearlyLineChart` exports.
  3. All new/changed assertions fail red against the current tree (no `YearlyLineChart.tsx`
     exists yet).

  **Phase 2 — Magnolia (implementation).**

  - *Step 0*: `node -v` / `npm -v` recorded (Amendment 3(b)); `npm ls recharts` — expect the same
    3.x already installed, unchanged. No new dependency this task.

  - *Output 1 — `src/components/YearlyLineChart.tsx`* (**new**, replaces `DeathsChart.tsx`,
    `'use client'`). Exports:

    ```ts
    import type { YearlyMetricRow } from "../lib/socrata"; // import type — see Constraint 1

    export type YearlyLineChartProps<K extends string> = {
      rows: YearlyMetricRow<K>[];
      fieldAlias: K;               // which row key to plot — mirrors MetricSectionProps<K>
      seriesLabel: string;         // Y-axis title text, e.g. "Deaths" | "Collisions"
      strokeStyle: "solid" | "dashed"; // FR-3's treatment; explicit, not a boolean
      colorSlot: 1 | 2;            // dataviz categorical slot — 1 = blue (deaths), 2 = orange (collisions)
      ariaLabel: string;           // role="img" accessible name, full text, caller-supplied
      captionText: string;         // figcaption's primary sentence, caller-supplied
      note?: string;               // FR-3's inline caveat; rendered as a second figcaption block only when present
    };

    export function YearlyLineChart<K extends string>(
      props: YearlyLineChartProps<K>,
    ): React.JSX.Element;
    ```

    No defaults, no options object, no `className`/width/height escape hatch — same discipline as
    Task 2's single-prop rule, just widened to the props that now genuinely vary across two live
    call sites (`composition-patterns`: parameterize what varies, nothing else).

    Rendered structure (contract; JSX shape is Magnolia's):
    ```html
    <figure class="figure">
      <div class="plot" role="img" aria-label="{ariaLabel}">
        <!-- ResponsiveContainer > LineChart > CartesianGrid, XAxis, YAxis, Line -->
      </div>
      <figcaption class="caption">
        {captionText}
        {note && <p>{note}</p>}
      </figcaption>
    </figure>
    ```

  - *Output 2 — `src/components/YearlyLineChart.module.css`* (**new**, replaces
    `DeathsChart.module.css`). Both series' tokens declared together (still **one** component, two
    instantiations — the Tipping Point's "second *component*" trigger for hoisting to
    `globals.css` has not fired):

    | Token | Light | Dark | Role |
    |---|---|---|---|
    | `--chart-series-1` | `#2a78d6` | `#3987e5` | categorical slot 1 — deaths |
    | `--chart-series-2` | `#eb6834` | `#d95926` | categorical slot 2 — collisions |
    | `--chart-grid` | `#e1e0d9` | `#2c2c2a` | shared chrome, unchanged from Task 2 |
    | `--chart-rule` | `#c3c2b7` | `#383835` | shared chrome, unchanged |
    | `--chart-ink` | `#52514e` | `#c3c2b7` | shared chrome, unchanged |

    The component selects between the two series tokens **without a colour literal in the `.tsx`
    file**: set an inline custom property on the `<figure>` whose *value* is a `var()` reference
    to the chosen slot — e.g. `style={{ "--chart-series": `var(--chart-series-${colorSlot})` }}` —
    and have every paint rule in this stylesheet (`.recharts-line-curve`, `.recharts-line-dot`)
    read `var(--chart-series)`, not `var(--chart-series-1)` directly. This is a reference to a
    named token, not a hex/`rgb`/`hsl` value, so Constraint 4 (no colour literal in `.tsx`) holds
    exactly as it did in Task 2. All other selectors (grid, axis line/tick, `.recharts-label`,
    `.endLabel`) carry forward byte-for-byte from `DeathsChart.module.css`.

  - *Output 3 — `src/app/page.tsx`* (**edited**). Replace the single `<DeathsChart rows={...} />`
    mount with two `<YearlyLineChart>` calls, each positioned exactly where its metric's chart
    belongs relative to the existing table blocks (deaths chart stays immediately above the deaths
    table, unchanged position; a new collisions chart is inserted immediately above the collisions
    `<MetricSection>`, at the seam already used for its `note` prop). Define one local constant so
    the chart's caveat text and the table's caveat text cannot drift apart:

    ```ts
    const COLLISIONS_REPORTING_NOTE =
      "This series is affected by a 2020 NYPD reporting-policy change that reduced how many " +
      "minor collisions are recorded; it is not evidence of a comparable drop in real collisions.";
    ```

    used both as `<MetricSection note={COLLISIONS_REPORTING_NOTE} .../>` (replacing today's inline
    literal) and as `<YearlyLineChart note={COLLISIONS_REPORTING_NOTE} .../>`.

    Chart copy, human-confirmed:
    1. Deaths chart: `ariaLabel="Line chart of NYC traffic deaths per year from 2018 to 2025."`,
       `captionText="NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the
       table below."` — byte-identical to Task 2's hardcoded strings, now passed explicitly.
    2. Collisions chart: `ariaLabel="Line chart of NYC recorded collisions per year from 2018 to
       2025."`, `captionText="NYC recorded collisions per year, 2018–2025. Every plotted figure is
       listed in the table below."`, `note={COLLISIONS_REPORTING_NOTE}`.

  - *Acceptance, by command, `node -v` recorded beside every result*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls recharts` — unchanged 3.x, no reinstall.
    3. `npm run dev`; load `/`, look at it in light **and** dark mode, desktop **and** 320px width:
       both charts render, deaths solid, collisions visibly dashed, no legend box on either, no
       horizontal scroll, no clipped end label on either panel. `git checkout -- CLAUDE.md`
       afterward.
    4. **Palette validation, recorded** (dataviz skill, both slots together since they appear on
       one page and the convention must hold across it):
       - `node <dataviz-base>/scripts/validate_palette.js "#2a78d6,#eb6834" --mode light --surface "#ffffff"`
       - `node <dataviz-base>/scripts/validate_palette.js "#3987e5,#d95926" --mode dark --surface "#0a0a0a"`
       Record resolved path and full output; halt and request a revised SPEC on any FAIL — do not
       re-pick a hue locally (this is why colorSlot 2 is pinned to the *documented* slot-2 orange,
       not an arbitrary "look distinct from blue" choice).
    5. The no-authored-figure grep, extended to the eight real collisions values (Constraint 3,
       generalized) → zero hits.
    6. The client-boundary greps, updated: `git grep -n 'lib/socrata' -- src/components` → exactly
       **2** hits (`MetricSection.tsx`, `YearlyLineChart.tsx`), both beginning `import type`.
       `git grep -n 'process\.env' -- src/components` → no hits (unchanged check).
    7. Report `src/app/page.tsx`'s new line count against the ~150-line Tipping Point.
    8. `npm audit`; report high/critical.

- **Query**: **none.** No `fetch`, dataset ID, or `$select`/`$where`/`$group`/`$order` is touched.
  Both charts consume `rows` already fetched and validated by `src/lib/socrata.ts` via
  `fetchDeathsPerYear()`/`fetchCollisionsPerYear()`, unchanged. `socrata.ts`, `deaths.ts`,
  `collisions.ts`, and both `*_SOQL` constants are **read-only to this task**.

- **Design Pattern**: **none — simple case, parameterization not a GoF pattern.** The variance
  (two metrics needing the same geometry with a different field, stroke, colour slot, and copy) is
  real and was pre-declared as the earned trigger in Task 2's own Tipping Point — but the fix is
  explicit props on one component, exactly `MetricSection<K>`'s already-adopted shape, not a
  Strategy/Factory/compound component. `composition-patterns` was consulted:
  `architecture-avoid-boolean-props` rules out a `showDashed`/`isCollisions` boolean;
  `patterns-explicit-variants` is why `strokeStyle`/`colorSlot` are typed unions, not derived
  implicitly from `fieldAlias` (colour assignment is a design decision independent of which field
  is plotted — a future third metric could need slot 3, not automatically "next available"). A
  merged two-series chart (which *would* justify a real pattern — a small series registry or a
  `<Chart.Line>` compound component) is explicitly rejected below, not merely deferred.

- **UI Scope**: **structural.** A second `role="img"` figure enters the page; a component is
  renamed and its props widen. Bounded exactly as Task 2 bounded it: only the two chart mount
  points and the shared note constant change in `page.tsx`; the `<h1>`, intro paragraph, all three
  tables, and all three disclosures are untouched.

- **Intellectual Control**:
  - *Why a shared y-axis is rejected outright, not deferred.* Deaths (229–297) and collisions
    (85,546–231,564) differ by ~800×. `dataviz`'s anti-pattern #1 names this exact shape of problem
    — a 0–30k series plotted against a 0–800k series — as fabricating an impression the data
    doesn't support, and its own prescribed fix is "two charts, small multiples, or index to a
    common base," never a shared or dual axis. Task 2's Constraint 6 argued zero-basing the deaths
    axis is an *integrity* requirement, not taste, specifically so the flatness of deaths reads
    honestly; putting collisions on that same axis would visually erase the exact thing Constraint
    6 protects. Indexing to a common base (=100 at 2018) is the one alternative the skill offers
    that stays on one axis — deliberately not taken here, because it changes the claim from "here
    are the two literal series" to "here is relative change," which is FR-4's territory (still
    blocked pending its own SPEC) and would require a new computed, tested transform rather than
    plotting the arrays as fetched.
  - *Why this means the "legend + tooltip" half of the prior Tipping Point doesn't fire.* Both
    triggers were written against a merged plot. Small multiples keep each panel single-series, so
    `dataviz`'s "single series needs no legend box" rule (marks-and-anatomy.md) applies to *both*
    panels independently, and the tooltip's original deferral reasoning — every value already sits
    in the table directly below, and nothing on the chart can ever visually cross since the two
    lines never share a plot — still holds without modification. Only the dashed-stroke trigger
    was ever really about the collisions series itself, and it fires here as intended.
  - *Why `colorSlot` is a separate prop from `fieldAlias`, not derived from it.* Coupling colour to
    the data key would make the component silently assume it only ever plots exactly two known
    fields. A future third chart (e.g. FR-12's casualty-filtered repair, if ever charted) should be
    free to take slot 3 (aqua — pre-validated all-pairs per `palette.md`) without the component
    needing a lookup table of field-name-to-colour baked in.
  - *Why `import type { YearlyMetricRow } from "../lib/socrata"` and not from `lib/deaths` or
    `lib/collisions`.* The component now genuinely serves either metric; importing a
    metric-specific module's type would misstate the dependency. `socrata.ts` is still the one file
    that reads the token, so the `import type` discipline from Constraint 1 carries forward
    unchanged — only the import path and the expected hit-count (now 2, matching `MetricSection`'s
    existing import) change.
  - *Why the collisions chart's caveat text is a shared constant, not restated.* NFR-5 requires the
    dashed-stroke-plus-label treatment "in every rendering." Two independently-typed copies of the
    same claim is exactly the drift ADR 0001 was written about — one wrong edit later and the table
    and the chart disagree about *why* the series is different, which is worse than either alone.
  - *Why this will not break at scale.* One component, two call sites, both fully parameterized;
    a third metric costs one more call, zero component change (mirrors `MetricSection`'s own
    already-proven claim). The two charts cannot disagree with their tables because both read the
    same `rows` arrays from the same `Promise.all` fetch; neither can fabricate a figure, since
    both write only `rows[rows.length-1][fieldAlias]` verbatim as their one authored figure.

- **Constraints**:
  1. **Client boundary absolute (NFR-2, Rule 3)**: `YearlyLineChart.tsx` never reads
     `process.env`, never value-imports `socrata.ts`; `import type` only. See acceptance clause 6.
  2. **Query frozen (Rule 4)**: no edit to `socrata.ts`, `deaths.ts`, `collisions.ts`, either route
     handler, or either `*_SOQL` constant.
  3. **No figure may be authored** — extends Task 2's Constraint 3 to the eight real collisions
     values; the mechanical hook covers the six-digit ones only (`96607`/`91316`/`85546` are
     five-digit and uncovered), so the source-grep is the net for all eight, exactly as it already
     is for deaths.
  4. **No colour literal in either `.tsx` file.** Same grep as Task 2, run against
     `YearlyLineChart.tsx`.
  5. **The dashed stroke is spent exactly once, on the collisions instantiation.** The deaths call
     passes `strokeStyle="solid"`; nothing else in the app may pass `"dashed"` this task.
  6. **Zero-based y-axis, linear interpolation, on *both* panels independently.** Neither chart's
     axis may be non-zero or shared with the other.
  7. **No animation, no `accessibilityLayer`** — both panels, unchanged from Task 2's Constraints
     7–8.
  8. **No new dependency.** `recharts` is already installed; nothing else may be added.
  9. **Files not to touch**: `src/lib/socrata.ts`, `src/lib/deaths.ts`, `src/lib/collisions.ts`,
     either route handler, `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`,
     `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`,
     `src/app/page.module.css`, `.claude/**`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/**`,
     `SESSION_STATE.md`.
  10. Amendment 3(b) and `npm audit` reporting, as standing clauses.

- **Edge Cases**:
  1. **Collisions `result.status` is `"empty"`/`"error"`** → no collisions chart at all (mirrors
     Task 2 Edge Case 1), independent of deaths' status.
  2. **Deaths `result.status` is `"empty"`/`"error"`** → no deaths chart, independent of
     collisions' status — the cross-metric independence already established for the tables now
     holds for the charts too.
  3. **jsdom `ResizeObserver`** — reuses the existing `vitest.setup.ts` stub; no change needed
     since it stubs the primitive, not a specific component.
  4. **A collisions row of unexpected magnitude** (e.g. a future year far outside the historical
     range) — the y-axis auto-scales from 0 as it already does; no clamping, no invented bound.
  5. **Very narrow viewport, dark mode** — both panels independently subject to Task 2's Edge
     Cases 6–7, unchanged reasoning.
  6. **Live figures have moved from the pinned table** — not this task's concern; `/verify-figures`
     is the mechanism, per standing policy.

- **Files** (max 5 — five used; test files are Cypress's own budget, not counted here, per Task
  2's established precedent):
  1. `src/components/DeathsChart.tsx` — **deleted**, superseded by Output 1.
  2. `src/components/DeathsChart.module.css` — **deleted**, superseded by Output 2.
  3. `src/components/YearlyLineChart.tsx` — **new.**
  4. `src/components/YearlyLineChart.module.css` — **new.**
  5. `src/app/page.tsx` — **edited.**

  **Not in this budget**: `src/components/YearlyLineChart.test.tsx` (renamed from
  `DeathsChart.test.tsx`) and `src/app/page.test.tsx` are Cypress's Phase 1 work, dispatched first.
  Flagging explicitly: the `page.test.tsx` diff from this rename is larger than usual (every
  `DeathsChart`-mock reference needs updating) — a known, bounded, one-time cost of honoring Task
  2's own pre-declared rename trigger rather than avoiding it.

- **Tipping Point**: revisit when **any one** trips:
  - **A genuine two-series-on-one-axis chart becomes justified** (comparable scales — e.g. an
    indexed-to-100 percent-change view under a future FR-4 SPEC, or arrests vs. deaths if ever
    scale-compatible). That is a **different component** — a real multi-line chart with the legend
    + crosshair/tooltip layer this task deliberately did not build — not a third `YearlyLineChart`
    call. Do not retrofit multi-series support onto `YearlyLineChart` in advance.
  - **A third single-series metric needs a chart** (e.g. FR-12's casualty-filtered repair). Costs
    one more `YearlyLineChart` call with `colorSlot={3}` (aqua, pre-validated all-pairs), zero
    component change — mirrors `MetricSection`'s already-proven claim exactly.
  - **`YearlyLineChart.tsx` exceeds ~140 lines**, or the label renderer grows a second case.
  - **`page.tsx` exceeds ~150 lines**, or holds more than ~4 chart/table pairs.
  - **A second *component* (not a second call site) needs the chart-chrome tokens** — only then do
    they hoist to `globals.css`.
  - **A measured performance problem** (real Slow-4G/Lighthouse number), not a hunch.

[FORCES]
1. Honesty of presentation (NFR-5) > matching the task's literal framing — a shared-axis chart was
   the requested shape, but it would fabricate the deaths-flatness claim the product exists to
   protect; small multiples is the correction, not a scope cut.
2. Earned parameterization (MetricSection's precedent) > a new GoF pattern for two call sites.
3. Simplicity > Pattern purity (always present unless explicitly overridden).
```
