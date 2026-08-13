# Administrative Reporting Drift in `h9gi-nx95` — Why NYC's Crash Count Fell 63% Without the Streets Getting Safer

**Source:** [nyc-crash-data-reporting-analysis.md](../../raw/archived-docs/2026-08-03/nyc-crash-data-reporting-analysis.md)
— an AI-generated deep-research report on the NYC Motor Vehicle Collisions dataset (author/model
not stated in the source). Fact-checked against the live Socrata API and a primary source by
Aspen, 2026-08-03, before archival; see the editorial note at the top of the archived file for the
full correction list. **Unlike the [sibling deep-research
report](nyc-collision-analytics-deep-research.md) archived the same day, this one's central thesis
survived the check intact** — and is stronger than the document itself realizes.

## What this document is

A structural-integrity analysis of a single open dataset. Its argument: the 63% decline in
recorded NYC motor-vehicle collisions between 2018 and 2025 is not a safety improvement but
**administrative dataset drift** — the NYPD stopped dispatching officers to property-damage-only
(PDO) crashes, so those crashes stopped entering the database, while injury and fatality crashes
kept flowing in unchanged. The dataset silently converted from a register of _all_ collisions into
a register of _casualty-producing_ collisions, with no metadata annotation, changelog, or
structural-break warning anywhere on the portal to tell an analyst it happened.

This note covers the policy mechanism, the pipeline model behind it, the remediation, and two
empirical findings derived during the fact-check that are **not in the source document**. It does
**not** re-cover the dataset's schema, API mechanics, or general analytics content — see the
[schema note](nyc-motor-vehicle-collisions-dataset.md) and the [deep-research
note](nyc-collision-analytics-deep-research.md) for those.

## The arithmetic that gives it away

The report's opening move is the strongest thing in it, and it needs no external evidence at all —
just the dataset arguing with itself. Corrected figures (the report's injury numbers were
fabricated; see "What the fact-check corrected" below):

| Metric                                          | 2018    | 2025   | Change       |
| ----------------------------------------------- | ------- | ------ | ------------ |
| Total recorded collisions                       | 231,564 | 85,546 | **−63.07%**  |
| Traffic fatalities                              | 231     | 229    | **−0.87%**   |
| Persons injured                                 | 61,940  | 49,634 | **−19.87%**  |
| Implied fatality rate (deaths / 10,000 crashes) | 9.98    | 26.77  | **+168.24%** |
| Implied injury rate (injuries / 100 crashes)    | 26.75   | 58.02  | **+116.90%** |

**The reasoning, which matters more than the numbers:** if the crash count really fell 63% while
deaths stayed flat, then the average NYC collision must have become **≈2.68× more lethal** in
seven years. Nothing physical happened that could do that — vehicle safety standards improved
rather than degraded over the window, impact speeds did not double citywide, and the fleet did not
transform into something 2.7× deadlier. When a ratio moves that far and no physical mechanism
exists to move it, the denominator is the thing that changed, not the world. That inference — _an
implausible derived rate is evidence of a measurement change, not a reality change_ — is the
transferable lesson here, and it generalizes to any administrative dataset, not just this one.

**One confounder the report under-weights**, flagged in the archived file rather than smoothed
over: the 2020–21 emptying of NYC streets produced a real, documented rise in speeding and in
severity per crash. That genuinely contributes to the _fatality_ trend. It does not damage the
thesis, because the thesis is about the _denominator_ — empty-street speeding does not remove
146,018 crashes from a police database. The precise statement: the fatality trend has two
mechanisms, the collision-count trend has essentially one.

## What the NYPD actually changed, and when

Historically, officers were dispatched to every reported collision and filed form **MV-104AN** on
scene; those forms flowed into NYPD's records system and out to the open-data portal. The change
came in two phases, both verified against [Streetsblog,
2020-04-03](https://nyc.streetsblog.org/2020/04/03/nypd-gives-a-few-details-of-new-no-report-crash-policy):

**Phase I — Staten Island pilot, March 18, 2019.** 911 dispatchers began triaging collision calls.
If a caller reported property damage only — no personal injuries, no injured domestic animals, no
unlocatable damaged parked vehicle, no impaired driver, no tow required — dispatchers told
motorists that police response was no longer required. Drivers exchange license, registration, and
insurance information themselves and self-file an **MV-104** with the **NYS DMV** if damage exceeds
**$1,000**.

**Phase II — citywide and permanent, April 6, 2020.** The pandemic's contact-reduction imperative
accelerated the rollout. 911 calls about minor PDO collisions were routed to automated IVR messages
explaining that no officer would be dispatched. Officers who did end up at minor crashes were
directed to hand drivers a **Collision Information Exchange form (PD 301-157)** instead of
completing an MV-104AN.

**The load-bearing detail — this is the whole mechanism in one sentence:** a driver's self-filed
MV-104 goes to the **state DMV**, and DMV self-filings **never route back into NYPD's database**.
The crash is still legally reported. It simply ceases to exist in `h9gi-nx95`. The data loss is not
a bug, an outage, or a migration failure — it is the intended and correct behavior of two agencies
whose systems were never wired together.

Pilot results the department reported for March–September 2019, quoted verbatim-correct in the
source: response times in Staten Island **"decreased 9 percent"** and **"61 percent of 911 calls
were deferred."** Note what those two numbers mean together — the policy _worked_ at its stated
goal (freeing patrol capacity for higher-priority calls). The data destruction was a side effect
nobody was measuring.

## Discretionary vs. non-discretionary pipelines

The report's most useful framing, and the part worth carrying into any future work on this dataset.
Municipal collision reporting runs through two pipelines with completely different capture
guarantees:

|                          | **Discretionary pipeline**                                                  | **Non-discretionary pipeline**                                                            |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Covers                   | Property-damage-only events                                                 | Injury and fatality events                                                                |
| Triggered by             | 911 call triage → operator deferral → _voluntary_ driver self-report to DMV | Automatic EMS dispatch → mandatory police scene investigation → statutory MV-104AN filing |
| Reaches `h9gi-nx95`?     | **No** — bypasses NYPD ingestion entirely                                   | **Yes** — complete ingestion                                                              |
| Stability across 2019–20 | Collapsed                                                                   | Unaffected                                                                                |

The consequence is a **denominator bias**: remove the discretionary tier and the count of crashes
falls while the count of severe outcomes doesn't, so every derived per-crash severity ratio inflates
artificially. Any metric with crashes in the denominator — fatality rate, injury rate,
crashes-per-intersection, before/after intervention comparisons — is corrupted across the boundary.
Any metric counting casualties directly is fine.

**Why this framing is worth more than the specific finding:** "which pipeline produced this row, and
is that pipeline discretionary?" is a question you can ask of any administrative dataset. It
predicts _in advance_ which columns will survive a policy change and which will evaporate, without
needing to discover the break empirically first.

## KABCO — an interpretive lens, labelled as one

The report maps the pipelines onto the standard **KABCO** injury-severity scale: **K** fatal (within
30 days), **A** suspected serious/incapacitating, **B** suspected minor/non-incapacitating evident,
**C** possible injury (complaint of pain, no visible injury), **O** property damage only. Its claim
is that K/A/B are near-completely captured and therefore stable, while O — and to a lesser degree C
— collapsed after April 2020.

**This is where the report overclaims, and the archived file is annotated accordingly.** It presents
the per-tier trends as if measured from the Person table (`f55k-p6yu`). That table exists and is
correctly named, but its live schema carries **no literal K/A/B/C/O columns** — the severity-adjacent
fields are `person_injury`, `bodily_injury`, `complaint`, and `person_type` — and the report cites no
tier-level query anywhere. The framework is a reasonable inference and is directionally consistent
with the casualty-filter results below, but it is an interpretive overlay on the data, not a
measurement of it. Treat "tier O fell" as a restatement of the PDO argument, not as independent
per-tier evidence.

## Finding A (new — not in the source): Staten Island is an uncontaminated natural experiment

The citywide April 2020 rollout is perfectly confounded with the COVID lockdown — traffic volume,
police behavior, and reporting policy all changed in the same week, so no clean causal read is
possible from it. **The Staten Island pilot fired ten months before any of that.** That makes it the
one place in this dataset where the policy's effect can be isolated. The source document notes the
pilot's existence but never exploits it.

Monthly Staten Island collision counts (live query, `borough='STATEN ISLAND'`):

| Period                               | Monthly collisions | vs. 2018 monthly average |
| ------------------------------------ | ------------------ | ------------------------ |
| 2018 average (annual total 6,171)    | ~514               | baseline                 |
| Jan 2019                             | 464                | −10%                     |
| Feb 2019                             | 429                | −17%                     |
| **Mar 2019** (pilot launches Mar 18) | **370**            | −28%                     |
| **Apr 2019** (first full month)      | **217**            | **−58%**                 |
| May–Dec 2019 average                 | ~271               | **−47%**                 |
| 2019 annual total                    | 3,650              | −41% vs. 2018 annual     |

The discontinuity starts in the launch month — March 18 gives a partial-month effect, so a partial
drop is exactly what a policy cause predicts — completes the following month, and then holds at
roughly half the prior level for the rest of the year. The annual figure (−41%) understates it
because January and February were still pre-pilot.

**Robustness check, run before trusting the above:** the obvious alternative explanation is the
dataset's known `borough`-field null drift — if boroughs simply stopped being recorded, a
borough-filtered query would fall for reasons having nothing to do with Staten Island. Citywide
`borough` coverage was essentially flat across the boundary: **64.4% (2018) → 64.8% (2019)**. A
0.4-percentage-point coverage _increase_ cannot manufacture a 47% decline. The effect is real.

**Why this finding matters more than the report's citywide argument:** the report's evidence is
correlational across a boundary where everything moved at once. This is a single-variable change
with a dated intervention, an immediate discontinuity, a sustained new level, and a ruled-out
confounder. It is the difference between "the timing is suggestive" and "the timing is the
experiment."

## Finding B (new — not in the source): the casualty filter demonstrably repairs the series

The report recommends filtering to `NUMBER OF PERSONS INJURED > 0 OR NUMBER OF PERSONS KILLED > 0`
but never demonstrates that it works. Run year by year against the live endpoint:

| Year | Casualty crashes | Note                      |
| ---- | ---------------- | ------------------------- |
| 2018 | 45,774           | baseline                  |
| 2019 | 45,439           | flat through the SI pilot |
| 2020 | 33,362           | **real** pandemic dip     |
| 2021 | 38,809           | recovering                |
| 2022 | 39,336           |                           |
| 2023 | 40,472           |                           |
| 2024 | 40,229           |                           |
| 2025 | 37,420           |                           |

**2018 → 2025: −18.2%.** Compare the three trends over the identical window:

| Series                                                    | 2018→2025  |
| --------------------------------------------------------- | ---------- |
| Raw recorded collisions                                   | −63.07%    |
| Persons injured                                           | −19.87%    |
| **Casualty-filtered crashes**                             | **−18.2%** |
| PDO residual (total − casualty crashes: 185,790 → 48,126) | **−74.1%** |

The filtered series tracks the injuries series to within 1.7 percentage points and diverges from
the raw series by 45. That is the proof: the distortion lives almost entirely in the PDO tier, and
removing that tier restores a series whose shape matches an independent measure of the same
underlying phenomenon. The 2020 dip is also diagnostically useful — it's the pandemic actually
showing up as a _temporary_ dip that recovers, which is what a real-world event looks like, as
opposed to the raw series' permanent level-shift, which is what an administrative change looks
like.

## Open-data governance failure modes

The report generalizes past this dataset into three structural problems with municipal open-data
publishing:

1. **No structural-break metadata.** `h9gi-nx95` carries no changelog, no versioning, no inline
   alert about the April 2020 policy change. An analyst querying row counts sees a continuous
   series from July 2012 onward and has no signal that its meaning changed midway.
2. **No disambiguation between administrative and physical trends.** The portal presents an
   administrative event log as though it were a measurement of the world. Distinguishing the two
   requires cross-referencing external sources — DMV self-filed MV-104s, or DOHMH emergency-department
   admissions — that the portal neither links nor mentions.
3. **Incentive misalignment.** A falling raw crash count reads as Vision Zero succeeding. Agencies
   have no structural reason to prominently flag that their collection scope shrank, and every
   reason to let the flattering number stand unqualified.

Point 3 is the one to sit with: this is not alleged bad faith, it's the absence of a _forcing
function_. Nobody has to lie for a misleading number to propagate — it just needs to be flattering,
technically true, and unannotated.

**Downstream damage the report names:** spatial density maps show artificial drops at intersections
that used to see many minor fender-benders, while severe-crash locations look disproportionately
dangerous by comparison, warping benefit-cost ratios for traffic-calming investments. Predictive
models trained across the 2020 boundary inherit a structural break and yield invalid parameters.
And publicly citing "a 60% drop in crashes" manufactures a false sense of safety that undercuts
support for street redesign.

**That benefit-cost claim has a live specimen.** NYC DOT's [2 October 2025 Vision Zero
release](https://www.nyc.gov/html/dot/html/pr2025/decline-in-traffic-deaths.shtml) evaluates three
individual street redesigns by before/after **injury** counts: Schermerhorn Street, Brooklyn
(completed 2022) −31% pedestrian injuries; White Plains Road, Bronx (2022) −41%
motor-vehicle-occupant and −10% total crash injuries; Queens Boulevard Phase IV (2021) −45%
pedestrian and −20% total crash injuries. Those counts come from `number_of_persons_injured` — the
same MV-104 pipeline the April 2020 change truncated. The release states no before/after windows,
but any pre-period for a project completed in 2021–22 plausibly reaches back across the break. Two
things are true at once and the citation needs both: this note's own casualty-filter finding is
that the _injuries_ series survived the change far better than the raw collision count did, so
these deltas are not presumptively wrong — and a before/after comparison drawn across an
unannounced collection-scope change still carries a reporting component of unknown size that
neither the release nor the portal gives a reader any way to bound. The abstract claim above now
has a date and three corridors attached.

**The same agency's [January 2025 equity
report](https://www.nyc.gov/html/dot/downloads/pdf/equity-and-street-safety.pdf) shows the
avoidance pattern.** Its methodology (p.2, appendix p.15) measures **fatalities only**, comparing
2004–2013 against 2014–2023 at the neighborhood-tabulation-area level — no collision counts, no
single-year endpoints. Whether or not that choice was made with the reporting break in mind, it is
the correct one, and it is worth citing precisely because it comes from the agency whose flattering
number this note is skeptical of: DOT's most rigorous public analysis quietly declines to use the
series that broke. Cite it for what it did, not for what it concluded.

**One more discontinuity, worth noting because the report's own critique applies to it:** the
dataset's automated updates are **currently paused** at maximum `crash_date` **2026-06-11** — an
undocumented break of exactly the type section 1 above complains about, discovered independently
and recorded in the [schema note](nyc-motor-vehicle-collisions-dataset.md). The report's "unbroken
temporal stream … to the present" claim was corrected on that basis.

## Don't conflate this with the 2026 Aggregate Nullification Anomaly

Two separate defects in the same dataset, easy to blur together and important to keep apart:

|         | **Reporting drift (this note)**                         | **Aggregate Nullification Anomaly**                                                                                                                                      |
| ------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| When    | 2019–2020                                               | after 2026-05-05                                                                                                                                                         |
| Symptom | Recorded crash _volume_ falls ~63%                      | The `number_of_persons_killed` _field_ stops populating while pedestrian/cyclist/motorist subtotals stay live                                                            |
| Cause   | **Confirmed** — documented NYPD PDO non-response policy | **Still unconfirmed** — sourced only to a user-submitted Help Desk ticket reporting the symptom                                                                          |
| Fix     | Casualty filter (validated above)                       | Fail loud on the absent aggregate (FR-11). **Not** a synthetic subgroup-sum total — that remedy is falsified; see [ADR 0002](adr/0002-no-synthetic-subtotal-fallback.md) |

This note's mechanism explains the **volume** decline. It says nothing about the 2026
**field-population** dropout, which remains unexplained — see the [deep-research
note](nyc-collision-analytics-deep-research.md) for that one.

## What the fact-check corrected

Recorded here because the corrections are themselves the Zero-Trust lesson, not bookkeeping:

1. **Fabricated injury figures.** The summary table claimed 60,868 (2018) → 48,694 (2025),
   "−20.00%". True: **61,940 → 49,634 = −19.87%**. The original pair divides to _exactly_ 0.8000 —
   a fingerprint of numbers reverse-engineered from a rounded headline to look precise. They aren't
   sums of the modal columns either (that gives 61,917 → 48,229), so no benign derivation explains
   them.
2. **Derived injury-rate row inherited the error.** 26.29 → 56.92 corrected to **26.75 → 58.02**
   (+116.90%).
3. **KABCO table overclaimed its evidence** — see above; relabelled as interpretive.
4. **PDO drop overstated** as ">75%"; measured **−74.1%**.
5. **">50% within 12 months" overstated**; calendar 2019→2020 is 211,486 → 112,918 = **−46.6%**.
6. **"Unbroken … to the present"** — the feed is paused at 2026-06-11.
7. **COVID confounder under-weighted** — annotated, not removed.
8. **Citation #6** (nyc.gov) returns HTTP 403 to automated fetchers. Recorded as _unverified but
   corroborated_ by citation #10 (Streetsblog) — deliberately neither "verified" nor "broken,"
   because it is neither.

Confirmed correct and left alone: the policy dates and mechanics, both pilot statistics, the
231,564 → 85,546 and 231 → 229 totals, the ≈2.68× multiplier, the existence and name of the Person
table, and the casualty-filter remediation.

## Remediation and recommendations

For an analyst using this dataset — the operative instruction:

```
# SoQL — restrict to the non-discretionary pipeline before any longitudinal analysis
$where=number_of_persons_injured > 0 OR number_of_persons_killed > 0
```

This strips the volatile PDO tier and isolates the events whose capture never changed. For
intervention evaluation across the boundary, the report also recommends **Interrupted Time-Series
(ITS)** models with explicit indicator variables for both dates — March 18, 2019 and April 6, 2020
— to absorb the level-shift and slope change in the _capture function_ rather than attributing them
to the road.

Its institutional recommendations, as stated: structural-break warning banners on the dataset page;
an explicit report-origin field in the schema (on-scene investigation vs. desk report vs. deferral
notice) so filtering doesn't require inferring the pipeline; an automated NYS DMV → NYC Open Data
ingestion path to restore PDO visibility; and a research-community norm of defaulting to
casualty-only filters for multi-year trend work.

## Why it matters to the fellowship

- **Bounded AI (Quality Standards) — "compute deterministically, summarize generatively."** This is
  the cleanest illustration in the archive so far. The report's _prose reasoning_ was sound and its
  _generated numbers_ were fabricated in the same document. The fix isn't better prompting; it's
  never letting a model produce a figure that a query can produce, which is precisely what the
  mandate says.
- **Zero-Trust (Quality Standards) — "treat all LLM output as untrusted input."** Note the failure
  shape: unlike the [sibling report](nyc-collision-analytics-deep-research.md), this one was
  _substantively right_. Being right about the argument bought it no credit on the arithmetic. A
  correct thesis is not evidence that the supporting numbers were measured — verify claims
  independently of how much you like the conclusion.
- **Rule 5 (Deterministic Rehearsal).** The Staten Island monthly query plus the borough-coverage
  robustness check are a textbook rehearsal: the alternative explanation was tested _before_ the
  finding was written down, not after someone challenged it. The check cost one query and is the
  only reason the finding is assertable.
- **ADR 0001 / Archive Threshold — "condense reasoning, not just outcomes."** Nearly all the value
  here is _why_: why DMV self-filings never return to NYPD, why the pilot is a better experiment
  than the rollout, why a flat coverage rate rules out the null-drift explanation. A note recording
  only "PDO crashes stopped being logged" would be true, useless, and uncitable.
- **Cypress (SDET) — black-box thinking, applied to data.** Cypress's discipline of testing observable
  behavior rather than internals is the same move the casualty filter makes: stop trusting the
  producer's internal accounting, pick the output signal whose collection contract is known not to
  have changed, and measure that.
- **Cycle 3 tie-in.** This lands directly on Rayan's active NYC Open Data assignment against this
  same dataset (see [`project-mvcc-data.md`](../../project-mvcc-data.md)). Concretely: any
  year-over-year chart built on raw crash counts across 2019–2020 will be **wrong**, and wrong in a
  way that looks like a great result. The casualty filter is a pre-flight requirement, not an
  optimization — and the 2019/2020 boundary needs a visible caveat wherever a trend line crosses it.
- **Willow (Tutor Assistant).** Worth carrying into tutor-pattern work: "the data says crashes fell
  63%" and "crashes fell 63%" are different claims, and the gap between them is where most bad
  data-driven conclusions live.

**Cross-links:** [NYC Motor Vehicle Collisions dataset notes](nyc-motor-vehicle-collisions-dataset.md)
(schema, endpoints, the update pause) · [NYC Collision Data — Deep Research
notes](nyc-collision-analytics-deep-research.md) (Danger Index, clustering, the separate
nullification anomaly) · [Data Analytics & Cleaning wiki](../../wiki/DataAnalytics.md) ·
[Data Cleaning Framework note](../week-4/data-cleaning-framework.md) (the **Evaluate Unsolvable
Issues** step is exactly what a structural break demands) · [Week 4 Kickoff: Open Source Data
Guide](../week-4/week-4-kickoff-open-source-data.md).

---

Source at its archived path: [nyc-crash-data-reporting-analysis.md](../../raw/archived-docs/2026-08-03/nyc-crash-data-reporting-analysis.md)
