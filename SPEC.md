# Active SPEC

**Status:** none active. FR-2 (injuries per year + the `socrata.ts` extraction) closed on
2026-08-06 — Cypress audit PASS, standard ordering. Nothing is pre-declared below; the next task
needs a fresh Cedar pass.

Archived in full, with its acceptance output and Cypress's audit report, in `ARCHIVED_SPECS.md`.
Live figures on both endpoints independently re-verified against the pinned table with zero drift.

---

## Standing clauses that bind the next SPEC

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
- **`@/*` path-alias imports don't resolve under Vitest.** `tsconfig.json`'s `paths` map is honored
  by `tsc`/`next build` but `vitest.config.mts` has no matching `resolve.alias`/`tsconfig-paths`
  plugin. Every SPEC so far has routed around this with relative imports throughout. Whoever writes
  the next Vitest-tested file with an `@/*` import will hit this — either keep using relative
  imports in test-covered files, or a future SPEC adds `vite-tsconfig-paths` (a new dependency,
  Rule 9, Cedar's call).
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** Next 16's `generate-agent-files.js` appends a
  `<!-- BEGIN:nextjs-agent-rules -->` block on every dev/build run. `CLAUDE.md` is off-limits to
  every SPEC and this block carries no project decision — `git checkout -- CLAUDE.md` after any
  `dev`/`build` run, don't commit it and don't try to suppress it as a fix.
- **`.claude/scripts/` holds two scripts** (`verify-figures.py`, `subtotal-gap.py`). At three, the
  shared Socrata fetch/token/cast logic is duplicated twice and should be extracted; at two,
  extracting it is the unearned abstraction Rule 8 rejects. Don't extract until a third script
  arrives.
- **`src/lib/socrata.ts` has already tripped its own SPEC's ~120-line Tipping Point** (252 raw / 194
  non-comment lines at the moment FR-2 closed). Cypress read it cover-to-cover and judged this
  inherent to the 10-branch validation pipeline it generalized from Task 1, not duplication or
  bloat — not an emergency, but the next SPEC that touches this file should treat "a third distinct
  query shape arrives" (already named in its own Tipping Point) as the real decomposition trigger,
  not the line count alone, and should note whether the line-count trip has gotten worse.
- **Acceptance-clause wording: say "read," not "appears."** FR-2's SPEC had a clause asking that a
  token *name* "appear in exactly one source file," which conflated the env-var name (fine in
  comments/synthetic test fixtures) with an actual `process.env.X` read (the thing NFR-2 actually
  cares about). Cypress substantively passed it by checking reads, not appearances, and flagged the
  wording for correction. Future SPECs with a similar clause should say "reads" explicitly.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. Also record `/`'s First Load JS (Task 2's build measured 769,350 bytes
  uncompressed) against NFR-1's budget.
- **`src/app/page.module.css` remains orphaned**, tracked debt with a named owner (the next SPEC
  that touches page-level layout) — flag if that SPEC lands without removing it.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all
  installed packages, so this is a documentation gap, not an open risk).

---

## No task pre-declared

The open P0 work is FR-3 (collisions with the dashed + inline-label treatment — needs a Redwood
data task *and* a Magnolia chart-redesign task, since FR-2's SPEC deliberately didn't combine
them), FR-4 (% change per metric, blocked until collisions exists — its text needs "each of the
three metrics"), FR-9 (caveats), and FR-12 (the casualty-filtered repaired series, needs FR-3's raw
collisions series to compare against). FR-3 and FR-12 carry the product's actual thesis. FR-3 is
still expected to trip Task 2's chart component's Tipping Point on three counts at once (a legend
becomes mandatory at 2+ series, the deliberately-deferred tooltip/crosshair layer becomes due, and
FR-3's dashed-stroke-plus-label treatment lands) the moment it's specced — that hasn't changed by
FR-2 landing, since FR-2 deliberately did not touch `DeathsChart.tsx`. Needs a fresh Cedar pass
before dispatch — none of the above is dispatch-ready as a one-line summary.
