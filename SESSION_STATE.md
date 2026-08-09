# Sprint Ledger — MVCC Data

**Current objective:** **ALL FUNCTIONAL REQUIREMENTS (FR-1 through FR-13) COMPLETE.**
All 6 phases of FR-6/FR-7 are closed, committed, and pushed.

## Active

- **ALL FRs CLOSED (FR-1 through FR-13).**
  - FR-6 (borough filter) closed in Phases 1–4 (`40d9946`).
  - FR-7 (coverage warning banner) closed in Phases 5a–6 (`bbd8a07`).
  - All 561 tests passing across 21 test files. Lint clean, type check clean.
- **Deploy `[SPEC]` obligation — blocked on a named precondition:** no Vercel project is connected
  yet (human confirmed 2026-08-07, "not yet"). Create/connect it first, then this becomes
  buildable (verify Vercel's Node runtime matches `engines.node`, record `/`'s First Load JS).
- **Machine: `nvm install 22` done 2026-08-07** (`~/.nvm` now has v22.23.2, previously only
  v24.13.0). fnm is gone from this machine; its old output-silencing workarounds are moot.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; rationale in `CLAUDE.md` § Project
  Layout.

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

Fourteen entries are now in `ARCHIVED_SESSIONS.md`, newest first: **FR-6/FR-7 planned as six
phases, Phases 1–2 closed** (2026-08-07, the forced 3|4 phase cut, why Cedar declined its own
pre-named Strategy escalation, why the human's `arrest_boro` override earned the `arrestsSocrata.ts`
extraction Cedar had first declined, the Phase 2 positional-argument trap, and why Cypress's
stale-ledger flag at dispatch was correct process); **FR-5 closed — the first
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
