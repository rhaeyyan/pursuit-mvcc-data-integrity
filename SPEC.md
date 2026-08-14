# [SPEC] Navigation reachability, borough-control removal, and danger-index correctness

**Approved by Rayan, 2026-08-14.** Origin: the map shipped last session was unreachable, and the
borough dropdown on The chart had exactly one outcome — a refusal — for all five options.

Seven tasks, three waves. Wave 1 runs in parallel worktrees (zero file overlap). Wave 2's T4 must
merge after T3. Wave 3 is gated on T5.

| Wave | Tasks | Notes |
| --- | --- | --- |
| 1 | T1 (route-group move) · T3 (delete `BoroughPicker`) · T5 (fix the SoQL) | parallel worktrees |
| 2 | T2a (nav entries + delete `GlobalNav`) · T2b (FR-7 warning on `/tdi`) · T4 (`/integrity` statement) | T2a+T2b merge as one unit; T4 after T3 |
| 3 | T6 (danger-index contract + copy + CSS Modules + the gated nav entry) | requires T1, T2a, T5 |

**T6 adds the `/danger-index` nav entry. T5 must land first.** That gating is the whole point:
the map is currently unreachable, which is protecting users from a ranking that is wrong.

## Human decisions on record (do not re-litigate)

1. Fix the danger-index data defects before linking the map.
2. Remove the borough dropdown; state the reason once on `/integrity`.
3. Move all four orphan pages into `(workspace)` and expose them in `LeftNav`.
4. Link `/tdi` now **with** FR-7's coverage warning attached, rather than gating it on a filter fix.

## Verification performed before approval (2026-08-14)

- **Live Socrata probe confirms `floor()` works** in `$select` and `$group` on `h9gi-nx95`.
- **Cedar's original T5 query was broken** — `avg(latitude) AS latitude` shadows the source column,
  so `$where ... latitude != 0` resolved to the aggregate and Socrata returned
  `query.soql.aggregate-in-ungrouped-context`. Corrected below to `lat_c`/`lon_c` aliases with the
  rename done in Zod, which keeps `DangerMap.tsx` out of scope as intended.
- **Both defects confirmed real, and the ranking changes.** Windowed + grid-merged top three:
  `406960/-739846` = **589**, `406757/-738969` = **478**, `406087/-740381` = **476**. Today's #1
  (476) drops to third. The ledger's "1,299" was the *unwindowed* sum of the split pair — the two
  defects were compounding, so neither figure in the ledger survives the fix.
- Baseline at approval: vitest **601/601 in 39 files**, `tsc --noEmit` clean, `eslint .` clean,
  Node v22.23.2.

---

```markdown
[SPEC] — T1  (wave 1)
- **Objective**: Move `src/app/local/`, `src/app/tdi/`, `src/app/auditor/`, and
  `src/app/danger-index/` into the `(workspace)` route group so all four inherit `LeftNav` +
  `RightInspector` + `workspace.module.css`, and rewrite the relative imports the extra directory
  level breaks. No behavioural change, no copy change, no styling change.
- **Requirement**: No FR — information-architecture enabling work. Unblocks NFR-3 for T2a/T6; the
  four routes currently render with no nav and no way back.
- **Inputs/Outputs**: Nothing changes at runtime. URLs are byte-identical — a route group
  contributes no URL segment. `export const dynamic = "force-dynamic"` (local, tdi) and
  `auditor`'s `searchParams` read stay exactly as written.
- **Design Pattern**: none — simple case. A directory move.
- **UI Scope**: structural — the DOM gains the workspace shell around each of the four pages. No
  file's own JSX changes.
- **Intellectual Control**: Cap-exempt per CLAUDE.md Rule 5 (atomic, tree-wide mechanical
  refactor), which also triggers Rule 5's Deterministic Rehearsal. Splitting into four
  route-sized tasks is worse: each intermediate state leaves the tree half-migrated and
  re-answers the same routing question.
  The routing risk is already disproven in this tree — `(workspace)/integrity` and
  `(workspace)/registry` are static siblings of the optional catch-all `(workspace)/[[...borough]]`
  today and resolve correctly, because Next matches a static segment before a catch-all.
  `dynamicParams = false` cannot 404 `/local`, since `/local` never reaches the catch-all. The
  error Next actually raises for optional catch-alls is a `page.tsx` at the same level;
  `src/app/(workspace)/page.tsx` does not exist and this task must not create one.
- **Constraints**:
  1. **Deterministic Rehearsal before any move.** Print the exact source→destination pair for all
     11 files and the exact list of import lines to rewrite; confirm the set matches the Files
     list below before executing.
  2. Use `git mv` so history follows the files.
  3. Rewrite the broken relative imports to the `@/` alias — not to `../../../`. The alias is
     resolved by both `tsconfig` and `vitest.config.mts`.
  4. Do not change any JSX, copy, className, CSS, `export const dynamic`, or `revalidate`. Do not
     add `revalidate` to `danger-index` — caching semantics for this Next version need the docs
     read first (CLAUDE.md); nobody guesses it here.
  5. Do not add or remove a `LeftNav` entry. That is T2a and T6.
- **Edge Cases**:
  1. `danger-index/page.tsx` and `error.tsx` already import via `@/` — verify, do not rewrite.
  2. `local/page.test.tsx` imports `LocalPage from "./page"` — unaffected; only `../../` breaks.
  3. Check `auditor/page.test.tsx` and `tdi/page.test.tsx` for the same `../../` imports.
  4. `/local?zip=abc` throws from `fetchLocalRawSeries` today (no `error.tsx` on that route) and
     will still throw after the move — pre-existing, out of scope, record it in the report.
- **Files** (11 — cap-exempt, Rule 5):
  `src/app/local/{page.tsx,page.module.css,page.test.tsx}` → `src/app/(workspace)/local/…`
  `src/app/tdi/{page.tsx,page.module.css,page.test.tsx}` → `src/app/(workspace)/tdi/…`
  `src/app/auditor/{page.tsx,page.module.css,page.test.tsx}` → `src/app/(workspace)/auditor/…`
  `src/app/danger-index/{page.tsx,error.tsx}` → `src/app/(workspace)/danger-index/…`
- **Acceptance**: `npx next build` succeeds; its route table still lists six static (`●`) borough
  paths (`/`, `/B`, `/K`, `/M`, `/Q`, `/S`) and shows `/local`, `/tdi`, `/auditor` as dynamic
  (`ƒ`). `vitest run` at or above 601, `tsc --noEmit` clean, `eslint .` clean.
- **Tipping Point**: If a fifth route needs the shell, or any route needs the shell *without*
  `RightInspector`, stop moving directories and extract a second layout inside the group.

[FORCES]
1. Atomicity > task-size granularity — four half-migrations are harder to review and revert.
2. Provable target set > speed — the rehearsal runs before the `git mv`, not after.
3. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T3  (wave 1)
- **Objective**: Remove the borough dropdown from the chart page and delete `BoroughPicker`
  outright. Keep the `[[...borough]]` route, `generateStaticParams`, `dynamicParams`,
  `revalidate`, and `parseBoroughParam` untouched. Keep `UnifiedTimeline`'s `boroughBlocked`
  branch and all of its copy exactly as it is.
- **Requirement**: Partially retires FR-6 [P1] (the borough *control*; the route and mapping
  survive). Preserves FR-7 [P1] via the retained refusal panel. **This is a requirement change,
  not just a code change** — it needs a PRD v1.3 note or a ledger entry.
- **Inputs/Outputs**: `Home({ params })` keeps its exact signature and all six `Promise.all`
  fetches, including `fetchCoverageData()` — the refusal panel still needs it. `activeCode`,
  `boroughLabel`, and the `UnifiedTimeline` props are unchanged. Only the
  `<div className={workspaceStyles.field}>` wrapper and the `<BoroughPicker />` inside it are
  removed from `WorkspaceHeader`'s children.
- **Design Pattern**: none — simple case. A deletion.
- **UI Scope**: structural — a control leaves the DOM.
- **Intellectual Control**: Two decisions and their reasons.
  **(1) `BoroughPicker.tsx`, `.module.css`, and `.test.tsx` are deleted outright.** One call site
  (`[[...borough]]/page.tsx:165`); after removal it is unreferenced. Keeping it means keeping a
  green test suite for a component nothing renders — precisely the `GlobalNav` situation T2a is
  cleaning up, and the reason nobody noticed `GlobalNav` was dead for weeks. A passing test on
  dead code actively conceals the deadness. Git history is where a component that might come back
  belongs.
  **(2) `UnifiedTimeline`'s `boroughBlocked` branch stays, and its existing tests stay.** Deleting
  the picker removes the in-app path to `/B`, not the URL. `generateStaticParams` still prerenders
  all six variants, so six static HTML files remain on the CDN, reachable by bookmark, external
  link, or typed URL. With the picker gone the refusal panel is the *only* thing between a direct
  hit and a chart the product itself says cannot be trusted — load-bearing defence now, not a
  redundant guard. `UnifiedTimeline.test.tsx:164-230` already characterizes it including an axe
  check; those tests are the pin and must not be touched.
- **Constraints**:
  1. Do not modify `UnifiedTimeline.tsx`, `src/lib/boroughs.ts`, or `workspace.module.css`.
  2. Do not remove `generateStaticParams`, `dynamicParams`, or `revalidate`.
  3. Do not remove the `boroughParam.status === "invalid"` `role="alert"` block — it still fires
     for a direct malformed URL.
  4. Leave `.field` in `workspace.module.css` alone; it has other consumers.
- **Edge Cases**:
  1. Direct navigation to `/B` still renders the refusal panel — assert it, since the picker is no
     longer what produces that state.
  2. Citywide `/` renders the timeline with no borough control anywhere in the document.
  3. `toCoverageInfo` and its `"unavailable"` branch are unchanged and still exercised.
- **Files** (5):
  1. `src/app/(workspace)/[[...borough]]/page.tsx` — remove import, wrapper `<div>`, `<BoroughPicker />`
  2. `src/components/BoroughPicker.tsx` — delete
  3. `src/components/BoroughPicker.module.css` — delete
  4. `src/components/BoroughPicker.test.tsx` — delete
  5. `src/app/(workspace)/[[...borough]]/page.test.tsx` — add the assertions below
- **Tests Cypress writes first**: (a) the citywide render contains no element with an accessible
  name matching `/borough/i` and no `combobox` role; (b) rendering with `params = { borough: ["B"] }`
  still produces the "We can't chart … reliably" heading and the "Read the data quality notes"
  link; (c) `axe-core` clean on both.
- **Tipping Point**: If a borough view is ever reinstated, it does not come back as a dropdown on
  the chart — it comes back as its own route with FR-7's warning rendered before the chart, or not
  at all.

[FORCES]
1. Honest refusal > offering a dead choice.
2. Deleting dead code > keeping it green — a passing test on an unrendered component hides that
   it is unrendered.
3. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T5  (wave 1)
- **Objective**: Fix both danger-index data defects in `fetchDangerIndex()`: constrain the
  aggregation to the pinned 2018–2025 window, and group on a rounded coordinate grid so one
  intersection is one row. Export the query string for FR-8, and tighten the schema so an absent
  aggregate fails loud rather than coercing to zero.
- **Requirement**: NFR-4 [P0] (every displayed figure produced by SoQL, and correct — the page
  displays counts ~1.9× their in-contract value today); FR-8 [P0] (the exact query must be
  displayable); FR-11 [P0] (explicit string casting, no absent-key-as-zero). No FR sponsors the
  danger-index page itself — PRD §6 defers the Danger Index — but NFR-4 and FR-8 govern anything
  the product displays regardless of sponsorship.
- **Inputs/Outputs**: `fetchDangerIndex(): Promise<DangerIndexRow[]>`. `DangerIndexRow` keeps
  `latitude: number`, `longitude: number`, `total: number` (so `DangerMap.tsx` needs no change and
  stays out of scope) and gains `lat_e4: number`, `lon_e4: number` — the integer grid key. Rows
  arrive pre-sorted by `total` descending. Error contract unchanged: a non-`ok` response and a
  schema-parse failure both **throw**, and `danger-index/error.tsx` remains the FR-10 state.
  Additionally export `const DANGER_INDEX_SOQL: string`, built from the same clause constants that
  build the request, so the displayed query and the sent query cannot drift (the pattern
  `buildYearlySoql` in `socrata.ts` already establishes).
- **Query** — dataset `h9gi-nx95`, `https://data.cityofnewyork.us/resource/h9gi-nx95.json`.
  **This exact form was probed live on 2026-08-14 and returns 200.**

  ```
  $select = floor(latitude * 10000) AS lat_e4,
            floor(longitude * 10000) AS lon_e4,
            count(collision_id) AS total,
            avg(latitude) AS lat_c,
            avg(longitude) AS lon_c
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
            AND latitude IS NOT NULL AND longitude IS NOT NULL
            AND latitude != 0 AND longitude != 0
  $group  = floor(latitude * 10000), floor(longitude * 10000)
  $order  = total DESC, lat_e4, lon_e4
  $limit  = 1000
  ```

  **The aliases are `lat_c`/`lon_c`, and that is not cosmetic.** Cedar's original spec aliased
  `avg(latitude) AS latitude`, shadowing the source column so that `$where ... latitude != 0`
  resolved to the aggregate. Socrata rejects it with
  `query.soql.aggregate-in-ungrouped-context: Aggregate function 'avg' used in ungrouped context:
  WHERE`. Verified by live probe — the failing and passing forms were both run. **Do the
  `lat_c` → `latitude` / `lon_c` → `longitude` rename inside the Zod schema**, so `DangerIndexRow`
  still exposes `latitude`/`longitude` and `DangerMap.tsx` remains untouched.

  **Expected response shape** — a JSON array of at most 1,000 objects, every value a **string**
  (trap: Socrata sends all numerics as strings). Actual probe output:
  ```json
  [{ "lat_e4": "406960", "lon_e4": "-739846", "total": "589",
     "lat_c": "40.6960330054329372", "lon_c": "-73.9845311602716469" }]
  ```

  **Window clause**: import it, do not retype it. Change `src/lib/socrata.ts:25` from
  `const WHERE_CLAUSE` to `export const CRASH_WINDOW_WHERE`, update its in-file references, and
  import it here. One string, one definition — a second copy of the window is the next thing to
  silently drift.

  **Rounding precision — four decimal places, and why.** 0.0001° of latitude is ~11.1 m; at
  40.7 °N, 0.0001° of longitude is ~8.4 m. The grid cell is therefore roughly **11 m × 8 m**. That
  absorbs the recorded defect (`40.696033,-73.98453` and `40.6960346,-73.9845292`, ~18 cm apart,
  both land in cell `406960 / -739846`) while staying far below the distance between genuinely
  distinct NYC intersections — the tightest Manhattan cross-street spacing is ~60–80 m, and a
  street-plus-service-road pair is ~20–30 m. Three decimal places (~111 m × 84 m) would merge
  adjacent cross-streets and is rejected. Five (~1.1 m × 0.8 m) leaves the float-splitting defect
  in place. **State the residual honestly in the page copy (T6):** grid snapping has a boundary
  artifact — two points 18 cm apart that straddle a cell edge still split. This reduces the
  splitting; it does not eliminate it. True de-duplication needs spatial clustering and is out of
  scope. An integrity product does not get to hide the limitation of its own repair.
- **Design Pattern**: none — simple case. Two clause corrections and a stricter schema. One
  caller, one query; a builder abstraction here is unearned (Rule 8).
- **Intellectual Control**: `avg(latitude)` / `avg(longitude)` as the marker position — rather
  than the cell corner the `floor` key implies — keeps the displayed coordinate a real,
  SoQL-computed centroid of the collisions in that cell instead of an arithmetic artifact of the
  bucketing. It is also NFR-4-clean: the centroid is computed by Socrata, never by a caller. The
  grid key stays an integer, which makes the group deterministic, the `$order` tiebreak stable,
  and the test assertable without float comparison.
- **Constraints**:
  1. `$order` gains `lat_e4, lon_e4` as tiebreaks. Without them, ties at the 1,000-row boundary
     make the set — and therefore the "Rank" column — non-reproducible and untestable.
  2. **Replace `z.coerce.number()` throughout.** `z.coerce.number()` maps `null` to `0` —
     absent-key-as-zero wearing a Zod costume, exactly trap 1. Follow the repo's established
     strict pattern (`socrata.ts:99`, `z.string().regex(/^\d+$/)`): parse `total` as a digits-only
     string, and the four coordinate fields as signed-decimal strings transformed with
     `.refine(Number.isFinite)`. A missing key must throw, never become 0. No `.catch()`, no
     `.default()`, no `.optional()` on any of the five fields.
  3. Keep `$limit: 1000`. Changing how many locations are shown is a product decision not in scope.
  4. Keep `count(collision_id)` rather than `COUNT(*)` — matches `localLedger.ts` and the wording
     the registry copy uses. `collision_id` is the primary key, so they are equivalent.
  5. Do not change the throw-on-failure contract. Do not touch `DangerMap.tsx` or any page file.
  6. `getSocrataAppToken()` stays where it is — server-side only (NFR-2). This module must never
     be imported by a `'use client'` file.
- **Edge Cases**:
  1. Socrata 4xx/5xx → existing `Danger index fetch failed: <status> <statusText>` throw.
  2. A row missing `total` or a coordinate → Zod throws. Assert explicitly; it is the FR-11 guard.
  3. Zero rows → an empty array, which `DangerMap`'s `Math.max(...[], 1)` already survives. Do not
     add a synthetic row.
  4. `avg()` on a single-row group returns that row's coordinate — no special case needed.
  5. Negative longitude under `floor` snaps west (`floor(-739845.29) = -739846`). Uniform across
     all rows and never reaches the marker, which uses `avg()`. Note it; do not "fix" it.
- **Files** (4):
  1. `src/lib/dangerIndexFetcher.ts` — the query, the schema, `DANGER_INDEX_SOQL`
  2. `src/lib/socrata.ts` — rename `WHERE_CLAUSE` → exported `CRASH_WINDOW_WHERE`
  3. `__tests__/dangerIndexFetcher.test.ts` — delete
  4. `src/lib/dangerIndexFetcher.test.ts` — new, replacing (3); sibling placement matches every
     other `src/lib/*.test.ts`
- **Tests Cypress writes first** (behavioral, against a stubbed `global.fetch` — no live network
  in the suite): (a) the request URL carries the 2018-01-01/2026-01-01 window; (b) `$group`
  contains no bare `latitude, longitude` — assert on the sent URL, since this is the defect;
  (c) two stub rows sharing a grid cell arrive as one row with the summed total and an averaged
  coordinate; (d) a stub row with `total` absent **throws**; (e) `total: null` **throws** (the
  `z.coerce` regression guard — write it even though it looks redundant); (f) `DANGER_INDEX_SOQL`
  contains the same `$where`/`$group` text the request URL carries (the FR-8 anti-drift pin);
  (g) the existing `$limit`/`$order` and non-`ok` throw assertions carry over; (h) the response
  parses `lat_c`/`lon_c` into `latitude`/`longitude` on the returned row.
- **Tipping Point**: If a second caller needs coordinate bucketing, or the grid precision needs to
  vary by zoom level, extract the bucketing into a named helper alongside `buildYearlySoql` rather
  than parameterizing this function.

[FORCES]
1. Correct figures > shipped figures — the page is live and wrong today.
2. Fail loud > convenient coercion — `z.coerce.number()` is trap 1 in a friendlier syntax.
3. One definition of the window > a second copy that drifts.
4. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T2a  (wave 2; depends on T1)
- **Objective**: Add three `LeftNav` entries for the newly-grouped routes, and delete the dead
  `GlobalNav` trio.
- **Requirement**: No FR — IA work serving NFR-3; the routes are currently unreachable from
  within the product.
- **Inputs/Outputs**: `NAV_ITEMS` in `src/components/LeftNav.tsx` goes from three entries to six,
  in this order and with these exact labels:
  ```
  { label: "The chart",               href: "/" }
  { label: "Your ZIP code",           href: "/local" }
  { label: "Boroughs ranked",         href: "/tdi" }
  { label: "Street redesigns",        href: "/auditor" }
  { label: "Data quality",            href: "/integrity" }
  { label: "Where numbers come from", href: "/registry" }
  ```
  No other change: the `usePathname` active-state logic, `aria-current`, the brand block, and the
  footer are untouched.
- **Design Pattern**: none — simple case. Three array entries.
- **UI Scope**: structural — the nav's DOM gains three list items.
- **Intellectual Control**: Labels are chosen against the settled terminology in
  `SESSION_STATE.md`'s Context Cache — plain-English noun phrases naming what you will see, no
  product jargon. "TDI", "Auditor", "Shadow Ledger", and "Danger Index" are all jargon and none
  appear. `/local` is a ZIP lookup, so "Your ZIP code"; `/tdi` ranks boroughs, so "Boroughs
  ranked"; `/auditor` compares before/after at street improvement projects, so "Street redesigns".
  The two reference pages stay last — they are the appendix, not the tour. `/danger-index` is
  deliberately absent; T6 adds it.
- **Constraints**:
  1. Do **not** add a `/danger-index` entry. Gated on T5; it is T6's line.
  2. Do not rename any existing label — the terminology has already regressed once and been
     restored.
  3. Do not restyle the nav, add icons, or add grouping headings. `LeftNav.module.css` is not in
     the file list.
  4. `GlobalNav` is deleted, not repurposed. Nothing imports it; its links point at the pre-T1
     orphan paths; and its `GlobalNav.test.tsx` is the reason its deadness went unnoticed.
- **Edge Cases**:
  1. `aria-current="page"` must resolve for each new href on exact match, as today.
  2. `/B`, `/K` etc. match no nav item — no entry shows as current. Correct and unchanged.
  3. Six items must not overflow the nav's fixed layout at the narrowest supported width; if it
     does, that is a `LeftNav.module.css` follow-up, not an inline style here.
- **Files** (5):
  1. `src/components/LeftNav.tsx`
  2. `src/components/LeftNav.test.tsx` — new (none exists today)
  3. `src/components/GlobalNav.tsx` — delete
  4. `src/components/GlobalNav.module.css` — delete
  5. `src/components/GlobalNav.test.tsx` — delete
- **Tests Cypress writes first**: (a) all six links render with the exact label text and href
  above; (b) the nav is a `<nav>` with accessible name "Sections" containing a single list;
  (c) mocking `usePathname` to `/local` sets `aria-current="page"` on exactly one link; (d)
  `axe-core` clean; (e) no assertion anywhere in the suite references `/danger-index` — T6 adds
  that test with the entry.
- **Tipping Point**: At eight entries, or the first entry needing a nested child, `NAV_ITEMS`
  stops being a flat array literal and the nav needs grouping — revisit before adding a seventh.

[FORCES]
1. Settled terminology > a fresh label per page.
2. Deleting dead code > leaving it "in case" — `GlobalNav` is the cautionary tale this closes.
3. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T2b  (wave 2; merges as one unit with T2a)
- **Objective**: Render FR-7's coverage warning on `/tdi`, so the borough leaderboard cannot be
  read without the caveat that the borough column is ~33% unpopulated and its coverage drifts.
- **Requirement**: FR-7 [P1]. **This task exists because of an explicit human decision**: T2a
  promotes `/tdi` into primary nav on the same day T3 removes borough views for coverage drift,
  and `/tdi` ranks boroughs. Linking it without the warning would contradict the product's own
  thesis. Rayan chose "link it now with the coverage warning" over gating on a filter fix.
- **Inputs/Outputs**: `tdi/page.tsx` gains a `fetchCoverageData()` call alongside its existing
  `fetchTDILeaderboard()` — run both in `Promise.all` (NFR-1), and map the result through the same
  shape `integrity/page.tsx` already uses. The warning renders **above** the leaderboard, not
  below it. `TDILeaderboard`'s own props and rendering are otherwise unchanged.
- **Design Pattern**: none — simple case.
- **UI Scope**: structural — a warning block enters the DOM above the table.
- **Intellectual Control**: Above the table, not below, because a caveat under a ranking is read
  after the ranking has already landed. This is the same placement argument FR-7 makes for the
  chart. Reuse the existing coverage-warning presentation rather than writing a third variant of
  this copy — if that means lifting the block out of `IntegrityAudit.tsx` into a shared component,
  that is the correct move and is what T4's Tipping Point anticipated; say so in the completion
  report rather than duplicating the markup.
- **Constraints**:
  1. **Every figure comes from `fetchCoverageData()`.** No literal percentage, no literal year.
     `guard-data-integrity.sh` blocks pasted pinned figures in non-test source.
  2. Handle the `status !== "ok"` branch with a figure-free sentence — the warning that the
     borough column is unreliable is *always* true; only the numbers are conditional.
  3. **Do not fix `src/lib/tdi.ts`'s `borough IS NOT NULL` filter in this task.** It is wrong (the
     ledger records that unpopulated rows arrive as an *absent key*, not null, and that
     `borough IN (...)` is the working form), but changing it changes what the ranking *means* and
     is therefore a Cedar `[SPEC]` under the Rule-2 carve-out. It is logged as a follow-up.
  4. Correlation-only framing (NFR-5). The ranking is collision volume by borough, with no
     population or vehicle-mile denominator — it must not be presented as a per-capita or per-trip
     risk ranking.
- **Edge Cases**:
  1. `fetchCoverageData()` fails while `fetchTDILeaderboard()` succeeds → the leaderboard still
     renders with the figure-free warning. One metric erroring must never suppress another.
  2. Both fail → the existing error path, unchanged.
- **Files** (3):
  1. `src/app/(workspace)/tdi/page.tsx`
  2. `src/app/(workspace)/tdi/page.test.tsx`
  3. one of: `src/components/TDILeaderboard.tsx`, or a new shared coverage-warning component
     (+ its test, if extracted — then this task is 4 files, still under cap)
- **Tests Cypress writes first**: (a) the warning renders above the leaderboard in DOM order;
  (b) with a synthetic coverage prop the rendered text contains those synthetic values and no
  other percentage; (c) with `status: "unavailable"` the warning still renders and contains no
  digits; (d) a failed coverage fetch still renders the leaderboard; (e) `axe-core` clean.
- **Tipping Point**: The third consumer of this warning is the point at which it must be a shared
  component if it is not already — after this task there are three (`/`'s refusal panel,
  `/integrity`, `/tdi`).

[FORCES]
1. The caveat ships with the link, not after it.
2. Live figures > readable literals — NFR-4 is a hard constraint.
3. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T4  (wave 2; must merge after T3)
- **Objective**: State once, on `/integrity`, why the product has no borough view — using the live
  coverage figures already in scope, as a standing statement rather than a reaction to a control
  that no longer exists.
- **Requirement**: FR-7 [P1]; FR-9 [P0] (the caveats section must cover borough-coverage drift);
  NFR-4 [P0] (figures live-computed, never literals).
- **Inputs/Outputs**: No new props, no new fetch. `IntegrityAudit` already receives
  `coverage: CoverageProp` from `integrity/page.tsx`'s `fetchCoverageData()` call, and already
  destructures `windowUnpopulatedSharePercent`, `firstCoverage`, and `lastCoverage` for the
  warning block at lines 171–198. The new paragraph goes inside the existing `<section>` headed
  "How often the borough is missing" (line 311), between the `<h2>` and the
  `<div className={styles.tableWrapper}>`, reading from the same values.
- **Design Pattern**: none — simple case. One paragraph in an existing section.
- **UI Scope**: structural — a paragraph enters the DOM.
- **Intellectual Control**: The file to edit is `src/components/IntegrityAudit.tsx`, **not**
  `src/app/(workspace)/integrity/page.tsx` — the page is a fetch-and-map shell with no copy in it,
  and every existing coverage sentence lives in the component. Placing the statement in the
  section that already tabulates per-year coverage means the claim and its evidence are adjacent:
  the reader sees "this is why there is no borough view" directly above the table of numbers that
  justifies it. The existing top-of-page warning block stays as-is; this is an additional, more
  specific statement, not a relocation.
- **Constraints**:
  1. **Every figure comes from the `coverage` prop.** Use
     `coverage.windowUnpopulatedSharePercent.toFixed(1)`, `firstCoverage`/`lastCoverage` `.year`
     and `.coverageRatePercent.toFixed(1)`, matching the formatting at lines 178–184.
  2. **Handle `coverage.status !== "ok"`** with a figure-free sentence, as the warning block does
     at lines 192–197. The statement that there is no borough view is *always* true and must
     render even when the numbers do not load.
  3. Plain English, matching the settled register. No new jargon.
  4. Correlation-only framing (NFR-5): this describes a record-keeping gap, not a policing claim.
  5. Do not modify the existing warning block, the coverage table, `CoverageProp`, or
     `integrity/page.tsx`.
  6. Do not add a link back to a borough view. There is none.
- **Edge Cases**:
  1. `coverage.status === "unavailable"` → the figure-free variant renders; assert it.
  2. `coverage.yearly` empty → `toCoverageProp` already returns `"unavailable"`; no new branch.
  3. Heading order must stay valid; the paragraph introduces no heading.
- **Files** (2):
  1. `src/components/IntegrityAudit.tsx`
  2. `src/components/IntegrityAudit.test.tsx`
- **Tests Cypress writes first**: (a) with a synthetic `coverage` prop, the rendered text contains
  those exact synthetic values and no other percentage — `UnifiedTimeline.test.tsx:164` ("reads
  coverage from props, not a copied-in figure") is the pattern to copy; (b) with
  `status: "unavailable"`, the statement still renders and contains no digits; (c) `axe-core`
  clean in both states.
- **Tipping Point**: If a third place needs this explanation, the copy stops being duplicated
  inline and becomes a shared component fed by `CoverageProp`. **T2b makes that third place** —
  coordinate with it rather than writing a third copy.

[FORCES]
1. Live figures > readable literals — NFR-4 is a hard constraint, not a preference.
2. Claim adjacent to evidence > claim in the introduction.
3. Simplicity > Pattern purity.
```

---

```markdown
[SPEC] — T6  (wave 3; depends on T1, T2a, T5 — this is the task that adds the /danger-index nav entry)
- **Objective**: Bring the danger-index page into contract: display the SoQL behind it (FR-8),
  repair the accessible table (NFR-3), correct the copy the T5 fix falsifies, migrate its inert
  Tailwind to CSS Modules, and add the single `LeftNav` entry that exposes it.
- **Requirement**: FR-8 [P0]; NFR-3 [P0]; NFR-5 (honest presentation). The page itself has no FR —
  PRD §6 defers the Danger Index — but everything the product displays is bound by FR-8 and NFR-3.
- **Inputs/Outputs**: The page keeps `const data = await fetchDangerIndex()` and keeps passing
  `data` to `DangerMap` unchanged (T5 preserved the field names precisely so this stays true). It
  additionally imports `DANGER_INDEX_SOQL` and renders it. `DangerIndexRow` now also carries
  `lat_e4`/`lon_e4`, available as stable React keys.
- **Design Pattern**: none — simple case. Presentation changes on one page.
- **UI Scope**: structural — a query-disclosure block is added, the table's markup changes, and
  every className is replaced.
- **Intellectual Control**: **The `<details>` tabular fallback partially satisfies NFR-3 and
  stays.** Progressive disclosure is a legitimate ARIA APG pattern — the `<summary>` is a
  discoverable, keyboard-operable control, and content behind a collapsed `<details>` is reachable
  rather than lost. Four concrete gaps disqualify it as-is, and this task closes them: (1) no
  `<caption>`, so the table has no accessible name; (2) the "Rank" cell is a `<td>` where it is
  the row's identifier and should be `<th scope="row">`; (3) nothing associates the map region
  with its table equivalent, so a screen-reader user landing on the map has no signal the data
  exists in text; (4) `<summary>` text reading "Tabular Fallback" is developer jargon. Fixing
  those four is what makes the page NFR-3-compliant; replacing `<details>` with an always-open
  table is not required and is not in scope.
  On FR-8: the disclosure renders `DANGER_INDEX_SOQL`, which T5 built from the same constants as
  the request — the page cannot display a query that differs from the one it sent.
- **Constraints**:
  1. **Copy corrections the T5 fix makes mandatory** — the current text is wrong as rendered:
     - "pinpoint high-risk locations" → the query aggregates to a ~11 m × 8 m grid cell, not a
       pinpoint. Say what it actually does.
     - The Methodology block's "grouping incident reports by exact coordinates" is now false.
       Replace with: the fixed 2018–2025 window; coordinates rounded to four decimal places
       (roughly a ten-metre grid) so one intersection reports as one row; the top 1,000 cells.
     - **Add the residual limitation** T5 identified: grid snapping still splits a pair that
       straddles a cell boundary, so the ranking is very close to correct rather than provably
       exact. An integrity product states the limits of its own repair.
     - **Add a correlation-only caveat (NFR-5):** a high count is collision *volume*, not risk per
       vehicle — no exposure denominator exists here. Nothing on this page may assert an
       intersection is "dangerous" in a causal or per-trip sense.
  2. **No figure in the copy may be a literal drawn from the data.** "1,000" and "four decimal
     places" are query parameters and are fine; a count, a rank, or a coordinate written into
     prose is not.
  3. **CSS Modules, not Tailwind** (the classes in these two files are inert — no dependency, no
     config, no PostCSS). Both `page.tsx` and `error.tsx` move to a shared `page.module.css` in
     the same directory. Do not add Tailwind. Do not add a dependency of any kind (Rule 9).
  4. Reuse the workspace design tokens and `workspace.module.css` table styling that
     `IntegrityAudit` uses, so the page reads as part of the product rather than a bolted-on tool.
  5. `LeftNav` gains exactly one entry, `{ label: "The map", href: "/danger-index" }`, inserted
     directly after `"The chart"`. "Danger Index" and "heatmap" are jargon and stay out of the nav.
  6. Do **not** touch `DangerMap.tsx`, `DangerMap.module.css`, or `src/lib/dangerIndexFetcher.ts`.
     `DangerMap`'s popup still carries inert Tailwind — a separate follow-up, not scope creep. And
     the ledger's warning stands: `.map { height: 100% }` is load-bearing on `.mapFrame` keeping a
     definite height.
  7. Do not add `revalidate` or `dynamic` to this page. Caching semantics for this Next version
     need the docs read first (CLAUDE.md), and guessing is worse than deferring.
  8. `<h1>` stays the page's only `h1`; the workspace shell contributes none.
- **Edge Cases**:
  1. Empty `data` → the map renders with no markers and the table renders a single "no rows" row.
     Neither may render a zero or an em-dash implying a measured value.
  2. `error.tsx` still catches the T5 throw path; its restyled markup must keep the `reset()`
     button keyboard-operable and its heading in the heading order.
  3. 1,000 table rows inside a scroll container — keep the existing max-height scroll; verify the
     sticky header does not detach from the `<caption>`.
  4. `prefers-reduced-motion` respected on any transition introduced by the restyle.
- **Files** (5):
  1. `src/app/(workspace)/danger-index/page.tsx`
  2. `src/app/(workspace)/danger-index/page.module.css` — new
  3. `src/app/(workspace)/danger-index/page.test.tsx` — new (the page has no test today;
     `dangerIndexFetcher.test.ts` is the only coverage and it never renders anything, which is why
     the wrong ranking shipped through a passing audit)
  4. `src/app/(workspace)/danger-index/error.tsx`
  5. `src/components/LeftNav.tsx` — the gated one-line entry
- **Tests Cypress writes first**: (a) rendering the page with a mocked `fetchDangerIndex` shows the
  `DANGER_INDEX_SOQL` text, including the window clause; (b) the table has an accessible name via
  `<caption>` and each row's rank is a row header; (c) the map region is programmatically
  associated with the table; (d) no Tailwind utility class remains in either file — a source-text
  assertion, since these classes fail silently rather than erroring; (e) the copy contains neither
  "exact coordinates" nor "pinpoint"; (f) `LeftNav` now renders seven links including "The map" →
  `/danger-index`; (g) `error.tsx` renders, its button is keyboard-reachable, `axe-core` clean;
  (h) `axe-core` clean on the page in both collapsed and expanded `<details>` states.
- **Tipping Point**: If the map gains a second data series, a filter, or a time slider, the page
  stops being a server component with one fetch and needs its own `[SPEC]` for state ownership —
  and at that point PRD §6's deferral of the Danger Index has to be revisited on the record rather
  than by accretion.

[FORCES]
1. Correct figures land before the nav link — T5 gates this task, not the reverse.
2. Honest limitations > a confident ranking.
3. Repo convention (CSS Modules) > the framework the file was written in.
4. Simplicity > Pattern purity.
```

---

## Follow-ups logged, deliberately not in scope

1. **`src/lib/tdi.ts`'s `borough IS NOT NULL` filter is wrong** — unpopulated rows arrive as an
   absent key, not null; `borough IN (...)` is the verified working form. Changing it changes what
   the ranking means → Cedar `[SPEC]`, Rule-2 carve-out. T2b attaches the warning; it does not fix
   the filter.
2. **T3 partially retires FR-6 [P1]** — needs a PRD v1.3 note.
3. **`UNIFIED_NAVIGATION_PLAN.md` is stale in two ways**: its SoQL-injection finding against
   `src/lib/localLedger.ts` is already fixed (both functions gate on `/^\d{5}$/`), and its
   reviewer block recording `/tdi` and `/auditor` as unsanctioned has now been overruled by an
   explicit human decision. Record both rather than deleting the block.
4. **`src/app/page.module.css` has no `src/app/page.tsx`** — orphaned stylesheet.
5. **`DangerMap.tsx`'s popup still carries inert Tailwind** — cosmetic, invisible today.
6. **`fetchDangerIndex()` has no `next: { revalidate }` while `socrata.ts` uses 86400** (raised by
   Redwood in T5's completion report). The danger-index aggregate is equally immutable over a fixed
   window, so it is currently re-fetched per request for no benefit — an NFR-1 gap. Deliberately
   *not* fixed in T5: CLAUDE.md forbids guessing this Next version's caching semantics without
   reading `node_modules/next/dist/docs/`, and the SPEC did not pin it. Needs a Cedar line, not a
   builder's judgement.
7. **`.claude/hooks/post-edit-lint.sh` was broken and is now fixed** (main session, 2026-08-14 —
   not part of any task above). `node_modules/.bin/eslint` has a `#!/usr/bin/env node` shebang, and
   hook shells inherit a bare PATH with no nvm, so eslint died at exec — and the hook reported that
   interpreter failure as "eslint reported problems … that could not be auto-fixed", exit 2. A
   false accusation agents then chased. Commit `f260705` fixed this class of bug in
   `stop-quality-gate.sh` last session but missed this hook; that is **four** toolchain regressions
   of the same shape. Fixed by resolving through nvm/`.nvmrc` (never a hardcoded bin path, which is
   what rots), plus a reachability check that exits 0 with an honest environment message instead of
   blocking. Verified three ways: failure reproduced, fix resolves v22.23.2, degraded path does not
   falsely accuse.
