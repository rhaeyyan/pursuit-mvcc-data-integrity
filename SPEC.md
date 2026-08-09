# Active SPEC

**Phase 4 of 6** — FR-6 UI & End-to-End Wiring. Cedar, 2026-08-08. Awaiting HITL approval before Cypress dispatch.

Phases 1 (borough vocabulary + `socrata.ts` transport), 2 (crash-metric wrapper propagation), and 3 (`arrests.ts` propagation) are closed and archived in `ARCHIVED_SPECS.md` (Phases 1–3 committed and pushed to `main`).

This phase provides the **UI switch-on** that closes FR-6 [P1]. It introduces a accessible `<BoroughPicker>` component, wires URL search parameters (`?borough=...`) through `parseBoroughParam` on the main page (`src/app/page.tsx`), and propagates the optional `BoroughCode` filter to all five metric fetches in parallel. It also updates section headings/captions when a borough filter is active and handles invalid parameters cleanly via an alert banner.

---

```markdown
[SPEC]
- **Objective**: Implement the borough filter UI component (`src/components/BoroughPicker.tsx`) and wire URL search parameters (`?borough=...`) on `src/app/page.tsx` through the `parseBoroughParam` trust boundary to all five metric series (`deaths`, `injuries`, `collisions`, `repairedCollisions`, `arrests`). When a valid borough parameter is present, all five series update in sync and captions display the active borough label (e.g., "Brooklyn"). When omitted or empty, citywide data is fetched (byte-identical to pre-FR-6). When invalid, an accessible error alert is displayed.

- **Requirement**: FR-6 [P1] — complete user-facing borough filter capability across all five metric series on the main page. Serves NFR-2 (type-closed boundary via `parseBoroughParam`), NFR-3 (WCAG 2.2 AA accessible controls and markup), and NFR-4 (no fake data or fabricated fallback figures).

- **UI Scope**: `structural` (adds new `<BoroughPicker>` layout container and DOM elements, updates captions).

- **Inputs/Outputs**:
  - `src/components/BoroughPicker.tsx` (Client Component `'use client'`):
    - Renders `<nav aria-label="Borough filter">` containing a label and `<select aria-label="Select NYC Borough" value={currentBorough}>` with options:
      - `""` -> "All NYC Boroughs (Citywide)"
      - `"B"` -> "Bronx"
      - `"K"` -> "Brooklyn"
      - `"M"` -> "Manhattan"
      - `"Q"` -> "Queens"
      - `"S"` -> "Staten Island"
    - Updates URL via `router.push('/?borough=' + value)` (or clears `borough` parameter when selecting citywide).
    - Fully accessible keyboard navigation and WCAG 2.2 AA compliant contrast.
  - `src/components/BoroughPicker.module.css`:
    - Styling for `<BoroughPicker>`, using CSS custom properties matching `globals.css` / `YearlyLineChart.module.css` (no hardcoded color literals, full dark mode support via `prefers-color-scheme`).
  - `src/app/page.tsx`:
    - Signature: `export default async function Home({ searchParams }: { searchParams?: Promise<{ borough?: string | string[] }> })`
    - Parses `borough` search parameter using `parseBoroughParam` from `src/lib/boroughs.ts`.
    - If `status === "invalid"`: renders `<p role="alert">Invalid borough parameter: "{received}". Displaying citywide data.</p>` alongside the picker and default citywide data.
    - If `status === "ok"`: calls `fetchDeathsPerYear(code)`, `fetchInjuriesPerYear(code)`, `fetchCollisionsPerYear(code)`, `fetchRepairedCollisionsPerYear(code)`, `fetchArrestsPerYear(code)` in parallel via `Promise.all`. Updates section captions and chart aria labels/captions to include `(${BOROUGHS[code].label})`.
    - If `status === "none"`: calls all five `fetchXPerYear()` with `undefined` (citywide default).

- **Design Pattern**: none — simple case. Direct parameter passing from URL/searchParams to data fetchers.

- **Intellectual Control**:
  1. Trust boundary: raw URL values never reach `$where` clauses or fetch functions without passing through `parseBoroughParam` first.
  2. Synchronized filtering: all five series update together from the single page-level borough filter.
  3. Regression pin: when no borough is selected (`status === "none"`), every query, table, and chart output remains byte-identical to the pre-FR-6 baseline.
  4. Invalid handling: malformed search parameters produce an explicit `<p role="alert">`, never silent failover or unsafe query injection.

- **Constraints**:
  1. Max 5 files per task (3 impl, 2 test).
  2. No inline color literals in JSX/TSX — styling lives in `BoroughPicker.module.css` using theme variables.
  3. No raw string borough codes in component code — all borough codes and labels are imported from `src/lib/boroughs.ts`.
  4. Server-side parallel fetching via `Promise.all` preserved (NFR-1).
  5. WCAG 2.2 AA compliance verified via `axe-core` tests.

- **Edge Cases**:
  1. `?borough=K` -> all 5 metrics show Brooklyn data.
  2. `?borough=k` -> case-insensitive matching in `parseBoroughParam` resolves to `"K"`.
  3. `?borough=invalid` -> `parseBoroughParam` returns `invalid`, page shows alert banner and falls back safely to citywide data.
  4. `?borough=B&borough=K` (repeated param) -> `parseBoroughParam` receives array, returns `invalid`, alert shown.
  5. `?borough=` (empty string) -> `parseBoroughParam` returns `none`, citywide data shown without alert.

- **Files** (max 5: 3 impl, 2 test):
  1. `src/components/BoroughPicker.tsx` — *new implementation.* Client component for borough selection dropdown and URL navigation.
  2. `src/components/BoroughPicker.module.css` — *new implementation.* CSS module for borough picker styling.
  3. `src/app/page.tsx` — *edited implementation.* Wire `searchParams`, `parseBoroughParam`, `<BoroughPicker>`, and updated captions.

  **Cypress Budget (2 test files):**
  1. `src/components/BoroughPicker.test.tsx` — *new test file.* Component unit and accessibility tests for `<BoroughPicker>`.
  2. `src/app/page.test.tsx` — *edited test file.* Page integration tests covering valid borough selection, citywide default, and invalid parameter alert banner.

- **Tipping Point**: revisit if multi-borough multi-select filter (e.g. checkboxes) is required in the future.
```

```markdown
[FORCES]
1. Explicit trust boundary parsing (`parseBoroughParam`) > passing unparsed URL strings.
2. Synchronized 5-series updates > per-panel independent borough selectors.
3. Accessible semantic markup & keyboard support (WCAG 2.2 AA) > custom unstyled dropdowns.
4. Simplicity > Pattern purity.
```

---

## Remaining phases

| # | Closes | Impl | Test | Agent |
|---|---|---|---|---|
| 1 | ~~FR-6 vocabulary + transport~~ CLOSED | 2 | 2 | Redwood |
| 2 | ~~FR-6 crash-metric propagation~~ CLOSED | 4 | 4 | Redwood |
| 3 | ~~FR-6 arrests propagation~~ CLOSED | 1 | 1 | Redwood |
| **4** | **FR-6 closed** — UI, end-to-end (this phase) | 3 | 2 | Magnolia |
| **5a** | structural only — no FR | 2 | 1 | Banyan |
| **5b** | FR-7 coverage data (both fields) | 1 | 1 | Redwood |
| 6 | **FR-7 closed** — banner | 3 | 2 | Magnolia |
