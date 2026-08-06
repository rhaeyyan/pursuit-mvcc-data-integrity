# Active SPEC

**Status:** approved — ready to dispatch to Banyan (mechanical refactor, tests-after)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Banyan (execution) → Cypress (audit)
**Ordering:** deviates from standard — Banyan executes first, no pre-written failing tests, since
this is a behavior-preserving mechanical refactor with no new behavior for a red test to describe

## Why this task, not something else (Cedar's reasoning, recorded)

FR-3's data half just closed; four backlog items are queued (FR-3's chart half, FR-4, FR-9, FR-12),
and `SPEC.md`'s own standing clause flagged a competing concern: `src/app/page.tsx` tripped its
~150-line Tipping Point (162 lines, three near-identical status/table/disclosure blocks) at the
exact moment the next task on the list — FR-3's chart redesign — is about to need that same file's
territory to mount a second series with a legend, tooltip/crosshair, and dashed stroke.

**Decision: do the `page.tsx` decomposition first, as its own small SPEC, before the chart redesign
lands** — not folded into the chart-redesign task, and not deferred. The trigger has already fired
(162 > 150, three genuinely-duplicated blocks, not a speculative fourth); the chart-redesign task is
independently large enough to trip `DeathsChart`'s own Tipping Point on three counts at once, so
bolting an unrelated page-wide JSX extraction onto it would blow past the 5-file cap and mix two
different owners' concerns (Magnolia's chart work vs. a structural refactor) in one diff — exactly
the "bigger, riskier diff than this task's stated objective" the FR-3 data-half SPEC itself warned
against doing prematurely. Letting the collision block's shape change again under the chart redesign
before untangling the current duplication would only compound the eventual diff.

This task is scoped as a **Banyan mechanical, behavior-preserving refactor** (not a new-feature
`[SPEC]`): extract a generic `MetricSection` component that the three existing blocks become thin
calls into, with zero visible/DOM change, verified by the existing `page.test.tsx` suite passing
**unmodified**. It also deletes the confirmed-dead, confirmed-unreferenced `src/app/page.module.css`
while in the neighborhood, discharging that other standing debt item cheaply. This clears clean
territory for the FR-3 chart-redesign SPEC to land next.

---

```markdown
[SPEC]

- **Objective**: Extract the three near-identical status/table/disclosure blocks in
  `src/app/page.tsx` (deaths, injuries, collisions) into one shared, generic
  `MetricSection` component, and delete the orphaned, zero-reference
  `src/app/page.module.css`. This is a **mechanical, behavior-preserving refactor**,
  not new product behavior: the rendered DOM, every string of copy, and every
  existing test assertion must survive unchanged. It discharges the two standing
  debt items SPEC.md named at FR-3's close — the ~150-line Tipping Point (162
  lines today) and the orphaned CSS module — so that the next SPEC (FR-3's
  dashed-stroke chart redesign) gets a clean, small `page.tsx` instead of
  competing with this refactor for the same file's diff.

- **Requirement**: **None directly** — this is an internal coupling/bloat refactor
  under CLAUDE.md Workflow Rule 3 ("Banyan invoked... when a coupling/bloat smell
  or refactor is flagged") and Rule 5 (task granularity), triggered by the
  standing clause recorded in `SPEC.md` on 2026-08-06 ("`src/app/page.tsx` has now
  tripped its own ~150-line Tipping Point... this is the standing trigger for the
  next SPEC to address"). It satisfies no new FR/NFR and must not be read as
  progress against one. It **unblocks** the next SPECs cleanly: FR-3 [P0]'s
  remaining chart half, FR-4 [P0] (needs a UI landing spot the chart redesign
  will create), FR-9 [P0] (caveats section — the other half of the compound
  Tipping Point trigger), and FR-12 [P0] (casualty-filtered repair, another
  metric block) will each be adding to or restructuring `page.tsx`; this task
  ensures they do so against ~50 lines of composition, not ~160 lines of
  triplicated markup.

- **Inputs/Outputs**:

  - *Input*: a clean tree with FR-3's data half merged (2026-08-06);
    `SOCRATA_APP_TOKEN` in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must
    satisfy `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/components/MetricSection.tsx`* (**new**). A **Server
    Component** — no `'use client'`. It renders plain semantic HTML only (no
    chart, no interactivity), so it stays on the server side of the boundary
    Task 2 established; unlike `DeathsChart.tsx`, there is no NFR-2 concern here
    and no need for a type-only-import trick.

    ```ts
    import type { YearlyMetricResult } from "../lib/socrata";

    export type MetricSectionProps<K extends string> = {
      fieldAlias: K;          // "deaths" | "injuries" | "collisions" — also the
                               // table's row-value key and the disclosure's
                               // "SoQL query — {fieldAlias}" label
      columnLabel: string;    // "Deaths" | "Injuries" | "Collisions" — the
                               // second <th>; a literal, never derived from
                               // fieldAlias by capitalization
      captionText: string;    // the exact existing per-metric <caption> text
      result: YearlyMetricResult<K>;
      soql: string;            // DEATHS_SOQL / INJURIES_SOQL / COLLISIONS_SOQL —
                               // rendered in the disclosure unconditionally,
                               // independent of `result.status`, exactly as today
      note?: string;           // collisions-only inline sentence; rendered only
                               // in the ok branch, after the table, before the
                               // disclosure. Absent for deaths/injuries.
    };

    export function MetricSection<K extends string>(
      props: MetricSectionProps<K>,
    ): React.JSX.Element;
    ```

    Rendered structure (the contract; exact JSX is Banyan's means):

    ```html
    <!-- ok branch -->
    <table>
      <caption>{captionText}</caption>
      <thead><tr><th scope="col">Year</th><th scope="col">{columnLabel}</th></tr></thead>
      <tbody><tr><td>{row.year}</td><td>{row[fieldAlias]}</td></tr>...</tbody>
    </table>
    <p>{note}</p> <!-- only if note is provided -->

    <!-- empty branch -->
    <p role="status">Socrata returned no rows for 2018–2025, so no figures could be produced.</p>

    <!-- error branch -->
    <p role="alert">No figures could be produced: {result.reason}</p>

    <!-- always, regardless of status -->
    <details>
      <summary>SoQL query — {fieldAlias}</summary>
      <pre><code>{soql}</code></pre>
    </details>
    ```

    `ok`/`empty`/`error` are mutually exclusive top-level conditionals exactly as
    in today's `page.tsx`, moved verbatim into this component, not restructured.

  - *Output 2 — `src/components/MetricSection.test.tsx`* (**new**, Cypress).
    Characterization tests proving the component's contract in isolation with
    an obviously-synthetic `fieldAlias` (e.g. `"widgets"`) so the coverage is
    provably generic, not deaths-shaped: ok/empty/error branches render the
    right role and text; `note` renders only when provided and only in the ok
    branch; the disclosure renders unconditionally and independent of status;
    axe-core reports zero violations in the ok state both with and without
    `note`. No real deaths/injuries/collisions figures appear in this file
    (Constraint 6).

  - *Output 3 — `src/app/page.tsx`* (**edited**). Replace each of the three
    blocks with one `<MetricSection>` call, keeping the intro `<h1>`/`<p>` and
    the `Promise.all` fetch untouched:

    ```tsx
    {result.status === "ok" && <DeathsChart rows={result.rows} />}
    <MetricSection
      fieldAlias="deaths" columnLabel="Deaths"
      captionText="NYC traffic deaths per year, 2018–2025"
      result={result} soql={DEATHS_SOQL}
    />

    <MetricSection
      fieldAlias="injuries" columnLabel="Injuries"
      captionText="NYC traffic injuries per year, 2018–2025"
      result={injuriesResult} soql={INJURIES_SOQL}
    />

    <MetricSection
      fieldAlias="collisions" columnLabel="Collisions"
      captionText="NYC recorded collisions per year, 2018–2025"
      result={collisionsResult} soql={COLLISIONS_SOQL}
      note="This series is affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions."
    />
    ```

    The `{result.status === "ok" && <DeathsChart .../>}` line **stays directly
    in `page.tsx`**, as a sibling before `<MetricSection>` — it does **not**
    move into `MetricSection` via a children or render-prop slot (see Design
    Pattern / Intellectual Control). This means `page.tsx` and `MetricSection`
    each independently narrow on `result.status === "ok"` once, for the deaths
    case only — a small, deliberate, acceptable duplication, not a defect.

  - *Output 4 — `src/app/page.module.css`* (**deleted**). Confirmed
    zero-reference repo-wide (`git grep -rn "page.module.css" -- src` → no
    hits, re-verified in this SPEC's prep 2026-08-06); it is scaffold leftover,
    never imported by `page.tsx`, which has been CSS-free since Task 1.

  - *Acceptance, by command, `node -v` recorded beside every result*:
    1. Step 0's `node -v`/`npm -v`.
    2. `git grep -rn "page.module.css" -- src` → zero hits, confirmed **before**
       deleting. If a reference exists, halt — do not delete.
    3. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each
       exit 0.
    4. **`git diff --stat -- src/app/page.test.tsx` shows zero changes.** This is
       the primary behavior-preservation gate. If satisfying acceptance required
       editing that file, report exactly which assertion broke and why — do not
       silently edit Cypress's file.
    5. `git diff --stat -- src/lib/deaths.test.ts src/lib/injuries.test.ts src/lib/collisions.test.ts src/app/api/deaths/route.test.ts src/app/api/injuries/route.test.ts src/app/api/collisions/route.test.ts src/components/DeathsChart.test.tsx` →
       zero changes across all seven.
    6. **Report the resulting line count of `src/app/page.tsx`**, compared
       explicitly against the ~150-line Tipping Point (162 today). Do not
       hardcode an expected number — measure and report it.
    7. The no-authored-figure greps, re-run unchanged:
       `git grep -nE '(^|[^0-9.])(229|231|244|268|269|280|290|297)([^0-9]|$)' -- src ':!*test*'`
       and the six-digit collisions/injuries pinned-literal check — zero hits.
    8. `npm run dev`; load `/` in light and dark mode, desktop and 320px width.
       Confirm the deaths chart, all three tables, the collisions note, and all
       three disclosures render identically to before this task (same text,
       same order, same roles). Then `git checkout -- CLAUDE.md`.
    9. `npm audit` — report high/critical; no install expected, none authorized.

- **Query**: **none — this task touches no query, no fetch, no dataset ID, and
  no `$select`/`$where`/`$group`.** `src/lib/socrata.ts`, `deaths.ts`,
  `injuries.ts`, `collisions.ts`, and all three `route.ts` files are read-only
  to this task; `MetricSection` receives an already-fetched, already-validated
  `YearlyMetricResult<K>` as a prop and performs no fetch and no re-validation.

- **Design Pattern**: **none — simple case**, per `composition-patterns`
  (consulted this pass). `architecture-avoid-boolean-props`: `note` is data (an
  optional string), not a behavioral toggle — there is no `showNote` boolean.
  `patterns-explicit-variants`: the three call sites pass explicit, distinct
  literal props (`fieldAlias`, `columnLabel`, `captionText`) rather than a
  `variant: "deaths" | "injuries" | "collisions"` switch that `MetricSection`
  would branch on internally. `patterns-children-over-render-props` is the rule
  that **decided** the chart's placement: a `renderBeforeTable` render-prop was
  considered and rejected specifically because the skill ranks children/plain
  composition above render props for this kind of slot, and here even
  `children` is unneeded — the chart is a plain sibling `page.tsx` composes
  directly, so `MetricSection`'s prop surface stays uniform across all three
  callers instead of carrying a slot only one of them uses.

- **UI Scope**: **N/A — no chart, no CSS, no visible DOM change.** This is a
  refactor of *component composition*, not of the rendered page: the produced
  HTML must be behaviorally identical to today's, mechanically verified by
  `src/app/page.test.tsx` passing with zero edits (Acceptance clause 4). If
  achieving that requires any visible change, that is a FAIL, not a
  judgment call.

- **Intellectual Control**:
  - *Why now, and not folded into the FR-3 chart-redesign SPEC.* The FR-3
    chart-redesign task is already large on its own terms — the dispatch brief
    names it as tripping `DeathsChart`'s own Tipping Point on three counts at
    once (legend, tooltip/crosshair, dashed stroke). Bolting a page-wide
    extraction of the deaths/injuries blocks (which have nothing to do with the
    chart) onto that task would mean one diff owned by two different concerns —
    Magnolia's chart work and a structural refactor — and would risk exceeding
    the 5-file cap once the chart's own files (`DeathsChart.tsx`, its
    stylesheet, its test, `page.tsx`) are counted. Sequencing this first keeps
    each task's diff explicable by its own objective.
  - *Why the extraction is safe to do now, when the prior SPEC declined it.*
    The FR-3 data-half SPEC's stated reason for declining extraction was that
    the compound trigger ("`page.tsx` exceeds ~150 lines" **or** "holds more
    than one series plus FR-9's caveats section") had only the line-count half
    live, and extracting "under cover of a data-addition task" would have been
    a bigger, riskier diff than that task's stated objective. Both objections
    dissolve here: the line-count half has now definitively fired (162 > 150),
    and this task's *entire* objective is the extraction — there is no data
    addition riding along with it to obscure.
  - *Why the chart mount is not threaded through `MetricSection` via children
    or a render prop.* Three options were considered: (a) a `children` slot,
    (b) a `renderBeforeTable(rows)` render prop, (c) leave the chart mount as a
    sibling in `page.tsx`. `composition-patterns`' own priority ordering favors
    children over render props, but neither is needed: only one of three call
    sites has anything to place before the table, so giving `MetricSection` a
    slot at all would be an abstraction with one real consumer — the same
    unearned-generality Rule 8 rejects for GoF patterns applies equally to a
    component's prop surface. Option (c) — the one-line
    `{result.status === "ok" && <DeathsChart rows={result.rows} />}` staying in
    `page.tsx`, exactly where it already lives — costs one small, legible,
    duplicated discriminant check and buys a `MetricSection` whose contract is
    identical for all three callers today and remains identical the day a
    fourth metric arrives with nothing special to prepend.
  - *Why literal props (`columnLabel`, `captionText`) instead of deriving them
    from `fieldAlias`.* A `capitalize(fieldAlias)` helper would make "Deaths"
    from `"deaths"` correctly today but is exactly the kind of implicit string
    transform that silently breaks the day a metric's display label diverges
    from its field name (a per-capita metric, a borough-qualified label). Every
    rendered word stays an explicit, grep-able literal at the call site — the
    same discipline the FR-3 SPEC already used for the collisions note text.
  - *Why `page.module.css` is deleted in this task rather than left for "the
    next layout SPEC."* SPEC.md already named this task's shape ("a `page.tsx`
    decomposition SPEC... is a strong candidate to finally resolve this") as
    the likely place it would land. The file has zero references
    (re-confirmed, Acceptance clause 2) and this task touches no styling, so
    deleting it costs nothing beyond the `git grep` that proves it's safe, and
    avoids a fourth future visit to this exact neighborhood for one dead file.
  - *Why this will not break at scale.* `MetricSection` is generic over `K`
    and knows nothing about deaths, injuries, or collisions by name — a fourth
    yearly-aggregate metric (e.g., FR-12's casualty-filtered series) costs one
    more `MetricSection` call with its own literal props, not a change to this
    component. The moment a caller needs something `MetricSection` cannot
    express — two data series in one table, a filter control, a legend — that
    is this component's own Tipping Point (below), and the answer is an
    explicit new prop or a new sibling component, decided by whichever SPEC
    hits it, not pre-built here on spec.

- **Constraints**:
  1. **Zero behavioral change.** Acceptance clauses 4–5 are the gate: if any
     existing test file needs an edit to pass, that is a FAIL, not a
     negotiation.
  2. **No new dependency.**
  3. **No CSS authored or edited.** `MetricSection.tsx` carries no `className`,
     no CSS-module import — `page.tsx`'s zero-CSS constraint (Task 2) extends
     to its extracted component. `globals.css` untouched.
  4. **Token discipline unaffected.** `MetricSection.tsx` never imports
     `socrata.ts`, `deaths.ts`, `injuries.ts`, or `collisions.ts` as *values* —
     only the `YearlyMetricResult` *type* from `socrata.ts`. It never reads
     `process.env`.
  5. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are
     untouched.** The chart-redesign SPEC owns them next.
  6. **No figure may be authored.** `MetricSection.test.tsx` uses an
     obviously-synthetic `fieldAlias` (e.g. `"widgets"`) and obviously-synthetic
     row values — never a real deaths/injuries/collisions figure, per the
     established `page.test.tsx` convention.
  7. **No render-prop or `children` slot added to `MetricSection`** for the
     chart (Design Pattern). If a future SPEC needs one, that SPEC adds it —
     this task does not pre-build it.
  8. **Relative imports only** (standing clause — `@/*` doesn't resolve under
     Vitest).
  9. **`page.module.css` deletion is gated on Acceptance clause 2's grep
     returning zero hits.** If it doesn't, halt and report — do not delete a
     file with a live reference and do not "helpfully" repoint that reference
     instead.
  10. **Files not to touch**: `src/lib/socrata.ts`, `src/lib/deaths.ts`,
      `src/lib/injuries.ts`, `src/lib/collisions.ts`, `src/app/api/deaths/route.ts`,
      `src/app/api/injuries/route.ts`, `src/app/api/collisions/route.ts`,
      `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
      `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`,
      `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`,
      `src/app/globals.css`, `.claude/**`, `CLAUDE.md`, `README.md`,
      `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  11. **Ordering deviation from the standard schema, stated explicitly.** This
      task is executed **Banyan-first, Cypress-audits-after** rather than
      Cypress-writes-failing-tests-first. Reason: this is a behavior-preserving
      mechanical refactor, not new product behavior — there is no new behavior
      for a red test to describe in advance. `page.test.tsx` passing unmodified
      *is* the pre-existing specification; `MetricSection.test.tsx` is
      characterization coverage written against the now-working extraction,
      matching the `[SPIKE]` audit-after model CLAUDE.md already sanctions for
      non-TDD-shaped work, and consistent with the roster's grant of
      "tree-wide mechanical refactors" to Banyan outside the standard loop.
  12. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance
      result.
  13. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **`note` absent (deaths, injuries).** No `<p>` element rendered at all in
     the ok branch — not an empty-string paragraph, not a `<p></p>`.
  2. **A `MetricSection` receiving an `ok` result with an empty `rows` array.**
     Cannot occur through the real pipeline (`socrata.ts` returns `status:
     "empty"` for zero rows, never `"ok"` with an empty array), but the
     component must not crash if it ever did — `.map` over `[]` renders a
     header-only table, no special-casing added on spec.
  3. **All eight ok/empty/error × (deaths, injuries, collisions) combinations
     already exercised by the untouched `page.test.tsx` three-way independence
     suite.** This task's job is to not disturb that guarantee — Acceptance
     clause 4 is the mechanical check, not a re-derivation of the coverage.
  4. **`page.module.css` deletion breaking `next build`** — guarded by
     Acceptance clauses 2 and 3 (grep first, then a real build); if the build
     fails after deletion, that falsifies the "zero-reference" premise and is a
     halt, not a re-add-and-move-on.

- **Files** (max 5 — four used):
  1. **`src/components/MetricSection.tsx`** — *new.* Generic status/table/note/
     disclosure component, Server Component, zero CSS.
  2. **`src/components/MetricSection.test.tsx`** — *new.* Cypress
     characterization tests against a synthetic `fieldAlias`.
  3. **`src/app/page.tsx`** — *edited.* Three blocks replaced by three
     `<MetricSection>` calls; `Promise.all`, `<h1>`, intro `<p>`, and the
     deaths-chart sibling mount unchanged in substance.
  4. **`src/app/page.module.css`** — *deleted.* Confirmed zero-reference.

- **Tipping Point**: `MetricSection`'s own — not `page.tsx`'s, which this task
  resets. Re-open when **either**: (a) a caller needs to render two data series
  in one table (e.g., a combined deaths+collisions row), a filter control, or a
  legend — none of which the current props can express without a boolean flag
  or a mode switch, which is exactly the signal to stop parameterizing and add
  an explicit new prop or a sibling component instead; or (b) FR-9's caveats
  section needs to sit inside this same repeating structure rather than beside
  it. Until then, a fourth yearly-aggregate metric (FR-12) costs exactly one
  more `MetricSection` call plus its own five-line lib file, zero change to
  this component.

[FORCES]
1. Clearing `page.tsx`'s territory before the FR-3 chart-redesign task lands > shipping a new FR this round
2. Simplicity > Pattern purity
```
