# [SPEC] MVCC Enterprise Workspace: Phase 4 (QA & Test Repair)

## Objective
The massive architectural shift to the 3-column "Enterprise Workspace" and the consolidation of the charts into `UnifiedTimeline.tsx` has broken the legacy unit tests in `src/app/[[...borough]]/page.test.tsx`.
Your job is to repair the test suite so it accurately reflects the new component hierarchy and passes cleanly.

## Inputs/Outputs
- **`src/app/[[...borough]]/page.test.tsx`**: Modify this file.
  - The page no longer mounts `MetricSection`, `CoverageWarning`, `Caveats`, or `StatenIslandPilotPanel`.
  - It now mounts `UnifiedTimeline` passing down the resolved data props.
  - Update the assertions to check for `UnifiedTimeline` (or simply ensure the page mounts successfully without throwing and passes axe accessibility).
- **`src/components/UnifiedTimeline.test.tsx`** (New or Optional): If needed, write a lightweight test verifying the `UnifiedTimeline` mounts without crashing.
- **`src/app/integrity/page.test.tsx`** & **`src/app/registry/page.test.tsx`** (New): Write baseline rendering tests + `axe-core` accessibility checks for the two new routes.

## Tasks (≤ 5 files)

1. Run the test suite: `npm run test` to see exactly what fails.
2. Update/Rewrite `src/app/[[...borough]]/page.test.tsx` to align with Phase 2 changes.
3. Write `src/app/integrity/page.test.tsx`.
4. Write `src/app/registry/page.test.tsx`.
5. Ensure `npm run test` is 100% green and linting passes.

## [FORCES]
- **Black-Box Testing**: Treat the new components as black boxes. Do not mock internal Recharts implementation details. Test what the user sees (or just that it mounts successfully and passes a11y checks).
