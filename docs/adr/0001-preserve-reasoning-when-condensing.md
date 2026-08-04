# 0001 — Preserve reasoning, not just outcomes, when condensing

- **Status**: Accepted
- **Date**: 2026-07-28
- **Supersedes / Superseded by**: none

## Context

This repo condenses records in three places, all of them lossy by design:

1. `SESSION_STATE.md` entries are summarized into `ARCHIVED_SESSIONS.md` at the Archive
   Threshold (150 lines / 5 sessions).
2. Aspen distills `raw/` source documents into `notebook/` notes.
3. Aspen further distills notes into the topical `wiki/`.

On 2026-07-28 a live test of the Willow subagent exposed a failure in the first of these.

The orchestrator asked Willow to draft an AI Tutor answer and supplied, as background, the
reason a candidate dataset had been rejected during MVP scoping months earlier: the Kaggle
**AI Requirements Index** CSV was an aggregated time-series of the *percentage* of job
listings requiring AI skills, rather than one row per listing. That is the wrong **grain**
for a per-person product, and no cleaning could recover the individual records, because they
were never in the file.

Willow refused to assert it. Under its anti-fabrication rule it checked the claim against the
repo and found that `ARCHIVED_SESSIONS.md` recorded only the bare outcome, "rejected
outright," with no rationale. It downgraded to the weaker supported claim and reported the
downgrade.

Willow was correct about the repo and the orchestrator was correct about the fact. The
rationale had existed verbatim in `SESSION_STATE.md`, but an earlier condensation pass kept
the *decision* and dropped the *reasoning*, and a subsequent rebase made the lossy version
canonical. The text was recovered only because an unrelated pre-rebase read happened to sit
in the active session's context. The underlying data was by then deleted (`raw/dataset/`,
removed 2026-07-27), so no re-derivation was possible.

Two properties of this failure make it worth a standing rule:

- **It is silent.** Nothing was flagged, no link broke, no check failed. The archive looked
  complete and was internally consistent. The loss was invisible until something tried to
  cite it.
- **It inverts the value ordering.** Condensation naturally preserves conclusions and drops
  discussion, because conclusions are short and reasoning is long. But the conclusion is the
  cheap half. "Dataset rejected" is not reusable; "rejected because the grain was wrong for a
  per-person product" is a transferable lesson that later changed how an unrelated question
  about CSV structure was answered.

## Decision

**When condensing any record, preserve the reasoning behind each decision even at the cost of
dropping procedural detail.**

Rationale means: why an option was rejected, what constraint forced a design, what tradeoff
was accepted, what would have to change for the decision to be revisited.

Procedural detail means: file counts, staging status, which agent performed the step, commit
mechanics. This is recoverable from `git log` and is the correct thing to sacrifice.

A record that states an outcome without its reasoning cannot be cited later and silently
destroys the thing it was written to preserve.

This decision is recorded here, in an append-only artifact, rather than only in the session
archive. `CLAUDE.md` already directs agents to treat `SESSION_STATE.md` as *episodic* memory
and the repo's actual state as the *procedural* source of truth. Normative rules must
therefore not depend on episodic storage for their justification, which is exactly the
dependency that produced this failure.

## Consequences

**Positive**

- Archived entries and distilled notes stay citable as evidence rather than decaying into
  a list of outcomes.
- The worked example above lives in a file that no condensation pass rewrites, so the rules
  depending on it keep their grounding.
- Establishes `docs/adr/` at repo root for workflow decisions that outlive a session.

**Negative / costs**

- Condensed entries run longer than pure outcome summaries, so the Archive Threshold is
  reached somewhat sooner.
- Judging "reasoning vs. procedure" is not mechanical and will occasionally be got wrong.

**Depends on this ADR** (update these if this decision changes)

- `CLAUDE.md` / `GEMINI.md` → Session Continuity → Archive Threshold → "Condense reasoning, not just
  outcomes."
- `.claude/agents/aspen.md` → Quality bar → "Preserve reasoning, not just conclusions."

`.claude/agents/willow.md` states its evidence-anchoring and anti-fabrication rules
self-standingly and does not depend on this record, though the Willow test is what surfaced
the failure.

**Scope note**

This adopts ADRs at repo root for cross-cutting workflow decisions. It does **not** resolve
the separate, still-deferred candidate in `CLAUDE.md`/`GEMINI.md` Rule 9, which concerns per-assignment
ADRs for consequential tech choices inside an assignment. That remains unadopted and
per-assignment, to be specced by Cedar at kickoff when an assignment earns it.

## Source record

The recovered rationale is preserved in `ARCHIVED_SESSIONS.md`, in the 2026-07-20 session
entry, tagged with its provenance. That copy is now a duplicate of the account above rather
than the authoritative one.
