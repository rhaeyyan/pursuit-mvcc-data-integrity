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
  - *Polish pass after seeing it rendered (`dataviz` skill loaded per CLAUDE.md).* Rendering
    exposed three faults no syntax check catches: a three-line label turned the decision node into
    a diamond that swallowed half the canvas, two identical `pass` labels collided with the
    subgraph title, and the default cluster grey muddied everything. Fixes: a one-line gate label,
    and a **validated payload** node so the fan-out to chart and table is labelled once — which is
    also more honest, since NFR-3 requires the table to show *the same figures*, i.e. one response
    feeding both, not two independent paths.
  - *Palette decision worth not re-litigating:* switched to `fill:none` with role identity carried
    by **stroke + label only**. Mermaid inside a README cannot branch on `prefers-color-scheme`, so
    hardcoded fills mean committing to one theme and losing the other; transparent fills let text
    and edge-label chips inherit the viewer's own mermaid theme, so the diagram is correct in
    GitHub light *and* dark. Strokes are the reference palette's dark-column steps, chosen because
    they clear 3:1 against **both** `#ffffff` and `#0d1117` (computed, not eyeballed). Validator:
    all PASS both modes except `#c98500` at 2.99:1 on light, where the relief rule is satisfied by
    construction — every node carries a visible text label, so identity is never color-alone.
  - *Second render pass — edge routing.* The swooping arrows were mermaid's default `basis` curve,
    not a layout accident; a 3-into-1 fan-in rendered as beziers reads as spaghetti at any size.
    Set `curve: "linear"` via an init directive and tightened `nodeSpacing`/`rankSpacing`. Also
    swapped the decision node from a diamond `{...}` to a hexagon `{{...}}`: mermaid sizes a diamond
    around its text's *inscribed* rectangle, so it inflates far faster than any other shape and
    forces every incoming edge onto a slanted face. Decision semantics survive the swap because
    they were never carried by the shape — the `pass`/`fail` edge labels and the node's own
    question mark do that work.
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
