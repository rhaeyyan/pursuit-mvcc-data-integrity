# Sprint Ledger — MVCC Data

**Current objective:** Navigation reachability + borough-control removal + danger-index
correctness. Seven tasks in three waves, all specced and human-approved in `SPEC.md` (2026-08-14).

## Active

- **🟡 IN FLIGHT — the `SPEC.md` seven-task plan (2026-08-14).** Origin: the map shipped last
  session was **unreachable**, and the borough dropdown on The chart had exactly one outcome — a
  refusal — for all five options.
  - **What was broken:** `GlobalNav.tsx` was the only file linking to the four orphan routes and
    **nothing imported it**; all four also sat outside `(workspace)`, so they rendered with no nav
    and no way back — each with a passing test suite. `UnifiedTimeline.tsx:150`'s
    `boroughBlocked = Boolean(boroughLabel)` is unconditional, so every borough choice hit the
    refusal panel. Full diagnosis, the four human decisions, and the wave table are in `SPEC.md` —
    read that, not a second copy here.
  - **The one thing not to lose:** **T6 adds the `/danger-index` link and T5 must land first.** The
    map being unreachable is what currently protects users from a wrong ranking.

- **✅ WAVE 1 COMPLETE — T1 · T3 · T5 all done, ALL UNCOMMITTED.** Independently re-verified by the
  main session: **609/609 in 38 files**, `tsc` clean, `eslint` clean, Node v22.23.2. T1 = 11
  `git mv` renames into `(workspace)` + 18 module-path rewrites, `next build` clean with six
  borough paths still static. T5 = both defects fixed, verified live by curling the URL
  reconstructed from the module's own exported `DANGER_INDEX_SOQL` (200, 1,000 rows, 589/478/476).
  T3 = picker + trio deleted, −12 lines / 0 added. **Count moved 618 → 609 in 38, and that is
  correct:** deleting `BoroughPicker.test.tsx` retired 13 tests (621 green + 1 fixed − 13 = 609).
  Redwood measured that file in isolation rather than accepting my impossible 622/39 target.
  **Next: commit wave 1 (branch first — we are on `main`), then wave 2 sequentially.**
  - **Process error, do not repeat:** T1 and T5 were dispatched in parallel into the *same* tree
    instead of isolated worktrees (Rule 5), which contaminated T1's test count. Banyan caught it,
    remeasured in a detached worktree at pristine `HEAD`, and reconciled. Parallel builder tasks
    need worktrees or they need to be sequential — wave 2 has real overlap (`LeftNav.tsx` is
    touched by both T2a and T6), so sequence it.

- **Danger-index data defects — FIXED by T5, uncommitted.** Diagnosis and the three rules it
  yielded (a pinned SoQL is a hypothesis until curled; "mounts without throwing" is not a
  behavioural test; `z.coerce.number()` is trap 1 in Zod syntax) archived in
  `ARCHIVED_SESSIONS.md`, "2026-08-14 — The two danger-index data defects". **Correct ranking is
  589 / 478 / 476** — the ledger's old "887" and "1,299" were wrong and are gone.

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

- **Deployed and live-verified:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir
  `./`, Vercel defaults, `SOCRATA_APP_TOKEN` server-side only. NFR-2 confirmed clean (no token
  identifier in any client chunk) as of the 2026-08-11 redeploy.

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
- **Verified baseline: vitest 618/618 in 39 files, `tsc --noEmit` clean, `eslint .` clean**
  (2026-08-14, Node v22.23.2, working tree with T1+T5 applied). Was 601/601 in 39 at `HEAD`
  (`f260705`); T5 traded a 2-test root file for a 19-test sibling.
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
