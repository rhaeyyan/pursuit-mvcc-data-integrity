# MVCC Data — Claude Code Operating Manual

**What this is.** A reporting-integrity dashboard for NYC's motor-vehicle collision record
(Pursuit L1 Cycle 3 — NYC Open Data, solo MVP). The record shows collisions down 63% between 2018
and 2025 and traffic deaths down 1%. The crashes didn't stop — a documented 2020 NYPD policy
stopped counting them. The product shows the break and publishes the corrected series.

Requirements live in [docs/project-mvcc-data.md](docs/project-mvcc-data.md) (PRD v1.2) — the
standing contract. Every `[SPEC]` cites the FR/NFR it satisfies. Supporting research:
[nyc-collision-reporting-drift.md](docs/nyc-collision-reporting-drift.md),
[nyc-collision-analytics-deep-research.md](docs/nyc-collision-analytics-deep-research.md).

---

## The four rules that make this project different

Everything else in this file is ordinary engineering discipline. These four are the product:

1. **No figure comes from a language model.** Every number rendered on the page is produced by
   SoQL aggregation or a pure, tested function — never computed, rounded, re-derived, or
   "sanity-corrected" by you (NFR-4). Your own arithmetic while working is not a source either;
   verify against a query. A hardcoded literal is a violation even when it happens to be right
   today, and `guard-data-integrity.sh` blocks it mechanically.
2. **Fail loud on an absent aggregate.** Socrata omits keys rather than nulling them. For the core
   yearly metrics, an absent or null value raises the error state — **never** a silent zero
   (FR-11). `number_of_persons_killed` is confirmed absent after 2026-05-05; a zero-coercion there
   would fabricate a safety improvement, which is precisely the failure this product criticizes.
3. **The App Token is server-side only.** Read `SOCRATA_APP_TOKEN` inside a Route Handler. Never a
   `NEXT_PUBLIC_` name, never a `'use client'` module, never a fixture, log, commit, or
   screenshot. The assignment brief says treat it like a password; the same hook enforces it.
4. **A query is a contract, not an implementation detail.** A dataset ID, `$select`/`$where`/
   `$group` clause, or the analysis window may only change via a Cedar `[SPEC]`. Redwood and
   Magnolia halt and request a revision rather than adjusting one in place. Every data `[SPEC]`
   pins its exact SoQL, so Cypress can test it and the page can satisfy FR-8 (display the query).

Before writing any SoQL, any Route Handler, any test asserting a figure, or any chart —
**load the `mvcc-data` skill.** It carries the endpoints, verified field names, the pinned figures,
and the five traps (absent-key-as-zero, `B`=Bronx-not-Brooklyn, the drifting `borough` coverage,
the two spellings of the DWI offense, the 1,000-row default limit).

---

## Tooling built for this repo

| Use | When |
|---|---|
| **Skill: `mvcc-data`** | Before any query, fetch, figure-asserting test, or chart. Non-optional. |
| **Skill: `dataviz`** (bundled) | Before the first line of chart code — color, mark, axis, legend, stat tile, or dashboard layout. |
| **`/verify-figures`** | Before any demo, submission, or claim about the data. Re-queries live and diffs against the pinned table; the PRD's risk register names this as the mitigation for the preliminary-feed risk. |
| **`.claude/scripts/verify-figures.py`** | The deterministic engine behind that command — it computes the diff, you only summarize it (Bounded AI). |
| **Plan mode** | Any non-trivial feature, per Rule 1. |

**Hooks — the mechanical layer.** These run whether or not anyone remembers the rule:

| Hook | Event | Does |
|---|---|---|
| `guard-data-integrity.sh` | PostToolUse (Edit\|Write) | Blocks `NEXT_PUBLIC_*` token names, `process.env` token reads in `'use client'` modules, and pinned figures pasted as literals into non-test source |
| `post-edit-lint.sh` | PostToolUse (Edit\|Write) | eslint `--fix` + prettier (JS/TS) or ruff (Python) on the edited file; unfixable violations come back as context |
| `git-guard.sh` | PreToolUse (Bash) | Confirms before `git push --force` (without `--force-with-lease`) and `git reset --hard` |
| `stop-quality-gate.sh` | Stop | `tsc --noEmit` + `eslint .` must pass; no-ops until a `package.json` and `node_modules` exist |
| `stop-session-state.sh` | Stop | Blocks turn-end if work went unrecorded in `SESSION_STATE.md`, and enforces the archive threshold |
| `check-citations.sh` | Stop | Every Markdown link and `file://` URI in the normative docs must resolve, anchors included |

Each Stop hook blocks at most once per turn (`stop_hook_active`), then escalates — Rule 4's
"cap every autonomous loop" applies to the hooks themselves. Run any of them standalone:
`./.claude/hooks/<name>.sh`.

---

## Project Layout
- `docs/` — the PRD and the verified research behind it. `docs/adr/` holds ADRs
  (`NNNN-slug.md`, Context/Decision/Consequences) for consequential, hard-to-reverse choices;
  SPECs capture *what* to build, ADRs capture *why* a choice was made.
- `.claude/agents/` — the seven subagent definitions; tool restrictions are enforced by `tools:`
  frontmatter, not honor system.
- `.claude/skills/` — **the live skill set Claude reads.** `skills/` is a canonical master copy and
  `.gemini/skills/` is Gemini CLI's; neither is read by Claude Code and they are no longer checked
  for lockstep (see Divergence note below).
- `.claude/hooks/`, `.claude/commands/`, `.claude/scripts/` — the enforcement, command, and
  deterministic-tooling layers described above.
- `SESSION_STATE.md` — the Sprint Ledger. `SPEC.md` — the active spec, created at kickoff.
- **`ARCHITECTURE.md` — deliberately deferred, not missing.** Do not create one to satisfy a
  reference. Its content already lives in three places that are harder to let rot: this file's
  Stack table (the choices), PRD §5.1 (the requirement-level rationale for dropping FastAPI /
  Supabase / Supabase Auth), and README § Technical Notes (the system diagram, build order, and
  out-of-scope list). A fourth copy would restate all three and start diverging immediately — the
  exact drift ADR 0001 was written about, and a design doc that reads as authoritative while being
  wrong is worse than no design doc. Written before the walking skeleton it would document
  intentions rather than architecture, and be rewritten the moment the first Route Handler lands.
  **Revisit when** "where does this change go?" stops being answerable from the file tree at a
  glance — realistically once several Route Handlers, a shared validation layer, a caching wrapper,
  and chart components with non-obvious boundaries coexist. Under the 5-file task cap, V1 may never
  reach that point.

> **Divergence note.** `GEMINI.md` and `.gemini/` are a parallel Gemini CLI setup. As of
> 2026-08-04 this file is deliberately **no longer kept at parity** with it — CLAUDE.md is tuned
> to Claude Code's own mechanisms (real hooks, `.claude/agents/`, skills, slash commands) rather
> than to the lowest common denominator. GEMINI.md is stale relative to this file; do not treat it
> as a second source of truth, and do not sync changes to it unless asked.

## Stack

Derived from the fellowship defaults with a **deliberate deviation recorded in PRD §5.1**: this
product reads two public, read-only APIs, stores nothing, and has no users, so FastAPI + Supabase +
Supabase Auth were dropped rather than inherited — three services with no requirement to justify
them (Rule 8, `Simplicity > Pattern purity`).

| Layer | Choice | Note |
|---|---|---|
| Frontend | React + TypeScript, Next.js App Router | Fellowship default, retained |
| Charts | Recharts | Declarative, React-native, small; no hand-rolled D3 for two line series |
| Data access | Next.js Route Handlers (server-side) | Not a separate backend; keeps the token off the client and gives ISR caching free |
| Backend / DB / Auth | **None** | Nothing is written; source of truth is the Socrata API |
| Data | `h9gi-nx95` (crashes, primary), `8h9b-rp9u` (arrests, severable P1) | Window fixed at 2018–2025 |
| Lint | ESLint + Prettier + `eslint-plugin-jsx-a11y` | Enforced per-file by hook, tree-wide by Cypress |
| Test | Vitest + `@testing-library/react` + `axe-core` | Behavioral tests per Rule 4 |
| Deploy | Vercel | ISR/caching matters here (NFR-1) |

### Recorded decisions
This project has no separate `AGENTS.md` — Claude Code loads `CLAUDE.md`, so the per-assignment
record lives here rather than in a file nothing reads.

- **Security isolation: none required.** PRD §5.6 assessed it — no untrusted third-party code, one
  low-sensitivity credential (a rate-limit attribution token, not an authorization secret), no PII
  (both datasets are public aggregates; arrest demographic fields are excluded from ingestion
  entirely). Re-assess and re-record if any of the three changes.
- **Test-quality gates adopted:** the Stop-hook typecheck/lint gate, and ADRs in `docs/adr/`.
  Declined for now: a sibling-test-file PostToolUse check (nothing to check until the app exists)
  and `commitlint` — though that decline's stated reason ("not yet a git repo") lapsed on
  2026-08-04. Re-open it if Rule 10's Conventional Commits start slipping; `.githooks/commit-msg`
  currently enforces only the AI-byline ban, not the message format.
- **Lighthouse CI** may be added as a post-deploy step once a Vercel preview URL exists — record
  the budget thresholds here when it is. It complements rather than replaces `axe-core` /
  `eslint-plugin-jsx-a11y`, which run pre-deploy on test-time JSX.
- **Git: initialized, guard installed** (verified 2026-08-04 — `main`, 2 commits, and
  `.git/hooks/commit-msg` byte-identical to `.githooks/commit-msg`). The ledger Stop hook, worktree
  parallelism (Rule 5), and the merge protocol (Rule 10) are all live, not inert. The guard lives
  outside version control, so **a fresh clone starts unprotected** — reinstall it there with
  `cp .githooks/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg`. It needs no
  `git config` change, which agents never touch.

---

## Workflow Rules

1. **Plan before building (Definition of Ready).** Start non-trivial features in plan mode. Cedar rejects ambiguous goals and demands clarification — recommend `/grill-me` — before generating a `[SPEC]`. The human approves the plan before any code is written (HITL checkpoint).
2. **Intake and routing.** Pine is an Air Traffic Controller and never executes tasks itself: simple bugs → Redwood, chart/layout/styling → Magnolia, exploratory → Cedar for a `[SPIKE]`, complex → Cedar for a `[SPEC]`, multiple plausible readings → back to the human via `/grill-me` rather than guessed at. **Carve-out:** anything that changes what a displayed number *means* is never SIMPLE, however small the diff — it goes to Cedar (see rule 4 of the four above).
   - **Match ceremony to the task.** This is an L1 solo MVP, so the default is the minimal path — Pine → Cedar → Cypress → Redwood — with **Birch** (context) and **Banyan** (review/refactor) invoked on demand: Birch when the context is non-trivial, Banyan when a coupling/bloat smell or refactor is flagged. Use the full path for higher-stakes work, and the SPIKE path for exploratory prototyping where Cypress audits *after* the walking skeleton exists.
3. **Redundancy & review.** On the full path Banyan peer-reviews Cedar's `[SPEC]` and Redwood/Magnolia's code to prevent bottlenecks and enforce Intellectual Control. Banyan also mediates the Cypress rejection loop.
4. **TDD and black-box testing.** Cypress writes failing tests from the `[SPEC]` before Redwood implements, prioritizing **behavioral/integration** tests — for a Route Handler that means its JSON response shape given a stubbed Socrata reply, not its fetch plumbing. No brittle unit tests that lock Redwood into an internal implementation. For a `[SPIKE]`, characterization tests come after. Tests define Done.
5. **Task granularity.** No task may modify more than 5 files; Cedar splits anything bigger and limits background/reference resources in a `[SPEC]` to 3 items (the "Constraint of Three") unless justified. Banyan is exempt for atomic, tree-wide mechanical refactors. High-risk write operations (directory deletions, mass replacements) execute a **Deterministic Rehearsal** — a dry run that proves the target set — before executing. Parallel work uses isolated Git Worktrees; Docker is rejected for *workspace* isolation as infrastructure bloat (that rejection is about parallelism, not about security isolation, which PRD §5.6 assessed separately). Keep actions surgical: intention over tool-execution rate.
6. **Walking skeleton first.** The thinnest end-to-end slice, then grow. Per the PRD handoff the first task is **one chart, one metric (deaths per year), rendering from a live server-side SoQL call** — everything else grows from that slice. No big-bang builds.
7. **Context diet.** Read only what the task needs. The PRD is 365 lines: cite the FR/NFR, don't load the document. Birch retrieves via ripgrep and AST/LSP search and reads only matched sections. Birch is read-only — it audits the Context Cache in `SESSION_STATE.md` against the four failure modes (Poisoning, Distraction, Confusion, Clash) and reports drift in its `[CONTEXT-PACKET]`; the main session writes the actual update. No vector store: lexical + LSP is simpler, zero-dependency, and never goes stale.
8. **Patterns are earned.** Apply a GoF pattern only when variance analysis finds genuine variation to encapsulate. Otherwise write `Design Pattern: none — simple case`. Here the fixed window and two dataset IDs are stable; the *set of series* rendered (raw, casualty-filtered, arrests, per-borough) is the axis that actually varies. Default force: `Simplicity > Pattern purity`.
9. **Dependency authority.** Only Cedar introduces a new NPM/PIP dependency. Redwood and Magnolia halt and request a `[SPEC]` update. No shadow IT. Vet anything new (`npm audit`); prefer well-maintained packages.
10. **Git protocol.** Conventional Commits (`feat:`, `fix:`, `docs:`). Banyan coordinates merges — reviewing branches and resolving conflicts before they land on the main branch. `git-guard.sh` mechanizes the destructive-command confirmations; `.githooks/commit-msg` rejects any `Co-Authored-By` trailer naming an AI assistant, since Rayan's commits carry no AI byline.

---

## Team Roster (`.claude/agents/`)

Every workflow has one definitive owner, so nothing falls to the bystander effect.

| Agent | Role | May edit? | Job |
|---|---|---|---|
| `pine` | API Gateway / Intake | No | Route tasks to the right specialist |
| `birch` | Systems Analyst | No | Gather the exact files/docs a task needs; audit the Context Cache |
| `cedar` | Tech Lead | No | Goals → `[SPEC]`/`[SPIKE]` + `[FORCES]` (≤5 files); pin every query; sole dependency authority |
| `cypress` | Data QA / SDET | Tests only | Failing tests first; audit correctness, security, a11y; emit `[COMPLIANCE-REPORT]` |
| `redwood` | Data Engineer | Yes | Route Handlers, SoQL aggregation, server-side fetching; emit `[COMPLETION-REPORT]` |
| `magnolia` | DataViz / UI Engineer | Yes | Recharts visualizations, layout, styling, frontend accessibility |
| `banyan` | Platform Engineer / Reviewer | Refactors only | Reduce coupling; mediate rejection loops; tree-wide mechanical refactors; merge coordination |

The fellowship's `aspen` (Archivist) and `willow` (Tutor Assistant) are deliberately absent: both
operate on `raw/`, `notebook/`, and `wiki/`, which this standalone project does not have.

## The Orchestrator (the main session)

Subagents cannot invoke other subagents — every arrow in the pipeline is the main session relaying
a handoff between two agents that share no context. The main session therefore owns:

- **Relaying handoffs verbatim** — Cedar's `[SPEC]` into Cypress's and Redwood's/Magnolia's prompts unchanged, and the reports back the other way.
- **Persisting the SPEC** to `SPEC.md` before dispatch, so the contract survives compaction and the HITL approval has a durable artifact.
- **Counting the rejection loop.** Subagents are stateless between spawns; only the main session can know this is retry 2 of 2.
- **Retry via continuation, not respawn** — continue the same agent invocation so it keeps its implementation context.
- **Worktree isolation** for parallel builder tasks; Banyan still coordinates the merge.
- **Applying Birch's flagged updates** to the ledger, since Birch is read-only.

## Handoff Schemas

### `[SPEC]` / `[SPIKE]` — Cedar → Cypress → Redwood / Magnolia
```markdown
[SPEC] / [SPIKE]
- **Objective**: <what the code must achieve>
- **Requirement**: <PRD FR/NFR this satisfies, e.g. FR-12 [P0]>
- **Inputs/Outputs**: <types, schemas, JSON shapes>
- **Query** (data tasks only): <exact dataset ID + SoQL + expected response shape>
- **Design Pattern**: <GoF pattern + justification, or "none — simple case">
- **UI Scope** (UI tasks only): structural — the layout/DOM must change | cosmetic — styling/motion on the existing layout
- **Intellectual Control**: <why this approach, and why it won't break at scale>
- **Constraints**: <performance, forbidden libraries, style>
- **Edge Cases**: <error handling, null states>
- **Files**: <max 5 files this task may touch>
- **Tipping Point**: <threshold at which this component must be refactored/decomposed>

[FORCES]
1. <Primary force> > <Secondary force>
2. Simplicity > Pattern purity   (always present unless explicitly overridden)
```

### `[COMPLIANCE-REPORT]` — Cypress → Cedar / Redwood
```markdown
[COMPLIANCE-REPORT]
- **Status**: PASS | FAIL
- **Critical violations**: <must fix before merge; empty if PASS>
- **Recommendations**: <non-blocking improvements>
- **Test results**: <command run + summary of output>
```

### `[COMPLETION-REPORT]` — Redwood / Magnolia → Cypress
```markdown
[COMPLETION-REPORT]
- **Files changed**: <list>
- **Spec items satisfied**: <checklist against the SPEC>
- **Complexity Justification**: <prove Jevon's Paradox was avoided; defend added lines against bloat>
- **Known gaps**: <anything deferred, or "none">
- **Tipping Point Progress**: <how close this is to the defined Tipping Point>
```

`[ROUTING-DECISION]` (Pine), `[CONTEXT-PACKET]` (Birch), and `[HEALING-REPORT]` (Banyan) each
define their exact block in their own `.claude/agents/*.md` file.

## Rejection Loop (circuit breaker)

1. Cypress FAILs → Redwood/Magnolia gets the `[COMPLIANCE-REPORT]` plus the original task and retries — continue that same invocation, don't respawn cold.
2. **Maximum 2 retry cycles.** After the second FAIL, escalate to **Banyan** for mediation: it reviews code and tests, instructs Cypress if the test is flawed, or performs the structural fix. Escalate to the human only if Banyan cannot resolve it.
3. **Cap every autonomous loop.** This loop, the lint-fix loop, the Stop hooks, and anything added later carry an explicit finite cap that escalates to the human on exhaustion. Never run an uncapped loop.

## Session Continuity (Sprint Ledger)

- **Start of session:** read `SESSION_STATE.md` first.
- **End of session:** record (1) what was accomplished, (2) what is unfinished or blocked, (3) explicit next steps. `stop-session-state.sh` catches you if you forget. `/wrap-up` runs the full close-out ritual (tracking check → ledger → Conventional Commits → push).
- **SPEC archival:** on completing an objective, append `SPEC.md` to `ARCHIVED_SPECS.md` with a timestamp and reset it, so `SPEC.md` only ever holds active work.
- **Fail loud on mismatch.** `SESSION_STATE.md` is *episodic* memory — a hint about what was true when written. The repo itself is the *procedural* source of truth. If the ledger names a file, skill, or agent that no longer exists, or records a step the tree contradicts, surface the discrepancy rather than trusting the stale entry.
- **Archive threshold:** over 150 lines or more than 5 historical sessions, move older `## History` entries to `ARCHIVED_SESSIONS.md`.
- **Condense reasoning, not just outcomes.** When archiving, the *why* is what's worth keeping: preserve why an option was rejected, why a scope line was drawn, what constraint forced a design — even at the cost of procedural detail. Recording only "X was rejected" produces an archive that cannot be cited later and destroys the reasoning it was meant to preserve. Full rationale and the failure that produced this rule: [docs/adr/0001-preserve-reasoning-when-condensing.md](docs/adr/0001-preserve-reasoning-when-condensing.md).

## Quality Standards

### Security (Zero-Trust)
- No secrets, API keys, or PII in context, code, or commits. `SOCRATA_APP_TOKEN` lives in a gitignored `.env` and is read only server-side. Verify `.gitignore` covers `.env*` before the first commit.
- Treat all API responses and LLM output as untrusted input: validate before rendering or executing.
- Arrest demographic fields (`perp_race`, `perp_sex`, `age_group`) are **permanently excluded from ingestion** (PRD §6). Arrest density reflects patrol patterns, not offending; charting it against a safety metric would present policing bias as neutral fact.

### Bounded AI
- **Compute deterministically, summarize generatively.** Build the deterministic script or pure function first, then hand its results to the model as context — `verify-figures.py` is the pattern to copy.
- **Strict schemas at every boundary.** Validate the Socrata response shape (Zod) before it reaches a component. Cast the string numerics explicitly; fail loud on an absent core aggregate.

### Accessibility (WCAG 2.2 AA)
- Target **WCAG 2.2 AA** and the **ARIA APG** patterns. Prefer native semantic HTML over ARIA-decorated divs.
- **Every chart also exposes its data as a screen-reader-accessible table** (NFR-3) — a two-line chart is not perceivable on its own, and shipping one without the table equivalent is an automatic FAIL.
- **Never encode meaning by color alone.** The reporting-affected collision series carries a dashed stroke **and** an explicit inline label ("affected by reporting decline — see caveats") in every rendering (FR-3).
- Verify mechanically: `axe-core` (or `@axe-core/playwright`) in tests, `eslint-plugin-jsx-a11y` in lint. Respect `prefers-reduced-motion`; meet AA contrast on every stroke and label.

### Honesty of presentation
- **Correlation language only.** Nothing on the page may assert that enforcement *caused* a change in deaths — the 2020–21 fatality rise is confounded by nationwide pandemic speed increases. Show co-movement, name the confounder, assert nothing. Consider defaulting the enforcement series to off so the integrity finding lands before the correlation does.
- Any Manhattan claim with a 2025 endpoint must cite January 2025 CBD congestion pricing as a confounder.
- 2025 is a fragile endpoint (local-minimum deaths, preliminary feed). If `/verify-figures` shows it moved materially, switch headline deltas to 2018–19 vs 2024–25 two-year averages.

## Design Principles (apply, don't recite)
- Encapsulate what varies; program to interfaces; favor composition over inheritance; keep coupling loose.
- Shorthand: "Facade it" (simplify a subsystem), "Strategy it" (interchangeable algorithms), "Observer it" (decouple events).
