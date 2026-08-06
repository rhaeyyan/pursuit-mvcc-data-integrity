# Active SPEC

**Status:** none active. The `MetricSection` extraction + `page.module.css` deletion closed on
2026-08-06 — Cypress audit PASS, deviated ordering (Banyan-first, tests-after). Nothing is
pre-declared below; the next task needs a fresh Cedar pass.

Archived in full, with its acceptance output and Cypress's audit report, in `ARCHIVED_SPECS.md`.
`src/app/page.tsx` is now 63 lines (was 162) — clean territory for the FR-3 chart-redesign task
this refactor was explicitly sequenced to precede.

---

## Standing clauses that bind the next SPEC

Archived with the SPECs that introduced them, restated here because they are live obligations:

- **Amendment 3(b) — acceptance-by-command must record `node -v`**, and the recorded version must
  satisfy `engines.node`. Costs no file budget; not optional in any SPEC.
- **Amendment 3(c) — `@types/node`'s major tracks `engines.node`'s major.** No Rule 9 halt required.
- **Amendment 3(d) — `eslint@^9` is required**, driven by `eslint-plugin-jsx-a11y@6.10.2`'s peer
  range, not `eslint-config-next`.
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) it's the *only* thing that catches the named failure, and (ii) no existing file, hook,
  CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`.
- **`@/*` path-alias imports don't resolve under Vitest.** Every SPEC so far has routed around this
  with relative imports. A future SPEC could add `vite-tsconfig-paths` (Cedar's call, Rule 9).
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** `git checkout -- CLAUDE.md` after any
  `dev`/`build` run; never commit that block.
- **`.claude/scripts/` holds two scripts.** At three, extract the shared Socrata fetch/token/cast
  logic; at two, extracting it is the unearned abstraction Rule 8 rejects.
- **`src/lib/socrata.ts` has already tripped its own ~120-line Tipping Point** (194 non-comment
  lines). Judged inherent, not bloat. Treat "a third distinct query shape arrives" as the real
  decomposition trigger, not line count alone.
- **`src/app/page.tsx`'s ~150-line Tipping Point is now reset** (63 lines, post-`MetricSection`).
  Watch it again as FR-3's chart half, FR-4, FR-9, and FR-12 each add to it.
- **`MetricSection`'s own Tipping Point (new).** Revisit when a caller needs two data series in one
  table, a filter control, or a legend — none of which the current props (`fieldAlias`,
  `columnLabel`, `captionText`, `result`, `soql`, optional `note`) can express without a boolean
  flag or mode switch — or when FR-9's caveats section needs to sit inside this repeating structure
  rather than beside it. A fourth yearly-aggregate metric (FR-12) costs one more `MetricSection`
  call, zero change to the component.
- **Acceptance-clause wording: say "read," not "appears."** A token-name-appears-in-N-files clause
  conflates the env-var name (fine in comments/synthetic test fixtures) with an actual
  `process.env.X` read. Future SPECs with a similar clause should say "reads" explicitly.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. Also record `/`'s First Load JS against NFR-1's budget (last measured
  769,350 bytes uncompressed, before FR-2/FR-3's data additions and this refactor).

## No task pre-declared

The open P0 work is **FR-3's remaining chart half** (the dashed-stroke-plus-inline-label treatment
on `DeathsChart.tsx`, expected to trip that component's own Tipping Point on three counts at once —
legend, tooltip/crosshair, dashed stroke — the moment it's specced; `page.tsx` is now clean
territory for it, per this refactor's whole purpose), FR-4 (% change per metric, still blocked
pending a UI landing spot tied to the chart redesign), FR-9 (caveats section), and FR-12
(casualty-filtered repair, unblocked by the raw collisions series but needs its own `$where`
shape). All three raw metrics (deaths, injuries, collisions) are live on `/` as accessible tables
via `MetricSection`; deaths alone also has a chart. Needs a fresh Cedar pass before dispatch — none
of the above is dispatch-ready as a one-line summary.
