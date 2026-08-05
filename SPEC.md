# Active SPEC

**Status:** none active. Task 1 of the walking skeleton closed on 2026-08-06 (Cypress audit PASS,
standard ordering). Task 2 (the Recharts chart) is pre-declared below, not yet dispatched.

Task 1 (deaths per year: `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, `src/app/page.tsx`,
plus Cypress's tests) is archived in full, with its Cypress audit report, in `ARCHIVED_SPECS.md`.
Live figures independently re-verified against PRD Appendix A with zero drift, including the
fragile 2025 endpoint (229, unchanged) — Task 2 can proceed without triggering PRD §7's two-year-
average fallback.

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
- **`vitest.config.mts` exists and lints correctly.** Amendment 3(e)'s rename is done; both its
  required checks passed (root `.mts` stays outside `tsconfig.include`; `eslint.config.mjs` does
  lint `.mts`, confirmed empirically by Cypress with a deliberate violation). Nothing further owed.
- **`@/*` path-alias imports don't resolve under Vitest.** `tsconfig.json`'s `paths` map is honored
  by `tsc`/`next build` but `vitest.config.mts` has no matching `resolve.alias`/`tsconfig-paths`
  plugin. Task 1 routed around this with relative imports throughout. Whoever writes the next
  Vitest-tested file with an `@/*` import will hit this — either keep using relative imports in
  test-covered files, or a future SPEC adds `vite-tsconfig-paths` (a new dependency, Rule 9, Cedar's
  call).
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** Next 16's
  `generate-agent-files.js` appends a `<!-- BEGIN:nextjs-agent-rules -->` block on every dev/build
  run. `CLAUDE.md` is off-limits to every SPEC (Constraint 8 precedent) and this block carries no
  project decision — `git checkout -- CLAUDE.md` after any `dev`/`build` run, don't commit it and
  don't try to suppress it as a fix.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all
  installed packages, so this is a documentation gap, not an open risk).

---

## Task 2 — pre-declared, NOT dispatched (Magnolia, ~3 files)

Sketched by Cedar alongside Task 1 so the pair could be reasoned about together; needs a fresh
Cedar pass for a full `[SPEC]` before dispatch (this sketch is not itself dispatch-ready — file
paths, exact mark spec, and constraints need the same rigor Task 1 got).

**Scope:** install `recharts@^3` (3.10.1, `engines.node >= 18`, already discharged in the scaffold
SPEC's Amendment 1 table — re-verify at dispatch time in case it's moved); add
`src/components/DeathsChart.tsx` (`'use client'`, single line series over the same 2018–2025 data
Task 1 already fetches, 2px stroke, round join/cap, ≥8px end markers, hairline gridlines, direct
end-of-line label, `prefers-reduced-motion` respected) plus its CSS module; edit `src/app/page.tsx`
to mount the chart inside a `<figure>` whose table-view toggle reveals the table Task 1 already
built (NFR-3 — the table is the chart's required accessible twin, not a thing to duplicate).

**UI Scope:** structural. **Sequencing:** touches `src/app/page.tsx`, which Task 1 also touched —
strictly sequential with Task 1, not a parallel worktree (already true, Task 1 is closed).

**Not yet decided, needs Cedar's SPEC:** whether `DeathsChart` receives the already-fetched
`DeathsRow[]` as a prop from the Server Component (in-process, same pattern Task 1 established) or
something else; the dataviz skill's stat-tile-vs-line-chart guidance already resolved in Task 1's
SPEC (line chart, not a stat tile — FR-1 is a time series). Reload the `dataviz` skill fresh rather
than relying on this summary.
