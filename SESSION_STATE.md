# Sprint Ledger — MVCC Data

**Current objective:** Danger-index map — height bug fixed and shipped (`bf930b1`). The two data
defects underneath it are open and need Cedar; until they land, the map renders a ranking that is
wrong.

## Active

- **Danger-index height fix — DONE, committed `bf930b1`, pushed to `origin/main` (2026-08-14).**
  New `src/components/DangerMap.module.css`; `DangerMap.tsx` rewired to it at three elements (the
  frame, the `MapContainer` className, the loading skeleton). CSS Modules, not the Tailwind the
  file was written in — repo convention.
  - **Root cause: the map container was 0 px tall.** `DangerMap.tsx`, `danger-index/page.tsx`, and
    `danger-index/error.tsx` are the *only* three files in `src/` written in Tailwind utility
    classes — **and Tailwind is not installed** (no dep, no config, no PostCSS, no `@tailwind` in
    `globals.css`). Proven, not inferred: the two stylesheets actually served contained **zero**
    matches for `.w-full` / `.h-full` / `.h-[600px]`, and `leaflet.css` sets no height on
    `.leaflet-container` — Leaflet requires the author to size it. Outer div → `height: auto`; its
    only child was `ssr:false` dynamic (0 `leaflet-container` in the SSR HTML). Leaflet initialised
    into a 0×0 viewport and painted neither tiles nor markers.
  - **Verified end-to-end against a live dev server, not assumed:** the served chunk now carries
    `.mapFrame { height: 600px }` and `.map { height: 100% }`; SSR HTML shows
    `class="DangerMap-module__…__mapFrame"` with zero remaining `h-[600px]`; and
    `react-leaflet@5`'s `MapContainer.js` was read to confirm it forwards `className` onto the
    `.leaflet-container` div, which is what makes the 100% resolve. Gate: **tsc clean, eslint
    clean, vitest 601/601 in 39 files, Node v22.23.2.**
  - **Trap for whoever touches this next:** `.map`'s `height: 100%` is load-bearing on `.mapFrame`
    keeping a *definite* height. If that becomes `auto`, Leaflet silently returns to 0×0 — same
    failure, no error anywhere.
  - **Left alone deliberately:** `page.tsx` and `error.tsx` are still inert Tailwind. Harmless for
    rendering now, but unstyled; restyling them is a Magnolia-shaped job, not "fix the height".

- **🔴 Danger-index: two data defects OPEN — needs Cedar, not a quick fix.** Both change what a
  displayed number *means*, so the CLAUDE.md Rule-2 carve-out applies however small the diff.
  Fixing the height made a **visibly incorrect ranking visible**, so these are now urgent.
  - (a) **No analysis-window filter.** `dangerIndexFetcher.ts` filters on coordinates only, so it
    aggregates the dataset's full **2012-07-01 → 2026-06-11** span (verified live) against a window
    pinned at 2018–2025. Top location reads **887 unwindowed vs 476 windowed** — every figure on
    that page is ~1.9× its in-contract value and non-comparable with every other number in the
    product. A `$where` clause is a contract (Rule 4).
  - (b) **`$group=latitude, longitude` on raw floats splits single intersections.**
    `40.696033,-73.98453` (712) and `40.6960346,-73.9845292` (587) are the same point ~18 cm apart.
    Summed = **1,299**, which outranks the 887 currently ranked #1 — so the "Rank" column and the
    "pinpoint high-risk locations" copy are both wrong as rendered. Persists inside the window too.
  - **Why the Cypress audit passed anyway:** `__tests__/dangerIndexFetcher.test.ts` mocks
    `global.fetch` and asserts only `$limit`/`$order` plus the parse. **Nothing renders `DangerMap`
    or the page**, so no test covers the height, the window, or the grouping.
  - The three danger-index commits (`64527f2`/`3292011`/`2a144a8`, 2026-08-13) reached `main` with
    **no ledger entry at all** — this is the first record of them.

- **Plain-English copy pass — DONE and COMMITTED as `699d998` ("refactor: simplify terminology
  across components"), 2026-08-13.** *This entry read "UNCOMMITTED, NEXT STEP: commit it" until
  2026-08-14, when `git status` showed a clean tree and `dashNote` was found present in HEAD —
  the ledger had simply never been updated after the commit landed. A second reminder that
  `SESSION_STATE.md` is episodic and the repo is the source of truth.* Reasoning (the two real
  bugs it caught, and the honesty-guardrail re-check) archived in `ARCHIVED_SESSIONS.md`,
  "2026-08-14".

- **Vision Zero Shadow Ledger, Phase 1 — spec approved, ready for TDD drafting (2026-08-12).**
  Hyper-local safety ledger search by ZIP code and Community Board, local aggregates from Socrata,
  repaired-vs-raw trends. Not started.

- **🔴 ROTATE TWO CREDENTIALS — `~/.bashrc` exports a GitHub PAT and a Context7 API key in
  plaintext** (found 2026-08-08; both were read into a session transcript, so rotation is the only
  fix — editing `.bashrc` does not un-leak them). Revoke the PAT at github.com/settings/tokens,
  rotate the Context7 key, then move both to a `chmod 600` file sourced conditionally. Neither is
  in the repo; nothing consumes them now. Violates the repo's own Rule 3.

- **Deployed and live-verified:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir
  `./`, Vercel defaults, `SOCRATA_APP_TOKEN` server-side only. NFR-2 confirmed clean (no token
  identifier in any client chunk) as of the 2026-08-11 redeploy.

- **Machine changes outside the repo, needing re-doing elsewhere:** `nvm install 22` (2026-08-07);
  `permissions.defaultMode: "auto"` in `~/.claude/settings.json` (2026-08-08, user-scope — applies
  to *every* project); **removed three stale `~/.local/bin/{node,npm,npx}` symlinks → v24.13.0**
  (2026-08-08 — they shadowed nvm; **do not re-add**).

- `ARCHITECTURE.md` is **deferred by decision, not pending** — see `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly.
- **Platform: Node v22.23.2 / npm 10.9.8 via `nvm` at `~/.nvm`. Verify `node -v` at point of use —
  do not trust a recorded recipe.** This project has now had **three** toolchain regressions of
  the same shape (fnm vanished 2026-08-07, nvm vanished 2026-08-11, the Homebrew path
  `/usr/local/opt/nvm/nvm.sh` vanished 2026-08-14 — that last one is why a backgrounded `next dev`
  died with exit 127 and why `stop-quality-gate.sh` now reports `not found`). **What works:**
  `bash -ic 'cd <repo> && npm run typecheck && npm run lint'` (interactive shell loads nvm from
  `.bashrc`; prints two harmless `no job control` / `terminal process group` lines on stderr —
  filter them). A non-interactive `bash -c` inherits no Node at all. For one-offs,
  `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"`. `stop-quality-gate.sh` sources no
  nvm **by design** and refuses to certify an unconfirmable platform — that strictness is the
  feature; don't "fix" the hook.
- **Current verified baseline (2026-08-14, Node v22.23.2): vitest 601/601 in 39 files,
  `tsc --noEmit` clean, `eslint .` clean.** (Was 599/599 in 38 on 2026-08-13; the delta is the
  pre-existing `dangerIndexFetcher.test.ts`.)
- **`node_modules/` wiping is a recurring pattern (2 occurrences), not a one-off.** Recovery:
  `nvm use` → `npm ci` → `npx next typegen` → gates. Typegen is non-optional (`layout.tsx` uses
  Next 16's generated `LayoutProps<"/">`; a wiped `.next/` fails `tsc` with a misleading
  `TS2304`). Verify `.git/hooks/commit-msg` is still byte-identical to `.githooks/commit-msg`
  afterwards — that's what distinguishes "wiped" from "fresh clone" (the latter needs the guard
  reinstalled). `node_modules/next/dist/docs/` only exists post-`npm ci`; **context7 is not a
  fallback — its API key is invalid in this environment.**
- **Live Socrata findings, verified 2026-08-07/08, still load-bearing.** Full probe output in
  `ARCHIVED_SPECS.md` (Phase 1 entry). (a) **Unpopulated rows arrive as an absent `borough` key** —
  not `null`, not `""` — trap 1 in a new place, and why FR-7's numerator enumerates the five values
  via `IN (...)` rather than `IS NOT NULL`. (b) **`borough IN (...)` works**, so the pre-authorised
  five-way `OR` fallback is dead. (c) **Window unpopulated share is 32.9% row-weighted**, *not* the
  ~31.8% mean-of-yearly-rates — they differ ~1.1pp, so the choice is pinned in code and test, and
  FR-7's "~30%" prose is rounding, **not drift** (`/verify-figures` must not flag it).
  (d) **`B`=Bronx re-confirmed by live row count** (Q1 2019 `arrest_boro`: `K` 15,809 > `B` 13,410).
- **Handoff schemas live only in the `handoff-schemas` skill** — load before any dispatch; no agent
  file defines those fields. **`github`'s MCP is off on a fault, not disuse** (run `/mcp`).
- **Styling is CSS Modules**, not Tailwind — chosen on reversibility, not taste. Tailwind is two
  dev deps and a PostCSS config to add later; removing it means unwinding class attributes across
  every component. **The danger-index files violated this and rendered nothing** (see Active) —
  check which styling system a file is in before extending it.
- **Live trap in the workspace shell — `useInspectorSync` will infinite-loop if you pass it an
  unmemoized object.** Any component calling `useInspectorSync`/`useWorkspaceInspector` becomes a
  Context consumer via `useContext` *regardless of which field it destructures*, so pushing a fresh
  object literal every render re-triggers the very render that pushed it. This hung a `vitest run`
  (~30s+, needed `pkill`). Wrap the panel object in `useMemo` with primitive/stable deps — never
  `JSON.stringify(...)` in the dep array. All three call sites (`UnifiedTimeline`,
  `IntegrityAudit`, `SeriesRegistry`) do this correctly; copy the pattern.
- **Terminology is settled — don't re-import a mockup's vocabulary over it.** "All reported
  crashes" / "Injury & fatal crashes" / "Minor crashes, no injuries" / "Change since 2018", and the
  three page names "The chart" / "Data quality" / "Where numbers come from". Simplified once in
  `d3f60f2`, regressed once by the redesign importing the Design Composer mockup's jargon
  wholesale, restored by the 2026-08-13 copy pass. Check existing terminology first.
- **Live visual QA: `mcp__playwright__browser_*` does not work here** (no Chromium; installer needs
  an unavailable `sudo` password — don't retry). `mcp__Claude_Browser__*` worked on 2026-08-13 but
  **was not available in the 2026-08-14 session** — don't assume it's there. Fallback that does
  work: run `next dev` on a spare port and `curl` the page, then grep the SSR HTML and fetch the
  emitted CSS chunks directly. That is how the danger-index height bug was proved.

## History

_(Empty — closed work is archived directly to `ARCHIVED_SESSIONS.md` as it closes.)_

Nineteen entries in `ARCHIVED_SESSIONS.md`, newest **2026-08-14 — FR-6/FR-7 and the deploy thread
archived; three ledger claims falsified**. Note the **2026-08-13 workspace redesign entry is filed
at the end of that file, not the top** — position does not imply date there.
