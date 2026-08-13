# Active SPEC

[SPEC]
- **Objective**: Build a persistent global navigation shell, fix a SoQL injection vulnerability in the Local Ledger, and integrate the navigation into the `layout.tsx` file.
- **Requirement**: Create `src/components/GlobalNav.tsx` and fix `src/lib/localLedger.ts`.
- **Scope Integrity**: PRD v1.3 is hereby amended to officially sanction TDI and SIP Auditor features (Option A selected). The GlobalNav MUST link to these.
- **Inputs/Outputs**:
  - `src/lib/localLedger.ts`: Implement strict Regex validation on the `zip` parameter (`/^\d{5}$/`) to prevent SoQL injection before interpolating it into the Socrata `$where` clause. Throw an error if validation fails.
  - `src/components/GlobalNav.tsx`: A Client Component. Renders `<nav>` with semantic `next/link` items for Citywide (`/`), Local (`/local`), TDI (`/tdi`), and Auditor (`/auditor`). It will hide itself during `@media print`.
  - `src/app/layout.tsx`: Updated to render `<GlobalNav />` at the top of the `<body>`.
  - `src/app/[[...borough]]/page.tsx`: Add hero cards at the top of the dashboard explicitly linking to the Local Ledger (`/local`), TDI Leaderboard (`/tdi`), and SIP Auditor (`/auditor`). Include a small disclaimer on the TDI card about the `deaths*10` weighting.
- **Intellectual Control**:
  - `GlobalNav` MUST pass 100% of `axe-core` accessibility checks.
  - Zero-Trust: User input (`zip`) MUST be strictly validated before database querying.
- **Files** (max 5):
  1. `src/lib/localLedger.ts` (modify)
  2. `src/components/GlobalNav.tsx` (new)
  3. `src/components/GlobalNav.test.tsx` (new)
  4. `src/app/layout.tsx` (modify)
  5. `src/app/[[...borough]]/page.tsx` (modify)

[FORCES]
1. **Zero-Trust**: Do not interpolate untrusted inputs into Socrata queries without strict type/shape validation.
2. **Simplicity > Pattern Purity**: A simple sticky header is preferred over complex sidebars.
3. **Accessibility**: All navigation must use `<nav>` landmarks and readable focus states.
