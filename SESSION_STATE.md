# Sprint Ledger — MVCC Data

**Current objective:** none pre-declared. FR-5 closed this session (see Active). `SPEC.md` is
reset and empty — next task starts with Cedar (FR-6/FR-7 likely candidate, its own `/grill-me`
round recommended given its recorded scope).

## Active

- **FR-5 (arrests as a fifth small-multiples panel) CLOSED (2026-08-07).** First task this session
  routed through `/grill-me` before Cedar, given FR-5–7's flagged design risk across three prior
  planning rounds. Interview locked in **small multiples** (overriding the PRD's literal
  "secondary axis" text, same reasoning as FR-3's correction) and **explicitly deferred FR-6/FR-7**
  to their own future round (FR-6's eventual scope recorded as a *global* filter across all five
  series). Standard ordering, Cypress PASS on Phase 1 and, after one self-fix, Phase 3. Cedar's
  build call: `arrests.ts` ships **self-contained**, not a `socrata.ts` widening — severability
  (PRD §5.2 names FR-5–7 droppable) should be a code fact, not a doc claim; ~130 lines of
  duplicated fetch/validate scaffold, named honestly, with a Tipping Point for a second
  `8h9b-rp9u` caller. Reuses `YearlyLineChart<K>`/`MetricSection<K>` unmodified, `colorSlot: 1`
  reused (panels never juxtaposed), no new inline note (`Caveats.tsx` already covers it
  page-wide). Zero regression on the four existing metrics or `socrata.ts` (empty diff). **The one
  failing test post-implementation was the third occurrence this session of the same bug shape** —
  an old test's absolute claim ("only socrata.ts reads the token") invalidated by new, legitimate,
  SPEC-approved behavior — same class as FR-4's and FR-13's note-paragraph tests. Cypress had
  already written the correct generalized pattern once (in its own `arrests.test.ts`) and ported it
  to the stale file. 374/374 after the fix. No `.env`/token needed — both datasets public,
  unauthenticated fetches worked all session; user offered `SOCRATA_APP_TOKEN` for rate-limit
  headroom, declined for now. Full narrative and reasoning in `ARCHIVED_SESSIONS.md`; closed SPEC
  in `ARCHIVED_SPECS.md`. `SPEC.md` reset — no task pre-declared. Working tree has the completed,
  uncommitted diff (3 implementation files + Cypress's 2 test files + 1 stale-test fix) — not yet
  committed.
- **Deploy `[SPEC]` obligation — the open question is answered (2026-08-07): no Vercel project is
  connected yet.** Rayan confirmed directly ("not yet"), settling what three sessions of Cedar
  planning rounds couldn't resolve by reading the repo alone. This SPEC stays blocked, but on a
  known, named precondition now rather than an unresolved mystery — **create/connect the Vercel
  project first**, then this becomes buildable (verify Vercel's Node runtime matches
  `engines.node`, record `/`'s First Load JS after both charts + FR-13's markers). Not something
  Cedar can pick next on its own; needs the human to do the Vercel-side setup first.
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

Thirteen entries are now in `ARCHIVED_SESSIONS.md`, newest first: **FR-5 closed — the first
`/grill-me` round this project ran** (2026-08-07, why product-judgment risk is the actual trigger
for the interview, and the third occurrence of the "old test's absolute claim" bug shape); **FR-13
closed — policy-date markers, a bug class caught twice** (2026-08-07, why the deaths panel got
markers too, an interrupted agent resumed rather than respawned); **FR-9 closed — the last P0, the
caveats section** (2026-08-06, why the twice-flagged open question resolved as additive not
consolidation); **`stop-quality-gate.sh`'s fake-green fix** (2026-08-06, why "nothing ran" and
"everything passed" must never be conflated); **FR-4 closed — a derived, not fetched, percent-change
line** (2026-08-06, why Cedar picked scope-readiness over centrality this round); **FR-12 closed —
the "repaired" collisions series** (2026-08-06, why Cedar found it outside the given candidate
list); **FR-3 closed — small-multiples chart** (2026-08-06, why the shared-axis framing was
rejected and rebuilt, plus a caught prompt-injection attempt); **`MetricSection` extraction**
(2026-08-06, why the deaths-chart slot was deliberately kept out of its contract); **FR-3's data
half** (2026-08-06, why FR-3 was recorded partially-satisfied rather than closed at the time);
**FR-2 / `socrata.ts` extraction** (2026-08-06, why Cedar picked it over the more thesis-central
FR-3); **the subgroup-sum fallback correction** (2026-08-06, why the mid-flight revision request
mattered); **Task 2 of the walking skeleton** (2026-08-06, the chart); **Task 1 of the walking
skeleton** (2026-08-06, the data path) plus the pre-Task-1 platform/scaffold work before it. Read
that file directly for the full reasoning behind any of these — this pointer is deliberately terse
now that thirteen entries live there, per the archive threshold.
