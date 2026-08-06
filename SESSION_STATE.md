# Sprint Ledger — MVCC Data

**Current objective:** Task 2 of the walking skeleton — mount a Recharts chart over the deaths-
per-year table Task 1 already built and audited. Cedar's `[SPEC]` is dispatched and human-approved;
Phase C (Magnolia implements) is done, uncommitted; **Phase D (Cypress audits) is next.**

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
- **Docs task CLOSED (2026-08-05).** Both batched items landed:
  1. `docs/project-mvcc-data.md` § Handoff amended in place — the three superseded kickoff clauses
     (subdirectory + its own `AGENTS.md`, move the PRD, record §5.6 there) replaced with a dated
     note explaining why each was retired, rather than silently deleted. `f77ae1c`.
  2. README § Stack gained one line naming the Node floor (`>=22.22.2`, pinned in `.nvmrc` and
     `engines.node`) and that a fresh clone needs `fnm`/`nvm` to pick it up. `c9e28b9`.

  Committed and pushed. **The fresh-clone gap is now down to two undocumented out-of-band steps**
  (the `settings.local.json` env block and `.git/hooks/commit-msg`) — the third, fnm + Node 22, is
  now named in-repo even though the wiring that reads `.nvmrc` still lives outside it.
- **Walking-skeleton Task 1 CLOSED (2026-08-06).** First application code in the repo:
  `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, `src/app/page.tsx` — the deaths-per-year
  metric, live from Socrata, rendered as an accessible table (FR-1/8/10/11, NFR-1–4). Cypress audit
  PASS, standard ordering (tests first, then implementation, then audit — the first SPEC here to
  use standard order rather than the SPIKE override the two prior SPECs used). Live figures
  independently re-verified against PRD Appendix A with **zero drift across all 8 years**, including
  the fragile 2025 endpoint. Full phase-by-phase narrative and the two bugs found mid-flight
  (a TDZ bug in Cypress's own test, and `next dev`/`build` auto-dirtying `CLAUDE.md`) are in
  `## History` below and in the archived SPEC. Commits: `4e63717` (SPEC) → `503c239` (tests) →
  `9ca19e4`+`7fc0050` (implementation + test fix) → this ledger update. All pushed.
- **Task 2 (the Recharts chart) is in flight.** Cedar's fresh-pass `[SPEC]` dispatched and
  human-approved via plan mode (`bc3d43e`) — supersedes the pre-Task-1 sketch in three places: 5
  files not ~3, the `<figure>`/caption live inside the chart component not `page.tsx`, and
  deliberately **no** table-view toggle (Task 1's permanent table already discharges NFR-3).
  **Phase B done (Cypress, tests first):** new `src/components/DeathsChart.test.tsx` (pinned SVG
  geometry — zero-based y-axis tick is called out in the SPEC and the tests as "the single most
  important test in this file"; solid non-dashed stroke; category not numeric x-axis; source-level
  greps standing in for the hook's uncovered constraints), `page.test.tsx` extended with a
  `DeathsChart` mock to assert the mount position/props without re-testing the chart's own
  rendering, and a `ResizeObserver`+dimension stub added to `vitest.setup.ts` (jsdom has no layout
  engine, so `<ResponsiveContainer>` renders nothing without it — verified against a temporarily
  installed `recharts@3.10.1`, never committed, including a text-measurement-span fix that fixed-size
  stubbing broke by making every axis tick appear the same width). Confirmed red for the right
  reason: `DeathsChart.test.tsx` fails to resolve `./DeathsChart` (doesn't exist yet); `page.test.tsx`
  has exactly one new failing assertion (the mount test) with all 42 other tests, including every
  Task 1 test, still green.
- **Phase C done (2026-08-06), uncommitted.** Magnolia implemented the five-file budget exactly:
  `package.json`/`package-lock.json` (added `recharts@3.10.1`, `npm audit` clean), new
  `src/components/DeathsChart.tsx` and `DeathsChart.module.css`, and a minimal `page.tsx` edit (one
  import, one `<DeathsChart rows={result.rows} />` in the `ok` branch, above the table). No prop-name
  substitutions were needed against the installed `recharts@3.10.1`. Colour is carried entirely by
  the CSS module targeting Recharts' stable class names (`:global(.recharts-line-curve)` etc.) rather
  than `currentColor` props — chosen because a single dot needs two different colours (fill vs. ring)
  and CSS rules outrank Recharts' own default presentation attributes regardless of specificity.
  Palette validator: both light (`#2a78d6`/`#ffffff`) and dark (`#3987e5`/`#0a0a0a`) checks PASS;
  `--chart-ink` contrast independently computed at 7.94:1 (light) / 11.05:1 (dark), clearing AA's
  4.5:1 floor. Build: First Load JS for `/` is **769,350 bytes uncompressed** (sourced from
  `.next/diagnostics/route-bundle-stats.json` — Next 16 Turbopack no longer prints the old stdout
  table), recorded for the deploy SPEC's NFR-1 budget, not reacted to. `node -v` throughout:
  `v22.23.2`. `typecheck`/`lint`/`build` all exit 0; independently re-confirmed by the orchestrator
  after Magnolia's report (`tsc --noEmit` clean under the same Node version).
  **One finding for Cypress's audit, not a Magnolia defect:** `npm run test` is 63/64 — the failure
  is a pre-existing bug in Cypress's own `DeathsChart.test.tsx` ("Constraint 1: no process.env
  anywhere under src/components" test, and SPEC.md's acceptance-clause-9 grep as literally written)
  — that one check scans `src/components` for the literal substrings `process.env`/`@/` without
  excluding test files, unlike three sibling checks in the same file that correctly do
  (`!isTestFile(f)`). It trips on the test file's own description strings about itself, not on the
  real component. Magnolia independently confirmed the actual constraint holds by scoping the grep
  to `DeathsChart.tsx`/`page.tsx` directly: zero hits on both `process.env` and `@/`. Cypress may
  edit its own test file to add the same exclusion Constraint 3/4's checks already use; Magnolia
  could not, being out of its write scope.
- **Next: Phase D — Cypress audits.** Should confirm the 63/64 result and either fix the
  test's missing `!isTestFile(f)` filter (matching its siblings) or explain why not, then emit the
  `[COMPLIANCE-REPORT]`. Nothing is committed yet — `git status` shows the 5 files modified/untracked
  from Phase C, pending Cypress's PASS before Redwood/Magnolia's work is merge-ready.
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
  **Cedar has SPEC'd the correction; it is queued in [`SPEC-QUEUED.md`](SPEC-QUEUED.md), and it is
  NOT dispatchable as written** — see § Pending revision request at the top of that file. **Next
  session's first action on this thread: send that revision request to Cedar** (respawns cold — it
  needs the SPEC block *and* the revision section, since it will not remember authoring either).
  Two of three reviewed judgment calls were endorsed unchanged and must not be reopened; the one
  change asks Cedar to make `subtotal-gap.py` a checker with pinned expected gaps and exit 1 on
  drift, rather than a reporter, because the SPEC's own Tipping Point currently has no detector.
  `SPEC.md` is occupied by Task 2, so the contract lives separately until Task 2 archives, then
  moves into `SPEC.md` verbatim and `SPEC-QUEUED.md` is deleted. Cedar's
  pass changed the blast radius in both directions: the falsified mitigation is live in **four**
  places, not one — the research doc's table row (156), its strategic-recommendations bullet
  (168–171), its trust note (40–48), and `nyc-collision-reporting-drift.md`'s Fix column (257),
  which is the most dangerous because a reader of that table sees no hedging at all. Conversely
  **the PRD is out of scope entirely** (FR-11 line 207 and the risk register line 262 already
  specify fail-loud and never mention a fallback) and **`src/lib/deaths.ts` is correct twice
  over** — `parseRow` rejects any non-numeric value, and `SELECT_CLAUSE` never selects the
  subgroup fields, so the fallback is unreachable rather than merely unused. No source change is
  owed. Five files (two prose corrections, a `mvcc-data/SKILL.md` clause, ADR 0002, and
  `.claude/scripts/subtotal-gap.py`); per-file rationale, constraints, and acceptance commands are
  in `SPEC-QUEUED.md` and are not restated here. One thing worth carrying: crashmapper's
  "Other/Unknown" residual pattern is recorded in the ADR but deliberately **not** adopted — it is
  a residual over *people within a record*, our PDO tier is a residual over *collision records*,
  and conflating them would be an error. Applying it needs its own SPEC.
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

*(Empty — everything closed so far is archived; nothing has closed since Task 1.)*

All entries are in `ARCHIVED_SESSIONS.md`: **Task 1 of the walking skeleton, 2026-08-06** — why the
skeleton split in two at the agent boundary rather than spend a second file-cap exemption, why the
page imports the fetch function instead of self-fetching its own Route Handler, the pinned-figure
hook's deliberate three-digit blind spot, the `vi.hoisted` TDZ bug Redwood diagnosed but refused to
fix because test files are Cypress's, and the `next dev` CLAUDE.md-dirtying side effect that is a
standing clause rather than a bug. Before that (the 2026-08-05 audit of both kickoff SPECs — the
scaffold's file bound proven by byte-comparison, the fake-green hook defect it found; the two-SPEC
toolchain build-out — the bounded generator-output exemption, the Node 20 halt and the per-project
platform raise, and `engine-strict`'s rejection on efficacy; README diagram rebuild and the
`ARCHITECTURE.md` deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude
Code agent configuration and the GEMINI.md parity drop; the `.gitignore` / NFR-2 gap).
