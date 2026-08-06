# Active SPEC

**Status:** none active. FR-3's data half (collisions per year) closed on 2026-08-06 — Cypress
audit PASS, standard ordering. Nothing is pre-declared below; the next task needs a fresh Cedar
pass.

Archived in full, with its acceptance output and Cypress's audit report, in `ARCHIVED_SPECS.md`.
Live figures on all three endpoints independently re-verified against the pinned table with zero
drift.

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
- **`@/*` path-alias imports don't resolve under Vitest.** Every SPEC so far has routed around
  this with relative imports throughout. Whoever writes the next Vitest-tested file with an
  `@/*` import will hit this — either keep using relative imports in test-covered files, or a
  future SPEC adds `vite-tsconfig-paths` (a new dependency, Rule 9, Cedar's call).
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** `git checkout -- CLAUDE.md` after any
  `dev`/`build` run, don't commit it and don't try to suppress it as a fix.
- **`.claude/scripts/` holds two scripts** (`verify-figures.py`, `subtotal-gap.py`). At three, the
  shared Socrata fetch/token/cast logic is duplicated twice and should be extracted; at two,
  extracting it is the unearned abstraction Rule 8 rejects.
- **`src/lib/socrata.ts` has already tripped its own ~120-line Tipping Point** (194 non-comment
  lines). Judged inherent to the validation pipeline it generalized, not bloat. The next SPEC
  touching this file should treat "a third distinct query shape arrives" as the real
  decomposition trigger, not line count alone.
- **`src/app/page.tsx` has now tripped its own ~150-line Tipping Point** (162 lines, three
  independent metric blocks). Reported at FR-3's close, not acted on. **This is the standing
  trigger for the next SPEC to address**: either extract a shared table+disclosure component (the
  three blocks are now near-identical enough that the "third block appears" objection FR-3's SPEC
  raised against premature extraction no longer applies as strongly), or make a deliberate case for
  leaving it as-is before a fourth metric lands.
- **Acceptance-clause wording: say "read," not "appears."** A token-name-appears-in-N-files clause
  conflates the env-var name (fine in comments/synthetic test fixtures) with an actual
  `process.env.X` read. Both FR-2 and FR-3's audits substantively passed by checking reads, not
  appearances. Future SPECs with a similar clause should say "reads" explicitly.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. Also record `/`'s First Load JS (Task 2's build measured 769,350 bytes
  uncompressed, before FR-2/FR-3's data additions) against NFR-1's budget.
- **`src/app/page.module.css` remains orphaned**, tracked debt with a named owner (the next SPEC
  that touches page-level layout) — flag if that SPEC lands without removing it. A `page.tsx`
  decomposition SPEC (see the Tipping Point above) is a strong candidate to finally resolve this.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (documented
  gap, not an open risk — discharged mechanically via `semver.satisfies`).

---

## No task pre-declared

The open P0 work is **FR-3's remaining chart half** (the dashed-stroke-plus-inline-label treatment
on `DeathsChart.tsx`, which will trip that component's own Tipping Point on three counts at once —
legend, tooltip/crosshair, dashed stroke — the moment it's specced), FR-4 (% change per metric,
still blocked pending a UI landing spot that depends on the chart redesign), FR-9 (caveats), and
FR-12 (casualty-filtered repair — now unblocked by the raw collisions series existing, but changes
the `$where` shape). All three raw metrics (deaths, injuries, collisions) are now live on `/` as
both accessible tables and, for deaths only, a chart. Needs a fresh Cedar pass before dispatch —
none of the above is dispatch-ready as a one-line summary. The `page.tsx` line-count Tipping Point
(above) is also a live candidate for its own small SPEC before any of these land, since FR-3's
chart-redesign task and a `page.tsx` decomposition task would otherwise compete for the same file.
