# Sprint Ledger — MVCC Data

**Current objective:** Staten Island pilot panel (PRD P2 story), data half — **human-approved
2026-08-11, Cypress dispatched, awaiting its `[COMPLIANCE-REPORT]`.**

## Active

- **APPROVED, IN FLIGHT — `SPEC.md` holds the Staten Island pilot panel data-half SPEC** (written
  and approved 2026-08-11). Scope: `src/lib/statenIslandPilot.ts` + test, and
  `src/app/api/staten-island-pilot/route.ts` + test (4 files) — fetch/validate/derive the monthly
  Staten Island collision count for 2018–2019 (the pre-COVID natural experiment PRD §3 names as a
  P2 story), deliberately **not** the chart/UI half, mirroring this project's FR-3 data/chart split.
  **The exact SoQL was verified live during drafting, not recalled** — `date_trunc_ym(crash_date)`
  grouped and filtered to `borough = 'STATEN ISLAND'`, confirmed to return 24 gap-free monthly rows
  matching Appendix A exactly (2018 sum 6,171; 2019 sum 3,650; Mar/Apr 2019 370/217; May–Dec 2019
  avg ≈271). One implementation detail the probe surfaced: Socrata returns `month` as a full
  floating timestamp (`"2018-01-01T00:00:00.000"`), not `"YYYY-MM"` — pinned in the SPEC so
  Redwood doesn't guess. Design choice recorded in the SPEC's Intellectual Control: this is a new
  self-contained module, not an extension of `socrata.ts` (whose fixed yearly/8-row contract
  doesn't fit a 24-row monthly window with a hardcoded, non-optional borough).
  **Cypress is dispatched (background) writing failing tests for `statenIslandPilot.test.ts` and
  `route.test.ts` — do not hand-implement `statenIslandPilot.ts`/`route.ts` while it's in flight.**
  Next step: relay its `[COMPLIANCE-REPORT]` to Redwood once it lands.

- **Deployed and live-verified:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir
  `./`, Vercel defaults, `SOCRATA_APP_TOKEN` set server-side only. NFR-2 confirmed clean (no token
  identifier in any client chunk) as of the 2026-08-11 redeploy.
- **NFR-1 borough-caching gap CLOSED, committed `f2611bf`, pushed, redeployed, live-verified
  2026-08-11.** `/` is now `src/app/[[...borough]]/page.tsx`, prerendering all six variants
  (citywide + 5 boroughs) via `generateStaticParams`. All 5 SPEC acceptance criteria confirmed
  against the live URL (cache HIT on repeat, cold latency <0.3s vs. a 2.5s budget, `/X`/`/k` 404,
  NFR-2 clean). Full outcome + reasoning (why `cacheComponents` was declined) archived in
  `ARCHIVED_SPECS.md` / `ARCHIVED_SESSIONS.md`, "2026-08-11."
- **The "record First Load JS" deploy obligation is retired, not deferred.** Next.js 16 removed
  that metric from `next build` output entirely (confirmed in the vendored docs). If bundle-size
  tracking is wanted later, target Lighthouse CI or Vercel Analytics instead — a new SPEC, not a
  retry of the old ask.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; rationale in `CLAUDE.md` § Project
  Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform target: Node v22.23.2 / npm 10.9.8, via `nvm` (installed through Homebrew, not
  `~/.nvm`'s default path).** Prefix every gate/build command with:
  `export NVM_DIR="$HOME/.nvm"; . /usr/local/opt/nvm/nvm.sh; nvm use >/dev/null`
  A system Node (currently v26.7.0) exists on this machine and is *not* the target — it passes
  `engines.node` and jsdom's range, but Vercel's runtime is 22.x and the pin is for dev/prod parity.
  Two prior toolchain regressions (fnm vanishing 2026-08-07, nvm vanishing 2026-08-11) are recorded
  with full reasoning in `ARCHIVED_SESSIONS.md`, "2026-08-11" — re-read that before assuming a third
  is a new problem shape.
- **`node_modules/` wiping is a recurring pattern (2 occurrences so far), not a one-off.** Recovery:
  `nvm use` → `npm ci` → `npx next typegen` → gates. Typegen is non-optional (`layout.tsx` uses
  Next 16's generated `LayoutProps<"/">`; a wiped `.next/` fails `tsc` with a misleading
  `TS2304`). Verify `.git/hooks/commit-msg` is still byte-identical to `.githooks/commit-msg` after
  any such recovery — that's what distinguishes "wiped" from "fresh clone" (the latter needs the
  guard reinstalled). `node_modules/next/dist/docs/` (the mandated Next reference) only exists post-
  `npm ci`; **context7 is not a fallback here — its API key is invalid in this environment.**
- **Current verified baseline (2026-08-11, node v22.23.2): vitest 570/570 in 22 files,
  `tsc --noEmit` clean, `eslint .` 0 errors / 2 known warnings** (`percentChange.ts:15` unused type
  param `K`; a `container`-unused warning in the moved `page.test.tsx`).
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
  fails outright (no Chromium binary); the installer needs `sudo` with no password available.
  Confirmed 2026-08-06/07; don't retry installing it in this environment. Live-browser visual QA
  genuinely needs a human with a browser, or a different sandbox.

## History

*(Empty — closed work is archived directly to `ARCHIVED_SESSIONS.md` as it closes, rather than
accumulating here first.)*

Fifteen entries are now in `ARCHIVED_SESSIONS.md`, newest first: **deploy verification, platform
recovery, and the borough-caching fix** (2026-08-11, why `cacheComponents` was declined in favor of
enumerated `generateStaticParams`, why a Redwood-flagged test bug was fixed directly rather than
round-tripped through Cypress, why "record First Load JS" turned out unfulfillable rather than
merely unmet, and the second toolchain regression this project has hit); **FR-6/FR-7 planned as six
phases, Phases 1–2 closed** (2026-08-07); **FR-5 closed — the first `/grill-me` round this project
ran** (2026-08-07); **FR-13 closed — policy-date markers** (2026-08-07); **FR-9 closed — the last
P0, the caveats section** (2026-08-06); **`stop-quality-gate.sh`'s fake-green fix** (2026-08-06);
**FR-4 closed — a derived, not fetched, percent-change line** (2026-08-06); **FR-12 closed — the
"repaired" collisions series** (2026-08-06); **FR-3 closed — small-multiples chart** (2026-08-06);
**`MetricSection` extraction** (2026-08-06); **FR-3's data half** (2026-08-06); **FR-2 /
`socrata.ts` extraction** (2026-08-06); **the subgroup-sum fallback correction** (2026-08-06);
**Task 2 of the walking skeleton** (2026-08-06); **Task 1 of the walking skeleton** (2026-08-06)
plus the pre-Task-1 platform/scaffold work before it. Read that file directly for the full
reasoning behind any of these — this pointer is deliberately terse now that fifteen entries live
there, per the archive threshold.
