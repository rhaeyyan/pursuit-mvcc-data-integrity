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

- **FR-6/FR-7 `/grill-me` round complete (2026-08-07) — four decisions settled, all on the
  recommended option.** (1) **Wiring: URL search param**, not client state — `?borough=K` drives a
  server re-render, `page.tsx` stays a server component, deep-linkable, ISR caches each borough
  separately, works with JS off. The existing `/api/*` Route Handlers stay out of the page's fetch
  path (the page has always imported the lib functions directly). (2) **Scope: all five series** —
  PRD-literal, matching the intent recorded at FR-5's close; `arrests.ts` gains an `arrest_boro`
  parameter but stays self-contained, so PRD §5.2 severability survives as a code fact. (3) **FR-7
  warning: one page-level banner** beside the control, shown only while a filter is active — not
  the five-way repetition of the existing `note` prop. (4) **FR-7's figures are computed live via
  SoQL**, never typed in — Rule 1 forbids the literal regardless of correctness, and
  `guard-data-integrity.sh` would block it. Four open assumptions went to Cedar with the block,
  the load-bearing one being that the banner must name *which* series its caveat covers:
  `arrest_boro` is a different field with a different completeness profile, so letting the
  collisions drift figure imply anything about arrests would violate NFR-5.
- **FR-6/FR-7 planned as six phases; Phase 1 approved and in flight (2026-08-07).** Cedar cut the
  work along contract boundaries, not file counts: 1 vocabulary + transport → 2 crash-metric
  propagation → 3 arrests propagation → 4 **FR-6 closed** (UI switch-on) → 5 FR-7 coverage data →
  6 **FR-7 closed** (banner). *The 3 | 4 cut is the forced one* — Phases 1–3 are each provably
  invisible (every caller still defaults to no borough), and shipping the picker before arrests
  propagates would render four panels labelled "Brooklyn" beside a fifth silently still citywide,
  the mislabelled-figure failure this product exists to criticise. **Cedar declined the
  `socrata.ts` Strategy/registry escalation it had itself pre-named for FR-6** — with the concrete
  case in hand, "metric × borough" turns out to be one more AND-ed conjunct on the axis already
  parameterised, not a second dimension; the real new force is a *trust boundary* (a URL param
  reaching a SoQL string), which a closed union type solves and a pattern does not. New Tipping
  Point recorded in its place: a third orthogonal filter axis, or a caller needing to vary
  `$group`/`$order`/the dataset ID. **HITL: three calls approved, one overridden** — the human
  ruled that `arrest_boro` coverage **will** be measured, so FR-7's banner speaks to all five
  filtered series. That trips `arrests.ts`'s Tipping Point (a second `8h9b-rp9u` caller) and
  widens FR-7 past its literal PRD text; Cedar is revising Phases 5–6 only. Phases 1–4 unaffected.
- **Live query findings, 2026-08-07 — all verified, none recalled.** (a) **The five `borough`
  literals are confirmed exactly as pinned**, uppercase: `BRONX`, `BROOKLYN`, `MANHATTAN`,
  `QUEENS`, `STATEN ISLAND`. (b) **Unpopulated rows arrive as an absent `borough` key** — not
  `null`, not `""`; the probe's sixth bucket was `{"rows": "343448"}` with no `borough` field at
  all. That is **trap 1 (Socrata omits keys) surfacing in a new place**, and it is why FR-7's
  numerator enumerates the five values positively via `IN (...)` rather than using `IS NOT NULL`.
  (c) **`borough IN (...)` works** — the pre-authorised five-way `OR` fallback is not needed.
  (d) **Coverage rate per year: 64.4, 64.8, 65.3, 65.3, 66.2, 68.0, 71.4, 80.1%** (2018→2025),
  reproducing the pinned 64.4%/80.1% endpoints exactly; 2019's 64.8% independently reproduces the
  `mvcc-data` skill's Staten Island natural-experiment note, which was never fed to the query.
  **Window unpopulated share derives to 32.9%, row-weighted** — not the ~31.8% mean-of-yearly-rates;
  the two differ by ~1.1pp so the choice is pinned explicitly in code and test. FR-7's PRD prose
  says "~30%": that gap is **rounding in the prose, not drift** — `/verify-figures` must not flag it.
- **FR-5 CLOSED (2026-08-07)** — arrests panel; `9d1be76`/`123aada`/`672b16a`. Narrative in
  `ARCHIVED_SESSIONS.md`, SPEC in `ARCHIVED_SPECS.md`; its two live facts are carried forward above.
- **Deploy `[SPEC]` obligation — the open question is answered (2026-08-07): no Vercel project is
  connected yet.** Rayan confirmed directly ("not yet"), settling what three sessions of Cedar
  planning rounds couldn't resolve by reading the repo alone. This SPEC stays blocked, but on a
  known, named precondition now rather than an unresolved mystery — **create/connect the Vercel
  project first**, then this becomes buildable (verify Vercel's Node runtime matches
  `engines.node`, record `/`'s First Load JS after both charts + FR-13's markers). Not something
  Cedar can pick next on its own; needs the human to do the Vercel-side setup first.
- **Machine changes outside the repo, needing re-doing on any other machine:** `nvm install 22`
  (done 2026-08-07 — `~/.nvm` previously held only v24.13.0); `permissions.defaultMode: "auto"` in
  `~/.claude/settings.json` (2026-08-08 — user-scope, so it applies to *every* project, unlike the
  `/doctor` skill/MCP disables which are local to this repo). *Superseded:* the former
  `~/.config/fish/conf.d/fnm.fish` and appended `~/.bashrc` block silenced fnm's "Using Node"
  banner on stdout; fnm is no longer installed, so both are moot. nvm emits no such banner under
  `nvm use 22 >/dev/null`, so no equivalent workaround is needed.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; its absence is not a gap to close.
  Rationale and revisit trigger in `CLAUDE.md` § Project Layout.
- **`/doctor` config pass DONE (2026-08-08)** — reasoning in `ARCHIVED_SESSIONS.md`. Load-bearing:
  **the three handoff schemas now live only in the `handoff-schemas` skill** (load before any
  dispatch; no agent file defines those fields), and **`github`'s MCP is off on a connection fault,
  not disuse** (run `/mcp` before judging it).


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
