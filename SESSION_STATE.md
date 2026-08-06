# Sprint Ledger — MVCC Data

**Current objective:** Walking skeleton is feature-complete (Tasks 1 and 2, both CLOSED). The
subgroup-sum-fallback correction: Redwood has executed the SPEC (uncommitted); **Cypress audit is
next**, per the SPEC's own deviated ordering (Redwood-first, Cypress-after).

## Active

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
- **Prior-art finding (2026-08-05) — the subgroup-sum fallback is falsified; it must not be
  specced.** `docs/nyc-collision-analytics-deep-research.md:156` proposes, as the mitigation for
  the `number_of_persons_killed` dropout, "a synthetic fallback total (sum of the subgroup
  fields)". GreenInfo-Network/nyc-crash-mapper (crashmapper.org, live, ~1M rows) shipped exactly
  that and it produced a public discrepancy against NYC Open Data — their issue #111
  ("Investigate sum discrepancies 2021-2024"): `number_of_pedestrians_* + _cyclist_* + _motorist_*`
  does not equal `number_of_persons_*`, because some casualties carry no role. Measured live
  against `h9gi-nx95` over our own window: the gap is exactly 0 for 2018–2020, then opens in 2021
  and stays open — **deaths short by 12, 20, 19, 9, 6** (2021–2025) and injuries short by ~1.4k–2.4k
  a year. So the "fallback" is not the same series; substituting it would understate 2022 deaths by
  ~7% while looking healthy. **FR-11 fail-loud stays the only behavior.** If a fallback is ever
  wanted it must render as a separate, labelled series with the residual shown, never backfilled
  into the fatality line. Their fix is the pattern worth copying: authoritative total field for the
  grand total, plus an explicit "Other/Unknown" category carrying `total − sum(categories)`.
  The same live query re-confirmed all 8 pinned deaths figures with zero drift.
  **Cedar's SPEC now lives in `SPEC.md` itself (moved there verbatim on Task 2's close) and has
  been revised (2026-08-06) — see § Revision history at the top of `SPEC.md`.** `subtotal-gap.py`
  is now specced as a checker (pins `PINNED_GAPS`, exits 1 on drift, matching `verify-figures.py`'s
  exit-code contract) rather than a reporter, closing the detector gap in this SPEC's own Tipping
  Point. Two of three reviewed judgment calls were endorsed unchanged (the `SKILL.md` edit's
  placement, the Redwood-first ordering). Cedar's original pass changed the blast radius in both
  directions: the falsified mitigation is live in **four** places, not one — the research doc's
  table row (156), its strategic-recommendations bullet (168–171), its trust note (40–48), and
  `nyc-collision-reporting-drift.md`'s Fix column (257), which is the most dangerous because a
  reader of that table sees no hedging at all. Conversely **the PRD is out of scope entirely**
  (FR-11 line 207 and the risk register line 262 already specify fail-loud and never mention a
  fallback) and **`src/lib/deaths.ts` is correct twice over** — `parseRow` rejects any non-numeric
  value, and `SELECT_CLAUSE` never selects the subgroup fields, so the fallback is unreachable
  rather than merely unused. No source change is owed. One thing worth carrying: crashmapper's
  "Other/Unknown" residual pattern is recorded in the ADR but deliberately **not** adopted — it is
  a residual over *people within a record*, our PDO tier is a residual over *collision records*,
  and conflating them would be an error. Applying it needs its own SPEC.
  **Redwood EXECUTED (2026-08-06), uncommitted.** Exactly 5 files: new `.claude/scripts/subtotal-
  gap.py` and `docs/adr/0002-no-synthetic-subtotal-fallback.md`; edited
  `docs/nyc-collision-analytics-deep-research.md` (sites 1/2/4), `docs/nyc-collision-reporting-
  drift.md` (site 3), `.claude/skills/mvcc-data/SKILL.md` (trap 1 + six subgroup fields). Since the
  scratchpad script the SPEC referenced (session-scoped, from an earlier session) was gone, exactly
  as its own Edge Case 5 anticipated, Redwood rebuilt it fresh from the pinned query. **Baseline
  run: exit 0, all 16 cells (8 years × deaths/injuries) matched the pinned table with zero drift.**
  **Detector proof passed**: mutating one `PINNED_GAPS` cell produced exit 1 naming the exact
  series/year/delta; reverting restored exit 0. `ruff check` clean; citations hook clean before and
  after (though it doesn't scan the three non-ADR edited files — the orchestrator independently
  verified all `[ADR 0002]` links in those three resolve, since the hook's normative-doc target
  list is narrower than this task's file list); residual-mention grep shows exactly one hit, inside
  the corrected mitigation cell itself, explicitly naming the remedy as rejected.
  **Next: Cypress audit** (re-runs acceptance clauses 2, 3, 5, 6 per the SPEC's own instruction),
  then close out and archive this SPEC the same way Tasks 1 and 2 were closed.
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

*(Empty — everything closed so far is archived; nothing has closed since Task 2.)*

All entries are in `ARCHIVED_SESSIONS.md`: **Task 2 of the walking skeleton, 2026-08-06** — why
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
