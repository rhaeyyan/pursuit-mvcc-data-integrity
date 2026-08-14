# Sprint Ledger — MVCC Data

**Current objective:** MVCC Workspace redesign implemented and committed, plus a plain-English copy pass on top (uncommitted) — Vision Zero Shadow Ledger, Phase 1 (spec approved 2026-08-12) is queued behind it, not started.

## Active

- **Plain-English copy pass over the whole workspace — done, gate-clean, UNCOMMITTED
  (2026-08-13). NEXT STEP: commit it** — self-contained copy/UX change on top of `8651222`,
  belongs in its own commit. Settled vocabulary and the regression that caused this are recorded
  in Context Cache below; the rest:
  - **Two real fixes found while rewriting, not just wording:** (1) every dashed/dotted series
    shared one inline note, "affected by reporting decline" — **factually wrong for the arrests
    line**, which is dashed because it's a different dataset. `SeriesDef` gained an optional
    per-series `dashNote`; FR-3's never-color-alone rule is still met, now accurately. (2) Raw
    dataset IDs were shown as the "Source" value; now plain name first, ID retained.
  - **Honesty guardrails re-checked line by line** — plain language is exactly where these get
    softened by accident. Correlation-only framing on arrests, the explicit no-causal-claim
    sentence, the "we can't verify SI borough labelling across the switch" limitation, and the
    one causal claim the product *is* allowed to make (policy change → reported-count drop)
    all survive intact.
  - **13 tests updated**, all my own assertions against old copy strings — no behavioral
    regressions. Two needed re-scoping rather than re-wording: plainer fallback text now
    repeats on a page (banner + table share a "couldn't load" message), so `getByText` went
    ambiguous, and the blocked-borough percentages are interpolated mid-sentence and are now
    asserted against `textContent`.

- **MVCC Workspace redesign — DONE, committed `8651222`, pushed to `origin/main`
  (2026-08-13).** Full reasoning (why a route group + scoped tokens, why Context over parallel
  routes, why `seriesConfig.ts` exists, the NFR-4 gap it closed, the dropped SI borough-coverage
  claim, and the commit's hostname-derived git author) archived in `ARCHIVED_SESSIONS.md`,
  "2026-08-13 — MVCC Workspace 3-column redesign".

- **Vision Zero Shadow Ledger, Phase 1 — Spec approved, ready for TDD drafting (2026-08-12).**
  The next sprint focus is implementing the hyper-local safety ledger search by ZIP code and Community Board, fetching local aggregates from the Socrata endpoint, and rendering the repaired versus raw trends. Queued behind the workspace redesign above — not started this session.

- **Deployed and live-verified:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir
  `./`, Vercel defaults, `SOCRATA_APP_TOKEN` set server-side only. NFR-2 confirmed clean (no token
  identifier in any client chunk) as of the 2026-08-11 redeploy.
- **NFR-1 borough-caching gap CLOSED** (`f2611bf`, live-verified 2026-08-11): all six variants
  prerender via `generateStaticParams`. **Path has since moved** to
  `src/app/(workspace)/[[...borough]]/page.tsx` by the redesign — `generateStaticParams` /
  `dynamicParams` / `revalidate` all carried over unchanged. Reasoning (incl. why
  `cacheComponents` was declined) in `ARCHIVED_SPECS.md` / `ARCHIVED_SESSIONS.md`, "2026-08-11".
- **The "record First Load JS" deploy obligation is retired, not deferred** — Next 16 removed
  the metric from `next build` output. Bundle tracking later means Lighthouse CI or Vercel
  Analytics, a new SPEC, not a retry.
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
- **Current verified baseline (2026-08-13, node v22.23.2): vitest 599/599 in 38 files,
  `tsc --noEmit` clean, `eslint .` clean (0 errors, 0 warnings).** The two long-standing
  warnings (`percentChange.ts:15` unused type param `K`; a `container`-unused warning in
  `page.test.tsx`) both cleared during the workspace redesign.
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
- **Live trap in the workspace shell — `useInspectorSync` will infinite-loop if you pass it an
  unmemoized object.** Any component calling `useInspectorSync`/`useWorkspaceInspector` becomes
  a Context consumer via `useContext` *regardless of which field it destructures*, so pushing a
  fresh object literal every render re-triggers the very render that pushed it. This hung a
  `vitest run` (~30s+, needed `pkill`) before it was diagnosed. Wrap the panel object in
  `useMemo` with primitive/stable deps — never `JSON.stringify(...)` in the dep array, which
  ESLint `react-hooks` rejects as a non-simple expression anyway. All three current call sites
  (`UnifiedTimeline`, `IntegrityAudit`, `SeriesRegistry`) do this correctly; copy the pattern
  for a fourth rather than rediscovering the bug.
- **Terminology is settled — don't re-import a mockup's vocabulary over it.** "All reported
  crashes" / "Injury & fatal crashes" / "Minor crashes, no injuries" / "Change since 2018", and
  the three page names "The chart" / "Data quality" / "Where numbers come from". This was
  simplified once in `d3f60f2` and regressed once by the redesign importing the Design Composer
  mockup's jargon wholesale; the 2026-08-13 copy pass restored it. Check existing terminology
  before adopting a source document's.
- **CORRECTED 2026-08-13 — live visual QA IS possible here; the old "no working browser" note
  was Playwright-specific.** `mcp__playwright__browser_*` still fails (no Chromium binary, and
  the installer needs a `sudo` password that isn't available — don't retry it). But
  **`mcp__Claude_Browser__*` works fine**: `preview_start` drives `next dev` via
  `.claude/launch.json`, and navigate/screenshot/`get_page_text`/`javascript_tool` all work
  against real Socrata data. Used for the whole redesign's visual QA. Two practical notes: the
  screenshot tool intermittently returns a blank/misaligned frame right after a scroll — verify
  with `get_page_text` or a `getBoundingClientRect()` call via `javascript_tool` before
  believing a layout bug; and restart the dev server after large refactors, since stale HMR
  state reports compile errors for code that no longer exists.

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
