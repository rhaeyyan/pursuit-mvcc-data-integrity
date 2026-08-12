# Sprint Ledger — MVCC Data

**Current objective:** none in flight. **Queued next:** the Staten Island pilot panel's chart/UI
half (sequenced after the fallback-banner-wiring SPEC below so the two don't edit `page.tsx`
concurrently — that's now clear).

## Active

- **Fallback banner wiring — CLOSED 2026-08-12.** `src/components/CachedDataBanner.tsx` (new,
  `role="status"`, deterministic UTC date formatting — no `toLocaleDateString()`) + `page.tsx`
  wired through `withFallback(rawDeathsResult, activeCode === undefined ? deathsFixtureData :
  undefined)`, banner rendered as a sibling before the deaths chart, gated on `status === "ok" &&
  source === "cache"`. Full TDD chain (Cypress → Redwood), approved via HITL before dispatch.
  **One real cross-cutting collision surfaced and was resolved, the second of its kind this
  project has hit** (first was the Staten Island Zero-Trust tests): 7 pre-existing tests mocked a
  citywide deaths fetch as `kind: "upstream"` purely to test cross-metric/Caveats independence,
  and that exact mock shape is what the new wiring now correctly substitutes instead of erroring.
  Redwood declined to touch tests or weaken the wiring; escalated to Cypress, who changed only the
  `kind` field (`"upstream"` → `"contract"`) in those 7 mocks, preserving every assertion
  byte-for-byte — a contract violation is unconditionally excluded from substitution (Edge Case 3)
  regardless of borough state. Verified node v22.23.2: **640/640** (+14 from 626 baseline), `tsc
  --noEmit` clean, `eslint .` 0 errors/2 known pre-existing warnings. Banner deliberately
  undecorated — visual polish is a named, not-yet-written Magnolia follow-up. Full reasoning
  archived in `ARCHIVED_SPECS.md` / to be condensed into `ARCHIVED_SESSIONS.md` at next archive
  pass, "2026-08-12 — Fallback banner wiring."

- **Fallback fixture mechanism — CLOSED 2026-08-11.** `scripts/generate-fallback-fixture.ts` runs
  the already-tested `fetchDeathsPerYear()` live and writes its `.soql`/`.rows` verbatim to the
  committed `src/lib/fixtures/deaths-fallback.json` — zero new SoQL. `src/lib/fallback.ts`'s pure
  `withFallback()` substitutes the fixture only on `kind: "upstream"` failures, never `kind:
  "contract"` or `status: "empty"` — a contract violation must never be masked by a cache.
  **Verified beyond the standard TDD chain**: independently re-ran the live generator twice myself
  after Redwood's report — once hit a genuine transient Socrata network failure that correctly
  wrote nothing (Edge Case 6 firing for real, not a bug), once succeeded with figures identical to
  the committed fixture (231, 244, 269, 297, 290, 280, 268, 229) except a fresh `asOf`. Verified
  570→613→**626/626**, `tsc` clean, `eslint` 0 errors/2 known warnings. **Mechanism only at the
  time** — wiring into `page.tsx` with a visible banner was the deliberate follow-up SPEC,
  matching this project's established data/UI split (FR-3, the NFR-1 fix, the Staten Island panel
  all did this too); that follow-up is now closed, see "Fallback banner wiring — CLOSED
  2026-08-12" above. Full reasoning (the citywide/deaths-only
  scope decision, why Redwood's Node-ESM module-resolution shim was accepted rather than treated
  as a red flag) archived in `ARCHIVED_SESSIONS.md` / `ARCHIVED_SPECS.md`, "2026-08-11 — Fallback
  fixture mechanism."

- **Staten Island pilot panel, data half — CLOSED 2026-08-11.** `src/lib/statenIslandPilot.ts` +
  `src/app/api/staten-island-pilot/route.ts` (self-contained module, not an extension of
  `socrata.ts` — see Intellectual Control reasoning archived below), full TDD chain, live-query
  acceptance check passed exactly (2018 sum 6,171, 2019 sum 3,650, Mar/Apr 2019 370/217).
  **One legitimate cross-cutting escalation surfaced and was resolved**: two pre-existing
  Zero-Trust `process.env` confinement tests didn't know about this new token-reading module;
  Cypress extended both to a 4th named exception after independent verification that the new
  module's token handling matched the existing safe pattern. Verified 570→**613/613**, `tsc`
  clean, `eslint` 0 errors/2 known warnings. **Chart/UI half is a deliberate, not-yet-written
  follow-up SPEC** — this closes the data half only. Full reasoning (why the escalation went to
  Cypress rather than a direct fix, why `date_trunc_ym` over `date_extract_m`) archived in
  `ARCHIVED_SESSIONS.md` / `ARCHIVED_SPECS.md`, "2026-08-11 — Staten Island pilot panel."

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
