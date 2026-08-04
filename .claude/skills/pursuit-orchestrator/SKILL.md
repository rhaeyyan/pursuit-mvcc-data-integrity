---
name: pursuit-orchestrator
description: Entrypoint for multi-agent orchestration — delegates goal→[SPEC]/[FORCES] planning to the Cedar (Tech Lead) subagent. Trigger for new features or refactors.
---

# Pursuit Orchestrator

This skill is the **discoverable entrypoint** for turning a high-level goal into a surgical,
multi-agent plan. It does **not** re-define the planning process — that lives in one canonical
place to avoid drift:

- **Owner of the process:** the **`cedar`** (Tech Lead) subagent — `.claude/agents/cedar.md`.
  Invoke it to produce the `[SPEC]` (or `[SPIKE]`, for exploratory work) + `[FORCES]` task list.
  Cedar plans; it never writes code. If the goal has multiple plausible interpretations, Cedar
  rejects it and recommends `/grill-me` to interview the human rather than guessing (Rule 1).
- **Canonical rules & schemas:** `CLAUDE.md`/`GEMINI.md` (Workflow Rules, the `[SPEC]`/`[SPIKE]`/
  `[FORCES]`/`[COMPLIANCE-REPORT]`/`[COMPLETION-REPORT]` schemas, the Rejection Loop, and the
  pipeline tiers — L1 takes the minimal path; Birch and Banyan are on-demand). The schema
  templates are **not** duplicated here — see [GoF pattern reference](#gof-pattern-reference-the-part-claudemdgeminimd-doesnt-enumerate)
  below for why.

## How to use
1. Hand the goal to the `cedar` subagent (via the Agent/Task tool). If Cedar needs codebase
   context, it requests a `[CONTEXT-PACKET]` from the **`birch`** (Systems Analyst) subagent —
   don't browse the tree yourself (Context Diet, Rule 7).
2. Cedar returns a one-paragraph plan summary for **human approval (HITL)**, then the ordered
   `[SPEC]`/`[SPIKE]`/`[FORCES]` tasks. Each task: ≤5 files (Rule 5), Cypress-writes-tests-first
   (TDD), and names its executing agent. Persist the approved block to `SPEC.md` before
   dispatching it — that's the orchestrator's (main session's) job, not Cedar's.
3. Route the approved tasks down the pipeline: **Cypress** (failing tests) → **Redwood** or
   **Magnolia** (implement — UI/UX tasks go to Magnolia, Rule 2) → **Cypress** (audit). On FAIL,
   the same agent retries with the `[COMPLIANCE-REPORT]`; after 2 retry cycles, stop and escalate
   to **Banyan** for mediation (Rejection Loop). Banyan also reviews on-demand outside the
   rejection loop when a coupling/bloat smell is flagged.

## GoF pattern reference (the part CLAUDE.md/GEMINI.md doesn't enumerate)
Patterns are **earned, not mandatory** — apply one only when variance analysis finds genuine
variation to encapsulate; otherwise `Design Pattern: none — simple case`. Default force:
`Simplicity > Pattern purity`.

- **Creational:** Factory Method, Singleton.
- **Structural:** Facade, Adapter, Proxy.
- **Behavioral:** Observer, Strategy, State.

Shorthand: *"Facade it"* (simplify a subsystem) · *"Strategy it"* (interchangeable algorithms)
· *"Observer it"* (decouple events). Fuller GoF pattern catalog lives in
[REFERENCES.md](references/REFERENCES.md) — the `[SPEC]`/`[SPIKE]`/`[FORCES]` schema templates
are **not** duplicated there; they're canonical in CLAUDE.md's/GEMINI.md's `## Handoff Schemas`
section only, specifically so they can't drift out of sync the way this file's copy once did.
