# NYC Collision Data — Deep Research: Danger Index, Clustering & Vision Zero Analytics

**Source:** [nyc-collision-data-deepresearch.md](../../raw/archived-docs/2026-08-03/nyc-collision-data-deepresearch.md)
— an AI-generated "deep research" report on the `h9gi-nx95` dataset (author/model not stated in
the source). Fact-checked and corrected by Aspen against the live Socrata API/metadata
endpoints, 2026-08-03, before archival — see the editorial note at the top of the archived file
for the full correction list.

## What this document is
A synthesis-style research report that goes past schema documentation into applied analytics
on top of the NYC Motor Vehicle Collisions dataset: a **Danger Index** formula for safe-route
optimization, a **K-Means vs. BIRCH** clustering tradeoff analysis, **Vulnerable Road User
(VRU)/e-bike risk** modeling, the **Vision Zero** policy-analytics pipeline, a table of
structural data-integrity anomalies with proposed ETL mitigations, and closing strategic
recommendations for three audiences (data engineers, spatial scientists, policy makers). It
landed directly as Markdown — no PDF/DOCX conversion step was needed. The schema/API sections
overlap heavily with the fellowship's existing [NYC Motor Vehicle Collisions dataset
note](nyc-motor-vehicle-collisions-dataset.md); this note does **not** re-cover that ground —
see that note for the full 29-column schema, both API endpoints, and the SoQL query mechanics.

## A note on trust: this report shipped with real errors
Before distilling the genuinely new content below, it's worth naming plainly what a fact-check
pass caught, because it's a direct illustration of why AI-generated "research" is treated as
**data to verify, not a citation to trust** (Zero-Trust mandate, Quality Standards):

1. **Stale record count.** The report claimed "over 1.97 million historical records ... to the
   present." Live count via `$select=count(*)` against the SODA API (2026-08-03): **2,269,187
   rows**, date range **2012-07-01 to 2026-06-11** — not open-ended, since the dataset's
   automated updates are currently paused (detail already in the sibling schema note).
2. **Swapped field names.** The schema table mapped `ON`/`CROSS`/`OFF STREET NAME` to
   `on_street_name`/`cross_street_name`/`off_street_name` in the intuitive order. NYC's own
   metadata actually swaps the last two: `off_street_name`'s display label is "CROSS STREET
   NAME" and `cross_street_name`'s is "OFF STREET NAME" — already flagged as a gotcha in the
   sibling note; this report independently reproduced the same landmine.
3. **Inconsistent vehicle-type-code field names presented as uniform.** The report listed
   `vehicle_type_code_1 ... 5` uniformly. The real API uses `vehicle_type_code1`/
   `vehicle_type_code2` (**no underscore**) for slots 1–2, then `vehicle_type_code_3`/`_4`/`_5`
   (**with underscore**) for slots 3–5 — an inconsistency in NYC's own schema, not something the
   report should have smoothed over into a single pattern.
4. **A citation overclaimed a root cause.** The "Aggregate Nullification Anomaly" row (the
   primary `number_of_persons_killed` field going silently unpopulated) cited a URL that turns
   out to be NYC Open Data's **Help Desk Inquiries** dataset (`r67x-e97r`) — a single
   user-submitted ticket (filed 2026-07-02) reporting the symptom, not an official diagnosis. The
   report presented "upstream NYPD database migration or field aggregation pipeline failure" as
   if it were a cited fact. **The symptom itself is real and independently confirmed still live**
   (records after 2026-05-05 omit the `number_of_persons_killed` key entirely while
   `number_of_pedestrians_killed`/`_cyclist_killed`/`_motorist_killed` remain populated) — but the
   *cause* is unconfirmed speculation dressed up as a citation.

**What was *not* independently re-verified**, and should be treated as unverified rather than
confirmed: the Danger Index formulas and the BIRCH clustering-feature (CF) vector math, both
embedded in the source as base64 PNG images and attributed to a real, cited paper ("Safest Route
Detection via Danger Index Calculation and K-Means Clustering"). Everything else spot-checked
clean: the 29-column schema count, the MV-104AN $1,000/injury reporting threshold, the SoQL
`$select`/`$where`/`$group`/`$order`/`$limit`/`$offset` mechanics (including the 1,000-record
default `$limit`) against Socrata's own docs, NYPD-via-NYC-OpenData as maintainer, and the "77%
of NYC cyclist fatalities were e-bikes in 2023" statistic against an NYT-sourced figure of 23/30.

## Danger Index — a composite risk metric for route optimization
Researchers building safe-routing tools on top of collision data combine it with complementary
datasets (e.g. NYPD Arrest Data) to score individual road-network edges with a **Danger Index**,
rather than routing purely on distance:

- For a given path segment, the Danger Index is a **weighted Crime Score + weighted Accident
  Score, normalized by physical path distance in kilometers**.
- The **Crime Score** and **Accident Score** are each the sum of weighted severity
  classifications across every observed incident on that segment — a severity weight per crime
  category for the Crime Score, and a collision severity weight (derived from injuries and
  fatalities in this dataset) for the Accident Score. Moving infractions and traffic collisions
  feed the Accident Score term directly.
- Once every edge in the graph carries a Danger Index, graph-traversal algorithms (Dijkstra's or
  variants) can minimize **cumulative danger** along a route instead of minimizing distance —
  the same shortest-path machinery, with a different edge weight.

**Why this matters beyond the formula:** the reasoning here is that raw collision counts alone
are a blunt instrument for routing — a segment with one fatal collision and a segment with ten
fender-benders shouldn't score the same, and normalizing by distance prevents long, generally
safe corridors from being penalized just for having more cumulative exposure. Combining crime
data with collision data acknowledges that "danger" to a pedestrian or cyclist isn't only
traffic risk.

## Spatial clustering: K-Means vs. BIRCH
Identifying high-risk crash clusters across a city-scale point distribution requires choosing an
algorithm that can handle the data volume, not just the geometry. The report frames this as a
genuine tradeoff rather than a single "best" choice:

| Dimension | K-Means | BIRCH (Balanced Iterative Reducing and Clustering using Hierarchies) |
|---|---|---|
| Computational complexity | O(n·k·i) — scales with iterations | Single-pass CF-tree construction |
| Memory overhead | Requires the full dataset in active memory | Compact — operates on summarized Clustering Feature (CF) tree nodes |
| Cluster geometry | Constrained to spherical/convex clusters | Flexible hierarchical sub-clustering |
| Outlier sensitivity | High — isolated crash points distort centroids | Low — filters noise during tree construction |
| Best fit | Localized, pre-segmented route corridors | Continuous, city-wide crash-point distributions |

**The mechanism behind BIRCH's memory efficiency:** each node in its CF tree is a compact
3-value summary — count of points, linear sum of the points, and squared sum of the points —
which is enough to compute inter-cluster distance without ever re-touching the raw coordinate
pairs. That's *why* it can process massive point sets in a single pass where K-Means needs the
full dataset resident in memory across iterations. The report's implied recommendation (not
independently verified here, since the CF-distance math is in the unverified image set): use
BIRCH for a first-pass, city-wide reduction, then K-Means or Danger Index scoring on the smaller
resulting sub-clusters for route-level precision — a two-stage pipeline rather than picking one
algorithm for the whole problem.

## Vulnerable Road User (VRU) and e-bike risk modeling
The report's headline stat: **e-bike incidents accounted for approximately 77% of all NYC
cyclist fatalities in 2023** (independently checked against an NYT-sourced figure of 23-of-30
cyclist fatalities being e-bike-related — consistent). The framing implication: this is a
structural shift, not noise. Traditional collision-risk models were built around motor-vehicle
speed and weight; a fleet increasingly made of e-bikes, standing e-scooters, and pedestrians
sharing the same infrastructure breaks that assumption, because the risk drivers are different
(exposure and micro-mobility infrastructure gaps, not vehicle mass).

This pushes predictive models toward **heterogeneous features** the traditional models didn't
need: micro-mobility lane presence/absence, ambient light conditions, street layout complexity,
and temporal delivery-demand spikes (i.e. gig-delivery e-bike traffic clustering around meal
times). The report names **spatial-temporal graph neural networks** as the modeling approach
increasingly used to capture these non-linear interactions — flagged here as the paper's stated
direction, not something this pass verified independently.

## Vision Zero policy-analytics pipeline
The report frames the whole point of this analytical stack as feeding **Vision Zero** (NYC's
policy framework aimed at eliminating traffic fatalities and severe injuries) with an explicit
lifecycle:

1. Raw MV-104AN collision reports ingested via the SODA REST API.
2. Automated cleaning and schema normalization.
3. Spatial hotspot identification via H3 hexagonal binning + hierarchical clustering (BIRCH,
   above).
4. Clusters feed Danger Index risk models.
5. Transportation engineers deploy targeted interventions off the model output.
6. Ongoing post-implementation monitoring measures whether the intervention actually worked.

Three concrete intervention categories the analytics pipeline is meant to support:
- **Street redesign validation** — before/after crash-rate comparison around protected bike
  lanes, pedestrian refuge islands, daylighted intersections.
- **Automated enforcement placement** — mapping historical speed- and red-light-related crashes
  to site speed cameras.
- **Signal timing modifications** — analyzing severe turning-collision hotspots to justify
  Leading Pedestrian Intervals (LPIs).

**A named limitation, not glossed over:** police-reported data under-represents minor property
damage and unregistered-micro-mobility incidents, which the report says can bias spatial
sampling toward under-counting in lower-income corridors specifically. Its proposed fix is
combining police data with hospital emergency-department admissions for a fuller injury picture
— i.e. the collision dataset alone is *not* sufficient for equity-aware policy analysis, an
acknowledged gap rather than a solved problem.

## Structural anomalies and ETL mitigations
The report's own anomaly table, reproduced with the root-cause column corrected per the
trust note above (the nullification row's cause is unconfirmed, not "upstream NYPD database
migration"):

| Anomaly | What happens | Root cause | Mitigation |
|---|---|---|---|
| Aggregate Nullification | `number_of_persons_killed` stops populating while pedestrian/cyclist/motorist subtotal fields stay live | **Unconfirmed** — sourced to one Help Desk ticket reporting the symptom, no official diagnosis | Runtime schema validation computing a synthetic fallback total (sum of the subgroup fields) when the primary field is null |
| Date Encoding Discrepancy | Date fields arrive as unparsed text instead of ISO timestamps | Data export misconfiguration during batch job generation | String matching / explicit typecasting during ingestion |
| Coordinate Spatial Dropout | Missing lat/long, returned as NULL or `(0,0)` | Incomplete field reports, GPS failures, legacy manual entry | `$where latitude IS NOT NULL` pre-filter before loading into GIS |
| Text Category Inconsistency | Free-text vehicle classification strings (`Sedan`, `SEDAN`, `4 dr door`) | Free-text manual entry on the physical MV-104AN form | Case normalization + dictionary-based canonical mapping |

The Coordinate Spatial Dropout and Text Category Inconsistency rows overlap directly with
data-quality gotchas already documented in the sibling schema note (the `(0,0)`-as-null
convention and free-text vehicle-type drift) — this table's genuinely new content is the
**Aggregate Nullification** and **Date Encoding Discrepancy** rows, which the sibling note
doesn't cover.

## Strategic recommendations (as stated in the source)
- **Data engineers:** implement schema validation that computes synthetic fallback totals when
  primary aggregate fields go null; enforce spatial pre-filtering (`$where latitude IS NOT
  NULL`) directly in SoQL queries rather than filtering client-side after the full payload
  transfers.
- **Spatial data scientists:** adopt a **multi-stage** clustering architecture — BIRCH first for
  city-wide reduction (lower memory, outlier-tolerant), then distance-normalized Danger Index
  scoring on the resulting sub-clusters for route-level precision. Maintain categorization
  dictionaries to keep pace with emerging micro-mobility vehicle types rather than letting
  free-text drift accumulate.
- **Policy makers:** modernize MV-104AN's *digital* entry interface with standardized
  dropdown/selection menus for e-bikes, cargo bikes, and scooters instead of free text (the
  report frames this as fixing the anomaly at its source rather than cleaning it downstream);
  integrate EMS/hospital admission data to correct under-reporting bias before directing Vision
  Zero infrastructure spend.

## Why it matters to the fellowship
- **Zero-Trust (Quality Standards) — "treat all LLM output as untrusted input."** This document
  is a direct, concrete instance of that rule: a well-formatted, citation-studded AI research
  report still shipped a fabricated causal claim dressed as a citation, plus three factual
  errors a live-source check caught. The lesson generalizes past this one dataset — any
  AI-generated "research" artifact dropped into `raw/` needs the same verify-before-distill
  discipline this task applied.
- **Bounded AI (Quality Standards) — "compute deterministically, summarize generatively."**
  The corrected Aggregate Nullification row is the same failure pattern the mandate exists to
  prevent: an LLM asserting a system-state fact (root cause) it has no deterministic basis for,
  instead of stating the confirmed symptom and marking the cause unconfirmed.
- **Rule 5 (Deterministic Rehearsal)** — the fact-check that produced this note's corrections
  *was* a deterministic rehearsal: live API/metadata queries run before trusting the report's
  claims, not after.
- **Cycle 3 tie-in** — this is directly relevant technique for Rayan's active NYC Open Data
  Cycle 3 assignment (working dataset: this same `h9gi-nx95`, per project memory): the Danger
  Index and BIRCH-then-cluster pipeline are concrete patterns to borrow if the build leans
  toward spatial risk scoring, while the anomaly table is a direct pre-flight checklist for
  whatever ingestion code gets written against this dataset.
- **Willow (Tutor Assistant)** — the "verify before distilling" pattern here is also directly
  relevant to Willow's AI Tutor pattern-learning: an AI-generated answer that reads confidently
  and cites sources is not the same as a *verified* answer.

**Cross-links:** [NYC Motor Vehicle Collisions dataset notes](nyc-motor-vehicle-collisions-dataset.md)
(schema, API endpoints, SoQL mechanics — this note's sibling) · [Data Analytics &
Cleaning wiki](../../wiki/DataAnalytics.md) · [Machine Learning wiki](../../wiki/MachineLearning.md)
(K-Means/BIRCH clustering context) · [Week 4 Kickoff: Open Source Data
Guide](../week-4/week-4-kickoff-open-source-data.md).

---
Source at its archived path: [nyc-collision-data-deepresearch.md](../../raw/archived-docs/2026-08-03/nyc-collision-data-deepresearch.md)
