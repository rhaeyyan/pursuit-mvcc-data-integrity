# Sprint Ledger — MVCC Data

**Current objective:** Task 2 of the walking skeleton — mount a Recharts chart over the deaths-
per-year table Task 1 already built and audited. Pre-declared in `SPEC.md`, not yet dispatched to
Cedar for a full `[SPEC]`.

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
- **Next: Phase C — Magnolia implements**, then Phase D — Cypress audits.
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
