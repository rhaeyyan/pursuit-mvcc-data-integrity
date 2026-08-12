# Sprint Ledger — MVCC Data

**Current objective:** **ALL FUNCTIONAL REQUIREMENTS (FR-1 through FR-13) and NFR-5 COMPLETE.**
Phase 8 (Enterprise Storytelling Layout) closed and pushed; `SPEC.md` is reset and empty.

## Active

- **Phase 8 (Enterprise Storytelling Layout) closed, committed `f1dba25`, pushed to `origin/main`.**
  Restructured `page.tsx` into header + KPI row + three thematic sections; new `KPIRow.tsx`/
  `KPIRow.module.css`. Full outcome and verification in `ARCHIVED_SPECS.md`, "Archived
  2026-08-09 — Phase 8." Suite at 566/566, `tsc`/`eslint` clean. No objective currently active.
- **DEPLOYED 2026-08-11 — the precondition above has lapsed.** Live at
  <https://pursuit-mvcc-data-integrity.vercel.app/>, root dir `./`, all build settings left on
  Vercel's auto-detected defaults, `SOCRATA_APP_TOKEN` set as a server-side env var.
  Verified by direct HTTP inspection: `200`, all eight years and all five metric sections render
  (no FR-10 error state), `/api/deaths` returns `status:"ok"` with 2018=231 / 2019=244.
  **NFR-2 clean** — no `SOCRATA_APP_TOKEN` / `X-App-Token` / `app_token` identifier appears in any
  of the 8 client chunks or the HTML.
  **One deploy finding fixed same-day, one now permanently unfixable as originally worded:**
  1. **NFR-1 borough-caching gap — FIXED 2026-08-11, uncommitted, ready to land.** `/` moved from
     `src/app/page.tsx` (searchParams — the whole route was dynamic, every response a cache MISS) to
     `src/app/[[...borough]]/page.tsx`, an optional catch-all with `generateStaticParams` enumerating
     the closed six-member set (citywide + 5 boroughs), `dynamicParams = false`, `revalidate = 86400`
     matching the Socrata Data Cache TTL. `BoroughPicker.tsx` now pushes `/${code}` instead of
     `/?borough=${code}`. Local build's route table confirms all six paths render `●` (SSG).
     Full TDD chain ran: Cypress wrote failing tests first (`[COMPLIANCE-REPORT]`: correct red state,
     2 failures for the right reasons), Redwood implemented (`[COMPLETION-REPORT]`: spec satisfied),
     I found and fixed one unrelated test bug directly rather than round-tripping through Cypress
     again — `BoroughPicker.test.tsx`'s new loop test called `render()` 5× with no `cleanup()`
     between iterations, so RTL found duplicate comboboxes; added `cleanup()` per iteration.
     **Verified independently, not just relayed:** node v22.23.2, `npx vitest run` → **570/570**,
     `tsc --noEmit` clean, `eslint .` 0 errors / 2 known warnings, `npm run build` route table read
     directly (not trusted from the report) — `/`, `/B`, `/K`, `+3 more` all `●`.
     **Not yet done:** commit, push, and the *live*-deploy half of acceptance (cache HIT on repeat
     `/K`, cold borough <2.5s, `/X` 404, no token in client bundle) — those need a fresh Vercel
     deploy of this branch, not just the local build.
  2. **First Load JS is not merely unrecorded — it cannot be recorded the way the obligation asked,
     ever, on this Next version.** Confirmed directly from
     `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md:989`: **Next.js 16
     deliberately removed the `size`/`First Load JS` metrics from `next build` output**, calling them
     inaccurate for RSC architectures; Next's own recommended replacement is Chrome Lighthouse or
     Vercel Analytics against Core Web Vitals, not a build-log field. **Retire this obligation as
     originally worded.** If bundle-size tracking is still wanted, the next SPEC should target
     Lighthouse CI (already named as a maybe-later item elsewhere in this file) or Vercel Analytics,
     not a number that no longer exists.
- **Machine: nvm was missing on 2026-08-11 and has been REINSTALLED (via Homebrew) and Node 22
  restored.** Platform is back to the targeted v22.23.2; see the Platform entry in the Context Cache
  for the current recipe. Node 26.7.0 remains on the machine as the system install — it is *not* the
  target, and `nvm use` must be run before any gate.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; rationale in `CLAUDE.md` § Project
  Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform: Node v22.23.2 / npm 10.9.8 — restored 2026-08-11, and the way it is obtained changed
  again.** fnm (pre-2026-08-07) → nvm-by-unknown-means (2026-08-07) → **nvm installed via Homebrew
  (2026-08-11)**. `~/.nvm` had been emptied and no version manager remained; `brew install nvm` put
  nvm 0.40.6 at `/usr/local/opt/nvm` (note: **not** `~/.nvm/nvm.sh` — that path is the *data* dir, so
  the 2026-08-07 sourcing line fails with exit 127 and is retired).
  **Working recipe, verified end-to-end:**
  `export NVM_DIR="$HOME/.nvm"; . /usr/local/opt/nvm/nvm.sh; nvm use >/dev/null`
  `nvm use` with no argument now reads `.nvmrc` correctly, so the version lives in one place.
  The sourcing block was also appended to `~/.zshrc`, which is what makes
  `stop-quality-gate.sh`'s suggested `bash -ic`/`fish -i` remedy actually work — **that advice was
  unactionable while no version manager existed, and the two prior ledger entries calling it "moot"
  were right at the time.** It is live again now.
- **Why 22 and not the system Node 26.7.0, which also passes.** v26.7.0 is *permissible* — it clears
  `engines.node` (`>=22.22.2`) and satisfies `jsdom@30.0.1`'s `>=26.0.0` branch, and a full run on it
  on 2026-08-11 was genuinely clean (0 `EBADENGINE`, 0 vulnerabilities, 566/566, `tsc` clean). It is
  not the *target*: `.nvmrc` pins 22, Vercel's runtime is 22.x, and the pin exists for dev/prod
  parity, which "permissible by `engines.node`" does not buy. Retargeting to 26 was considered and
  rejected on 2026-08-11 because **Vercel very likely offers no Node 26 runtime yet**, so it would
  have inverted the mismatch rather than fixed it — local on 26, production on 22.
  Keep the jsdom range in mind as the real discriminator: v24.13.0 satisfied *none* of its three
  branches, which is why that specific version was the trap, not "any non-22 Node".
- **`node_modules/` wiping is now a recurring pattern, not a one-off — 2 occurrences (2026-08-07,
  2026-08-11), same recovery recipe both times, repo itself intact both times.** Recovery:
  `nvm use` → `npm ci` → **`npx next typegen`** → gates. Typegen is non-optional: `tsconfig.json`
  includes `.next/types/**/*.ts` and `layout.tsx` uses Next 16's generated `LayoutProps<"/">`, so a
  wiped `.next/` fails `tsc` with a misleading `TS2304: Cannot find name 'LayoutProps'` that reads
  like a source bug and isn't one. Also check `.git/hooks/commit-msg` is still byte-identical to
  `.githooks/commit-msg` after any such recovery (confirmed both times) — its presence is what
  distinguishes "workspace wiped" from "fresh clone," which would need the guard reinstalled.
  `node_modules/next/dist/docs/` (the CLAUDE.md-mandated Next reference) only exists after `npm ci`,
  so a wipe blocks that reading too — **context7 is not a fallback for it: its API key is invalid in
  this environment** (`Invalid API key... should start with 'ctx7sk'`).
- **Do not run the gates on Node 24.13.0 — it is a genuine dependency gap, not a policy nit.**
  `jsdom@30.0.1` requires `^22.22.2 || ^24.15.0 || >=26.0.0`; v24.13.0 satisfies none of the three
  (too new for the 22 branch, too old for the 24.15 branch) and `npm ci` reports `EBADENGINE`. jsdom
  is the DOM environment every component test runs in, so a green run there would be meaningless.
  Node 22 installs clean with no `EBADENGINE` output at all — that silence is the signal.
- **Verified baseline before FR-6/FR-7 work began (2026-08-07, node v22.23.2):** vitest **374/374 in
  17 files**, `tsc --noEmit` clean, `eslint .` 0 errors and 1 pre-existing warning (unused type param
  `K` in `percentChange.ts:15`). Matches the 374 recorded at FR-5's close, so the wipe cost nothing.
- **Current verified baseline (2026-08-11, node v22.23.2 — the targeted platform): vitest 566/566 in
  22 files, `tsc --noEmit` clean, `eslint .` 0 errors and 2 warnings.** Identical results to the
  Node 26 run earlier the same day, which is reassuring but not a licence to gate off-target.
  Note the drift: **the warning count is 2, not the 1 recorded above** — `page.test.tsx:2667` (`container` assigned but never used) joined
  `percentChange.ts:15` at some point during Phases 6-8 and was never recorded. Neither is a
  regression from this session; the accurate bar for any future acceptance gate is **0 errors /
  2 warnings**, and `SPEC.md`'s acceptance criteria now says so.
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
