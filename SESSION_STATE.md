# Sprint Ledger — MVCC Data

**Current objective:** stand up the walking skeleton — one chart, one metric (deaths per year),
rendering from a live server-side SoQL call (PRD handoff, Rule 6). Nothing is built yet.

## Active

- **Blocked on nothing.** Next action is Cedar kickoff: scaffold the Next.js App Router project
  and convert PRD §5.3 P0 requirements into `[SPEC]` tasks, starting with the skeleton.
- `git init` has not been run. Until it is, the ledger Stop hook, worktree parallelism, and the
  merge protocol are inert, and `.githooks/commit-msg` cannot be installed.
- `SPEC.md` and `ARCHITECTURE.md` do not exist yet — they get created at kickoff.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.

## History

- **2026-08-04 — Claude Code agent configuration built out.** Created a standalone `CLAUDE.md`
  plus `.claude/` (7 agents, 6 hooks, 1 project skill, 1 slash command, 1 deterministic script)
  for this directory, which had only a Gemini CLI setup before.
  - *Initially built at parity with `GEMINI.md`, then deliberately un-parity'd on request.* The
    parity constraint had forced Claude-side capabilities down to the lowest common denominator:
    Gemini CLI has no hook system, so the mechanical rules were prose in GEMINI.md and stayed
    prose in CLAUDE.md. Dropping parity converted three of them into enforcement that runs whether
    or not anyone remembers the rule — the token-exposure and hardcoded-figure guard, and the
    typecheck/lint Stop gate. `GEMINI.md` is now stale relative to `CLAUDE.md` **by design**; it
    is not a second source of truth. The cross-tool `check-config-parity.sh` hook was removed for
    the same reason (recoverable from `Pursuit_AI-Native/.claude/hooks/` if parity is ever wanted
    back).
  - *Why a project skill rather than more CLAUDE.md prose:* the dataset contract (endpoints,
    verified fields, pinned figures, the five traps) is needed by five of the seven agents but
    only at query-writing time. As a skill it loads on demand; in CLAUDE.md it would tax every
    session's context for a fact most turns don't need (Rule 7, context diet).
  - *Why `AGENTS.md` was folded into `CLAUDE.md`:* Claude Code auto-loads `CLAUDE.md` and not
    `AGENTS.md`, so the per-assignment record (security-isolation assessment, adopted gates, lint
    rationale) lived in a file nothing would read. It is now the "Recorded decisions" section.
  - *Skill-tree prune:* `.gemini/skills/` carried 7 items the curated `skills/` did not
    (ai-ml-developer, canvas-design, mobile-developer, nonprofit-builder, react-view-transitions,
    and two shell scripts) — an unpruned copy from the parent repo. Deleted after a dry-run
    confirmed all 7 remain recoverable from `Pursuit_AI-Native/.gemini/skills/`.
  - *MCP pruned* from 7 servers to 3 (context7, playwright, github). Dropped supabase (no
    database in this build), markitdown (nothing to convert), godot and aseprite (other projects).
