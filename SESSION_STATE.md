# Sprint Ledger — MVCC Data

**Current objective:** Navigation reachability + borough-control removal + danger-index
correctness. Seven tasks in three waves, all specced and human-approved in `SPEC.md` (2026-08-14).

## Active

- **🟡 IN FLIGHT — the `SPEC.md` seven-task plan (2026-08-14).** Origin: the map shipped last
  session was **unreachable** (`GlobalNav.tsx` was the only file linking the four orphan routes and
  **nothing imported it**; all four also sat outside `(workspace)`, so they had no nav and no way
  back — each with a passing test suite), and the borough dropdown produced a refusal for all five
  options (`UnifiedTimeline.tsx:150`'s `boroughBlocked` is unconditional). Full diagnosis, the four
  human decisions, and the wave table are in `SPEC.md` — read that, not a second copy here.
  - **The one thing not to lose:** **T6 adds the `/danger-index` link and T5 must land first.** The
    map being unreachable is what currently protects users from a wrong ranking.

- **✅ WAVE 1 COMMITTED** on branch **`fix/nav-reachability-and-danger-index`** (NOT `main`, NOT
  pushed). Six commits, one per concern: `7650465` hook · `514af77` skill-substitution ·
  `e31d875` danger-index SoQL · `bf37f3d` route-group move · `4e2ec7e` borough picker · `162350e`
  docs. Verified at `HEAD`: **609/609 in 38 files**, `tsc` + `eslint` clean; renames survived.
  618 → 609 is correct — deleting `BoroughPicker.test.tsx` retired 13 tests.
- **🟡 WAVE 2 — T4 DONE + COMMITTED, T2b and T2a NOT STARTED. Paused here 2026-08-14.**
  **Order is T4 → T2b → T2a and that order is load-bearing:** T2a adds `/tdi` to the nav, T2b puts
  FR-7's warning on `/tdi`, so T2a goes **last** and no commit ever links the borough leaderboard
  without its caveat — the condition the human attached to that decision. Do not reorder.
  - T4 = `/integrity` standing statement, commit `988a987`. **614/614 in 38 files**, tsc +
    eslint + prettier clean. Magnolia hit a session limit before writing anything, so the main
    session implemented it against Cypress's red tests; Magnolia's agent context is gone.
  - **NEXT STEP, exactly:** Cypress writes T2b's red tests → Redwood implements → commit; then
    Cypress T2a → implement → commit; then wave 3 (T6). Specs are verbatim in `SPEC.md`.
  - **Watch at T2b** — it is the *third* consumer of the coverage-warning copy (refusal panel ·
    `/integrity` · `/tdi`), the threshold T4's Tipping Point set for extracting a shared component
    rather than writing a third divergent copy. T2b must **not** touch `tdi.ts`'s broken filter.
  - **Process error, do not repeat:** T1 and T5 were dispatched in parallel into the *same* tree
    instead of isolated worktrees (Rule 5), contaminating T1's test count. Parallel builder tasks
    need worktrees or must be sequential — `LeftNav.tsx` is touched by both T2a and T6.

- **Danger-index data defects — FIXED and committed (`e31d875`).** Diagnosis and the three rules it
  yielded (a pinned SoQL is a hypothesis until curled; "mounts without throwing" is not a
  behavioural test; `z.coerce.number()` is trap 1 in Zod syntax) archived in `ARCHIVED_SESSIONS.md`,
  "2026-08-14 — The two danger-index data defects". **Correct ranking is 589 / 478 / 476.**

- **Seven out-of-scope follow-ups are enumerated in `SPEC.md`'s closing section** — read there, not
  a second copy here. The one with teeth: **`src/lib/tdi.ts` filters `borough IS NOT NULL`**, wrong
  on this dataset (unpopulated rows arrive as an *absent key*; `borough IN (...)` is the verified
  form). T2b attaches FR-7's warning to `/tdi` but must **not** touch the filter — that changes
  what the ranking means, so it is a Cedar `[SPEC]` under the Rule-2 carve-out. Also owed: a PRD
  v1.3 note for T3 partially retiring FR-6 [P1].

- **Vision Zero Shadow Ledger, Phase 1 — spec approved, ready for TDD drafting (2026-08-12).** Not
  started. Local ledger search by ZIP/Community Board, Socrata aggregates, repaired-vs-raw trends.

- **🔴 ROTATE TWO CREDENTIALS — `~/.bashrc` exports a GitHub PAT and a Context7 API key in
  plaintext** (found 2026-08-08; both were read into a session transcript, so rotation is the only
  fix — editing `.bashrc` does not un-leak them). Revoke the PAT at github.com/settings/tokens,
  rotate the Context7 key, then move both to a `chmod 600` file sourced conditionally. Neither is
  in the repo; nothing consumes them now. Violates the repo's own Rule 3.

- **Deployed:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir `./`, Vercel defaults,
  `SOCRATA_APP_TOKEN` server-side only. NFR-2 clean (no token identifier in any client chunk) as of
  the 2026-08-11 redeploy. **Note this deploy predates the branch — it still serves the wrong
  danger-index ranking and the dead borough dropdown.**

- **Machine changes outside the repo, needing re-doing elsewhere:** `nvm install 22` (2026-08-07);
  **removed three stale `~/.local/bin/{node,npm,npx}` symlinks → v24.13.0** (2026-08-08 — they
  shadowed nvm; **do not re-add**).

- `ARCHITECTURE.md` is **deferred by decision, not pending** — `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly.
- **Platform: Node v22.23.2 / npm 10.9.8 via `nvm` at `~/.nvm`. Verify `node -v` at point of use —
  do not trust a recorded recipe.** **Four** toolchain regressions of the same shape so far (fnm
  vanished 2026-08-07; nvm vanished 2026-08-11; the Homebrew path `/usr/local/opt/nvm/nvm.sh`
  vanished 2026-08-14; `post-edit-lint.sh` had no Node at all until 2026-08-14). **What works:**
  `bash -ic '<cmd>'` — an interactive shell loads nvm from `.bashrc`; it emits two harmless
  `no job control` / `terminal process group` lines on stderr, filter them. A non-interactive
  `bash -c` inherits no Node; for one-offs prepend `$HOME/.nvm/versions/node/v22.23.2/bin` to PATH.
- **Both `stop-quality-gate.sh` and `post-edit-lint.sh` now source nvm themselves** (2026-08-14).
  Hook shells are non-interactive, inherit a bare PATH and never read `.bashrc`. The gate was
  reporting UNVERIFIED every turn; the lint hook was worse — `node_modules/.bin/eslint` has a
  `#!/usr/bin/env node` shebang, so it died at exec and the hook reported that **interpreter
  failure as an unfixable lint violation**, exit 2. Agents then hunted a nonexistent error. Both
  now resolve through nvm/`.nvmrc` — never a hardcoded bin path, which is precisely what rots — and
  the lint hook exits 0 with an honest environment message when Node is genuinely absent rather
  than blocking. **Strictness is unchanged, proved by negative test:** with `.nvmrc` set to an
  uninstalled `18` the gate still exits 2 rather than falling back to the v22 sitting right there.
- **Verified baseline: vitest 614/614 in 38 files, `tsc --noEmit` + `eslint .` clean** (2026-08-14,
  Node v22.23.2, branch `HEAD` after T4). Counts move legitimately as tasks delete test files —
  reconcile, don't assume drift.
- **`node_modules/` wiping recurs (2×), not a one-off.** Recovery: `nvm use` → `npm ci` →
  `npx next typegen` → gates. Typegen is non-optional (`layout.tsx` uses Next 16's generated
  `LayoutProps<"/">`; a wiped `.next/` fails `tsc` with a misleading `TS2304`). Then verify
  `.git/hooks/commit-msg` still matches `.githooks/commit-msg` — that distinguishes "wiped" from
  "fresh clone", which needs the guard reinstalled. `node_modules/next/dist/docs/` only exists
  post-`npm ci`; **context7 is not a fallback — its API key is invalid here.**
- **A stale `.next/dev/types/validator.ts` survives `next build` and breaks it after any route
  rename** — `tsconfig` includes `.next/dev/types/**/*.ts`, but only `next dev` regenerates it, so
  `tsc` fails with `TS2307`s that point at no real source error. Delete `.next/dev` and rebuild.
- **Live Socrata findings, verified 2026-08-07/08, still load-bearing.** Full probe output in
  `ARCHIVED_SPECS.md` (Phase 1). (a) **Unpopulated rows arrive as an absent `borough` key** — not
  `null`, not `""` — trap 1 in a new place, and why FR-7 enumerates the five values via `IN (...)`
  not `IS NOT NULL`. (b) **`borough IN (...)` works**; the five-way `OR` fallback is dead.
  (c) **Window unpopulated share is 32.9% row-weighted**, not the ~31.8% mean-of-yearly-rates —
  pinned in code and test, so FR-7's "~30%" prose is rounding, **not drift**. (d) **`B`=Bronx
  re-confirmed by live row count** (Q1 2019 `arrest_boro`: `K` 15,809 > `B` 13,410).
- **Handoff schemas live only in the `handoff-schemas` skill** — load before any dispatch; no agent
  file defines those fields. **`github`'s MCP is off on a fault, not disuse** (run `/mcp`).
- **🔴 Never write `$` + a digit in a skill file.** The Skill tool substitutes the caller's
  arguments into `$<digit>` at load time, so `.claude/skills/mvcc-data/SKILL.md`'s pinned
  `$1,000` MV-104 damage threshold was reaching agents as `<argument>,000`. Found by Cypress,
  **reproduced deliberately 2026-08-14** by invoking the skill with a marker argument. Fixed to
  `USD 1,000` in both the live copy and the `skills/` master (a live-only fix would return on the
  next re-copy). SoQL `$select`/`$where`/`$limit` are unaffected — only `$<digit>` is at risk. This
  is a Rule-1 violation delivered by the toolchain rather than by a model: a pinned figure in the
  dataset contract, silently rewritten. Check any new skill prose for the pattern.
- **Moving a test file? `vi.mock("../../lib/x")` is a module specifier like any other.** T1's
  rehearsal scanned for `../../` in *any* syntax rather than just `import … from` and caught three
  the naive grep misses. Left unrewritten they resolve to nothing, `vi.mock` silently no-ops, and
  the page tests run against the **real Socrata fetchers** — green, while hitting the network.
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
  crashes" / "Injury & fatal crashes" / "Minor crashes, no injuries" / "Change since 2018", plus
  page names "The chart" / "Data quality" / "Where numbers come from". Simplified in `d3f60f2`,
  regressed once by the redesign importing mockup jargon wholesale, restored 2026-08-13.
- **Live visual QA: `mcp__playwright__browser_*` does not work here** (no Chromium; installer needs
  an unavailable `sudo` — don't retry). `mcp__Claude_Browser__*` worked 2026-08-13 but not
  2026-08-14 — don't assume it. **Fallback that works:** `next dev` on a spare port, `curl` the
  page, grep the SSR HTML, fetch the emitted CSS chunks. That proved the danger-index height bug.

## History

_(Empty — closed work is archived to `ARCHIVED_SESSIONS.md` as it closes.)_ Twenty-two entries
there, newest **2026-08-14 — the two danger-index data defects**. The **2026-08-13 workspace
redesign entry sits at the end of that file, not the top** — position does not imply date.
