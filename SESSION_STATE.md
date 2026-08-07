# Sprint Ledger — MVCC Data

**Current objective:** none pre-declared. FR-4 closed this session (see Active). `SPEC.md` is reset
and empty — next task starts with Cedar.

## Active

- **FR-4 (2018→2025 percent-change summary line, all four metrics) CLOSED (2026-08-06).** Cedar
  picked it over the other remaining P0 item (FR-9) on scope-readiness, not centrality — FR-9 has
  an unresolved design question worth its own SPEC, FR-4 didn't. Standard ordering throughout;
  Cypress PASS on both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent.
  New `src/lib/percentChange.ts` (pure functions: `computeChange`, `formatPercentChange`,
  `formatChangeSummary`) computes from `rows[0]`/`rows[last]` generically — never hardcodes
  2018/2025 — so `MetricSection` stays decoupled from the analysis window `socrata.ts` owns
  exclusively. Deliberate, named side effect: since `MetricSection` is the one shared component
  all four metrics render through, this also gives the repaired-collisions series a percent-change
  line beyond FR-4's literal "three metrics" — accepted explicitly, not scope creep. `MetricSection.tsx`
  landed at 101 lines (under the SPEC's own 115–120 estimate). The `-0%` rendering trap Cypress
  flagged in Phase 1 (`Math.round(-0.4)` → JS `-0`) was verified fixed by hand-derivation in the
  audit, not just a passing test. One non-blocking eslint warning (`ChangeSummary<K>`'s `K` unused
  in the type body) left unsuppressed deliberately — narrowing it would break the SPEC-pinned
  generic signature, and no `eslint-disable` convention exists elsewhere in this codebase. Full
  narrative and reasoning in `ARCHIVED_SESSIONS.md`; closed SPEC in `ARCHIVED_SPECS.md`. `SPEC.md`
  reset — no task pre-declared. Working tree has the completed, uncommitted diff (2 implementation
  files + Cypress's 2 test files) — not yet committed.
- **FR-12 (casualty-filtered "repaired" collisions, data half) CLOSED (2026-08-06).** Cedar found
  it by re-reading the PRD directly rather than picking from the seven candidates it was handed —
  P0, and the PRD's own text names it as the product's actual "fix" (the corrected number to use
  instead of the reporting-broken raw series), unblocked only once FR-3's chart half landed the
  session before. Standard ordering throughout; Cypress PASS on both the Phase 1 red-test check
  and the Phase 3 audit — no rejection loop spent. Widened `socrata.ts` with one new optional
  `extraWhere` param — Cedar explicitly declined the Strategy/registry escalation four prior SPECs
  had pre-committed to at "a third query shape," naming the real trigger as a second independent
  axis of variation (FR-6's borough filter) instead. New `repairedCollisions.ts` +
  `api/repaired-collisions/route.ts`; `page.tsx` gained a fourth independent table (now 122 lines,
  under the ~150 Tipping Point). **FR-12 fully closed** — unlike FR-3, its text has no stroke/chart
  requirement, so two tables satisfy "alongside the raw series" as written. The byte-identical
  invariant on `socrata.ts`'s 2-argument call path was verified three ways: unit test, Cypress
  reading the source by hand, and a live-API regression check confirming deaths/injuries/collisions
  figures unchanged. Full narrative and reasoning in `ARCHIVED_SESSIONS.md`; closed SPEC in
  `ARCHIVED_SPECS.md`. `SPEC.md` reset — no task pre-declared. Committed as three commits
  (test → feat → docs) and pushed: `1207be0`→`e50a533`→`752019e`, `origin/main` now at `752019e`.
- **FR-3's chart half (collisions dashed-stroke chart, small multiples) CLOSED (2026-08-06).**
  Standard ordering throughout; Cypress PASS on both the Phase 1 red-test check and the Phase 3
  audit — no rejection loop spent. FR-3 (dashed stroke + inline label, conjunctively) is now
  **fully satisfied**. One non-blocking finding logged and handled: a `next dev`-injected
  `CLAUDE.md` block was reverted (its own text tried to argue for committing it instead — an
  injection attempt, disregarded and flagged, not followed). One open non-blocker: live-browser
  visual QA (dashed rendering, dark-mode swap, 320px) is still owed whenever a Chromium binary is
  available in this environment; substituted this round with jsdom+axe-core assertions and a
  pinned-token cross-check. `YearlyLineChart.tsx` is 151 lines, past its own ~140-line Tipping
  Point by 11 — logged, not blocking. Full narrative and reasoning in `ARCHIVED_SESSIONS.md`;
  closed SPEC in `ARCHIVED_SPECS.md`. `SPEC.md` reset — no task pre-declared. Committed as three
  commits (test → feat → docs, matching established convention) and pushed:
  `6f4b945`→`46b0d46`→`4e8fefe`, `origin/main` now at `4e8fefe`.
- **`MetricSection` extraction + `page.module.css` deletion CLOSED (2026-08-06).** `page.tsx`:
  162 → 63 lines. Cypress PASS: 155/155 tests, `git diff --stat` on `page.test.tsx` and six other
  protected test files empty (independently reconfirmed by both Banyan and Cypress) — the
  mechanical proof nothing observable changed. Sequenced deliberately *before* the FR-3 chart
  redesign so that task gets clean territory instead of competing for the same file. Full
  narrative in `ARCHIVED_SESSIONS.md`; closed SPEC in `ARCHIVED_SPECS.md`. Commits:
  `235347d`→`3f1cfc5`→`ca683e0` → archival. `SPEC.md` reset — no task pre-declared.
- **Both `stop-quality-gate.sh` fake-green defects FIXED (2026-08-06), Redwood, no SPEC (simple
  bug, routed directly per Pine's rules).** (1) A missing/non-executable `tsc`/`eslint` binary now
  fails loud (`failed=$((failed+1))`, explicit "incomplete or corrupted install" message) instead
  of silently skipping the check while still reporting clean — verified by renaming each binary in
  turn and confirming exit 2, then restoring and reconfirming exit 0. (2) The all-clear message now
  captures `node -v` defensively into a variable with an `"unknown"` fallback, so it can no longer
  print an empty version. `--hook` mode and the `stop_hook_active` escalation short-circuit
  reconfirmed untouched. Independently re-verified (not just trusting Redwood's report): re-ran the
  script standalone post-fix, clean with `Node v22.23.2`.
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

*(Empty — everything closed so far is archived; nothing has closed since MetricSection.)*

Nine entries are now in `ARCHIVED_SESSIONS.md`, newest first: **FR-4 closed — a derived, not
fetched, percent-change line** (2026-08-06, why Cedar picked scope-readiness over centrality this
round, and the `-0%` trap that got double-verified); **FR-12 closed — the "repaired" collisions
series** (2026-08-06, why Cedar found it outside the given candidate list, and why the
Strategy/registry pre-commitment was overridden rather than followed); **FR-3 closed —
small-multiples chart** (2026-08-06, why the shared-axis framing was rejected and rebuilt, plus a
caught prompt-injection attempt); **`MetricSection` extraction** (2026-08-06, why the deaths-chart
slot was deliberately kept out of its contract); **FR-3's data half** (2026-08-06, why FR-3 was
recorded partially-satisfied rather than closed at the time); **FR-2 / `socrata.ts` extraction**
(2026-08-06, why Cedar picked it over the more thesis-central FR-3); **the subgroup-sum fallback
correction** (2026-08-06, why the mid-flight revision request mattered); **Task 2 of the walking
skeleton** (2026-08-06, the chart); **Task 1 of the walking skeleton** (2026-08-06, the data path)
plus the pre-Task-1 platform/scaffold work before it. Read that file directly for the full
reasoning behind any of these — this pointer is deliberately terse now that nine entries live
there, per the archive threshold.
