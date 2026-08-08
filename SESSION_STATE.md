# Sprint Ledger — MVCC Data

**Current objective:** **FR-6 (borough filter) + FR-7 (coverage warning)** — the last two open FRs,
both P1. The recommended `/grill-me` round ran on 2026-08-07 and settled four decisions before any
SPEC existed (see Active). Cedar is planning the phase split; `SPEC.md` still empty pending its
phase-1 SPEC and the human's approval.

## Active

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
- **FR-5 CLOSED (2026-08-07)** — arrests as a fifth small-multiples panel. Committed in `9d1be76`
  (red tests) / `123aada` (implementation) / `672b16a` (close-out docs). *Condensed here on
  2026-08-07 once the entry became redundant: the full narrative — why `arrests.ts` ships
  self-contained rather than widening `socrata.ts`, why `colorSlot: 1` was reused, and the third
  occurrence of the stale-absolute-assertion bug shape — is already in `ARCHIVED_SESSIONS.md`, and
  the closed SPEC in `ARCHIVED_SPECS.md`. The two facts from it still load-bearing for current
  work are carried forward above: FR-5's Tipping Point (a second `8h9b-rp9u` caller) and the
  severability rationale, both now in play under the FR-7 `arrest_boro` override.*
- **Deploy `[SPEC]` obligation — the open question is answered (2026-08-07): no Vercel project is
  connected yet.** Rayan confirmed directly ("not yet"), settling what three sessions of Cedar
  planning rounds couldn't resolve by reading the repo alone. This SPEC stays blocked, but on a
  known, named precondition now rather than an unresolved mystery — **create/connect the Vercel
  project first**, then this becomes buildable (verify Vercel's Node runtime matches
  `engines.node`, record `/`'s First Load JS after both charts + FR-13's markers). Not something
  Cedar can pick next on its own; needs the human to do the Vercel-side setup first.
- **Machine changes outside the repo, needing re-doing on any other machine:** `nvm install 22`
  (done 2026-08-07 — `~/.nvm` previously held only v24.13.0). *Superseded:* the former
  `~/.config/fish/conf.d/fnm.fish` and appended `~/.bashrc` block silenced fnm's "Using Node"
  banner on stdout; fnm is no longer installed, so both are moot. nvm emits no such banner under
  `nvm use 22 >/dev/null`, so no equivalent workaround is needed.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; its absence is not a gap to close.
  Rationale and revisit trigger in `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform: Node v22.23.2 / npm 10.9.8** — unchanged as the *target*, but **the way it is
  obtained changed on 2026-08-07: `fnm` is gone from this machine, replaced by `nvm`.** The old
  entry here described an fnm setup plus an `env.PATH` block in `.claude/settings.local.json`;
  neither exists any more (that file now holds only `permissions` and `enabledMcpjsonServers`).
  Ignore `stop-quality-gate.sh`'s suggested `fish -i`/`bash -ic` remedy — fnm is absent from
  interactive shells too, so re-entering a login shell does not help. **Working recipe, verified
  end-to-end:** prefix commands with
  `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null`.
  `nvm install 22` resolves to exactly v22.23.2 / npm 10.9.8.
- **Recovering a wiped workspace (done 2026-08-07, ~2 min).** `node_modules/` and `.next/` were both
  absent while the repo itself was intact — the `.git/hooks/commit-msg` guard was still installed and
  byte-identical, so this was *not* a fresh clone and that guard did not need reinstalling. Order
  that works: `nvm use 22` → `npm ci` → **`npx next typegen`** → gates. The typegen step is not
  optional: `tsconfig.json` includes `.next/types/**/*.ts`, and `layout.tsx` uses Next 16's
  generated global `LayoutProps<"/">`, so a wiped `.next/` fails `tsc` with a single misleading
  `TS2304: Cannot find name 'LayoutProps'` that looks like a source bug and is not one.
- **Do not run the gates on Node 24.13.0 — it is a genuine dependency gap, not a policy nit.**
  `jsdom@30.0.1` requires `^22.22.2 || ^24.15.0 || >=26.0.0`; v24.13.0 satisfies none of the three
  (too new for the 22 branch, too old for the 24.15 branch) and `npm ci` reports `EBADENGINE`. jsdom
  is the DOM environment every component test runs in, so a green run there would be meaningless.
  Node 22 installs clean with no `EBADENGINE` output at all — that silence is the signal.
- **Verified baseline before FR-6/FR-7 work began (2026-08-07, node v22.23.2):** vitest **374/374 in
  17 files**, `tsc --noEmit` clean, `eslint .` 0 errors and 1 pre-existing warning (unused type param
  `K` in `percentChange.ts:15`). Matches the 374 recorded at FR-5's close, so the wipe cost nothing.
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
