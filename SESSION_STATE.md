# Sprint Ledger — MVCC Data

**Current objective:** MVCC Workspace redesign implemented (2026-08-13) — Vision Zero Shadow Ledger, Phase 1 (spec approved 2026-08-12) is queued behind it, not started.

## Active

- **MVCC Workspace redesign — implemented and gate-clean, uncommitted (2026-08-13).** User
  imported a Design Composer mockup ("MVCC Workspace.dc.html", project "Enterprise
  visualization redesign") via the Design MCP and asked for it built as the real UI/UX layer.
  Plan approved and executed in 6 phases; full plan (architecture decisions, exact
  number-sourcing per view) archived at the end of this entry rather than re-derived — see
  `ARCHIVED_SESSIONS.md` once this entry rolls off, or the session transcript in the meantime.
  - Route group `src/app/(workspace)/` now wraps `/`, `/integrity`, `/registry` in a persistent
    3-column shell (`LeftNav` / routed content / `RightInspector`), all Broadsheet-editorial
    tokens scoped to `(workspace)/workspace.module.css` — `globals.css`'s existing tokens are
    untouched (still load-bearing for `/local`, `/tdi`, `/auditor`, `KPIRow`, `MetricSection`,
    etc.). `src/context/WorkspaceInspectorContext.tsx` bridges the shared right-inspector panel
    to whichever routed page is active (Observer pattern — genuine variance per Rule 8).
  - **The old `[[...borough]]/`, `integrity/`, `registry/` route folders moved into the group**
    (`git mv`, not delete+recreate — history preserved). Imports in moved files switched to the
    `@/*` alias; `vitest.config.mts` gained a matching `resolve.alias` (Vitest doesn't honor
    `tsconfig.json` paths on its own — Next's bundler does, Vite doesn't).
  - `src/lib/derived.ts` (new pure helpers: `pdo()`, `valueAtYear()`) and
    `src/lib/seriesConfig.ts` (new: the single shared definition of all 6 series' metadata —
    label/ink/dash/badge/note — plus `rawValueForYear`/`deltaLabel`/`defensibleLine`/
    `allSeriesInspectorItems`, reused verbatim by `UnifiedTimeline`, `IntegrityAudit`, and
    `SeriesRegistry` so the three views can't drift). `IntegrityAudit`/`SeriesRegistry` now
    receive real fetched data as props from async server `page.tsx` files (previously both were
    fully static/hardcoded — an undetected NFR-4 gap the guard hook's literal-list check
    couldn't catch; fixed as a side effect of wiring real data through, confirmed live: the
    borough-blocked coverage message showed 33%/64.4%/80.1% on a live requery, not the mockup's
    illustrative ~30%, and the SI-pilot section's live numbers (514/217/6,171/2.68×) matched the
    mockup's placeholder prose almost exactly — real data, not a copy).
  - **Recurring gotcha, worth flagging for next session:** any component calling
    `useInspectorSync`/`useWorkspaceInspector` becomes a Context consumer via `useContext`
    *regardless of which field it destructures* — pushing an unmemoized plain object on every
    render causes an infinite re-render loop (hung a `vitest run` once, ~30s+, had to `pkill`).
    Fix is `useMemo` with a dependency array of primitives/stable references, never
    `JSON.stringify(...)` in the deps (ESLint `react-hooks` rejects non-simple-expression deps
    anyway). All four call sites (`UnifiedTimeline`, `IntegrityAudit`, `SeriesRegistry`) now do
    this correctly — if a fifth caller is added, copy the pattern, don't rediscover the bug.
  - **Verified via `mcp__Claude_Browser__*` against a local `next dev`** (this sandbox's earlier
    "no working browser" limitation was Playwright/Chromium-specific — the Browser pane tool
    works fine): all three routes, the borough-blocked state, live SoQL disclosure expansion,
    and hover/table-row → inspector sync all confirmed working with real Socrata data. One
    Browser-pane screenshot-capture glitch encountered (blank gap after scroll) — confirmed via
    direct `getBoundingClientRect()` that the actual DOM/CSS was pixel-correct; a tool rendering
    artifact, not a product bug.
  - **Baseline after this work: 599/599 vitest passing (up from 570), `tsc --noEmit` clean,
    `eslint .` clean.** `.claude/launch.json` added (was missing) so `mcp__Claude_Browser__preview_start`
    can drive `next dev` — `{"name":"mvcc-dev","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":3000}`.
  - **Not committed.** Working tree also still carries the pre-existing, unrelated
    `globals.css`/`layout.tsx` light-theme-revert diff noted at the top of this session — left
    untouched throughout (out of scope, doesn't conflict with the new work since the new tokens
    are scoped to `(workspace)/workspace.module.css`, not `globals.css`).

- **Vision Zero Shadow Ledger, Phase 1 — Spec approved, ready for TDD drafting (2026-08-12).**
  The next sprint focus is implementing the hyper-local safety ledger search by ZIP code and Community Board, fetching local aggregates from the Socrata endpoint, and rendering the repaired versus raw trends. Queued behind the workspace redesign above — not started this session.

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
  A system Node (currently v26.7.0) exists on this machine and is _not_ the target — it passes
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
- **`eslint@^9` is required, not merely unbumped.** The discriminator is _not_ `eslint-config-next`
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

_(Empty — closed work is archived directly to `ARCHIVED_SESSIONS.md` as it closes, rather than
accumulating here first.)_

Eighteen entries are now in `ARCHIVED_SESSIONS.md`, newest first: **fallback banner wiring**
(2026-08-12, why the banner is a plain `page.tsx` sibling not threaded through `MetricSection`, why
the second cross-cutting mock collision resolved as a label fix rather than a judgment call unlike
the first); **fallback fixture mechanism** (2026-08-11, the citywide/deaths-only scope decision,
why Redwood's Node-ESM module-resolution shim was accepted); **Staten Island pilot panel, data
half** (2026-08-11, why the escalation went to Cypress rather than a direct fix, why
`date_trunc_ym` over `date_extract_m`); **deploy verification, platform
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
