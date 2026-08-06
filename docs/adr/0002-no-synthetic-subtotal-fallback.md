# 0002 — No synthetic subtotal fallback for an absent core aggregate

- **Status**: Accepted
- **Date**: 2026-08-05
- **Supersedes / Superseded by**: none

## Context

`docs/nyc-collision-analytics-deep-research.md`'s Structural Anomalies table recorded a proposed
mitigation for the **Aggregate Nullification Anomaly** (`number_of_persons_killed` going silently
unpopulated, confirmed absent after 2026-05-05): "runtime schema validation computing a synthetic
fallback total (sum of the subgroup fields) when the primary field is null." The same idea
appeared a second time in that document's "Data engineers" strategic-recommendation bullet, and a
third time as the stated **Fix** for the Aggregate Nullification Anomaly in
`docs/nyc-collision-reporting-drift.md`'s comparison table (line 257) — the table whose whole
purpose is to tell a reader which of the two defects they are looking at and what to do about it.
Read in isolation, the fallback presented as the settled answer, with none of the hedging that sat
around the original research doc's table row.

**Prior art the correction is grounded in.** GreenInfo-Network's `nyc-crash-mapper`
(crashmapper.org; React/Redux/Leaflet over CARTO; same `h9gi-nx95`; ~1M rows; maintained through
October 2025) shipped exactly this fallback pattern in production, then filed and closed issue
**#111**, "Investigate sum discrepancies 2021-2024," opened on a user-reported mismatch against
NYC Open Data's own totals. Their root cause, in their own words: NYPD records a casualty on the
crash record without always assigning that person a role (pedestrian, cyclist, motorist), so the
subgroup sum is **"casualties we could classify," not "casualties."** A sum of the role fields
therefore *undercounts* the authoritative total, and the undercount is not a small or constant
rounding artifact — see Consequences (a) below. Their eventual four-part fix: (1) always use the
authoritative field for grand totals, never a computed sum; (2) add an explicit "Other/Unknown"
category displaying `total − sum(categories)` so the unclassified casualties are shown, not
hidden; (3) backfill the 968 records that were repairable from source data; (4) add About-page
copy explaining that some injuries have no role ascribed to them.

**Our own measurement, 2018–2025** (`.claude/scripts/subtotal-gap.py`, live run 2026-08-05,
dataset `h9gi-nx95`, gap = authoritative total − subgroup sum):

| Year | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|
| deaths gap | 0 | 0 | 0 | 12 | 20 | 19 | 9 | 6 |
| injuries gap | 23 | 1 | 0 | 2,132 | 2,392 | 2,411 | 1,835 | 1,405 |

This independently reproduces the shape crashmapper's issue #111 describes: no gap through 2020,
then a gap that opens in 2021 and persists. The same live run also **re-confirmed all 8 pinned
deaths figures in PRD Appendix A with zero drift** — a dated corroboration worth keeping next to
this finding, since it establishes the run that produced the gap table was measuring against a
still-accurate baseline, not a stale one.

## Decision

**Fail loud, per FR-11.** When the primary aggregate field (`number_of_persons_killed`,
`number_of_persons_injured`) is absent or null for a year in the analysis window, the application
raises the defined error state. The subgroup sum is never used as a fallback, a default, a
placeholder, or a cross-check that overrides the primary field — for deaths, for injuries, or for
any future casualty aggregate this project adds. This does not amend FR-11's text, which already
specified fail-loud with no fallback; it corrects a *proposed mitigation* in the research layer
that had drifted out of agreement with the requirement it was meant to serve.

## Consequences

**(a) Why the shape of the gap matters more than its size.** The gap is exactly 0 for 2018–2020,
then opens in 2021 and stays open. A fatality or injury series built on the subgroup sum instead
of the authoritative field would therefore not just be a little low across the board — it would
slope down *more steeply* than the real series, with the extra steepness manufactured entirely by
a change in NYPD's role-classification practice, not by any change in road safety. That is the
same failure mode as the 2020 reporting break this whole project exists to expose, one field
further down the pipeline: a bookkeeping change silently produces a safety improvement that isn't
there. This is the payload of this ADR; a future session citing this decision should be able to
reach this paragraph without re-deriving the gap itself.

**(b) The remedy is falsified; the dropout's cause remains unconfirmed.** These are two different
claims and must not be conflated. The Aggregate Nullification Anomaly's **symptom** (records after
2026-05-05 omit `number_of_persons_killed` entirely) was and remains confirmed. Its **cause** was
and remains unconfirmed — sourced to a single Help Desk ticket, no official diagnosis, and
`docs/nyc-collision-analytics-deep-research.md` line 156's "Unconfirmed" label is correct and is
not touched by this ADR. Only the **proposed remedy** changes state here, from an untested
suggestion to independently falsified by a second team's production experience.

**(c) The residual-as-category pattern is recorded, not adopted.** Crashmapper's "Other/Unknown"
category is the constructive half of their fix and is worth keeping on the record: instead of
hiding the unclassified casualties inside a fallback sum, show them as their own labeled category.
It is **not** implemented in this project, for a concrete reason — we currently render no
casualty-by-role breakdown at all (FR-2 is not yet built), so there is no total for a residual
category to reconcile against. It also must not be conflated with this project's existing
property-damage-only (PDO) tier: the PDO tier is `raw collisions − casualty-filtered collisions`,
a residual over *collision records*, while crashmapper's Other/Unknown is
`persons_injured − sum(role-assigned persons)`, a residual over *people within a record*. The two
rhyme structurally — both are "the total minus what we could classify" — but they are different
quantities over different denominators, and treating them as interchangeable would be its own
small integrity error. Adopting the Other/Unknown pattern for FR-2 or any future casualty-by-role
breakdown requires its own `[SPEC]`, and that SPEC should name this ADR.

**(d) Re-verification is a script, not a re-derivation.** `.claude/scripts/subtotal-gap.py`
reproduces the query above and diffs the result against the pinned gap table, printing a
per-year, per-series `ok`/`DRIFT`/`ABSENT` status and exiting non-zero on any mismatch (dated
2026-08-05, mirroring `.claude/scripts/verify-figures.py`'s house style). Checking whether this
finding still holds means running that script, not asking a model to subtract two aggregates —
having a language model perform that subtraction to refresh a normative document would be the
identical NFR-4 violation this ADR corrects, one level up.

**Positive**

- The four prose sites that recommended the fallback now agree with FR-11 instead of contradicting
  it, and the `mvcc-data` skill — the file actually read before a query is written — carries the
  same correction so the mistake cannot re-enter through the mandatory-load path.
- The finding is re-verifiable on demand rather than trusted from a prior run.

**Negative / costs**

- None of the four corrected prose sites had any effect on shipped behavior — `src/lib/deaths.ts`
  never fetched the subgroup fields and the fallback was unreachable in code, so this ADR corrects
  documentation risk, not a live defect. The cost paid here is entirely the four-site correction
  effort, which is the point: a wrong mitigation sitting uncorrected in research docs is exactly
  the kind of drift an agent following the mandatory `mvcc-data` skill load could otherwise
  reintroduce into real code later.

**Depends on this ADR** (update these if this decision changes)

- `docs/nyc-collision-analytics-deep-research.md` — the Aggregate Nullification Mitigation cell,
  the "Data engineers" strategic-recommendation bullet, and the trust-note item 4 addition.
- `docs/nyc-collision-reporting-drift.md` — the comparison table's Fix cell for the Aggregate
  Nullification Anomaly.
- `.claude/skills/mvcc-data/SKILL.md` — trap 1's added clause and the Verified fields list.

## Source record

The live query this ADR's gap table and PRD-Appendix-A corroboration are drawn from is
`.claude/scripts/subtotal-gap.py`, run 2026-08-05 against `h9gi-nx95` with no `SOCRATA_APP_TOKEN`
set (anonymous, rate-limited). Re-run it to check whether either finding still holds; do not
re-derive its numbers by hand or by model.
