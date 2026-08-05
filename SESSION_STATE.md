# Sprint Ledger — MVCC Data

**Current objective:** Task 2 of the walking skeleton — mount a Recharts chart over the deaths-
per-year table Task 1 already built and audited. Pre-declared in `SPEC.md`, not yet dispatched to
Cedar for a full `[SPEC]`.

## Active

- **Both completed SPECs are audited and closed.** Cypress PASS on 2026-08-05, one pass covering
  the scaffold (checklist a–f) and the platform guard (acceptance clause + constraints 1–8). No
  critical violations; seven non-blocking recommendations, all recorded in `SPEC.md` § Carried
  forward. `SPEC.md` is now reset and holds no active work.
- **Committed and pushed** (2026-08-04) — `14b2960` scaffold, `4f396e1` platform guard, `d2cedb9`
  SPECs + ledger. Split by concern rather than by edit order, so the guard's rationale isn't buried
  in the scaffold commit. *Audit note:* this means SPEC 2's `@types/node` and lockfile changes
  actually landed in `14b2960`, not `4f396e1` — all three file outputs are present and correct,
  only the commit boundary differs from the SPEC's file list. Not a violation.
- **Two hook defects the audit surfaced**, both in `.claude/hooks/stop-quality-gate.sh` and both
  **pre-existing** (they predate `4f396e1`), so neither is a regression from the platform SPEC:
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90) — the `[ -x ]`
     guards skip both checks, `failed` stays 0, and the gate prints "clean" having run nothing.
     Reproduced on an empty `node_modules/`. This is the same failure class the platform SPEC
     existed to eliminate, one layer down, and it fires on any interrupted `npm install`.
  2. **The all-clear line can print an empty version** (line 104) — it re-invokes `node -v` rather
     than reusing the captured value, so an unresolvable `node` yields `(Node )` in the very line
     that exists to make the platform auditable.

  Both belong to the next SPEC that touches that file. Cypress may not edit it; Redwood or Banyan
  must. Neither blocks the skeleton.
- **Docs task CLOSED (2026-08-05).** Both batched items landed:
  1. `docs/project-mvcc-data.md` § Handoff amended in place — the three superseded kickoff clauses
     (subdirectory + its own `AGENTS.md`, move the PRD, record §5.6 there) replaced with a dated
     note explaining why each was retired, rather than silently deleted. `f77ae1c`.
  2. README § Stack gained one line naming the Node floor (`>=22.22.2`, pinned in `.nvmrc` and
     `engines.node`) and that a fresh clone needs `fnm`/`nvm` to pick it up. `c9e28b9`.

  Committed and pushed. **The fresh-clone gap is now down to two undocumented out-of-band steps**
  (the `settings.local.json` env block and `.git/hooks/commit-msg`) — the third, fnm + Node 22, is
  now named in-repo even though the wiring that reads `.nvmrc` still lives outside it.
- **Walking-skeleton Task 1 CLOSED (2026-08-06).** First application code in the repo:
  `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, `src/app/page.tsx` — the deaths-per-year
  metric, live from Socrata, rendered as an accessible table (FR-1/8/10/11, NFR-1–4). Cypress audit
  PASS, standard ordering (tests first, then implementation, then audit — the first SPEC here to
  use standard order rather than the SPIKE override the two prior SPECs used). Live figures
  independently re-verified against PRD Appendix A with **zero drift across all 8 years**, including
  the fragile 2025 endpoint. Full phase-by-phase narrative and the two bugs found mid-flight
  (a TDZ bug in Cypress's own test, and `next dev`/`build` auto-dirtying `CLAUDE.md`) are in
  `## History` below and in the archived SPEC. Commits: `4e63717` (SPEC) → `503c239` (tests) →
  `9ca19e4`+`7fc0050` (implementation + test fix) → this ledger update. All pushed.
- **Next: Task 2 (the Recharts chart)** — pre-declared sketch in `SPEC.md`, needs a fresh Cedar
  pass for a dispatch-ready `[SPEC]` before Magnolia builds it. Two standing gotchas Task 1 found,
  now recorded in `SPEC.md`'s standing clauses so Task 2 doesn't rediscover them: `@/*` path-alias
  imports don't resolve under Vitest (use relative imports in test-covered files), and `next dev`/
  `build` auto-dirty `CLAUDE.md` (revert with `git checkout`, never commit or "fix").
- **Harness platform fix CONFIRMED LIVE** (2026-08-05): `node -v` in the Bash tool now prints
  `v22.23.2` and `which node` resolves under the fnm v22 tree. Fix was `env.PATH` in
  **`.claude/settings.local.json`**, gitignored (machine-specific, absolute path under
  `/home/rhaeyyan`), so **a fresh clone must redo it**, alongside the fnm install and the
  `.git/hooks/commit-msg` guard. Reproducing the Node 20 failure path now takes deliberate effort —
  `env PATH=/usr/local/bin:/usr/bin:/bin`.
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. Deferred rather than blocking because `jsdom`/`@testing-library/*` are dev deps
  and `next build` doesn't run tests — a Vercel image on Node 20 would still build green, so the
  divergence surfaces only as local-vs-deploy drift in Route Handler behavior.
- **Machine changes outside the repo, needing re-doing on any other machine:**
  `~/.config/fish/conf.d/fnm.fish` (new) and an appended block in `~/.bashrc` (existing file
  edited). Both silence fnm's "Using Node" banner in non-interactive shells — it lands on **stdout**
  and would contaminate parsed command output.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; its absence is not a gap to close.
  Rationale and revisit trigger in `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform: Node v22.23.2 / npm 10.9.8**, per-project via `fnm` + `.nvmrc`. fnm's `default` alias
  is `system`, so only `.nvmrc` directories switch; `/tmp` and `$HOME` still yield the system
  v20.19.6. `engines.node` is `>=22.22.2`.
- **Standing rule — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Standing acceptance clause (Amendment 3(b)), binds every future SPEC:** acceptance-by-command
  must record `node -v` beside the results, and it must satisfy `engines.node`. A gate that ran on
  an unverified platform produced an unverified result; unverified is not PASS. NFR-4 pointed at
  the toolchain.
- **`eslint@^9` is required, not merely unbumped.** The discriminator is *not* `eslint-config-next`
  (permissive, `>=9.0.0`) — it is **`eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes
  eslint 10**, the plugin NFR-3 depends on. Check that package first before evaluating eslint 10.
- **Styling is CSS Modules**, not Tailwind — chosen on reversibility, not taste. Tailwind is two dev
  deps and a PostCSS config to add later; removing it means unwinding class attributes across every
  component Magnolia will have written by then.

## History

- **2026-08-06 — Task 1 of the walking skeleton shipped: deaths per year, live from Socrata,
  standard TDD order, Cypress audit PASS.** First application code in the repo.
  - *Why the skeleton split into two tasks instead of one.* Cedar found the full slice (data +
    Route Handler + page + a `'use client'` Recharts component + its CSS) was 6+ files against
    Rule 5's 5-file cap, and none of the six qualified as generator-output-class the way the
    scaffold's exemption did. Rather than spend another bounded exemption, Cedar split on the
    agent boundary: Redwood builds data + the NFR-3 table now, Magnolia adds the chart over it
    later. Presented to the human as an explicit decision point in plan mode rather than assumed —
    approved as proposed.
  - *Why the page imports the fetch function directly instead of calling its own Route Handler
    over HTTP.* Self-fetching needs an absolute URL the server doesn't portably know, fails during
    `next build`'s prerender when no server is listening, and adds a redundant round trip and a
    second caching layer. The Route Handler still exists — not decorative — because NFR-2 and the
    Stack table name it as the token-handling mechanism, and it's the black-box surface Cypress
    tests and a human can `curl`. One query, one schema, one validator, in one module, imported by
    both faces.
  - *The one constraint with no mechanical net, named before it could be discovered the hard way.*
    `guard-data-integrity.sh`'s pinned-figure list only covers 26 six-digit literals (collisions,
    injuries, casualty-filtered) — three-digit deaths values would false-positive the hook on every
    ordinary integer, so they're deliberately absent from it. Cedar flagged this in the SPEC itself
    rather than let it surface as a surprise at audit time; Cypress's audit (grep across all
    non-test source for the 8 real deaths figures) was the only protection, and it held.
  - *A bug found mid-implementation was routed to its owner, not fixed by whoever found it.*
    Redwood hit a `ReferenceError` in Cypress's own `page.test.tsx` — a `vi.mock` factory closing
    over a plain top-level `const` that Vitest's mock-hoisting evaluates before its temporal-dead-
    zone initialization (the same pattern the file's own `fetchDeathsPerYear` was correctly
    wrapped in `vi.hoisted()` for, two lines above the bug). Redwood diagnosed it precisely, built
    an isolated repro, and **declined to touch the file** — test files are Cypress's alone. The
    orchestrator relayed the diagnosis to the same Cypress invocation (continuation, not a
    respawn, so it kept its authoring context) rather than fixing it in the main session, which
    would have been faster but would have blurred who owns test correctness. One-line fix,
    verified against the exact failure it corrected. No rejection loop needed — this was a test-
    authoring bug surfaced during implementation, not a Cypress FAIL of Redwood's work after audit.
  - *A second hazard reappeared after being fixed once, and that was expected, not a regression.*
    `next dev`/`next build` auto-append a `<!-- BEGIN:nextjs-agent-rules -->` block to `CLAUDE.md`
    (Next 16's `generate-agent-files.js`) on every run. Redwood reverted it during implementation;
    it came back during Cypress's independent `npm run dev` verification pass, and the orchestrator
    reverted it again before archiving the SPEC. Recorded as a standing clause rather than a bug
    to fix, since it's a generator side effect outside the repo's control — the fix is "revert
    after every dev/build run," permanently, not a one-time cleanup.
  - *The audit didn't trust the implementer's own evidence.* Cypress re-ran the live Socrata query
    independently (`npm run dev` → `curl` → kill the server) rather than diffing Redwood's pasted
    response body, and re-derived the FR-8 invariant by reading `src/lib/deaths.ts` directly rather
    than trusting its own pre-written test's pass. Both matched. This is the same discipline the
    2026-08-05 audit established for the scaffold SPEC (verify cold, not from a report) — now
    applied to live data, not just static files.

Older entries are in `ARCHIVED_SESSIONS.md` (the 2026-08-05 audit of both kickoff SPECs — the
scaffold's file bound proven by byte-comparison, the fake-green hook defect it found; the two-SPEC
toolchain build-out — the bounded generator-output exemption, the Node 20 halt and the per-project
platform raise, and `engine-strict`'s rejection on efficacy; README diagram rebuild and the
`ARCHITECTURE.md` deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude
Code agent configuration and the GEMINI.md parity drop; the `.gitignore` / NFR-2 gap).
