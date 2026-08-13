# Vision Zero Shadow Ledger: Unified Navigation & App Shell

This plan details how we will integrate the four distinct features (Hyper-Local Ledger, TDI Leaderboard, SIP Auditor, and the main Borough Dashboard) into a cohesive, narrative-driven product. Currently, the pages exist in silos with no way for a user to discover them. We will solve this by introducing a global app shell and restructuring the home screen to act as a proper landing hub.

## User Review Required

> [!NOTE]
> **Navigation Placement & Theming**
> I am proposing a persistent **Top Navigation Bar** that will live in `layout.tsx`. It will stick to the top of the viewport and provide direct links to the 4 core tools. It will use the existing Glassmorphic aesthetic (Obsidian background, frosted blur, and Emerald Teal hover states).
> The Print Button (Phase 4) will remain as a floating action button in the bottom right, so it is decoupled from the main navigation.

## Reviewer Findings — Blocking, Read Before Open Questions

> [!WARNING]
> **Scope integrity: two of the four "features" this plan unifies are not sanctioned product
> scope.** Reviewed against `docs/project-mvcc-data.md` (PRD), `SPEC.md`, `ARCHIVED_SPECS.md`,
> `ARCHIVED_SESSIONS.md`, and `docs/adr/`. Neither has an FR/NFR citation, a `[SPEC]`, or an ADR
> anywhere in the project's history.
>
> 1. **TDI Leaderboard _is_ the "Danger Index."** `src/lib/tdi.ts` computes
>    `((deaths*10 + injuries) / population) * 10000` per borough and labels it the "True Danger
>    Index." PRD §6 (Out of Scope) states verbatim: _"The Danger Index / safe-routing algorithm —
>    deferred indefinitely... it is a separate product, not a feature of this one."_ The PRD's
>    stated reason for deferring it — the lack of "a defensible severity-weighting scheme" — is
>    exactly the problem with the `deaths*10` weight in the code, which cites no methodology.
> 2. **SIP Auditor re-implements a feature already rejected.** `src/lib/auditor.ts` +
>    `src/lib/fixtures/sips.json` compute before/after collision deltas at Street Improvement
>    Project sites. `ARCHIVED_SESSIONS.md` (2026-08-04) records this exact idea being evaluated and
>    turned down: _"Rejected — ingesting SIP data. Separate DOT open dataset requiring NTA-level
>    census joins; out of scope for a two-dataset MVP."_ The current version avoids the census-join
>    problem with a small hand-typed fixture, but it's the same rejected feature.
>
> By contrast, `/local` (Phase 1, spec approved 2026-08-12 per `SESSION_STATE.md`) and the Staten
> Island pilot panel (PRD P2 story) are legitimate — this is not a claim that everything outside
> the PRD's walking skeleton is suspect, just these two.
>
> **This plan, as written, gives both permanent top-nav billing** ("True Danger Leaderboard,"
> "Street Redesign Auditor") alongside the sanctioned features. Building navigation infrastructure
> around them doesn't just expose pages that already exist — it promotes two out-of-scope,
> unspecced features into the product's primary information architecture as a side effect of an
> IA task. **That decision needs to be made explicitly, by Rayan, before any nav work starts:**
> either sanction TDI and the SIP Auditor via a PRD v1.3 amendment (with a cited severity-weighting
> methodology for TDI, and a documented SIP data source), or pull/quarantine them behind no nav
> link until that happens.

> [!NOTE]
> **Process gaps in this plan itself**
>
> - Not cast as a Cedar `[SPEC]`/`[FORCES]` block — no Requirement/FR citation, no Design Pattern
>   line, no Tipping Point, despite being a non-trivial architectural change (Rule 1).
> - Not persisted to `SPEC.md` — that file still holds the earlier Phase 4 PrintButton spec.
> - The Verification Plan's "Manual Verification" step assumes a live-browser dev-server
>   walkthrough is feasible in-session. `SESSION_STATE.md` already records: _"No working browser in
>   this sandbox, and it's not fixable here... Live-browser visual QA genuinely needs a human with a
>   browser."_ Rewrite this section around Cypress + `axe-core` as the actual automated check, with
>   the click-through explicitly deferred to Rayan.
> - Open Question 2 ("Hero Cards") is asked as undecided, but Proposed Changes already commits to
>   building the "Narrative Header / Feature Hub" as if answered. Resolve the question before
>   specifying the change it gates.

> [!NOTE]
> **Adjacent issue, surfaced during review, not part of this plan's scope**
> `src/lib/localLedger.ts` interpolates the raw `zip` query param directly into a SoQL `$where`
> clause with no validation (`` `zip_code = '${zip}'` ``) — an unsanitized-input-into-query pattern
> on the very route (`/local`) this plan proposes to spotlight via a global nav link. Worth fixing
> before widening that route's visibility, independent of the nav decision.

## Open Questions

1. **Routing Structure:** Currently, the main "Borough Dashboard" lives at the root route (`/` or `/K`, `/M`, etc). Do you want to keep the Borough Dashboard as the root homepage, and simply add a Navigation Bar that links out to `/local`, `/tdi`, `/auditor`? Or would you prefer a completely new Landing Page at `/` that explains the product, with the Borough Dashboard moved to something like `/boroughs`?
   _(I recommend keeping the Borough Dashboard at `/` and just adding a rich header/navigation, as it gets users into the data immediately)._

   > **Reviewer response:** Agree on keeping the Borough Dashboard at `/` — it's the PRD's actual
   > walking skeleton and moving it would be a bookmark-breaking, hard-to-reverse change with no
   > offsetting benefit. But the nav bar shouldn't link out to all three tools uniformly yet: `/local`
   > is sanctioned (Phase 1, approved spec) and can link from day one. `/tdi` and `/auditor` should
   > stay unlinked from any global nav until the scope question in **Reviewer Findings** above is
   > resolved — a nav bar is exactly the kind of "quiet promotion" that needs to wait on that
   > decision rather than precede it. If Rayan wants them visible sooner for demo purposes, that's a
   > distinct, explicit call to make now, not a default.

2. **"Data Story" Integration:** Should we add "Hero Cards" at the top of the homepage that explain _why_ these other tools exist and link to them? (e.g., a card saying "Is your neighborhood actually safe? Check the True Danger Index →").

   > **Reviewer response:** Hold off on any card that editorializes the TDI or SIP Auditor findings
   > ("Is your neighborhood actually safe?") — that copy asserts the arbitrary `deaths*10` weighting
   > is a validated safety judgment, which compounds the exact risk PRD §6 flagged when it deferred
   > the Danger Index for lacking "a defensible severity-weighting scheme." Writing marketing copy
   > around an unsanctioned metric is worse than just linking to it quietly. A hero card introducing
   > `/local` ("Check what's happening in your ZIP code →") is fine now since that feature is
   > sanctioned. Revisit TDI/auditor cards only after the scope decision lands.

## Proposed Changes

### UI & Architecture Layer (Magnolia)

#### [NEW] `src/components/GlobalNav.tsx`

- A client-side navigation component utilizing `next/link`.
- Renders links to:
  - **Citywide Dashboard** (`/`)
  - **True Danger Leaderboard** (`/tdi`)
  - **Local Neighborhood Search** (`/local`)
  - **Street Redesign Auditor** (`/auditor`)
- Styled as a frosted glass Topbar (`backdrop-filter: blur(12px)`) that remains sticky at the top of the screen.
- Includes `@media print { display: none !important; }` so it doesn't pollute the printed briefing sheets.

#### [NEW] `src/components/GlobalNav.module.css`

- CSS module for the navigation styling, matching the premium dark mode aesthetics.

#### [MODIFY] `src/app/layout.tsx`

- Import `<GlobalNav />` and mount it at the top of the `<body>`, above `{children}`.
- Update global padding if necessary to account for the sticky header.

#### [MODIFY] `src/app/[[...borough]]/page.tsx`

- Add a "Narrative Header" or "Feature Hub" at the top of the dashboard, above the data charts.
- These will be visually distinct "Cards" that introduce the other tools, connecting the citywide data to the hyper-local tools.

## Verification Plan

### Automated Tests

- Cypress will write a test for `GlobalNav.tsx` to verify all 4 links are present, accessible (`role="navigation"`), and functional.

### Manual Verification

- We will navigate the live dev server, ensuring a user can seamlessly move from the Homepage -> TDI -> Local -> Auditor without relying on manual URL entry.
- We will trigger the Print action to verify the new Topbar is correctly hidden from the Phase 4 PDF output.
