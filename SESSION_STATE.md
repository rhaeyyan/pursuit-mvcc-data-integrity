# Sprint Ledger — MVCC Data

**Current objective:** None active. FR-2 (injuries per year) closed. `SPEC.md` has no task
pre-declared — the next task needs a fresh Cedar pass. See `SPEC.md` § No task pre-declared
(FR-3/4/9/12).

## Active

- **FR-2 (injuries per year) CLOSED (2026-08-06).** Extracted `src/lib/socrata.ts` (generic
  yearly-metric transport, per Task 1's own pre-committed Tipping Point trigger); `deaths.ts`
  reduced to a thin wrapper (byte-identical `DEATHS_SOQL`, `DeathsChart.tsx` untouched); added
  `injuries.ts` + `api/injuries/route.ts` + an independent injuries table/disclosure, fetched via
  `Promise.all`. Cypress PASS: 104/104 tests, zero drift on live figures for either metric, `git
  diff --stat` on the deaths test files and all three `DeathsChart` files empty. Two findings
  (both non-blocking, independently judged by both Redwood and Cypress): `socrata.ts` already trips
  its own ~120-line Tipping Point (judged inherent, not bloat); an acceptance clause's wording
  ("token appears in one file") was imprecise vs. NFR-2's actual concern (reads). Full narrative in
  `ARCHIVED_SESSIONS.md`; closed SPEC in `ARCHIVED_SPECS.md`. Commits: `c4e8602`→`c973beb`→`7e35715`
  → archival. `SPEC.md` reset — no task pre-declared.
- **Two hook defects the 2026-08-05 audit surfaced**, both in `.claude/hooks/stop-quality-gate.sh`
  and both
  **pre-existing** (they predate `4f396e1`), so neither is a regression from the platform SPEC:
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90) — the `[ -x ]`
     guards skip both checks, `failed` stays 0, and the gate prints "clean" having run nothing.
     Reproduced on an empty `node_modules/`. This is the same failure class the platform SPEC
     existed to eliminate, one layer down, and it fires on any interrupted `npm install`.
  2. **The all-clear line can print an empty version** (line 104) — it re-invokes `node -v` rather
     than reusing the captured value, so an unresolvable `node` yields `(Node )` in the very line
     that exists to make the platform auditable.

  Both belong to the next SPEC that touches that file. Cypress may not edit it; Redwood or Banyan
  must. Neither blocks the skeleton.
- **Walking-skeleton Tasks 1 and 2 both CLOSED — the skeleton is feature-complete.** Full
  phase-by-phase narrative for both (Task 1: `4e63717`→`503c239`→`9ca19e4`+`7fc0050`; Task 2:
  `bc3d43e`→`503c239`→`1e67154`→`735bcfd`) is in `ARCHIVED_SESSIONS.md`; the completed SPECs
  themselves are in `ARCHIVED_SPECS.md`. Docs task (`f77ae1c`, `c9e28b9`) also closed and archived.
- **Subgroup-sum-fallback correction CLOSED (2026-08-06).** The falsified mitigation (subgroup
  fields don't reconcile to the authoritative total from 2021 onward — GreenInfo-Network/
  nyc-crash-mapper issue #111) is corrected at all four sites; `.claude/scripts/subtotal-gap.py`
  is a permanent, self-checking re-verification script (`PINNED_GAPS`, exits 1 on drift); ADR 0002
  records the finding. Detector proof independently confirmed twice (Redwood + Cypress, different
  cells). Cypress PASS. Full narrative, including why the mid-flight revision request mattered and
  why the detector was re-proven independently rather than trusted, is in `ARCHIVED_SESSIONS.md`;
  the closed SPEC itself is in `ARCHIVED_SPECS.md`. Commits: `da35ab6` (execution) → `a0f2c27`
  (ledger) → archival. `SPEC.md` is now reset — no task pre-declared.
- **Harness platform fix CONFIRMED LIVE** (2026-08-05): `node -v` in the Bash tool now prints
  `v22.23.2` and `which node` resolves under the fnm v22 tree. Fix was `env.PATH` in
  **`.claude/settings.local.json`**, gitignored (machine-specific, absolute path under
  `/home/rhaeyyan`), so **a fresh clone must redo it**, alongside the fnm install and the
  `.git/hooks/commit-msg` guard. Reproducing the Node 20 failure path now takes deliberate effort —
  `env PATH=/usr/local/bin:/usr/bin:/bin`.
- **Deploy `[SPEC]` obligation** (full rationale in `SPEC.md` § Carried forward): verify Vercel's
  Node runtime matches `engines.node`, now also recording `/`'s First Load JS after Task 2's chart.
- **Machine changes outside the repo, needing re-doing on any other machine:**
  `~/.config/fish/conf.d/fnm.fish` (new) and an appended `~/.bashrc` block — both silence fnm's
  "Using Node" banner in non-interactive shells, which lands on stdout and contaminates output.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; its absence is not a gap to close.
  Rationale and revisit trigger in `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform: Node v22.23.2 / npm 10.9.8**, per-project via `fnm` + `.nvmrc`. fnm's `default` alias
  is `system`, so only `.nvmrc` directories switch; `/tmp` and `$HOME` still yield the system
  v20.19.6. `engines.node` is `>=22.22.2`.
- **Standing rule — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Standing acceptance clause (Amendment 3(b)), binds every future SPEC:** acceptance-by-command
  must record `node -v` beside the results, and it must satisfy `engines.node`. A gate that ran on
  an unverified platform produced an unverified result; unverified is not PASS. NFR-4 pointed at
  the toolchain.
- **`eslint@^9` is required, not merely unbumped.** The discriminator is *not* `eslint-config-next`
  (permissive, `>=9.0.0`) — it is **`eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes
  eslint 10**, the plugin NFR-3 depends on. Check that package first before evaluating eslint 10.
- **Styling is CSS Modules**, not Tailwind — chosen on reversibility, not taste. Tailwind is two dev
  deps and a PostCSS config to add later; removing it means unwinding class attributes across every
  component Magnolia will have written by then.

## History

*(Empty — everything closed so far is archived; nothing has closed since FR-2.)*

All entries are in `ARCHIVED_SESSIONS.md`: **FR-2 (injuries per year) shipped, 2026-08-06** — why
Cedar picked FR-2 over the more thesis-central FR-3 (a pre-committed refactor trigger beats a
task that bundles three decisions into one shot), why `fetchYearlyMetric` stayed narrow on purpose,
why `DeathsRow`/`DeathsResult`'s exact shape was the load-bearing acceptance criterion, and why a
file tripping its own Tipping Point on the task that wrote it was treated as information for the
next SPEC rather than an emergency. **The falsified subgroup-sum fallback corrected, 2026-08-06** —
why the mid-flight revision request (reporter → checker) was worth blocking
dispatch over, why the detector proof was independently re-run by a second agent on a different
cell rather than trusted from the first run, why two agents hand-verified links a hook was known
not to cover, and why the script was rebuilt fresh rather than chasing a gone scratchpad path.
**Task 2 of the walking skeleton, 2026-08-06** — why
colour lives entirely in the CSS module targeting Recharts' own class names rather than
`currentColor` props (a dot needs two colours at once, `currentColor` only carries one), why the
zero-based y-axis was the single most important test in the file rather than a style choice, the
`process.env`-grep test-authoring bug found by Magnolia and fixed by Cypress (same ownership
boundary as Task 1's TDZ bug), and why the First Load JS figure was recorded with no threshold to
react to. **Task 1 of the walking skeleton, 2026-08-06** — why the skeleton split in two at the
agent boundary rather than spend a second file-cap exemption, why the page imports the fetch
function instead of self-fetching its own Route Handler, the pinned-figure hook's deliberate
three-digit blind spot, the `vi.hoisted` TDZ bug Redwood diagnosed but refused to fix because test
files are Cypress's, and the `next dev` CLAUDE.md-dirtying side effect that is a standing clause
rather than a bug. Before that (the 2026-08-05 audit of both kickoff SPECs — the
scaffold's file bound proven by byte-comparison, the fake-green hook defect it found; the two-SPEC
toolchain build-out — the bounded generator-output exemption, the Node 20 halt and the per-project
platform raise, and `engine-strict`'s rejection on efficacy; README diagram rebuild and the
`ARCHITECTURE.md` deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude
Code agent configuration and the GEMINI.md parity drop; the `.gitignore` / NFR-2 gap).
