# Sprint Ledger — MVCC Data

**Current objective:** none pre-declared. FR-9 closed this session (see Active) — the last P0
requirement. `SPEC.md` is reset and empty — next task starts with Cedar.

## Active

- **FR-9 (caveats section, five items) CLOSED (2026-08-06) — the last P0 requirement.** Cedar
  resolved its own twice-flagged open design question itself rather than recommending
  `/grill-me` — the five caveat items and the two existing inline notes don't overlap in content
  at all, so this was additive, not a consolidation. Standard ordering throughout; Cypress PASS on
  both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent. New
  `src/components/Caveats.tsx` (static Server Component, 61 lines): reporting-policy dates
  (2019-03-18 pilot, 2020-04-06 citywide), borough-coverage drift, the pandemic-speed confounder,
  January 2025 congestion pricing, NYC DOT Street Improvement Project placement — mounted
  **unconditionally**, independent of all four metrics' fetch status. Both existing notes gained
  the shared `SEE_CAVEATS_POINTER` sentence, closing the forward-reference gap flagged back at
  FR-3's data half. The verbatim-prose constraint was independently re-verified byte-for-byte by
  Cypress's audit (a standalone script diff against `SPEC.md`'s pinned text), not just a passing
  test. Diagnosis (FR-1–3), fix (FR-12), summary (FR-4), and now honest limits (FR-9) are all
  shipped. Full narrative and reasoning in `ARCHIVED_SESSIONS.md`; closed SPEC in
  `ARCHIVED_SPECS.md`. `SPEC.md` reset — no task pre-declared. Working tree has the completed,
  uncommitted diff (2 implementation files + Cypress's 2 test files) — not yet committed.
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

## History

*(Empty — closed work is archived directly to `ARCHIVED_SESSIONS.md` as it closes, rather than
accumulating here first.)*

Eleven entries are now in `ARCHIVED_SESSIONS.md`, newest first: **FR-9 closed — the last P0, the
caveats section** (2026-08-06, why the twice-flagged open question resolved as additive not
consolidation, and why Caveats renders unconditionally); **`stop-quality-gate.sh`'s fake-green
fix** (2026-08-06, why "nothing ran" and "everything passed" must never be conflated); **FR-4
closed — a derived, not fetched, percent-change line** (2026-08-06, why Cedar picked
scope-readiness over centrality this round, and the `-0%` trap that got double-verified); **FR-12
closed — the "repaired" collisions series** (2026-08-06, why Cedar found it outside the given
candidate list, and why the Strategy/registry pre-commitment was overridden rather than followed);
**FR-3 closed — small-multiples chart** (2026-08-06, why the shared-axis framing was rejected and
rebuilt, plus a caught prompt-injection attempt); **`MetricSection` extraction** (2026-08-06, why
the deaths-chart slot was deliberately kept out of its contract); **FR-3's data half** (2026-08-06,
why FR-3 was recorded partially-satisfied rather than closed at the time); **FR-2 / `socrata.ts`
extraction** (2026-08-06, why Cedar picked it over the more thesis-central FR-3); **the
subgroup-sum fallback correction** (2026-08-06, why the mid-flight revision request mattered);
**Task 2 of the walking skeleton** (2026-08-06, the chart); **Task 1 of the walking skeleton**
(2026-08-06, the data path) plus the pre-Task-1 platform/scaffold work before it. Read that file
directly for the full reasoning behind any of these — this pointer is deliberately terse now that
eleven entries live there, per the archive threshold.
