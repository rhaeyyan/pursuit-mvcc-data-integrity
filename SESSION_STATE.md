# Sprint Ledger — MVCC Data

**Current objective:** none active. Two shipped-without-a-PRD-contract features have now been
reconciled: the danger-index map (§6 amendment, v1.3) and the Hyper-Local Ledger (`/local`, v1.4).
`/tdi` and `/auditor` remain the one open scope question (see below) — do not treat their
existence in the tree as sanctioned.

## Active

- **✅ Vision Zero Shadow Ledger, Phase 1 (`/local`) — reconciled, DONE, committed (2026-08-15).**
  Was already shipped 2026-08-12, not "not started" as this ledger previously (wrongly) claimed —
  see `ARCHIVED_SESSIONS.md`, "2026-08-15 — PRD reconciled for two shipped-without-a-contract
  features", for full reasoning including an FR-8 SoQL-display bug found and fixed along the way.
  New PRD FR-15 (v1.4); nav link restored; gates clean (vitest 601/601, `tsc`/`eslint` clean).
  **Known gap, not fixed:** `/local` has no way back to the dashboard from the page itself (sits
  outside the `(workspace)` route group) — cosmetic, not data-integrity, flag if worth a follow-up.
- **🟡 `/tdi` and `/auditor` scope — still unresolved, open since 2026-08-12.**
  `UNIFIED_NAVIGATION_PLAN.md`'s reviewer findings flag both as unspecced, unsanctioned features
  built and merged with no FR/NFR, SPEC, or ADR: `/tdi` reimplements the PRD-deferred "Danger
  Index / safe-routing algorithm" with an uncited `deaths*10` severity weight
  (`src/lib/tdi.ts`); `/auditor` reimplements a Street-Improvement-Project analysis the project
  explicitly rejected on 2026-08-04 (see `ARCHIVED_SESSIONS.md`) using a hand-typed fixture
  (`src/lib/auditor.ts` + `src/lib/fixtures/sips.json`) instead of the real dataset. Both are
  currently orphaned (no live nav link, same as `/local` was) but still deployed and reachable by
  direct URL. **Needs an explicit human decision, per the nav plan's own blocking note:** either
  sanction both with a real PRD amendment (a defensible severity-weighting methodology for TDI; a
  documented SIP data source, not a fixture, for the auditor), or roll them back/delete them. Not
  touched this session — deliberately left orphaned rather than either promoted or removed.

- **✅ Leaked-credential rotation — resolved by the human (per human, 2026-08-15).** The GitHub PAT
  and Context7 API key that `~/.bashrc` had exported in plaintext (found 2026-08-08) have been
  revoked/suspended directly by the human, outside this session. Not independently re-verified
  here (`.bashrc` is off-limits to read — see Context Cache). Do not re-raise this item.

- **Deployed and live-verified:** <https://pursuit-mvcc-data-integrity.vercel.app/> — root dir
  `./`, Vercel defaults, `SOCRATA_APP_TOKEN` server-side only. NFR-2 confirmed clean (no token
  identifier in any client chunk) as of the 2026-08-11 redeploy.

- **Machine changes outside the repo, needing re-doing elsewhere:** `nvm install 22` (2026-08-07);
  `permissions.defaultMode: "auto"` in `~/.claude/settings.json` (2026-08-08, user-scope — applies
  to *every* project); **removed three stale `~/.local/bin/{node,npm,npx}` symlinks → v24.13.0**
  (2026-08-08 — they shadowed nvm; **do not re-add**).

- `ARCHITECTURE.md` is **deferred by decision, not pending** — `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly.
- **Platform: Node v22.23.2 / npm 10.9.8 via `nvm` at `~/.nvm`. Verify `node -v` at point of use —
  do not trust a recorded recipe.** This project has now had **three** toolchain regressions of
  the same shape (fnm vanished 2026-08-07, nvm vanished 2026-08-11, the Homebrew path
  `/usr/local/opt/nvm/nvm.sh` vanished 2026-08-14, killing a backgrounded `next dev` with exit
  127). **What works:** `bash -ic '<cmd>'` — an interactive shell loads nvm from `.bashrc`; it
  emits two harmless `no job control` / `terminal process group` lines on stderr, filter them. A
  non-interactive `bash -c` inherits no Node at all; for one-offs prepend
  `$HOME/.nvm/versions/node/v22.23.2/bin` to PATH.
- **`stop-quality-gate.sh` now sources nvm itself (2026-08-14) — it used to have no Node at all.**
  Hook shells are non-interactive, inherit a bare PATH and never read `.bashrc`, so the gate was
  reporting UNVERIFIED on *every* turn regardless of workspace state. It now asks nvm to resolve
  `.nvmrc` before checking. **Its strictness is unchanged and that is the point** — proved by
  negative test, not assumed: with `.nvmrc` set to an uninstalled `18` it still exits 2 rather than
  falling back to the v22 sitting right there. Resolving via `.nvmrc` (not a pinned bin path in
  `settings.json`) is deliberate — a hardcoded path would rot on the next `nvm install`, which is
  the exact shape of all three regressions above.
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
