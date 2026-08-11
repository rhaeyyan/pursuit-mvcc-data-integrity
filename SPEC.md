# Active SPEC

[SPEC]

- **Objective**: Make all six variants of the dashboard (citywide + five boroughs) prerendered and
  CDN-cacheable, so the first visit to a borough meets NFR-1's latency budget. Measured on the
  2026-08-11 deploy: every response is `x-vercel-cache: MISS` with
  `cache-control: private, no-cache, no-store`, and a cold `?borough=K` took **3.2s unthrottled**
  against a 2.5s-under-Slow-4G budget. Cause: `/` awaits `searchParams` (`page.tsx:70-75`), which
  opts the whole route out of static rendering. Fix: move the borough from a search param to a
  prerendered route segment. **No SoQL changes.**

- **Requirement**: NFR-1 [P0] (caching/latency). Must preserve FR-6 (borough filter + pinned code
  mapping) and FR-7 (coverage warning while a filter is active) with no behavioural regression.

- **Inputs/Outputs**:
  - Route becomes `src/app/[[...borough]]/page.tsx`, an optional catch-all.
  - Props change from `searchParams?: Promise<{ borough?: string | string[] }>` to
    `params: Promise<{ borough?: string[] }>`.
  - URL shape: `/` = citywide, `/B` `/K` `/M` `/Q` `/S` = the five boroughs.
  - The `src/lib/*` data layer, its return types, and every rendered figure are **unchanged**.

- **Query**: **None. No query changes in this task.** Every `$select` / `$where` / `$group` /
  dataset ID stays byte-identical, and `borough` still reaches the data layer as the same
  `BoroughCode` the functions already accept. Rule 4 applies with full force: if the implementation
  appears to need a clause edited, **halt and request a revised SPEC** — do not adjust one in place.
  `src/lib/boroughs.ts` is deliberately **not** in the file list so FR-6's pinned mapping
  (`B`→BRONX, `K`→BROOKLYN, …) cannot be touched by this change.

- **Design Pattern**: none — simple case. A closed five-member filter domain enumerated at build
  time; there is no varying algorithm to encapsulate.

- **UI Scope**: structural — the route/DOM location of the page changes. Visual output is
  byte-identical; no restyling is in scope.

- **Intellectual Control**: Next 16.3.0 offers two mechanisms, and this picks the narrower one.
  `cacheComponents: true` + `use cache` (verified in
  `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and
  `02-guides/migrating-to-cache-components.md`) is the general answer for *open or large* filter
  domains — it keeps `searchParams` and caches per argument. But it is a project-wide rendering-model
  change: those docs state it makes `dynamic`/`revalidate`/`fetchCache` segment configs **error**
  (line 75) and changes how GET Route Handlers prerender, so it would ripple into all five existing
  API routes and the `next: { revalidate: 86400 }` option in `socrata.ts:207`. That is unjustified
  blast radius on a feature-complete MVP with 566 green tests.
  `generateStaticParams` over a **closed set of six** is the exact-fit tool: the borough domain is
  fixed by FR-6 and cannot grow, so enumerating it is complete rather than approximate, all six
  variants become static HTML on the CDN, and the existing `revalidate` mechanism keeps working
  untouched. Catch-all support and the `dynamicParams = false` 404 behaviour are both confirmed in
  `03-api-reference/04-functions/generate-static-params.md` (lines 168-180, 376).

- **Constraints**:
  - **No new dependencies** (Rule 9). This is routing configuration only.
  - `export const revalidate = 86400` on the segment, matching the Socrata Data Cache TTL in
    `socrata.ts:207`, so HTML and upstream data age on the same clock rather than drifting.
  - `export const dynamicParams = false` so only the six enumerated paths are ever served.
  - Do **not** enable `cacheComponents`; `next.config.ts` is not in the file list.
  - `page.module.css` stays where it is — the moved page imports `../page.module.css`.
  - Keep `BoroughPicker` a `<select>` in a labelled `<nav>`; its `useSafeRouter` try/catch stays
    (it is what lets the component render in tests without a router).

- **Edge Cases**:
  1. **Unknown code** (`/X`, `/BROOKLYN`) → 404 via `dynamicParams = false`. No error state, no
     silent fallback to citywide.
  2. **Lowercase** (`/k`) → 404, deliberately. Normalising would add a second cache key per borough
     and double the prerendered set for no user-visible gain; the picker only ever emits uppercase.
  3. **Multi-segment** (`/K/extra`) → 404 by the same mechanism. The page must additionally treat a
     `params.borough` array of length ≠ 1 as "no borough" rather than reading `[0]` blindly.
  4. **The `/` (no-segment) case is the one genuine unknown.** Verify empirically whether Next
     16.3.0's `generateStaticParams` prerenders the root of an optional catch-all via
     `{ borough: undefined }` or `{ borough: [] }` — assert which by inspecting the build output's
     route table, do not assume. If neither prerenders `/`, report it in the
     `[COMPLETION-REPORT]` rather than working around it silently; `/` is already fast (~0.2s warm)
     so it is the acceptable one to leave dynamic.
  5. **Old `?borough=K` links break.** Accepted, not fixed: the deploy is hours old and nothing
     links to those URLs yet. A `next.config.ts` redirect would cost a 6th file and a config change
     this SPEC deliberately excludes. Note it in the report.
  6. FR-7's coverage warning must still render for all five boroughs, and the FR-10 error state must
     still be reachable per-metric — one metric failing must not suppress another (the existing
     independent-branch guarantee in `page.tsx:1-17`).

- **Files** (4 — one slot of headroom against the cap of 5):
  1. `src/app/[[...borough]]/page.tsx` — **moved** from `src/app/page.tsx`; reads `params`, adds
     `generateStaticParams` / `dynamicParams` / `revalidate`, imports `../page.module.css`.
  2. `src/components/BoroughPicker.tsx` — `router.push('/?borough=K')` → `router.push('/K')`;
     empty selection → `router.push('/')`.
  3. `src/app/[[...borough]]/page.test.tsx` — **moved** from `src/app/page.test.tsx`; params-shaped
     fixtures replacing searchParams-shaped ones.
  4. `src/components/BoroughPicker.test.tsx` — assert the new push targets.

- **Tipping Point**: the moment a **second** filter dimension is introduced (year range, vehicle
  type, injury severity), the prerendered variant count becomes multiplicative and enumeration stops
  being the right tool. At that point migrate to `cacheComponents` + `use cache` keyed on function
  arguments — the mechanism deliberately declined above — and accept the project-wide change then,
  when an open filter domain finally justifies it.

## Acceptance criteria

Tests first (Cypress), then implementation (Redwood). Per the standing Amendment 3(b) clause,
**record `node -v` beside every command result, and it must read v22.x.** The machine also carries a
system Node v26.7.0 which is *permissible but not the target* — prefix every gate with:

```
export NVM_DIR="$HOME/.nvm"; . /usr/local/opt/nvm/nvm.sh; nvm use >/dev/null
```

Baseline on that platform, verified 2026-08-11 immediately before this SPEC: **566/566 in 22 files,
`tsc --noEmit` clean, `eslint .` 0 errors / 2 warnings**, `npm ci` with 0 `EBADENGINE`.

1. Full suite green (baseline 566; the moved/updated tests may change the count — state the new one).
2. `tsc --noEmit` clean and `eslint .` at **0 errors**, allowing exactly the **two** known
   pre-existing warnings — `percentChange.ts:15` (unused type param `K`) and
   `page.test.tsx:2667` (unused `container`). Both verified present on 2026-08-11 *before* this task
   began; neither is this task's to fix, but the second one lives in a file this task **moves**, so
   carry it across rather than "cleaning" it and inflating the diff.
3. Build output's route table shows the six paths as static/prerendered — paste that table.
4. **Post-deploy, on the live URL** (this is the criterion the whole task exists for):
   - `/K` requested twice returns `x-vercel-cache: HIT` on the second request.
   - A cold borough variant completes **< 2.5s**, versus the 3.2s measured on 2026-08-11.
   - `/X` returns 404.
   - Client bundle still contains no token identifier (NFR-2 regression check).
5. Record `/`'s **First Load JS** from the build log — the outstanding ledger obligation, still
   unmet.

[FORCES]

1. **Narrow blast radius > mechanism modernity.** `cacheComponents` is the more current Next 16
   idiom and is explicitly declined here: a feature-complete MVP with all FRs closed should not take
   a project-wide rendering-model change to fix one route's caching.
2. **Preserving the query contract > convenience.** `boroughs.ts` and every SoQL string stay out of
   scope, so a performance fix cannot become a data-integrity risk (Rule 4, NFR-4).
3. Simplicity > Pattern purity.
