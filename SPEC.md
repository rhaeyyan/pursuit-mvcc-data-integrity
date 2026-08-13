# Active SPEC

[SPEC]
- **Objective**: Build the UI/Presentation layer for the Vision Zero Shadow Ledger Community Board Briefing Sheet (Phase 4).
- **Requirement**: Create `src/components/PrintButton.tsx`, add it to `src/app/layout.tsx`, and add `@media print` rules to `src/app/globals.css`.
- **Inputs/Outputs**:
  - `src/components/PrintButton.tsx`: A Client Component. Renders an accessible floating action button in the bottom right corner (fixed position). Clicking it calls `window.print()`.
  - `src/app/layout.tsx`: Updated to render `<PrintButton />` inside the body.
  - `src/app/globals.css`: 
    - Adds `@media print` query.
    - Sets `body { background: white !important; color: black !important; }`.
    - Hides the PrintButton (`.print-button { display: none !important; }`).
    - Ensures `<details>` elements are expanded and styled cleanly for print (`details[open] { display: block; }` and styling to mimic `open` state).
    - Prevents page breaks inside charts/tables: `figure, table { break-inside: avoid; }`.
- **Intellectual Control**:
  - `PrintButton` MUST pass 100% of `axe-core` accessibility checks.
- **Files** (max 5):
  1. `src/components/PrintButton.tsx` (new)
  2. `src/components/PrintButton.test.tsx` (new — Cypress writes this first)
  3. `src/app/layout.tsx` (modify)
  4. `src/app/globals.css` (modify)

[FORCES]
1. Use semantic HTML and `axe-core` compliant structure.
