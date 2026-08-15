# Product Requirement Document (PRD): MVCC Data — NYC Traffic Reporting-Integrity Dashboard

**Document Version:** 1.2 (revised draft — supersedes v1.1)

**Status:** Draft — pending human review before Cedar (Tech Lead) [SPEC] conversion

**Assignment:** Pursuit L1 Cycle 3 — NYC Open Data (solo MVP), due week of 2026-08-03

**Working name:** MVCC Data (Motor Vehicle Collisions — Crashes)

**Tagline:** _NYC's crash data shows a 63% drop in collisions and no drop in deaths. The crashes didn't stop — a 2020 policy stopped counting them. This dashboard shows the break, and the number you should use instead._

> **Scope note on tier.** `prd-builder` is written for L2/L3 builds. This is an L1 solo MVP, so
> this PRD is deliberately lighter than the L2 template implies — but all seven sections are
> present per the skill's "no section is optional" rule. Sections that genuinely do not apply are
> marked N/A with a reason rather than padded.

> **Data provenance.** Every figure in this PRD was verified against the live Socrata APIs on
> **2026-08-03** by direct query, not carried over from secondary sources. The underlying
> research report was itself fact-checked and corrected first (four confirmed errors) — see
> [`notebook/week-5/nyc-collision-analytics-deep-research.md`](notebook/week-5/nyc-collision-analytics-deep-research.md)
> and the schema reference at
> [`notebook/week-5/nyc-motor-vehicle-collisions-dataset.md`](notebook/week-5/nyc-motor-vehicle-collisions-dataset.md).

> **v1.1 revision notes.** This revision resolves a self-review pass plus an instructor-scope
> clarification: (1) FR-11's absent-key-as-zero rule contradicted §7's fail-loud mitigation for
> the confirmed `number_of_persons_killed` dropout — core yearly aggregates now error on
> absent/null values instead of coercing to zero; (2) the assignment's dataset scoping is now
> recorded in §5.2 (single primary dataset; additional datasets permitted where required — the
> arrest pairing is allowed, and the enforcement series is additionally marked severable);
> (3) the borough letter-code mapping (`K`=Brooklyn, not `B`) is pinned in FR-6 with empirical
> evidence; (4) Manhattan CBD congestion pricing (Jan 2025) is added as a named confounder
> (FR-9, Appendix A); (5) the preliminary-data risk now carries an endpoint-fragility mitigation
> (two-year-average fallback); (6) every FR carries its derived story priority ([P0]/[P1]),
> making FR-5–7 explicitly severable P1 scope; plus minor testability fixes (FR-3/NFR-5 concrete
> mechanism, throttle profile in NFR-1/§4, §4 metric-to-§1 linkage).

> **v1.2 revision notes.** A second research document (`raw/nyc-crash-data-reporting-analysis.md`)
> was fact-checked on 2026-08-03 and **confirmed the reporting-drift mechanism as documented NYPD
> policy**, not inference. This revision folds in the confirmed findings: (1) §1 now names the
> cause — the NYPD non-response policy for property-damage-only collisions (Staten Island pilot
> 2019-03-18, citywide 2020-04-06) — replacing v1.1's hedged "likelier explanation"; (2) the
> top §7 risk (thesis contested) drops from Med/High to **Low/Med**, because the mechanism is now
> a dated public policy with a verified natural experiment behind it; (3) **FR-12 [P0]** adds a
> casualty-filtered "repaired" series — the verified remediation, which turns the product from
> diagnosis-only into diagnosis-plus-fix; (4) **FR-13 [P1]** adds structural-break markers at the
> two policy dates; (5) a new **P2** story covers the Staten Island pilot panel — the one
> COVID-uncontaminated window; (6) FR-9's caveat list gains the policy dates; (7) Appendix A
> gains the verified Staten Island and casualty-filter series. **No numeric figure was imported
> from that second document** — its injury figures were found to be back-derived from a rounded
> percentage rather than queried, so every number below remains this PRD's own live-query
> verification.

---

## 1. Problem Statement

New York City publishes its motor-vehicle collision record openly, and journalists, advocacy
groups, students, and agency staff routinely cite it to argue that streets are getting safer or
more dangerous. Read at face value, the record says collisions fell 63% between 2018 and 2025
(231,564 → 85,546). Over that same period, traffic deaths did not fall at all (231 → 229), and
injuries fell only 20%. For the collision decline to be genuine, the average recorded crash would
have to have become roughly 2.7 times more lethal in seven years — implausible on its face. The
actual cause is a documented change in police procedure: the NYPD stopped dispatching officers to
property-damage-only collisions, piloting the change in Staten Island on **2019-03-18** and making
it permanent citywide on **2020-04-06**. Drivers in minor crashes now exchange information
themselves and self-file an MV-104 with the state DMV, and those filings never enter the NYPD
database the published dataset is built from. Minor collisions did not stop happening; they
stopped being counted. The dataset therefore transitions mid-series from a register of _all
police-attended collisions_ into a register of _casualty collisions_, and anyone charting raw
counts across that boundary produces a confidently wrong headline. Nothing on the portal warns
them: the dataset carries no changelog, banner, or metadata flag for the policy change, so the
break is visible only to someone who already knows to cross-check a discretionary metric against
a non-discretionary one.

---

## 2. Target Users

| User                        | Role                                                          | Technical level | Key pain point                                                                                           |
| --------------------------- | ------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| Civic journalist            | Writes local transportation/safety stories on deadline        | Low–Mid         | Needs a defensible citywide number fast; a raw crash-count chart hands them a wrong lede with no warning |
| Street-safety advocate      | Argues for/against infrastructure and enforcement policy      | Mid             | Opponents cite the same dataset to the opposite conclusion; needs to know which metrics survive scrutiny |
| Open-data student / analyst | Learning to query civic data responsibly (Rayan's own cohort) | Mid–High        | Naive `GROUP BY year` on a large public dataset silently produces an artifact, not a finding             |
| Agency / policy analyst     | Evaluates Vision Zero program outcomes                        | Mid             | Needs to separate genuine safety change from measurement change before attributing either to policy      |

**All four rows are assumed personas — no user interviews were conducted.** They are inferred from
the documented audience of NYC Open Data and from the assignment brief's stated goal ("learning to
filter and query it responsibly"). **Validate before treating any as established.**

---

## 3. User Stories

### Civic journalist

- **P0** — As a journalist, I want to see traffic deaths and injuries charted over time, so that I can cite a metric that isn't distorted by reporting drift.
- **P0** — As a journalist, I want a plain-language explanation of why raw collision counts are unreliable, so that I don't publish a wrong figure.
- **P0** — As a journalist, I want to see the corrected trend alongside the broken one, so that I have a number I can actually print rather than only a warning about the one I can't.
- **P1** — As a journalist, I want to copy a single sourced sentence with its numbers, so that I can quote the finding accurately without re-deriving it.

### Street-safety advocate

- **P0** — As an advocate, I want to compare a discretionary metric against a non-discretionary one side by side, so that I can show the divergence rather than assert it.
- **P1** — As an advocate, I want to narrow the view to one borough, so that I can speak to my own community board's area.
- **P1** — As an advocate, I want to see which specific locations have the highest recorded collision counts, so that I can point to concrete intersections rather than only citywide or borough-level aggregates.
- **P2** — As an advocate, I want to export the chart as an image, so that I can use it in a presentation.

### Open-data student / analyst

- **P0** — As an analyst, I want to see the exact query behind each number, so that I can verify the finding myself instead of trusting the dashboard.
- **P1** — As an analyst, I want the known data-quality traps documented in one place, so that I don't rediscover them the hard way.
- **P2** — As an analyst, I want to switch the enforcement series on and off, so that I can judge the correlation without it being forced on me.
- **P2** — As an analyst, I want to see the Staten Island pilot window on its own, so that I can evaluate the reporting-change effect in the one period not confounded by the pandemic.

### Policy analyst

- **P1** — As a policy analyst, I want traffic-enforcement activity plotted against traffic deaths, so that I can see whether two independent measures of agency activity moved together.
- **P2** — As a policy analyst, I want per-capita or per-vehicle-mile normalization, so that I can compare boroughs of different sizes fairly.

---

## 4. Success Metrics

### Quantitative

| Metric                                                                                         | Target                                            | Pain point addressed                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Time for a first-time visitor to state the core finding correctly                              | < 60 seconds from page load                       | Journalist on deadline publishes a wrong lede (§1)                                      |
| Share of user-test participants who correctly answer "did NYC roads get safer?" after using it | ≥ 4 of 5                                          | The face-value reading is wrong and nothing warns you (§1)                              |
| Verifiable numbers on the page — every displayed figure traceable to a shown query             | 100%                                              | Nothing on the portal warns or equips the reader — verification must be self-serve (§1) |
| Initial page load (chart interactive)                                                          | < 2.5s under Chrome DevTools "Slow 4G" throttling | Deadline pressure; abandonment                                                          |

### Qualitative

- A user who arrives believing "crashes are down 63%, so streets got safer" leaves able to explain, unprompted, why that inference fails.
- A skeptical user can reach the same conclusion independently using the displayed queries, without trusting the dashboard's framing.
- The caveats read as the _substance_ of the product, not as a disclaimer users skip.

---

## 5. Technical Requirements

### 5.1 Stack

**Deliberate deviation from fellowship defaults, justified per Rule 8 (`Simplicity > Pattern purity`)
and Rule 2 ("match ceremony to the task").** The default stack assumes an application with user
data. This product reads two public, read-only APIs, stores nothing, and has no users to
authenticate. Inheriting FastAPI + Supabase + Supabase Auth would add three services with zero
requirements to justify them.

| Layer           | Technology                                    | Notes                                                                    |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| Frontend        | React + TypeScript (Next.js, App Router)      | Fellowship default, retained                                             |
| Charts          | Recharts                                      | Declarative, React-native, small; no D3 hand-rolling for two line series |
| Data access     | Next.js Route Handlers (server-side)          | **Not** a separate backend — see §5.5 for why this isn't a static fetch  |
| Backend service | **None**                                      | N/A — no business logic beyond aggregation, which SoQL does server-side  |
| Database        | **None**                                      | N/A — the product writes nothing; source of truth is the Socrata API     |
| Auth            | **None**                                      | N/A — no accounts, no user data, no per-user state                       |
| Deployment      | Vercel                                        | Fellowship default; ISR/caching support matters here (§5.5)              |
| Lint            | ESLint + Prettier, `eslint-plugin-jsx-a11y`   | Per Quality Standards                                                    |
| Test            | Vitest + `@testing-library/react`, `axe-core` | Per Rule 4 (behavioral tests)                                            |

### 5.2 Data sources

| Dataset                            | ID          | Verified size  | Range                   | Cadence                      |
| ---------------------------------- | ----------- | -------------- | ----------------------- | ---------------------------- |
| Motor Vehicle Collisions – Crashes | `h9gi-nx95` | 2,269,187 rows | 2012-07-01 → 2026-06-11 | Daily — **currently paused** |
| NYPD Arrests Data (Historic)       | `8h9b-rp9u` | 6,264,978 rows | 2006-01-01 → 2025-12-31 | Quarterly                    |

**Assignment scope (instructor guidance, relayed 2026-08-03):** the Cycle 3 assignment is scoped
to a single primary dataset, with additional datasets permitted where required. Primary:
`h9gi-nx95` (one of the six approved options). Supplementary: `8h9b-rp9u`, used solely for the
P1 enforcement series (FR-5/FR-6) as the second independent witness to NYPD administrative
output — the honest reading of "where required" is that this series _strengthens_ the thesis
rather than being strictly necessary to it, so it is deliberately **severable**: every P0
requirement is single-dataset, and dropping FR-5–7 shrinks the product without breaking it.

**Analysis window is fixed at 2018–2025.** This is a deliberate constraint with three payoffs: it
sits entirely inside both datasets, it avoids the collisions dataset's paused-update boundary and
its known post-2026-05-05 `number_of_persons_killed` dropout, and it means the year-to-date arrest
dataset (`uip8-fykc`) is **not needed** — no union across two arrest tables.

**Traffic-offense filter** (verified present in `ofns_desc`; counts are all-time):

| Offense category                                                               | Rows    |
| ------------------------------------------------------------------------------ | ------- |
| `VEHICLE AND TRAFFIC LAWS`                                                     | 258,876 |
| `OTHER TRAFFIC INFRACTION`                                                     | 185,841 |
| `INTOXICATED & IMPAIRED DRIVING`                                               | 114,597 |
| `INTOXICATED/IMPAIRED DRIVING` (duplicate spelling — **both must be matched**) | 13,256  |
| `HOMICIDE-NEGLIGENT-VEHICLE`                                                   | 152     |

Vehicle-_theft_ categories (`GRAND LARCENY OF MOTOR VEHICLE`, `UNAUTHORIZED USE OF A VEHICLE`) are
deliberately excluded — they are property crimes, not road-safety enforcement.

### 5.3 Functional requirements

Each requirement is tagged with the §3 story priority it derives from. **[P0]** requirements are
MVP blockers. Of the **[P1]** requirements, FR-5–7 (the enforcement series and borough filter) are
the arrest-dataset-dependent group and are severable together per §5.2; FR-13 is P1 but _not_ part
of that group — it depends only on the primary dataset.

1. **[P0]** The system shall display total traffic deaths per year for 2018–2025, sourced from `sum(number_of_persons_killed)` grouped by `date_extract_y(crash_date)`.
2. **[P0]** The system shall display total persons injured per year over the same window and grouping.
3. **[P0]** The system shall display recorded collision counts per year over the same window, visually distinguished as the reporting-affected series by a dashed stroke **and** an explicit inline label (e.g., "affected by reporting decline — see caveats"), never by color alone (§5.4 NFR-3, NFR-5).
4. **[P0]** The system shall compute and display the percentage change from 2018 to 2025 for each of the three metrics independently.
5. **[P1]** The system shall display traffic-enforcement arrest counts per year, filtered to the §5.2 offence list, as a second series on a secondary axis.
6. **[P1]** The system shall filter all series to a single borough using the pinned code mapping `B`→BRONX, `K`→BROOKLYN, `M`→MANHATTAN, `Q`→QUEENS, `S`→STATEN ISLAND. (The naive `B`→Brooklyn misreading is the known trap — `K` is Kings County. Mapping confirmed empirically: sample arrest row with `arrest_boro: K`, precinct 71, at 40.661, −73.932 — Crown Heights, Brooklyn.)
7. **[P1]** The system shall display a persistent warning whenever a borough filter is active, stating that the collisions `borough` field is unpopulated in ~30% of rows and that its coverage rate drifts across years (64.4% in 2018 → 80.1% in 2025).
8. **[P0]** The system shall display, for each chart, the exact SoQL query used to produce it.
9. **[P0]** The system shall display a caveats section covering: the reporting-drift finding **with its two documented policy dates (Staten Island pilot 2019-03-18; citywide 2020-04-06)**, the borough-coverage drift, the COVID/vehicle-speed confounder, the January 2025 launch of Manhattan CBD congestion pricing (which bears on any Manhattan claim with a 2025 endpoint), and the **geographically non-random placement of NYC DOT Street Improvement Projects** (which bears on any borough-level claim: DOT's January 2025 equity report documents that SIP mileage since 2014 was deliberately concentrated in the lowest-income and highest-Asian/Black/Hispanic neighborhoods, several of them in the Bronx, so a borough's deaths trend has a documented intervention as an alternative explanation).
10. **[P0]** The system shall render a defined empty/error state when a Socrata request fails or returns zero rows, rather than an empty chart or a crash.
11. **[P0]** The system shall treat all numeric fields from the API as strings requiring explicit casting. Absent-key-as-zero coercion applies **only** to optional row-level fields; for the core yearly aggregates (deaths, injuries, collisions, arrests), an absent or null value for any year in the window shall trigger the FR-10 error state — never a silent zero. A validation shall assert that every year 2018–2025 returns a present, non-null, parseable value for each core metric (this is the guard for the confirmed post-2026-05-05 `number_of_persons_killed` dropout pattern).
12. **[P0]** The system shall display a casualty-filtered "repaired" collision series — collisions where `number_of_persons_injured > 0 OR number_of_persons_killed > 0` — alongside the raw series, so the corrected trend (−18.2%) and the artifact trend (−63.1%) are visible together. This is a single additional SoQL query with a `$where` clause, not a new subsystem; it is P0 because without it the product diagnoses a problem and offers no usable number in its place.
13. **[P1]** The system shall mark the two documented policy dates on the time axis — 2019-03-18 (Staten Island pilot) and 2020-04-06 (citywide) — as labelled reference markers, so the structural break is located visually rather than only described in prose.
14. **[P1]** The system shall display a supplementary map of the highest-collision-count locations in the 2018–2025 window, computed as `COUNT(*)` from `h9gi-nx95` grouped by latitude/longitude rounded to 5 decimal places (~1m precision), ranked descending, limited to the top 1000 points, with a screen-reader-accessible tabular fallback per NFR-3. This is a raw collision-count map, not a severity-weighted risk score — page copy shall state that distinction explicitly, so the "Danger Index" name is not read as an algorithmic safety index (§6).

### 5.4 Non-functional requirements

- **NFR-1 Performance**: chart interactive < 2.5s under Chrome DevTools "Slow 4G" throttling. Aggregates for a fixed historical window are immutable — responses shall be cached (ISR/`revalidate`), not re-fetched per visitor.
- **NFR-2 Security (Zero-Trust)**: the Socrata App Token shall be read from an environment variable and used **only** in server-side Route Handlers. It shall never appear in client bundles, committed files, or screenshots. `.env*` shall be gitignored.
- **NFR-3 Accessibility (WCAG 2.2 AA)**: chart data shall also be available as a screen-reader-accessible table — a two-line chart is not perceivable to non-sighted users on its own. Series shall be distinguishable without relying on color alone. All controls keyboard-navigable; AA contrast met; `prefers-reduced-motion` respected.
- **NFR-4 Determinism (Bounded AI)**: every displayed figure shall be computed by SoQL aggregation or a pure client-side function. No figure on the page may be produced by a language model. This is a hard constraint — the product's entire claim is arithmetic integrity.
- **NFR-5 Honesty of presentation**: the collision-count series shall carry FR-3's dashed-stroke-plus-label treatment in every rendering, and page copy shall use correlation language only — no assertion that enforcement _caused_ any change in deaths. (The styling clause is mechanically testable via FR-3; the copy constraint is a Cypress review item.)
- **NFR-6 Browser support**: last 2 versions of Chrome, Firefox, Safari.

### 5.5 Integrations / APIs

| Service                    | Data read                                                                      | Writes | Auth                         |
| -------------------------- | ------------------------------------------------------------------------------ | ------ | ---------------------------- |
| Socrata SODA — `h9gi-nx95` | Yearly aggregates of crash counts, injuries, deaths; optional borough grouping | None   | App Token (server-side only) |
| Socrata SODA — `8h9b-rp9u` | Yearly aggregates of traffic-offense arrests; optional borough grouping        | None   | App Token (server-side only) |

**Why server-side rather than a static client fetch:** the assignment brief explicitly instructs
that the App Token be treated like a password and never committed or shared. A browser-side fetch
would ship it in the client bundle to every visitor. Next.js Route Handlers keep it server-side at
no infrastructure cost, and give the caching in NFR-1 for free.

### 5.6 Security-isolation gate (Rule 9)

Assessed at PRD time: the build (a) executes no untrusted third-party code, (b) holds one
low-sensitivity credential (a rate-limit attribution token, not an authorization secret), and
(c) processes no PII — both datasets are public aggregates, and the arrest dataset's demographic
fields (`perp_race`, `perp_sex`, `age_group`) are **excluded from ingestion entirely** (§6).
**Mechanism: none required** beyond NFR-2's env-var handling. To be recorded in the assignment's
`AGENTS.md` at kickoff.

---

## 6. Out of Scope (v1)

- **Maps and geospatial clustering** (H3 binning, K-Means/BIRCH, heatmaps) — deferred to v2. The thesis is a time-series integrity argument; a map adds significant frontend and clustering work without strengthening it.
- **The Danger Index / safe-routing algorithm** — deferred indefinitely. It requires a street-network graph and a defensible severity-weighting scheme; it is a separate product, not a feature of this one.
- **Arrest demographic fields** (`perp_race`, `perp_sex`, `age_group`) — **permanently excluded, not deferred.** Arrest density reflects patrol and enforcement patterns, not ground-truth offending; surfacing demographics against a "safety" metric risks presenting policing bias as neutral fact. Nothing in the thesis needs them.
- **Causal claims about enforcement** — permanently out. The 2020–21 fatality rise is confounded by nationwide pandemic speed increases. The product shows co-movement and names the confounder; it does not assert cause.
- **Matched-location traffic-volume normalization** (`7ym2-wayt`) — deferred to v2. It would strengthen the argument by showing traffic recovered while recorded crashes kept falling, but the dataset is a location-varying sample (98,961 readings in 2018 vs. 40,224 in 2020), so a valid comparison requires same-location matching — real work, and not a v1 blocker.
- **Live/current-year data** — out. The analysis window is fixed at 2018–2025 (§5.2); the collisions feed is paused and its fatality field has a known 2026 dropout.
- **User accounts, saved views, alerts** — out. No user state exists in this product.

---

## 7. Risks and Assumptions

| Risk / Assumption                                                                                                                                                                                    | Likelihood                | Impact             | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The reporting-decline interpretation is contested — a real decline in minor crashes (safer vehicles, less driving) could explain part of the 63% drop                                                | **Low** (was Med in v1.1) | **Med** (was High) | **Substantially retired in v1.2.** The mechanism is now a dated, documented NYPD policy, not an inference (§1), and the Staten Island pilot provides a pre-COVID natural experiment (Appendix A) that a "real decline" hypothesis cannot explain. Residual risk is one of _magnitude_, not direction — some share of the drop may still be genuine. Continue presenting the gradient as evidence rather than proof, and keep the alternative explanation in the caveats |
| Socrata API is rate-limited, slow, or down at demo time                                                                                                                                              | Med                       | High               | Server-side caching (NFR-1) means the demo does not depend on a live call; commit a dated JSON snapshot of the eight-year aggregate as a documented fallback fixture                                                                                                                                                                                                                                                                                                    |
| The collisions dataset resumes updating mid-build and revises historical figures (data is flagged preliminary, and ingestion paused ~5.5 months after 2025 ended, so late amendments may be pending) | Med                       | Med                | Headline deltas are single-year endpoints and therefore fragile — 2025 deaths (229) is a local minimum; re-verify aggregates once before submission, date-stamp every figure, and if 2025 moves materially, switch headline deltas to 2018–19 vs 2024–25 two-year averages. The argument's direction survives any plausible revision                                                                                                                                    |
| `number_of_persons_killed` dropout (confirmed absent after 2026-05-05) extends backwards into the analysis window on a future revision                                                               | Low                       | High               | Add a build-time assertion that each year 2018–2025 returns a non-null fatality sum; fail loudly rather than silently charting zeros                                                                                                                                                                                                                                                                                                                                    |
| Assumed personas (§2) are wrong — no user research was done                                                                                                                                          | High                      | Med                | Treat §2 as hypothesis; run the §4 comprehension test on ≥5 real people before Demo Day and revise                                                                                                                                                                                                                                                                                                                                                                      |
| A two-line dual-axis chart invites the "enforcement caused deaths" misreading the product explicitly disclaims                                                                                       | Med                       | Med                | NFR-5; consider defaulting the enforcement series to _off_ (P2 story) so the integrity finding lands before the correlation does                                                                                                                                                                                                                                                                                                                                        |
| Scope creep back toward a map — it is the more visually impressive build                                                                                                                             | Med                       | Med                | §6 names it out of scope; the walking skeleton (§5) ships a working chart before any optional work begins                                                                                                                                                                                                                                                                                                                                                               |

---

## Quality Gates

- [x] Every user story has a priority label (P0/P1/P2)
- [x] Every success metric connects to a Section 1 pain point
- [x] Every functional requirement is testable
- [x] Out-of-scope list contains at least 3 items — 7 listed
- [x] Risks table has at least 2 rows — 7 listed
- [x] No solution-speak in Section 1; the word "AI" does not appear in the Problem Statement

---

## Handoff

> Cedar (Tech Lead): convert this PRD into [SPEC] + [FORCES] tasks. P0 stories are MVP blockers —
> those tasks come first. P1 stories are v1 stretch goals. P2 stories are out of scope for the
> initial build. Per Rule 6, the first task must be the walking skeleton: **one chart, one metric
> (deaths per year), rendering from a live server-side SoQL call.** Everything else grows from
> that slice. Per Rule 5, no task may touch more than 5 files. FR priorities are explicit in
> §5.3 (FR-1–4, 8–12 = P0; FR-5–7 and FR-13 = P1; FR-5–7 severable as a group).
>
> _Kickoff-clause update, 2026-08-05: the three instructions that originally followed this sentence
> are superseded and intentionally removed — this repo already **is** the assignment's own
> subdirectory (scaffolding a nested one would silently no-op `stop-quality-gate.sh`, which probes
> `.`, `app`, `web`, `frontend` for the app root); `AGENTS.md` was folded into `CLAUDE.md` by
> recorded decision, since Claude Code does not auto-load `AGENTS.md`; and the §5.6
> security-isolation assessment already lives in `CLAUDE.md` § Recorded decisions. Left here as a
> dated note rather than silently deleted, so a future reader who remembers the original text can
> see it was retired on purpose, not lost._

---

## Appendix A — Verified figures (queried live 2026-08-03)

Citywide, from `h9gi-nx95`:

| Year | Collisions recorded | Injuries | Deaths |
| ---- | ------------------- | -------- | ------ |
| 2018 | 231,564             | 61,940   | 231    |
| 2019 | 211,486             | 61,391   | 244    |
| 2020 | 112,918             | 44,615   | 269    |
| 2021 | 110,558             | 51,785   | 297    |
| 2022 | 103,887             | 51,933   | 290    |
| 2023 | 96,607              | 54,252   | 280    |
| 2024 | 91,316              | 54,030   | 268    |
| 2025 | 85,546              | 49,634   | 229    |

**The gradient (2018 → 2025), ordered by how discretionary the metric is to record:**

| Metric              | Change   | Officer discretion                       |
| ------------------- | -------- | ---------------------------------------- |
| Collisions recorded | **−63%** | Full — officer decides whether to file   |
| Injuries            | **−20%** | Partial — ambulance/hospital involvement |
| Deaths              | **−1%**  | None — medical examiner, mandatory       |

Deaths per recorded collision rose from ~1.0 per 1,000 to ~2.7 per 1,000 — a **2.68× implied
increase in lethality** that the reporting-decline hypothesis explains and a genuine-safety-gain
hypothesis does not.

Traffic-enforcement arrests, citywide, from `8h9b-rp9u`: 29,007 (2018) → 8,330 (2020 trough) →
21,123 (2025). Manhattan is the outlier borough: enforcement −62% (6,775 → 2,548) against
−10% to −26% elsewhere, while Manhattan injuries rose +19% (borough codes per FR-6: B=Bronx,
K=Brooklyn, M=Manhattan, Q=Queens, S=Staten Island).

### The documented cause (verified 2026-08-03)

NYPD ceased dispatching officers to property-damage-only collisions: **Staten Island pilot
2019-03-18**, **permanent citywide 2020-04-06**. Drivers self-file MV-104 with the state DMV above
a $1,000 damage threshold; those filings never enter the NYPD database behind `h9gi-nx95`.
Corroborated by [Streetsblog's 2020-04-03 coverage](https://nyc.streetsblog.org/2020/04/03/nypd-gives-a-few-details-of-new-no-report-crash-policy)
(the NYPD's own page on the policy blocks automated fetches and could not be verified directly).

**Staten Island monthly collisions — the pre-COVID natural experiment.** The citywide rollout is
perfectly confounded with pandemic lockdown; the pilot fired **ten months earlier**, so it isolates
the reporting effect cleanly:

| Period                           | Monthly collisions |
| -------------------------------- | ------------------ |
| 2018 average                     | ~514               |
| Jan 2019                         | 464                |
| Feb 2019                         | 429                |
| **Mar 2019** (pilot begins 3/18) | **370**            |
| **Apr 2019** (first full month)  | **217**            |
| May–Dec 2019 average             | ~271               |

Annual totals: 6,171 (2018) → 3,650 (2019). **Robustness check:** citywide `borough`-field
coverage was flat across this boundary (64.4% → 64.8%), so a ~47% drop cannot be a coverage
artifact.

**Casualty-filtered series — the verified repair (FR-12).** Applying
`number_of_persons_injured > 0 OR number_of_persons_killed > 0`:

| 2018   | 2019   | 2020   | 2021   | 2022   | 2023   | 2024   | 2025   |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| 45,774 | 45,439 | 33,362 | 38,809 | 39,336 | 40,472 | 40,229 | 37,420 |

**−18.2%** across the window — tracking injuries (−19.9%), not raw collisions (−63.1%), with a
genuine COVID dip in 2020 that then recovers. The residual property-damage-only tier fell
185,790 → 48,126 (**−74.1%**), which is where the entire artifact lives.

**Named confounder for the Manhattan claim:** Manhattan CBD congestion pricing launched January
2025 and reduced CBD traffic. Its direction makes the +19% injury figure _conservative_ (absent
pricing it would likely be higher), but any Manhattan claim with a 2025 endpoint must cite it.
The enforcement collapse is not a pricing artifact — Manhattan enforcement had already fallen to
1,993 by 2023 and was _rising_ (1,993 → 2,475 → 2,548) through the pricing launch.
