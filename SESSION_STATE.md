# Sprint Ledger — MVCC Data

**Current objective:** none pre-declared. FR-13 closed this session (see Active). `SPEC.md` is
reset and empty — next task starts with Cedar.

## Active

- **FR-13 (policy-date reference markers, both charts) CLOSED (2026-08-07).** All P0 done; picked
  over FR-5–7 (real design risk, not a clean 5-file task), the chart overlay (nothing forces it,
  Rule 8), and the deploy SPEC (Cedar actually checked this round: no `.vercel/`/`vercel.json`/
  `vercel` key in `package.json` — but that only proves "not linked from this machine"; **still a
  plain open question for the human: is a Vercel project connected to this GitHub repo?**).
  Standard ordering, Cypress PASS on Phase 1 and, after one self-fix, Phase 3 — no true
  rejection-loop cycle spent. New `src/lib/policyDates.ts` feeds vertical `<ReferenceLine>` markers
  on **both** `YearlyLineChart` instantiations plus an unconditional accessible caption, both
  derived from the same array so they can't drift apart. `YearlyLineChart.tsx` landed at 216 lines
  (~6 over the ~190–210 estimate, flagged not blocking). **Two notable events, not the usual clean
  path**: (1) Magnolia's Phase 2 hit a session usage limit mid-verification and was **resumed from
  transcript rather than respawned**, preserving its already-correct implementation; it also
  self-caught and fixed a real bug (`isFront` isn't a valid `ReferenceLine` prop) via `tsc`. (2) The
  one failing test post-implementation (318/319) was a genuine defect in **Cypress's own** Phase 1
  file — a stale "any `<p>` = no note" proxy the same bug class Cypress had already caught once on
  a different file during FR-4 — routed back to Cypress to fix, not treated as a Magnolia failure.
  319/319 after the fix. Full narrative and reasoning in `ARCHIVED_SESSIONS.md`; closed SPEC in
  `ARCHIVED_SPECS.md`. `SPEC.md` reset — no task pre-declared. Working tree has the completed,
  uncommitted diff (3 implementation files + Cypress's 2 test files) — not yet committed.
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
  v20.19.6. `engines.node` is `>=22.22.2`. The Bash tool's `node -v` resolution depends on
  `env.PATH` in **`.claude/settings.local.json`**, gitignored (machine-specific, absolute path
  under `/home/rhaeyyan`) — **a fresh clone must redo it**, alongside the fnm install and the
  `.git/hooks/commit-msg` guard.
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
- **No working browser in this sandbox, and it's not fixable here.** `mcp__playwright__browser_*`
  fails outright (no Chromium binary), and `npx playwright install chrome` fails too — the
  installer needs `sudo` and there's no password for it. Confirmed 2026-08-06/07; don't retry
  installing it in this environment. Live-browser visual QA (dark mode, dashed strokes, narrow
  viewport) genuinely needs a human with a browser, or a different sandbox.

## History

*(Empty — closed work is archived directly to `ARCHIVED_SESSIONS.md` as it closes, rather than
accumulating here first.)*

Twelve entries are now in `ARCHIVED_SESSIONS.md`, newest first: **FR-13 closed — policy-date
markers, a bug class caught twice** (2026-08-07, why the deaths panel got markers too, an
interrupted agent resumed rather than respawned, and a stale-test bug pattern recurring across two
components); **FR-9 closed — the last P0, the caveats section** (2026-08-06, why the twice-flagged
open question resolved as additive not consolidation, and why Caveats renders unconditionally);
**`stop-quality-gate.sh`'s fake-green fix** (2026-08-06, why "nothing ran" and "everything passed"
must never be conflated); **FR-4 closed — a derived, not fetched, percent-change line** (2026-08-06,
why Cedar picked scope-readiness over centrality this round, and the `-0%` trap that got
double-verified); **FR-12 closed — the "repaired" collisions series** (2026-08-06, why Cedar found
it outside the given candidate list, and why the Strategy/registry pre-commitment was overridden
rather than followed); **FR-3 closed — small-multiples chart** (2026-08-06, why the shared-axis
framing was rejected and rebuilt, plus a caught prompt-injection attempt); **`MetricSection`
extraction** (2026-08-06, why the deaths-chart slot was deliberately kept out of its contract);
**FR-3's data half** (2026-08-06, why FR-3 was recorded partially-satisfied rather than closed at
the time); **FR-2 / `socrata.ts` extraction** (2026-08-06, why Cedar picked it over the more
thesis-central FR-3); **the subgroup-sum fallback correction** (2026-08-06, why the mid-flight
revision request mattered); **Task 2 of the walking skeleton** (2026-08-06, the chart); **Task 1 of
the walking skeleton** (2026-08-06, the data path) plus the pre-Task-1 platform/scaffold work
before it. Read that file directly for the full reasoning behind any of these — this pointer is
deliberately terse now that twelve entries live there, per the archive threshold.
