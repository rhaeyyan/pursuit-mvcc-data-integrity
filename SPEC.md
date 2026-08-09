# Active SPEC

**Phase 6 of 6** — FR-7 Coverage Warning Banner UI. Cedar, 2026-08-08. Awaiting HITL approval before Cypress / Magnolia dispatch.

Phases 1–5b are closed and committed (`00f0cce`). Phase 5b landed `src/lib/arrestsCoverage.ts` with row-weighted 32.9% arrests unpopulated share derivation.

This phase is the **final UI switch-on that closes FR-7 [P1] and completes the project**. It introduces the `<CoverageWarning>` banner component (`src/components/CoverageWarning.tsx` + `src/components/CoverageWarning.module.css`), fetches coverage data on `src/app/page.tsx`, and renders an accessible page-level warning banner detailing dataset record-keeping unpopulated shares across 2018–2025.

---

```markdown
[SPEC]
- **Objective**: Implement the `<CoverageWarning>` component and render it near the top of `src/app/page.tsx` using live data fetched via `fetchCoverageData()`. The banner informs users of missing location/borough data (~31% in collisions, 32.9% in arrests) to prevent misinterpretation of borough-filtered trends as real geographic safety shifts.

- **Requirement**: FR-7 [P1] — page-level coverage warning banner. Serves NFR-3 (WCAG 2.2 AA accessible alert/warning landmark), NFR-4 (live derived percentages), and PRD honesty standards (strict non-comparability framing).

- **UI Scope**: `structural` (adds new `<CoverageWarning>` container, disclosure `<details>`, and DOM elements).

- **Inputs/Outputs**:
  - `src/components/CoverageWarning.tsx`:
    - Renders `<aside aria-label="Dataset coverage warning" className={styles.container}>`.
    - Collisions block leads with full detail (window unpopulated share ~31%, yearly trend).
    - An explicit non-comparability sentence placed *between* the blocks:
      *"These coverage rates describe dataset record-keeping completeness, not enforcement activity, and cannot be compared between datasets."*
    - Arrests block follows as one concise sentence (32.9% window unpopulated share).
    - Includes a `<details>` disclosure carrying yearly coverage tables (2018–2025) for both datasets.
    - Forward pointer sentence: *"See Caveats below for additional reporting policy context."*
    - If one dataset coverage fails (e.g. `status: "partial"`), the surviving dataset banner still renders cleanly (independent per-field status).
  - `src/components/CoverageWarning.module.css`:
    - Styling for `<CoverageWarning>`, using CSS custom properties matching theme (`var(--foreground)`, `var(--background)`).
  - `src/app/page.tsx`:
    - Imports `fetchCoverageData` from `../lib/arrestsCoverage`.
    - Adds `fetchCoverageData()` to the server-side `Promise.all` array.
    - Renders `<CoverageWarning coverageResult={coverageResult} />` above or alongside the main metrics.

- **Design Pattern**: none — simple component composition.

- **Intellectual Control & Honesty Rules**:
  1. No shared visual frame (no two-row comparison table, no paired side-by-side tiles, no common comparison header).
  2. Ordered by consequence, not symmetry (collisions leads; arrests is one sentence).
  3. Greppable forbidden-vocabulary list strictly enforced: *better, worse, higher, lower, compared to, unlike, whereas, only*.
  4. NO computed difference or ratio exists anywhere in component or rendered DOM text.
  5. Explicit non-comparability notice placed between blocks.
  6. Coverage-is-not-validity pointer references `Caveats`.
  7. Independent per-field status: failure of one dataset fetch never silences the other.

- **Constraints**:
  1. Max 5 files (3 impl, 2 test).
  2. WCAG 2.2 AA compliant markup and keyboard accessible disclosure `<details>`.
  3. No hardcoded figure literals in component JSX — figures are read from `coverageResult`.

- **Edge Cases**:
  1. Coverage result `status: "ok"` -> renders complete banner with collisions and arrests sections.
  2. Coverage result `status: "partial"` (e.g. arrests failed) -> renders collisions section and non-comparability note without crashing or hiding collisions.
  3. Coverage result `status: "error"` -> renders a fallback warning `<p role="status">Coverage metadata is currently unavailable.</p>`.

- **Files** (3 impl, 2 test):
  1. `src/components/CoverageWarning.tsx` — *new implementation.*
  2. `src/components/CoverageWarning.module.css` — *new implementation.*
  3. `src/app/page.tsx` — *edited implementation.*

  **Cypress Budget (2 test files):**
  1. `src/components/CoverageWarning.test.tsx` — *new test file.* Component unit, honesty rules, and accessibility tests.
  2. `src/app/page.test.tsx` — *edited test file.* Page integration tests covering coverage banner rendering.
```

```markdown
[FORCES]
1. Strict non-comparability framing & honesty rules > visual symmetry.
2. Independent per-dataset error handling > coupled all-or-nothing banners.
3. Accessible semantic HTML (WCAG 2.2 AA) > custom unstyled widgets.
4. Simplicity > Pattern purity.
```
