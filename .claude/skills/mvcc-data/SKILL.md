---
name: mvcc-data
description: The MVCC Data project's dataset contract — Socrata endpoints, verified field names, pinned figures, SoQL patterns, and the five known traps that silently corrupt a result. Load this BEFORE writing any SoQL query, any Route Handler that fetches from Socrata, any test asserting a figure, or any chart that displays one. Triggers on - Socrata, SODA, SoQL, h9gi-nx95, 8h9b-rp9u, crash data, collisions, arrests, borough filter, yearly aggregate, "verify the numbers", App Token.
---

# MVCC Data — dataset contract

Everything here was verified by live query on **2026-08-03**. Treat these as the pinned
reference values: if a query disagrees with this file, the discrepancy is the finding — surface
it, do not quietly adopt the new number. Full provenance in `docs/project-mvcc-data.md`
Appendix A.

## Endpoints

```
https://data.cityofnewyork.us/resource/h9gi-nx95.json    # Motor Vehicle Collisions – Crashes (PRIMARY)
https://data.cityofnewyork.us/resource/8h9b-rp9u.json    # NYPD Arrests Data (Historic) — severable P1 only
```

Auth: header `X-App-Token: <SOCRATA_APP_TOKEN>`, **server-side only**. The token is a
rate-limit attribution token, not an authorization secret — but it is still never allowed into a
client bundle, a fixture, a log, or a commit.

| Dataset     | Rows      | Range                   | Cadence                      |
| ----------- | --------- | ----------------------- | ---------------------------- |
| `h9gi-nx95` | 2,269,187 | 2012-07-01 → 2026-06-11 | Daily — **currently paused** |
| `8h9b-rp9u` | 6,264,978 | 2006-01-01 → 2025-12-31 | Quarterly                    |

**Analysis window is fixed at 2018–2025.** It sits inside both datasets, avoids the paused-update
boundary and the 2026 fatality dropout, and removes any need for the year-to-date arrest table
(`uip8-fykc`). Do not widen it without a `[SPEC]` change.

## Verified fields

`h9gi-nx95`: `crash_date`, `number_of_persons_injured`, `number_of_persons_killed`, `borough`,
`collision_id`. Also verified: `number_of_pedestrians_killed`, `number_of_cyclist_killed`,
`number_of_motorist_killed`, `number_of_pedestrians_injured`, `number_of_cyclist_injured`,
`number_of_motorist_injured` — **breakdown fields that do not reconcile to the totals** (see trap
1); listing them here is not an endorsement of summing them.
`8h9b-rp9u`: `arrest_date`, `ofns_desc`, `arrest_boro`.

Every numeric field arrives as a **string**. Cast explicitly, always.

## The five traps

1. **Absent-key-as-zero.** Socrata omits keys rather than returning null. For the core yearly
   aggregates (deaths, injuries, collisions, arrests) an absent or null value must raise the
   error state — **never** coerce to zero. `number_of_persons_killed` is confirmed absent after
   **2026-05-05**; if that dropout ever extends backwards into the window, a silent zero would
   fabricate a safety improvement. This is the exact failure the product exists to expose. The
   pedestrian/cyclist/motorist subgroup fields are **not** a substitute for an absent primary
   aggregate either — the sums genuinely disagree from 2021 onward because NYPD records a
   casualty without always assigning that person a role. Fail loud is the only correct behavior
   in both cases; see [ADR 0002](../../../docs/adr/0002-no-synthetic-subtotal-fallback.md).
2. **`B` is the Bronx, not Brooklyn.** Arrest borough codes: `B`=Bronx, `K`=Brooklyn (Kings),
   `M`=Manhattan, `Q`=Queens, `S`=Staten Island. Confirmed empirically — arrest row with
   `arrest_boro: K`, precinct 71, at 40.661/−73.932 is Crown Heights, Brooklyn.
3. **The collisions `borough` field is ~30% unpopulated, and its coverage drifts** (64.4% in 2018
   → 80.1% in 2025). Any borough-filtered series must carry a persistent warning (FR-7); a
   borough trend computed without one is measuring coverage, not collisions.
4. **Two spellings of the same offense.** `INTOXICATED & IMPAIRED DRIVING` (114,597 rows) and
   `INTOXICATED/IMPAIRED DRIVING` (13,256 rows) are both live. Match **both** or lose 10% of the
   series.
5. **The 1,000-row default limit.** SoQL returns 1,000 records unless `$limit` says otherwise.
   Aggregate server-side with `$select`/`$group` so the response is 8 rows, not a truncated
   sample — never paginate two million rows into the client.

## Query patterns

Deaths per year (FR-1) — the same shape serves injuries and raw collisions:

```
?$select=date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths
&$where=crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
&$group=date_extract_y(crash_date)
&$order=year
```

Casualty-filtered "repaired" series (FR-12) — one added `$where` clause, not a subsystem:

```
&$where=... AND (number_of_persons_injured > 0 OR number_of_persons_killed > 0)
```

Traffic-enforcement arrests (FR-5, P1, severable) — filter `ofns_desc` to exactly:
`VEHICLE AND TRAFFIC LAWS`, `OTHER TRAFFIC INFRACTION`, `INTOXICATED & IMPAIRED DRIVING`,
`INTOXICATED/IMPAIRED DRIVING`, `HOMICIDE-NEGLIGENT-VEHICLE`. Vehicle-_theft_ categories
(`GRAND LARCENY OF MOTOR VEHICLE`, `UNAUTHORIZED USE OF A VEHICLE`) are property crimes, not road
safety — excluded deliberately.

## Pinned figures — citywide, `h9gi-nx95`

| Year | Collisions | Injuries | Deaths | Casualty-filtered |
| ---- | ---------- | -------- | ------ | ----------------- |
| 2018 | 231,564    | 61,940   | 231    | 45,774            |
| 2019 | 211,486    | 61,391   | 244    | 45,439            |
| 2020 | 112,918    | 44,615   | 269    | 33,362            |
| 2021 | 110,558    | 51,785   | 297    | 38,809            |
| 2022 | 103,887    | 51,933   | 290    | 39,336            |
| 2023 | 96,607     | 54,252   | 280    | 40,472            |
| 2024 | 91,316     | 54,030   | 268    | 40,229            |
| 2025 | 85,546     | 49,634   | 229    | 37,420            |

**The gradient, ordered by how discretionary the metric is:** collisions **−63%** (officer decides
whether to file) → injuries **−20%** (ambulance/hospital involved) → deaths **−1%** (medical
examiner, mandatory). Implied lethality rise of 2.68× is what makes the raw series impossible to
read at face value. The casualty-filtered repair is **−18.2%**, tracking injuries. The residual
property-damage-only tier fell 185,790 → 48,126 (**−74.1%**) — the entire artifact lives there.

Arrests (`8h9b-rp9u`, traffic-filtered): 29,007 (2018) → 8,330 (2020 trough) → 21,123 (2025).
Manhattan is the outlier: enforcement −62% (6,775 → 2,548) while Manhattan injuries rose +19%.

## The documented cause

NYPD ceased dispatching officers to property-damage-only collisions: **Staten Island pilot
2019-03-18**, **permanent citywide 2020-04-06**. Drivers self-file an MV-104 with the state DMV
above a $1,000 damage threshold; those filings never enter the NYPD database behind `h9gi-nx95`.
The Staten Island pilot is the pre-COVID natural experiment — monthly collisions ~514 (2018 avg) →
370 (Mar 2019) → 217 (Apr 2019, first full month); annual 6,171 → 3,650, with `borough` coverage
flat across the boundary (64.4% → 64.8%), so a ~47% drop cannot be a coverage artifact.

This is **documented policy, not inference**. State it as cause. But:

## What the product must never claim

- **No causal claim about enforcement.** Arrests and deaths co-move; the 2020–21 fatality rise is
  confounded by nationwide pandemic speed increases. Show co-movement, name the confounder, assert
  nothing.
- **Manhattan CBD congestion pricing launched January 2025** and reduced CBD traffic. Any Manhattan
  claim with a 2025 endpoint must cite it as a confounder.
- **No demographic fields.** `perp_race`, `perp_sex`, `age_group` are permanently excluded from
  ingestion. Arrest density reflects patrol patterns, not offending; charting it against a safety
  metric would present policing bias as neutral fact.
- **2025 is a fragile endpoint.** Deaths (229) is a local minimum and the feed is flagged
  preliminary. If a re-verification moves 2025 materially, switch headline deltas to 2018–19 vs
  2024–25 two-year averages rather than restating a single-year figure.

## Re-verification

Run `/verify-figures` before any demo or submission. It re-queries the live API and diffs against
the pinned table above. The PRD's risk register names this as the mitigation for the
preliminary-data risk — it is not optional polish.
