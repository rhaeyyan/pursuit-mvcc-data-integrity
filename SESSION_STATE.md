# Sprint Ledger — MVCC Data

**Current objective:** stand up the walking skeleton — one chart, one metric (deaths per year),
rendering from a live server-side SoQL call (PRD handoff, Rule 6). Nothing is built yet.

## Active

- **Blocked on nothing.** Next action is Cedar kickoff: scaffold the Next.js App Router project
  and convert PRD §5.3 P0 requirements into `[SPEC]` tasks, starting with the skeleton.
- `SPEC.md` does not exist yet — it gets created at kickoff. `ARCHITECTURE.md` is **deferred by
  decision, not pending** (2026-08-04); its absence is not a gap to close. Rationale and the
  revisit trigger are in `CLAUDE.md` § Project Layout.
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

- **2026-08-04 — README architecture diagram repaired and corrected.** The mermaid block failed to
  render: escaped `[\"` openers, which mermaid parses as a parallelogram it can never close. Fixed,
  and rebuilt to current mermaid.js.org standards — markdown strings (backtick-quoted) in place of
  the discouraged `<br/>`, `direction TB` rather than the top-level-only `TD` alias, `classDef`
  ahead of its `class` assignments. Classic shape syntax kept deliberately over the v11.3 `@{ shape: }`
  form, which would break on any renderer pinned below that version for no gain.
  - *Two modeling errors fixed while redrawing, worth more than the syntax fix:* the old diagram
    routed every series through a "Data Repair Engine" box, which (a) invents a subsystem FR-12
    explicitly says is just one `$where` clause, and (b) left the **raw** series with no path to
    the chart — yet raw-beside-repaired *is* the product's central claim. A diagram that omits it
    describes a different, weaker product. Also added the NFR-3 accessible data table, whose
    absence CLAUDE.md rates an automatic FAIL.
  - *Decision that came out of it — `ARCHITECTURE.md` is deferred, not owed.* Both this ledger and
    `CLAUDE.md` § Project Layout had listed it as a pending deliverable, which is how an agent ends
    up manufacturing a hollow one to satisfy the reference. Rejected because its content is already
    covered three times over (CLAUDE.md Stack table, PRD §5.1, README Technical Notes) and because
    a design doc written before any code documents intentions, not architecture — it would be
    rewritten at the first Route Handler and rot in between, which is ADR 0001's failure mode
    exactly. The revisit trigger is recorded with the decision rather than left implicit: when
    locating a change requires more than a glance at the file tree.
- **2026-08-04 — NYC DOT Vision Zero releases evaluated against the record; two docs amended.**
  Reviewed DOT's [January 2025 equity report](https://www.nyc.gov/html/dot/html/pr2025/vision-zero-report-street-redesign.shtml)
  and its [October 2025 Q3 companion](https://www.nyc.gov/html/dot/html/pr2025/decline-in-traffic-deaths.shtml)
  for anything that changes the product's thesis. It doesn't — neither mentions the MV-104 break —
  but two things were worth capturing and one was rejected:
  - *Added to FR-9's caveats list:* SIP (Street Improvement Project) placement as a **third named
    confounder**, alongside COVID speeds and CBD congestion pricing. The equity report's own
    methodology documents that redesigns were deliberately concentrated in the lowest-income and
    highest-Asian/Black/Hispanic NTAs since 2014 — so the placement is *geographically
    non-random by design*, which is exactly what makes any borough-level deaths claim (the Bronx
    especially) attributable to something other than enforcement or reporting.
  - *Added to the drift note's downstream-damage section:* the October release evaluates three
    named corridors by before/after `number_of_persons_injured` deltas. That converts the note's
    abstract "warps benefit-cost ratios" claim into a dated, checkable instance. Recorded **with**
    its own counterweight — this note's casualty-filter finding is that the injuries series
    survived the 2020 change far better than the raw collision count, so the deltas are not
    presumptively wrong. The defensible claim is only that the reporting component is of unknown
    size and cannot be bounded from the published material. Overstating it would repeat the error
    the note exists to criticize.
  - *Rejected: putting any DOT figure on the page.* The equity report's −26%/−34% are 2004–13 vs
    2014–23 decade averages across NTAs; the product's series is citywide 2018–2025. Set side by
    side they read as contradicting "deaths down 1%" when they are simply a different measurement.
    Same for the "159 deaths, −18%" Q3 figure — a partial-year count, not comparable to a pinned
    annual one, and NFR-4 forbids the literal regardless.
  - *Rejected: ingesting SIP data.* Separate DOT open dataset on NTA-level census joins; out of
    scope for a two-dataset MVP whose walking skeleton isn't built (Rule 6).
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
