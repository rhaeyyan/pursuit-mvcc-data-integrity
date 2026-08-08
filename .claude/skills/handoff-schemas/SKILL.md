---
name: handoff-schemas
description: The exact block formats agents pass between each other — [SPEC]/[SPIKE] + [FORCES] (Cedar → Cypress → Redwood/Magnolia), [COMPLIANCE-REPORT] (Cypress), and [COMPLETION-REPORT] (Redwood/Magnolia). Load BEFORE dispatching a subagent, relaying a handoff, or writing a SPEC to SPEC.md. Nothing else in the repo defines these fields.
---

# Handoff Schemas

Subagents cannot invoke other subagents — every arrow in the pipeline is the main session
relaying a block between two agents that share no context. These are the block formats.
Relay them **verbatim**; the main session persists the `[SPEC]` to `SPEC.md` before dispatch so
the contract survives compaction.

## `[SPEC]` / `[SPIKE]` — Cedar → Cypress → Redwood / Magnolia

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

## `[COMPLIANCE-REPORT]` — Cypress → Cedar / Redwood

```markdown
[COMPLIANCE-REPORT]
- **Status**: PASS | FAIL
- **Critical violations**: <must fix before merge; empty if PASS>
- **Recommendations**: <non-blocking improvements>
- **Test results**: <command run + summary of output>
```

## `[COMPLETION-REPORT]` — Redwood / Magnolia → Cypress

```markdown
[COMPLETION-REPORT]
- **Files changed**: <list>
- **Spec items satisfied**: <checklist against the SPEC>
- **Complexity Justification**: <prove Jevon's Paradox was avoided; defend added lines against bloat>
- **Known gaps**: <anything deferred, or "none">
- **Tipping Point Progress**: <how close this is to the defined Tipping Point>
```

`[ROUTING-DECISION]` (Pine), `[CONTEXT-PACKET]` (Birch), and `[HEALING-REPORT]` (Banyan) each
define their exact block in their own `.claude/agents/*.md` file — not here.
