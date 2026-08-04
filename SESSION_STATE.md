# Sprint Ledger — MVCC Data

**Current objective:** stand up the walking skeleton — one chart, one metric (deaths per year),
rendering from a live server-side SoQL call (PRD handoff, Rule 6). Nothing is built yet.

## Active

- **Blocked on: human approval of the kickoff `[SPEC]`** (Rule 1 HITL — no code until then).
  `SPEC.md` now exists and holds Cedar's scaffold authorization. On approval, dispatch **Redwood**;
  Cypress audits after (the SPEC states an explicit ordering override — a scaffold has no
  behavior to write failing tests against).
- **Why the scaffold is its own SPEC rather than pre-work:** `create-next-app` introduces the
  entire dependency tree, and Rule 9 gives Cedar sole dependency authority. Treating it as
  "just plumbing" would route around that rule. It also can't be a normal task — a scaffold
  writes ~20 files against Rule 5's cap of 5, so the SPEC grants a *bounded* exemption: generator
  output is exempt because it encodes no decisions and is reproducible from one pinned command,
  while hand-authored/hand-modified files are capped at 5 and enumerated for audit.
- **Version check discharged early** (main session ran it; Cedar has no shell): `next@16.3.0`
  needs Node `>=20.9.0`, local is 20.19.6 — compatible, no Node upgrade forced. `vitest` corrected
  from Cedar's guessed `^3` to `^4` (4.1.10, Node-20 compatible). Vercel's build runtime is a
  deploy-time setting, not a scaffold constraint, since `next@16` runs on Node 20 and 22 alike.
- **Styling decided: CSS Modules**, not Tailwind (human, 2026-08-04). Grounds are reversibility,
  not taste — Tailwind is two dev deps and a PostCSS config to add later, but removing it means
  unwinding class attributes across every component Magnolia will have written by then.
- **Two hazards the SPEC exists to prevent, both verified present in this tree:** a stock
  `eslint .` lints 270+ third-party `.mjs` skill-payload files under `.claude/`, `.gemini/`, and
  `skills/`; and the stock `tsconfig` `include` of `**/*.ts` sweeps three `types.d.ts` files from
  those same trees into `tsc --noEmit`. Both gates would fail on their first run. Fixed up front
  via ignore entries and a `src/**` allowlist `include` (allowlist, not denylist — a denylist
  re-breaks the moment a fourth skill tree appears).
- `ARCHITECTURE.md` is **deferred by decision, not pending** (2026-08-04); its absence is not a
  gap to close. Rationale and the revisit trigger are in `CLAUDE.md` § Project Layout.
- **Follow-up owed, tracked not lost:** the PRD handoff (`docs/project-mvcc-data.md` ~280–289)
  is stale — it tells kickoff to create an assignment subdirectory with its own `AGENTS.md` and
  record the §5.6 assessment there. All three clauses are superseded (this repo *is* that
  directory; `AGENTS.md` was folded into `CLAUDE.md`; §5.6 is already recorded there). Amend so a
  future agent doesn't act on it.
- **Stale-entry correction (2026-08-04, both files fixed):** this ledger and `CLAUDE.md` § Recorded
  decisions both said "git not yet initialized." The repo *is* initialized (2 commits on `main`)
  and `.git/hooks/commit-msg` is byte-identical to `.githooks/commit-msg`, so the AI-byline guard,
  worktree parallelism (Rule 5), and the merge protocol (Rule 10) are all live rather than inert.
  Two follow-ons recorded in `CLAUDE.md` rather than lost: the guard lives outside version control,
  so a fresh clone starts unprotected and must reinstall it; and `commitlint`'s decline reason
  ("not yet a git repo") has lapsed, leaving Rule 10's Conventional Commits format unenforced by
  anything mechanical — re-open if commit hygiene slips.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.

## History

- **2026-08-04 — `.gitignore` created; NFR-2's pre-first-commit check had never actually run.**
  CLAUDE.md requires verifying `.gitignore` covers `.env*` *before the first commit*; there was no
  `.gitignore` in the repo at all, and three commits had already been pushed public. Nothing leaked
  — `.env` does not exist yet — but the gap was live: creating one and running `git add -A` would
  have published `SOCRATA_APP_TOKEN`, the exact Rule 3 failure. Also closes two quieter holes:
  `.claude/settings.local.json` was ignored only by the *user's global* excludes file, so any fresh
  clone or second machine would have tracked it, and its `.tmp.*` write-leftovers were accumulating
  as untracked noise that an `add -A` would eventually sweep in. `.env.example` is negated back in
  so variable *names* can be documented without values.

Older entries are in `ARCHIVED_SESSIONS.md` (README diagram rebuild and the
`ARCHITECTURE.md` deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude
Code agent configuration and the GEMINI.md parity drop).
