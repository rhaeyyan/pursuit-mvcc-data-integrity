# Archived Sessions — MVCC Data

Older `## History` entries moved out of `SESSION_STATE.md` when it crossed the archive threshold
(150 lines / 5 sessions). Condensed per CLAUDE.md § Session Continuity and
`docs/adr/0001-preserve-reasoning-when-condensing.md`: **the reasoning is the payload.** Procedural
detail is dropped freely; why an option was rejected, why a scope line was drawn, and what
constraint forced a design are kept, because those are what a future session cannot re-derive.

---

> **Filing note (2026-08-14).** This file is *mostly* newest-first, but
> "2026-08-13 — MVCC Workspace 3-column redesign" was appended at the **end** (~line 1264) rather
> than the top. Left in place rather than reordering 1,300 lines for cosmetics — but don't assume
> position implies date when searching.

## 2026-08-14 — FR-6/FR-7 and the deploy thread archived; three ledger claims falsified

Archived because `SESSION_STATE.md` hit 264 lines against a 150-line threshold. `## History` was
empty — this project archives closed work directly — so the overflow was closed `## Active` items.
**Three of them turned out to be false, not merely finished**, which is the more valuable half of
this entry.

**Falsified claims (the ledger contradicted the repo; per CLAUDE.md these are surfaced, not
silently dropped):**

- _"The Node-platform mismatch is solved … it now self-verifies: 'Quality gate clean … (Node
  v22.23.2)', exit 0."_ **False as of 2026-08-14** — `stop-quality-gate.sh` reports
  `actually running: not found` and blocks. The 2026-08-08 diagnosis was correct *for its day*
  (three stale `~/.local/bin` symlinks that `.bashrc` prepended **after** nvm loaded, shadowing
  every nvm selection). What broke it since is different: the **Homebrew nvm path
  `/usr/local/opt/nvm/nvm.sh` no longer exists**. The lesson worth keeping is the count — this is
  the **third** toolchain regression (fnm vanished 2026-08-07, nvm vanished 2026-08-11, the
  Homebrew nvm path vanished 2026-08-14). Treat the toolchain as unstable infrastructure:
  **verify `node -v` at point of use; never trust a recorded invocation recipe.** The hook itself
  is not at fault and was deliberately left unmodified — it sources no nvm by design, just calls
  `node -v` and refuses to certify a platform it cannot confirm. That strictness is the feature.
- _"Deploy `[SPEC]` … no Vercel project is connected yet, this SPEC stays blocked."_ **Superseded**
  — the app has been live at `pursuit-mvcc-data-integrity.vercel.app` since 2026-08-11, so the
  blocker cleared without the entry being retired. Reasoning kept: three consecutive Cedar planning
  rounds could not resolve this by reading the repo, because **it was never a repo-answerable
  question** — some preconditions live outside the tree and only the human can settle them. Cedar
  should ask rather than re-plan when a blocker has that shape.
- _"Record `/`'s First Load JS."_ Retired, not deferred — Next 16 removed the metric from
  `next build` output. Bundle tracking now means Lighthouse CI or Vercel Analytics, i.e. a new
  SPEC, not a retry of this one.

**Plain-English copy pass (`699d998`, 2026-08-13) — why a wording pass is worth an archive entry:**

- _It caught two factual bugs, not just wording._ (1) Every dashed/dotted series shared one inline
  note, "affected by reporting decline" — **factually wrong for the arrests line**, which is dashed
  because it is a *different dataset*, not because reporting declined. `SeriesDef` gained an
  optional per-series `dashNote`, so FR-3's never-colour-alone rule is still met and is now also
  accurate. The general lesson: a shared caveat string silently becomes a false claim the moment a
  second thing adopts the same visual encoding for a different reason. (2) Raw dataset IDs were
  being shown as the "Source" value; now plain name first, ID retained.
- _Why the honesty guardrails were re-checked line by line:_ **plain language is exactly where
  these get softened by accident.** Correlation-only framing on arrests, the explicit
  no-causal-claim sentence, the "we can't verify SI borough labelling across the switch"
  limitation, and the one causal claim the product *is* allowed to make (policy change →
  reported-count drop) all survived intact — but only because they were audited deliberately
  rather than trusted to survive a rewrite.
- 13 tests updated, all assertions against old copy strings; no behavioral regressions. Two needed
  re-scoping rather than re-wording: plainer fallback text now repeats on a page (banner and table
  share a "couldn't load" message) so `getByText` went ambiguous, and the blocked-borough
  percentages are interpolated mid-sentence and are now asserted against `textContent`.

**FR-6/FR-7, closed work — why the design went the way it did:**

- _Why six phases cut where they were:_ Cedar cut along **contract** boundaries, not file counts:
  1 vocabulary+transport → 2 crash-metric propagation → 3 arrests propagation → 4 FR-6 closed (UI
  switch-on) → 5 FR-7 coverage data → 6 FR-7 closed (banner). **The 3 | 4 cut is the forced one.**
  Phases 1–3 are each provably invisible (every caller still defaults to no borough); shipping the
  picker before arrests propagated would have rendered four panels labelled "Brooklyn" beside a
  fifth silently still citywide — the mislabelled-figure failure this product exists to criticise.
- _Why Cedar declined the `socrata.ts` Strategy/registry escalation it had itself pre-named:_ with
  the concrete case in hand, "metric × borough" is **one more AND-ed conjunct on the axis already
  parameterised**, not a second dimension. The genuinely new force was a **trust boundary** (a URL
  param reaching a SoQL string), which a closed union type solves and a pattern does not.
  Replacement Tipping Point recorded: a third orthogonal filter axis, or a caller needing to vary
  `$group`/`$order`/the dataset ID.
- _The HITL override:_ three calls approved, one overridden — the human ruled `arrest_boro`
  coverage **will** be measured, so FR-7's banner speaks to all five filtered series. That trips
  `arrests.ts`'s Tipping Point (a second `8h9b-rp9u` caller) and widens FR-7 past its literal PRD
  text. Phases 1–4 unaffected.
- _Why the `/grill-me` decisions left this file:_ the four settled decisions (URL search param
  wiring; all five series in scope; one page-level FR-7 banner; FR-7 figures computed live) were
  moved verbatim to `SPEC.md` § Standing decisions on 2026-08-08 — they **bind Phases 2–6**, so
  they belong where Cedar reads them, not in episodic memory. The load-bearing open assumption
  lives there too (the banner must name which series its caveat covers, or NFR-5 is violated).
- _Phase 1 closed (2026-08-08):_ `boroughs.ts` (new) + `socrata.ts` (+23/−9), Cypress PASS,
  478/478. The page was proved unchanged by **computing byte-identity, not asserting it** — HEAD
  and tree extracted to two scratch trees and all four FR-8 contracts diffed. Worth copying as a
  technique whenever a refactor claims "no visible change".
- _FR-5 closed (2026-08-07):_ arrests panel; `9d1be76`/`123aada`/`672b16a`. Narrative already in
  this file, SPEC in `ARCHIVED_SPECS.md`.
- _NFR-1 borough-caching gap closed_ (`f2611bf`, live-verified 2026-08-11): all six variants
  prerender via `generateStaticParams`; the redesign moved the path to
  `src/app/(workspace)/[[...borough]]/page.tsx` with `generateStaticParams`/`dynamicParams`/
  `revalidate` carried over unchanged. Why `cacheComponents` was declined is in the 2026-08-11
  entry.
- _`/doctor` config pass (2026-08-08):_ full reasoning in the 2026-08-08 entry. The two
  load-bearing residues are promoted to Context Cache rather than archived, since they still bind
  every session: handoff schemas exist **only** in the `handoff-schemas` skill, and `github`'s MCP
  is off on a **fault**, not disuse.

---


## 2026-08-12 — Staten Island pilot panel, chart/UI half

- _Why we wrote `StatenIslandPilotPanel.tsx` as a separate component:_ `YearlyLineChart` and `MetricSection` are structurally yearly components (mapping fields like `row.year`, checking policy markers by year). The Staten Island pilot is a 24-row monthly dataset (Jan 2018–Dec 2019) with its own statistics payload. Forcing a unified component or type would have created premature, wrong-shaped generic complexity (`Simplicity > Pattern Purity`).
- _How we handled the split solid/dashed rendering in Recharts:_ We mapped rows into `plotData` containing `pre` and `post` keys. Pre-boundary months populate `pre`, post-boundary months populate `post`, and the boundary month ("2019-03") populates both. This allows Recharts to draw two continuous lines (solid and dashed) connected at the exact transition point without any visual gap.
- _Defensive Edge Case 3 handling:_ If the boundary month derived from `POLICY_DATE_MARKERS` does not fall within the dataset's range, we render the entire series as a single solid line (`pre` only) and hide the post-boundary line and reference lines, preventing crashes or fabricated segmentations.
- _Test mock correction in page.test.tsx:_ The mock stub in `page.test.tsx` was updated to render a `<details>` block query disclosure. This satisfies the page-wide assertion expecting 7 query disclosures (5 metric sections, 1 coverage warning, and 1 pilot panel), ensuring test suite alignment with the contract's unconditional query presentation rule.

---

## 2026-08-12 — Fallback banner wiring

The fallback-fixture SPEC's own Tipping Point named this wiring as the deliberate follow-up: the
mechanism existed and was tested, but nothing on the page yet used it or told the reader when a
number had come from cache instead of live. `ARCHIVED_SPECS.md`, "2026-08-12 — Fallback banner
wiring (CLOSED)" holds the mechanical record; this entry keeps why it was built the way it was.

- _Why the banner is a plain sibling in `page.tsx`, not threaded through `MetricSection`._
  `MetricSection`'s `result` prop type carries no `source` field and the component only ever reads
  `.status`/`.rows` — passing a wider shape in would type-check under TS structural typing but the
  component would have no way to act on it. `MetricSection.tsx`'s own header already documents the
  precedent this follows: the deaths chart itself is a plain sibling in `page.tsx`, not routed
  through a shared slot, because only one caller needs it. Extending a shared component's prop
  contract for a single caller's concern would have been the coupling this project's Rule 8
  ("patterns are earned") argues against.
- _Why passing `undefined` as the fixture whenever a borough filter is active is enforcement, not a
  gap._ The fallback-fixture SPEC had already scoped the mechanism to citywide-only, specifically
  so a borough-filtered page could never silently display all-NYC numbers under a borough heading.
  This SPEC's job was to enforce that decision at the one place it becomes observable, using
  `withFallback`'s own existing Edge Case 3 (no fixture provided → passthrough) rather than adding
  new branching to re-litigate a decision that was already closed.
- _The second cross-cutting collision this project has hit, and why it resolved differently from
  the first._ Seven pre-existing tests mocked a citywide deaths fetch as `kind: "upstream"` purely
  to test cross-metric/Caveats independence — unrelated to fallback behavior when written, but
  `kind: "upstream"` is exactly the shape `withFallback` now treats as substitutable. Unlike the
  Staten Island data-half collision (which required _widening_ a security allowlist, a real
  judgment call), this was a mock whose _label_, not its intent, had drifted out from under a new
  correct behavior — Redwood correctly declined to weaken the new wiring or touch tests outside its
  authorization, and escalated. Cypress's fix was narrow by construction: change only the `kind`
  field (`"upstream"` → `"contract"`) in those 7 mocks, preserving every existing assertion
  byte-for-byte, because a contract violation is unconditionally excluded from substitution
  regardless of borough state — the tests' original intent (cross-metric independence) was
  preserved exactly, just expressed with a mock shape that no longer collided with new, correct
  behavior.
- _Why the banner shipped deliberately undecorated._ The SPEC's own UI Scope split it as structural
  (a new DOM element, conditionally rendered) but explicitly cosmetic-deferred styling to a named
  follow-up, keeping the file count at 4 of the 5-file cap and matching the project's established
  data/UI split (the same split FR-3, the NFR-1 fix, and the Staten Island panel all used). Visual
  polish for an already-correct, already-accessible (`role="status"`) element is Magnolia's to pick
  up separately, not a reason to hold the wiring SPEC open.

---

## 2026-08-11 — Fallback fixture mechanism

PRD §7's risk register names the mitigation in one line — "commit a dated JSON snapshot... as a
documented fallback fixture" — but that line hides a real design trap: a naive reading is
indistinguishable from the exact NFR-4 violation this product exists to criticize (a verified
figure pasted into source, correct today, unaccountable tomorrow). `ARCHIVED_SPECS.md`, "Archived
2026-08-11 — Fallback Fixture Mechanism" holds the mechanical record; this entry keeps why it was
built the way it was.

- _Why the fixture's numbers are trustworthy despite being a committed JSON literal._ The
  distinction that matters isn't "is this a literal" — it's "who typed it and how." Every other
  literal this project blocks was a human or model asserting a fact from memory. This fixture is
  the stdout of running already-tested, already-shipped code (`fetchDeathsPerYear()`) once and
  writing down what it returned — the same "compute deterministically, summarize generatively"
  discipline `verify-figures.py` already established, applied to a build artifact instead of a
  chat response. Verified against the actual mechanical guard before writing the SPEC, not
  assumed: `guard-data-integrity.sh` only scans code extensions and separately exempts any
  `fixture`-named path, so the JSON is the sanctioned case, not a loophole.
- _Why substitution is gated on `kind: "upstream"` and nothing else._ An unreachable API and a
  broken query are different failure classes with opposite correct responses. Socrata being down
  is exactly what caching should paper over. An absent aggregate or a malformed row is the precise
  shape of failure this entire product was built to make visible — masking that with a cache would
  quietly reintroduce the silent-zero problem NFR-4 was written to prevent, just one layer removed
  from where the rule text says to watch for it. `withFallback`'s three-line branch is short
  enough that this reasoning could get lost in a future refactor if it isn't written down
  somewhere the code doesn't carry it.
- _Why the fixture is citywide-only and deaths-only, and why neither is a shortcut._ A
  borough-filtered page silently served citywide fallback numbers would misrepresent what's on
  screen — narrower scope here avoided a real correctness bug, not just extra work. Deaths-only
  is Rule 6's walking-skeleton discipline applied to an availability concern for the first time
  this project has needed it: prove the mechanism once, cheaply, before repeating it four more
  times for injuries/collisions/repaired-collisions/arrests once real wiring exists to justify the
  repetition.
- _Why Redwood's module-resolution shim was accepted rather than treated as a red flag._ Plain
  Node ESM and Next.js's `bundler` moduleResolution disagree on whether an extensionless relative
  import (`"./socrata"`) is valid — the app's own source uses that style throughout, correctly,
  under Next's resolution. A generator script that needs to import real app code from outside
  Next's build pipeline hits that gap directly. The alternative (adding `.ts` extensions to every
  import in `socrata.ts`/`deaths.ts`/`boroughs.ts`) would have meant editing three files Rule 4
  freezes as a query contract, for a reason that has nothing to do with query correctness. A
  ~10-line inline resolution hook, scoped to retry only a failed relative specifier and only within
  the generator script's own process, was the narrower fix — verified narrow by reading the whole
  script, not just trusting Redwood's own characterization of it.
- _Why the orchestrating session re-ran the generator live twice after implementation, rather than
  trusting the committed file plus Redwood's report._ The first independent run hit a genuine
  transient Socrata network failure — the script correctly exited non-zero and wrote nothing,
  leaving the previously-good fixture untouched. That was not a problem to route around; it was
  Edge Case 6 firing for real, in the wild, which is stronger evidence the mechanism works than
  any stubbed test could provide. The second run succeeded with figures identical to the committed
  fixture, differing only in `asOf`. Both outcomes were worth having on the record.

---

## 2026-08-11 — Staten Island pilot panel, data half

PRD §3's P2 story ("see the Staten Island pilot window on its own") and §7's residual risk item
("some share of the drop may still be genuine... magnitude, not direction") both point at the same
gap: the thesis had never been given an actual number for how big the reporting-artifact effect is
in isolation from COVID. This session closed the data half of that gap. `ARCHIVED_SPECS.md`,
"Archived 2026-08-11 — Staten Island Pilot Panel, Data Half" holds the mechanical record; this
entry keeps the reasoning.

- _Why the query was run live during SPEC drafting, before any test or implementation existed._
  This project's own precedent (see the FR-6 Phase 1 entry below) is that a query fact is never
  handed off from recollection, even a basic one. Running `date_trunc_ym(crash_date)` live before
  pinning it in the SPEC did two things a citation to Appendix A couldn't: confirmed the function
  name and grouping behavior actually work as expected (not assumed from familiarity with
  `date_extract_y`), and surfaced that Socrata returns `month` as a full floating timestamp
  (`"2018-01-01T00:00:00.000"`), not the `"YYYY-MM"` shape a reader of the skill's prose table
  might reasonably guess. That single probe turned a plausible-sounding SPEC into a verified one
  and pre-empted an implementation surprise.
- _Why this became a new, self-contained module rather than a fourth parameter on `socrata.ts`._
  `socrata.ts`'s own header already states its `$group`/`$order` "stay fixed internal constants...
  that generality remains unearned." This panel needed three simultaneous deviations from that
  file's contract at once — monthly instead of yearly grain, a 2018–2019 window instead of
  2018–2025, and a hardcoded rather than optional borough. Bending one file to cover both shapes
  would have been exactly the premature generality Rule 8 warns against; `arrestsSocrata.ts` had
  already established the alternative (a self-contained sibling module) for an analogous reason.
- _Why the derived stats functions weren't pulled into their own file, unlike `percentChange.ts`._
  `percentChange.ts` earned separation because it's shared across five metrics. `avg2018Monthly`/
  `avgMayDec2019` have exactly one caller each and no reuse case — splitting them out would have
  been the same unearned-generality mistake in the opposite direction. The distinction that
  matters: a precedent justifies extraction only when the _reason_ it was extracted also applies,
  not just because a superficially similar file exists.
  This SPEC also had a real object lesson in why that instinct pays off: after this SPEC and
  Cypress's first-pass tests were both already approved/written, a genuinely legitimate
  cross-cutting issue surfaced anyway — two pre-existing Zero-Trust confinement tests
  (`arrests.test.ts`, `repairedCollisions.test.ts`) each hardcoded a _closed 3-file_ allowlist for
  who may reference `process.env` in `src/lib`, and neither the SPEC nor Cypress's tests had
  cross-referenced them, because they predate this feature entirely. `statenIslandPilot.ts`
  legitimately needed to read the token itself (Cypress's own contract required a zero-argument
  `fetchStatenIslandPilot()`), so it correctly tripped both as an unlisted 4th offender. Redwood
  found this, correctly judged it outside its 2-file authorization, and explicitly declined the
  tempting shortcut — disguising the `process.env` reference to dodge the grep — naming that move
  as defeating the check's purpose rather than satisfying it. That refusal is the finding worth
  keeping: a security-relevant test failing on legitimate new code is not the same failure shape as
  a test failing on a bug, and treating them identically (patch until green) would have quietly
  broken the actual security property NFR-2 exists to protect.
- _Why the escalation was routed to Cypress rather than fixed directly by the orchestrating
  session, unlike an earlier same-session precedent (the `BoroughPicker.test.tsx` `cleanup()` fix,
  done directly)._ The distinguishing question was whether a judgment call about _what should be
  permitted_ was still open, or only a mechanical fix to _already-approved_ intent remained. The
  `cleanup()` case was pure RTL hygiene — the test already correctly expressed its own intent and
  just needed a bug fixed. This case required widening a Zero-Trust allowlist, which is a judgment
  call about a security boundary — even though the SPEC's own Intellectual Control section had
  already implicitly approved the design (self-contained module, mirroring `arrestsSocrata.ts`),
  actually confirming the new module's token handling was safe before broadening the check is
  exactly the "audit... security" mandate this project assigns to Cypress by role, not to whichever
  agent happens to be holding the file. The orchestrating session verified the module's safety
  independently first (same warn-not-throw pattern, no token logging, no `'use client'`) — but
  verifying is not the same as being the one authorized to change the boundary.

---

## 2026-08-11 — Deploy verification, platform recovery, and the borough-caching fix

The project's first production deploy landed this session
(<https://pursuit-mvcc-data-integrity.vercel.app/>), followed by its first live-traffic
performance finding, two separate platform-toolchain failures, and the fix for the finding —
verified end to end against the live URL, not just locally. `SPEC.md` / `ARCHIVED_SPECS.md`
("Archived 2026-08-11 — NFR-1 Borough Caching Fix") hold the mechanical record; this entry keeps
the reasoning that isn't there.

- _Why the deploy was verified by direct HTTP inspection rather than trusted from Vercel's "deploy
  succeeded" status._ A green build says the code compiled, not that FR-10's error state stays
  unreached or that NFR-2 holds in the shipped bundle. Pulled all 8 client chunks and grepped them
  plus the HTML for the token identifier; only that gave a real answer. The same discipline caught
  the actual finding: every response carried `x-vercel-cache: MISS` with `private, no-cache`, and a
  cold `?borough=K` measured 3.2s against NFR-1's 2.5s budget — invisible from the build log, only
  visible by requesting the live route.
- _Why the fix picked `generateStaticParams` over Next 16's more idiomatic `cacheComponents` + `use
cache`._ Both were read from the vendored Next docs (`node_modules/next/dist/docs/`) before
  deciding, per CLAUDE.md's Next-docs mandate. `cacheComponents` is the general answer for an _open_
  filter domain — it keeps `searchParams` and caches per argument — but enabling it makes
  `dynamic`/`revalidate`/`fetchCache` segment configs **error** project-wide (confirmed in
  `migrating-to-cache-components.md`), which would have rippled into all five existing API routes
  and `socrata.ts`'s `revalidate: 86400` for a fix scoped to one route. The borough domain is
  _closed_ (five FR-6-pinned codes) and provably will not grow without FR-6 itself changing, so
  enumerating it is complete, not an approximation — the narrower tool was correct, not merely
  cautious. The Tipping Point recorded in `SPEC.md` names the reversal condition precisely: a
  second, open-ended filter dimension is what would finally justify the project-wide change.
- _Why `boroughs.ts` was named out of scope in the SPEC's file list rather than just left alone by
  convention._ A performance fix touching the FR-6 pinned code mapping (`B`→BRONX, `K`→BROOKLYN, …)
  is exactly the kind of scope creep Rule 4 of CLAUDE.md's four core rules exists to block — a query
  contract changing as a side effect of an unrelated task. Naming the exclusion in the SPEC made it
  checkable rather than relying on nobody happening to touch the file.
- _Why one Redwood-flagged test failure (a missing `cleanup()` between five sequential `render()`
  calls in Cypress's new loop test, causing RTL to see duplicate comboboxes) was fixed directly by
  the orchestrating session instead of round-tripped back through Cypress._ The project's role table
  restricts test edits to Cypress, but the failure was RTL hygiene, not a judgment call about what
  to test or a disagreement with the SPEC — a full agent dispatch for a one-line fix would have
  violated Rule 5's "surgical: intention over tool-execution rate" in the other direction. The
  distinction that matters: Redwood _finding_ a bug in Cypress's test and Cypress _rejecting_
  Redwood's implementation are different shapes, and only the second is the rejection loop Rule 10
  Banyan mediates.
- _Why the SPEC's own "record First Load JS" acceptance criterion turned out to be unfulfillable,
  not just unmet._ Confirmed directly against `node_modules/next/dist/docs/.../version-16.md:989`:
  Next.js 16 deliberately removed that metric from `next build` output, judging it inaccurate for
  RSC architectures, and points instead to Lighthouse or Vercel Analytics against Core Web Vitals.
  This had sat as an open deploy obligation since the 2026-08-07 precondition; chasing it further
  would have meant reading a number that no longer exists. Retired as originally worded rather than
  left open indefinitely — a future SPEC wanting bundle-size tracking should target Lighthouse CI
  (already a named maybe-later item) or Vercel Analytics instead.
- _Why the platform recovery this session needed is worth keeping, not just the fix._ `nvm` was
  found completely absent (no version manager of any kind — nvm, fnm, volta, asdf, mise, n — and a
  system Node v26.7.0 substituting silently). This is the second toolchain regression this project
  has hit (the first, 2026-08-07, was fnm disappearing), and both times the failure mode was the
  same shape: a shell that _looks_ fine (`node -v` returns a plausible version) but is silently off
  the pinned target. `v26.7.0` was a closer call than the earlier `v24.13.0` trap — it actually
  clears `jsdom@30`'s engine range and produced a genuinely clean local run — so the reason to
  reinstall `nvm` rather than retarget the project to 26 wasn't "this platform is broken," it was
  "Vercel's runtime is 22.x and the pin exists for dev/prod parity, which passing `engines.node`
  doesn't buy." `brew install nvm` (not a piped remote script) plus a `~/.zshrc` sourcing block is
  what makes the _project's own_ `stop-quality-gate.sh` hook's suggested remedy (`bash -ic`/`fish
-i`) actionable again — that hook's advice had been correct in principle but unexecutable while no
  version manager existed at all, which the ledger now no longer mis-describes as "moot."
- _Why `node_modules/` wiping (now 2 occurrences) is recorded as a pattern rather than two
  unrelated incidents._ Same symptom, same intact-repo diagnosis (`.git/hooks/commit-msg` byte-
  identical both times, ruling out "fresh clone"), same recovery recipe both times. Naming it as a
  recurring class rather than re-deriving the diagnosis from scratch next time is the entire point
  of keeping this file.

---

## 2026-08-07 — FR-6/FR-7 planned as six phases; Phases 1–2 closed

A second `/grill-me` round settled four decisions before Cedar wrote any SPEC: URL search-param
wiring (not client state — server re-render, deep-linkable, ISR-friendly, works with JS off); all
five series in scope (matching FR-5's precedent, `arrests.ts` gains an `arrest_boro` param but
stays self-contained); one page-level FR-7 banner rather than five repeated `note` props; FR-7's
figures computed live via SoQL, never typed in. Cedar then cut the work into six phases along
contract boundaries (vocabulary+transport → crash-metric propagation → arrests propagation →
FR-6 UI switch-on → FR-7 coverage data → FR-7 banner) and declined its own pre-named Strategy/
registry escalation for `socrata.ts`. Phases 1 and 2 both closed this session, each in one
Cypress→Redwood pass with no rejection cycle. Full phase table and both closed SPECs are in
`SPEC.md` / `ARCHIVED_SPECS.md`; this entry keeps only the reasoning that isn't there.

- _Why the phase boundary sits between 3 and 4, not somewhere file-count-driven._ Phases 1–3 are
  each provably invisible — every caller still defaults to no borough — so they can land
  independently without ever producing a wrong number on the page. Phase 4 is a single switch-on.
  The alternative (shipping the picker before arrests propagates) would render four panels
  labelled "Brooklyn" beside a fifth silently still citywide — the exact mislabelled-figure failure
  this product exists to criticize, so the cut had to fall exactly there and nowhere else.
- _Why Cedar declined the Strategy/registry pattern it had itself flagged as likely, back when FR-6
  was still hypothetical._ With the concrete case in hand, "metric × borough" turned out to be one
  more AND-ed conjunct on an axis `socrata.ts` already parameterized, not a second dimension a
  pattern would need to encapsulate. The real new force was a trust boundary — a URL param reaching
  a SoQL string — and a closed union type (`BoroughCode`) solves that directly; a pattern would
  have wrapped a single forwarded parameter in ceremony. New Tipping Point recorded in its place: a
  third orthogonal filter axis, or a caller needing to vary `$group`/`$order`/the dataset ID.
- _Why the human's one override (arrest_boro coverage **will** be measured, against Cedar's
  recommendation) forced a real re-plan rather than a small tweak._ It trips `arrests.ts`'s
  already-recorded Tipping Point (a second `8h9b-rp9u` caller) and widens FR-7 past its literal PRD
  text. Cedar's response was to split Phase 5 in two and earn the `arrestsSocrata.ts` extraction it
  had previously declined — the deciding fact it didn't have at the first pass was that the
  coverage denominator must be the arrests panel's own row set, needing the trap-4 five-spelling
  `ofns_desc` clause, not just fetch scaffolding. Declining extraction would have meant a _third_
  copy of the fetch pipeline and a second, silently divergent copy of the offense list. The full
  six-rule honesty framing this override created (no shared visual frame, no computed
  difference/ratio ever existing in code, forbidden-vocabulary list, independent per-field error
  status) is recorded in `SPEC.md`'s "Phases 5–6 revised" section, not repeated here.
- _Why Phase 1's verification probe (live borough-literal query) was made non-closable rather than
  typed from the `mvcc-data` skill's recollection._ The five spellings were expected to match, and
  they did (`BRONX`/`BROOKLYN`/`MANHATTAN`/`QUEENS`/`STATEN ISLAND`, uppercase), but Rule 1 doesn't
  grade on expected outcomes — a figure or a fact typed from memory is a violation even when
  correct. The probe also answered a question recollection couldn't: unpopulated rows arrive as an
  _absent_ `borough` key, not `null` or `""` — trap 1 (Socrata omits keys) surfacing somewhere new,
  and the reason FR-7's future numerator must enumerate the five values positively via `IN (...)`
  rather than `IS NOT NULL`. Derived coverage rates (64.4%→80.1%, 2018→2025; 32.9% row-weighted
  window-unpopulated share) are carried forward in `SESSION_STATE.md` since Phase 5b hasn't
  consumed them into code yet.
- _Why Phase 2's one real risk was a positional-argument trap, not a logic error._ `deaths.ts`/
  `injuries.ts`/`collisions.ts` forward `borough` as `fetchYearlyMetric`'s 4th argument, but their
  3rd (`extraWhere`) slot had never been filled by these callers before — passing `borough` without
  first passing an explicit `undefined` for `extraWhere` would silently shift it into the wrong
  slot and corrupt the `$where` clause without raising a type error a careless read would catch.
  Cedar named this in the SPEC's Edge Case 4 before Redwood ever touched the files, and Cypress
  asserted against it directly (no phantom `AND undefined`, no borough literal in the `extraWhere`
  position) rather than trusting the happy path — the trap was caught by test design, not by
  Redwood happening to get it right.
- _Why Cypress flagging a stale-ledger mismatch at Phase 2's dispatch was correct process, not
  friction._ `SESSION_STATE.md` still read "blocked on HITL approval... not yet answered" when
  Cypress was dispatched, because the human's "go" had arrived in conversation but the ledger
  hadn't been updated yet before the next dispatch. Per CLAUDE.md's "fail loud on mismatch" rule,
  Cypress surfaced this instead of silently trusting the dispatch instructions over the file it
  could see — the right call even though the approval was in fact real. Lesson for future phases:
  update the ledger _before_ dispatching the next agent, not after, so this class of false-positive
  flag doesn't recur.

## 2026-08-08 — `/doctor` config pass: what got cut from `CLAUDE.md`, and why the kept parts stayed

A tooling-maintenance session, no FR work touched and no `.ts` file modified. Install verified
healthy: native 2.1.226 (= latest on the `latest` channel), all five config files parse, all seven
agent definitions carry valid frontmatter with unique names. Disabled 7 never-used skills and 3
never-used MCP servers, trimmed `CLAUDE.md` 272 → 217 lines, migrated the handoff schemas to a
skill. Net ~1.1k est. tokens/session.

- *Why these specific `CLAUDE.md` cuts, and why the neighbouring content survived.* The test
  applied was **derivability**: can a session working in this repo reconstruct the line by reading
  the code? The **Team Roster table** went because the harness already injects every agent's role
  and tool set into each session — the `May edit?` column was a hand-maintained copy of `tools:`
  frontmatter, i.e. a second source of truth that could silently drift from the enforcement. The
  **Project Layout bullets** went because they were `ls` output. The **Design Principles** list
  went because it was generic advice under a heading that already said "apply, don't recite". What
  stayed, and why it is *not* derivable: the **`ARCHITECTURE.md` deferral** (a decision plus a
  standing prohibition — the file tree cannot express "deliberately absent"), the **Divergence
  note** (GEMINI.md's staleness is a fact about intent, not structure), the **Stack table** (its
  Note column is rationale — "no hand-rolled D3 for two line series" — not a dependency list
  `package.json` already carries), and the **Hooks table** (the `Does` column would otherwise cost
  reading six shell scripts).
- *Why the handoff schemas moved to a skill rather than being cut.* They are needed only at
  dispatch time, not on every turn, which is the textbook lazy-load case. But **nothing else in the
  repo defines their fields** — `cedar.md`, `cypress.md`, `redwood.md` and `magnolia.md` all
  reference `[SPEC]`/`[COMPLIANCE-REPORT]`/`[COMPLETION-REPORT]` by name only. That made a plain
  cut impossible and the migration load-bearing: both `CLAUDE.md` § Handoff Schemas and the Tooling
  table now carry an explicit load-before-dispatch pointer, because a schema that fails to load at
  the moment of a handoff is worse than one that costs tokens every turn.
- *Why the disables are believable, and where they are not.* Zero invocations across 50 transcripts
  / 20 days / 9 project directories is real disuse evidence for skills, which have per-dispatch
  counters. The MCP servers have **no usage counter at all** — transcripts were the only signal —
  and their tool schemas are deferred, so disabling them saved **no context**; the case was purely
  one less connection to maintain. Recorded as reversible: the skill folders were left on disk and
  every override is a key in the gitignored `.claude/settings.local.json`.
- *One finding that is a fault, not disuse.* `github`'s MCP tools were absent from the session even
  though it was listed as enabled, while `context7` and `playwright` loaded normally. That is a
  connection failure, so its zero-call count proves nothing about whether it is wanted. Run `/mcp`
  and fix the connection before concluding it should stay off.
- *A signal-quality caveat worth not re-deriving.* Two skills declare a frontmatter `name` that
  differs from their directory — `composition-patterns` declares `vercel-composition-patterns`,
  `react-best-practices` declares `vercel-react-best-practices`. Usage may be recorded under either
  key, so their zero counters are marginally less certain than the other five. Both name forms were
  written into `skillOverrides` so the disable lands regardless.


---

## 2026-08-07 — FR-5 closed: arrests as a fifth witness, and the first `/grill-me` round this project ran

Added traffic-enforcement arrest counts (2018–2025, five offense categories) as a fifth
independent metric — its own small-multiples panel plus table, from a second Socrata dataset
(`8h9b-rp9u`) via a deliberately self-contained transport that never touches `socrata.ts`. Standard
ordering, Cypress PASS on the Phase 1 red-test check and, after one self-fix, the Phase 3 audit.
Full SPEC in `ARCHIVED_SPECS.md`, "Archived 2026-08-07 — FR-5."

- _Why this was the first task this session routed through `/grill-me` before Cedar, rather than
  going straight to a SPEC._ FR-5–7 had been flagged as real design risk across three separate
  Cedar planning rounds (dual-axis misreading, the borough-code trap, the "enforcement caused
  deaths" framing NFR-5 explicitly warns against) — genuine product-judgment calls, not
  engineering ones, and exactly the category Rule 1 says should go to a human rather than be
  guessed at. The interview surfaced (and let the human resolve) two decisions that would have
  produced materially different SPECs depending on the answer: how arrests relate visually to the
  other series, and how large FR-6's borough filter should actually be. Getting these settled
  before Cedar ever wrote a SPEC meant zero mid-flight scope renegotiation this time, unlike the
  FR-3 chart-half task where Cedar had to catch and correct a flawed premise _after_ being
  dispatched. Worth remembering as the actual trigger for `/grill-me`: not "this is hard," but
  "the ambiguity is about what the human wants, not about what's technically correct."
- _Why the PRD's literal "secondary axis" text was overridden again, and why this time it happened
  in the interview rather than as a Cedar correction._ The human chose small multiples directly,
  informed by FR-3's precedent (same ~30–100× scale mismatch, same risk-register line, same
  `dataviz` anti-pattern) laid out as one of four concrete options rather than a binary yes/no.
  Presenting the real alternatives — secondary axis as specced, small multiples, secondary-axis-
  defaulted-off (the risk register's own named mitigation), or table-only — let the human make an
  informed product call instead of either rubber-stamping risky PRD text or having Cedar quietly
  override it a third time running.
- _Why `arrests.ts` duplicates ~130 lines of `socrata.ts`'s fetch/validate scaffold instead of
  sharing it, and why that was the right call even though it's real, visible duplication._ PRD §5.2
  states plainly that "dropping FR-5–7 shrinks the product without breaking it" — severability is a
  named design goal, not an afterthought. `socrata.ts` is the one file every P0 metric depends on;
  widening it with a dataset-id parameter to serve a feature the PRD explicitly marks droppable
  would make that severability a documentation claim instead of a code fact — dropping FR-5 later
  would mean untangling a shared file instead of deleting three self-contained ones. The
  duplication cost was named honestly in the SPEC rather than hidden behind a DRY-sounding
  refactor, with an explicit Tipping Point (a second `8h9b-rp9u` caller) for when to stop paying it.
- _Why `colorSlot: 1` was reused rather than a new slot earned._ Five independent `<figure>`
  elements that are never juxtaposed in one plot don't create the visual-collision risk color
  reuse exists to prevent — that risk only fires inside a shared legend or a merged chart, neither
  of which this task has. Earning a third color token would have meant re-running the CVD-
  separation validator against every existing token and both light/dark surfaces for zero
  comprehension benefit — a cost with no corresponding payoff, so it wasn't paid.
- _The third occurrence of the same test-bug shape this session, and why it's worth naming as a
  pattern rather than three unrelated incidents._ A stale confinement check in
  `repairedCollisions.test.ts` — "no file besides `socrata.ts` reads `process.env`" — broke the
  moment `arrests.ts`'s SPEC-approved exception made it false. This is the identical shape to
  FR-4's `MetricSection` note-paragraph test and FR-13's `YearlyLineChart` note-paragraph test: an
  old test encodes "the only thing that could be true right now" as its check, and the moment a
  second legitimate case arrives, the test breaks for a reason that has nothing to do with a real
  regression. All three times, Cypress (never Redwood or Magnolia, which correctly can't touch test
  files) caught and fixed it — and this time, Cypress had _already written the correct generalized
  version once_, in `arrests.test.ts`'s own confinement check, and simply ported that pattern to
  the older file rather than re-deriving it. Three occurrences in one session across three
  different files (`MetricSection.test.tsx`, `YearlyLineChart.test.tsx`, `repairedCollisions.test.ts`)
  is enough to call this a known failure mode of "exactly one of X" tests in a codebase that keeps
  adding legitimate second/third instances of X — worth watching for proactively in future test
  authoring, not just reactively fixing each time it recurs.

---

## 2026-08-07 — FR-13 closed: policy-date markers, and a bug class caught twice on two files

Added two vertical `<ReferenceLine>` markers (2019-03-18 Staten Island pilot, 2020-04-06 citywide)
to both the deaths and collisions charts, plus an unconditional accessible caption sentence, both
derived from a new `src/lib/policyDates.ts` so the visual and text layers can't drift apart.
Standard ordering, Cypress PASS on the Phase 1 red-test check and, after one self-fix, the Phase 3
audit — no true rejection-loop cycle spent, though the path there was less linear than most closed
tasks this session. Full SPEC in `ARCHIVED_SPECS.md`, "Archived 2026-08-07 — FR-13."

- _Why markers render on both charts, not the collisions panel alone, even though FR-13's PRD text
  never explicitly says "both."_ The product's whole small-multiples design (FR-3) exists so a
  reader can compare a discretionary metric (collisions, an officer's filing decision) against a
  non-discretionary one (deaths) across the identical window. Showing the same two markers on the
  deaths panel is what lets a reader see, directly and without re-reading prose, that deaths didn't
  move at the exact boundary where collisions did — that comparison _is_ the point of the marker,
  not an incidental nice-to-have. Omitting it from one panel would have been an arbitrary asymmetry
  nothing in the requirement's stated purpose ("locate the structural break visually") justified.
- _The categorical-axis compromise, and why it was solved with an engineering call instead of a
  `/grill-me` round._ Recharts' `XAxis type="category"` has one tick per year; there is no
  continuous timeline a day-precision date can sit on. Snapping each marker to its containing
  year's tick and carrying the actual day in the label text instead of the pixel position is the
  same "never let a visual encoding alone carry more precision than it has" rule NFR-5 already
  established for the dashed collisions stroke — an existing project precedent made this a
  resolvable design decision, not a genuinely open question requiring the human.
- _Why `policyDates.ts` was built this session and not earlier, despite the same two dates already
  existing as prose in `Caveats.tsx`._ FR-9's own closing SPEC had explicitly declined the
  extraction, naming "no SPEC yet defines what shape FR-13 needs" as the reason under Rule 8's
  unearned-generality discipline. This session's SPEC is that shape landing: `{ year, isoDate,
label }`, a coordinate-shaped need genuinely different from FR-9's prose-shaped one. Deliberately
  did _not_ retrofit `Caveats.tsx` to import from the new module — editing a file under a
  verbatim-prose test contract for a cosmetic dedup on two fixed historical-fact literals wasn't
  worth the risk, and named explicitly as a bounded, considered duplication rather than an
  oversight, revisitable only if `Caveats.tsx` is touched for its own reasons later.
- _A session-usage-limit interruption, and why resuming beat respawning._ Magnolia's Phase 2
  invocation cut out mid-verification after already writing the real implementation
  (`policyDates.ts`, both `YearlyLineChart.tsx`/`.module.css` edits complete) — only the acceptance
  checklist was interrupted, not the build. The orchestrating session resumed the same agent from
  its transcript rather than dispatching a fresh one, preserving its implementation context; a
  cold respawn would have either redone finished work or lost the reasoning behind decisions
  already made (e.g. why `"2 3"` was chosen as the marker dash pattern, distinct from `"8 6"`).
- _A genuine bug caught in Magnolia's own draft before it ever reached Cypress._ `isFront` isn't a
  valid `ReferenceLine` prop in this Recharts version — `tsc` caught it the moment the resumed
  Magnolia invocation ran typecheck, and it was fixed within the same task, the ordinary Rule-4
  path, not an escalation. Worth noting only because the orchestrating session initially saw this
  error via a Stop-hook notification and correctly treated it as categorically different from the
  "module doesn't exist yet" red state that had shown up in every prior mid-TDD task this
  session — a real type error in _written_ code needs a different response (let the agent holding
  the file fix it) than an absent module does (wait for the agent to finish writing it). Conflating
  the two would have meant either editing a file mid-flight under a background agent (a race) or
  wrongly treating a real bug as an expected, ignorable red.
- _The second bug — a stale test in Cypress's own Phase 1 file — and why it was routed back to
  Cypress rather than treated as a Magnolia failure or silently patched by whoever found it._
  `YearlyLineChart.test.tsx` had a pre-existing Task-2-era assertion checking for "any `<p>`" in
  `figcaption` as a proxy for "no note" — a proxy that was only ever safe because the note used to
  be the sole possible paragraph. FR-13's new, legitimate, unconditional marker-caption paragraph
  broke that coincidental equivalence, exactly the same bug class Cypress had already caught once
  before, on a _different_ file, during FR-4 (`MetricSection.test.tsx`'s identical "any paragraph"
  proxy). Magnolia correctly declined to fix it itself — it can't edit test files, and 318/319
  passing with one stale assertion failing is a materially different signal than a real
  implementation defect. Routing it back to Cypress, using the FR-4 fix as precedent, kept file
  ownership boundaries intact and let the same rescoping pattern (assert the note's own content and
  an exact count, not "zero paragraphs total") get reapplied consistently rather than reinvented.
  Worth remembering as a recurring shape: any test that encodes "the only thing that could be here"
  as its check is fragile the moment a second legitimate thing arrives, and this project has now
  hit that exact failure twice on two different components in three sessions.

---

## 2026-08-06 — FR-9 closed: the caveats section, and the sole remaining P0 requirement

Added a standalone `Caveats.tsx` — a static Server Component with five items (the two reporting-
policy dates, borough-coverage drift, the pandemic-speed confounder, January 2025 congestion
pricing, DOT Street Improvement Project placement) — mounted unconditionally at the bottom of
`page.tsx`, plus a one-sentence forward-pointer appended to the two existing inline notes. Standard
ordering, Cypress PASS on both the Phase 1 red-test check and the Phase 3 audit — no rejection loop
spent. Full SPEC in `ARCHIVED_SPECS.md`, "Archived 2026-08-06 — FR-9." This closes the last P0
requirement: diagnosis (FR-1–3), fix (FR-12), summary (FR-4), and now honest limits (FR-9) are all
shipped.

- _Why Cedar resolved its own twice-flagged open question instead of recommending `/grill-me`, and
  why that call was correct rather than a shortcut._ The ledger had flagged, across two prior
  sessions, that FR-9 might require deciding whether the existing inline notes should become
  cross-references into it. Rather than treating that flag as proof the question was genuinely
  ambiguous, Cedar re-read FR-9's actual PRD text against the two notes' actual content and found
  they don't overlap at all — the notes explain _why a series looks different_, FR-9's five items
  cover _broader interpretive limits_ (dates, borough coverage, a nationwide confounder, a
  congestion-pricing launch, infrastructure placement) that never appear in either note. A flagged
  question is not automatically a real one; re-deriving from the source text before accepting an
  inherited framing is the same discipline Cedar applied when it corrected the shared-axis premise
  on FR-3's chart and the Strategy-pattern pre-commitment on FR-12.
- _Why Caveats renders unconditionally, independent of all four metrics' fetch status — the one
  design choice that inverts every other component's pattern on this page._ Every `MetricSection`
  and chart on `/` only renders on `status === "ok"`, because there's nothing honest to show without
  data. Caveats is the opposite case: it explains the record's limits, which is arguably most
  needed exactly when a fetch has failed and a reader is looking at an error state trying to
  understand what they're seeing. Cedar named this explicitly rather than defaulting to the
  page's established conditional-rendering habit out of consistency for its own sake.
- _Why no percentage or count was ever going to appear in Caveats.tsx, even though borough-coverage
  rate would have made item 2 more concrete._ FR-7's not-yet-built persistent borough-filter warning
  is that number's one legitimate home. A second, independently-typed copy here would have no
  mechanism to stay in sync with it once FR-7 ships — exactly the failure ADR 0001 was written
  about. FR-9's own text only requires "covering... the borough-coverage drift," which the
  qualitative sentence satisfies without inventing a number this task has no way to keep honest.
- _Why a shared `policyDates.ts` module was named and explicitly declined, not built preemptively._
  FR-13 (policy-date chart markers, still unspecced) will want the same two dates in a different
  shape — coordinates, not prose. Extracting a shared module now, before FR-13's SPEC exists to
  define what shape it actually needs, would be exactly the unearned-generality Rule 8 rejects.
  Named as a deferred trigger rather than silently duplicated or silently pre-built.
- _Why the verbatim-prose constraint got a dedicated, independent re-derivation in the audit rather
  than trusting the passing test._ Five paragraphs of exact, citation-level prose are the kind of
  content most likely to drift silently — a single reworded clause would pass casual review. Cypress
  wrote a standalone script diffing SPEC.md's pinned text against the shipped component
  character-for-character, the same category of extra rigor it applied to the `-0%` trap on FR-4
  and the byte-identical invariant on FR-12 — proportionate scrutiny aimed at the specific way this
  particular task could fail quietly.

---

## 2026-08-06 — `stop-quality-gate.sh`'s two fake-green defects fixed

No SPEC — a simple, fully-diagnosed bug fix routed directly to Redwood per Pine's rules, not
through Cedar. A missing/non-executable `tsc`/`eslint` binary used to fail the `[ -x ... ]` guard
silently and fall through to "Quality gate clean," having never actually run either check — the
same toolchain-form silently-coerced-zero the script's own Node-version-mismatch branch already
refused to allow, just reached through a different code path nobody had closed. Fixed to fail loud
with an explicit "incomplete or corrupted install" message instead. Also hardened the all-clear
message's `node -v` interpolation with a defensive capture and `"unknown"` fallback, so it can no
longer print an empty version and silently violate Amendment 3(b). Verified by renaming each binary
in turn and confirming exit 2, then restoring and reconfirming exit 0; `--hook` mode and the
`stop_hook_active` escalation short-circuit reconfirmed untouched. Independently re-verified by the
orchestrating session (not just trusting Redwood's report) before being folded into the next
commit. Worth remembering as the general shape of the finding: "nothing ran" and "everything
passed" are not the same claim, and a gate that conflates them is worse than no gate, since it
actively produces false confidence rather than an honest gap.

---

## 2026-08-06 — FR-4 closed: a 2018→2025 percent-change line, derived not fetched

Added a percent-change summary line under each metric's table — `src/lib/percentChange.ts`'s
three pure functions (`computeChange`, `formatPercentChange`, `formatChangeSummary`), wired into
`MetricSection.tsx` between the table and the optional note. No new query: it's arithmetic on
`result.rows`, the array `MetricSection` already receives. Standard ordering, Cypress PASS on both
the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent. Full SPEC in
`ARCHIVED_SPECS.md`, "Archived 2026-08-06 — FR-4."

- _Why Cedar picked FR-4 over FR-9, the other remaining P0 requirement, and how that differs from
  the FR-12 pick two sessions earlier._ At FR-12, Cedar found a requirement that _wasn't_ on the
  candidate list it was handed and argued for it on thesis-centrality grounds. Here, both remaining
  P0 candidates (FR-4, FR-9) were already visible, and Cedar picked the _less_ thesis-central one —
  deliberately, on scope-readiness rather than importance. FR-9 (the caveats section) carries a real
  unresolved design question the ledger already flags (should the two existing inline notes become
  cross-references once it lands?), and Cedar treated that as reason enough to defer it to its own
  dedicated SPEC rather than force an answer inside this task. Worth remembering as the general
  shape of the choice: centrality and readiness are different axes, and a P0 requirement with an
  open question is not automatically the right thing to build next just because it's more central.
- _Why `computeChange` takes the first and last row of whatever array it's given, rather than
  parameterized `startYear=2018`/`endYear=2025` constants — and why this was scrutinized as the
  single most load-bearing design decision in an otherwise small task._ `socrata.ts` already owns
  the analysis window exclusively (Rule 4). A second, hardcoded copy of "2018"/"2025" living in a
  presentation component would be exactly the kind of driftable duplicate contract Rule 4 exists to
  prevent — if the window ever moved, this component could silently disagree with the one that
  actually fetches the data. The generic design costs nothing extra to write and removes the
  possibility of that drift by construction, not by discipline.
- _Why giving the repaired-collisions series (FR-12) a percent-change line too — beyond FR-4's
  literal "three metrics" — was named and accepted explicitly rather than either silently built or
  silently suppressed._ Because `MetricSection` is the one shared component all four current metrics
  render through, the generic first/last-row design fires identically for all four call sites; there
  was no extra code path to add or skip for the fourth metric specifically. Cedar chose to record
  this as a deliberate scope decision with its own justification (it reinforces FR-12's own claim,
  and the PRD's Appendix A already independently states the repaired series' change) rather than
  either quietly shipping it unremarked or engineering a special case to hold it back to exactly
  three. An unplanned but harmless consequence of a generic design is still worth naming, not just
  allowing to happen.
- _Why the `-0%` rendering trap got real weight in this session, not just a passing test._ Cypress
  flagged in its Phase 1 report, before implementation existed, that `Math.round(-0.4)` produces JS
  `-0`, and that a naive sign-concatenation (`value > 0 ? "+" : ""`) could render `"-0%"` depending
  on exactly how the branching was written. Redwood's fix (`rounded === 0` loose equality, which
  catches both `+0` and `-0`) was verified twice independently — once by Redwood's own report, once
  by Cypress's audit hand-deriving four specific inputs and reading the actual implementation rather
  than trusting the green test. A trap this narrow and this easy to introduce silently is exactly
  the kind of thing that's cheap to catch in review and expensive to catch after ship — worth the
  extra verification pass even on a two-file task.
- _Why the pre-existing "no paragraph when note is absent" test needed rescoping, and why that
  rescoping was treated as in-scope rather than a workaround._ The old test happened to work by
  checking "no `<p>` anywhere after the table" — which was only ever a proxy for "no note paragraph,"
  true only because the note used to be the sole possible sibling. FR-4 correctly invalidates that
  coincidental equivalence by adding a second, legitimate paragraph. Cypress rescoped the test to
  check the note's own text specifically and separately assert the paragraph count is exactly one
  (the change-summary line) — preserving the original protection (no stray/empty note paragraph)
  without weakening it to accommodate the new feature. This is the same category of judgment Cypress
  exercised in FR-3's chart-half task and FR-12's ambiguous-caption-text finding: tests occasionally
  encode assumptions narrower than what they're meant to protect, and recognizing which assumption
  is load-bearing versus incidental is real audit work, not busywork.

---

## 2026-08-06 — FR-12 closed: the "repaired" collisions series, the product's actual fix

Added a fourth, independently-fetched yearly metric — collisions with a recorded injury or death
— as its own accessible table on `/`. `src/lib/socrata.ts` widened with one new optional
`extraWhere?: string` parameter (AND-ed onto the fixed `WHERE_CLAUSE` when present); new
`src/lib/repairedCollisions.ts` and `src/app/api/repaired-collisions/route.ts`; `page.tsx` gained
a fourth parallel fetch and independent `MetricSection` block. Standard ordering, Cypress PASS on
both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent. Full SPEC in
`ARCHIVED_SPECS.md`, "Archived 2026-08-06 — FR-12."

- _Why Cedar picked FR-12 over the seven candidates it was actually handed._ Asked to choose from
  a list (deploy SPEC, FR-4, FR-9, FR-13, FR-5–7, plus two already-closed items), Cedar instead
  re-read the PRD directly and surfaced something the candidate list omitted: FR-12 is P0, and the
  PRD's own text names it as the point of the whole product — _"without it the product diagnoses a
  problem and offers no usable number in its place."_ Every prior session had shipped diagnosis
  (the break, the raw collapsing series); nothing had yet shipped the fix. This is the same
  discipline as the FR-2-over-FR-3 pick two sessions earlier: evaluate on merits, not by
  elimination from a given list. Worth remembering that a candidate list handed to Cedar is a
  starting point, not a ceiling — the correct backlog can be more complete than what the
  orchestrating session already knew to name.
- _Why FR-12 was only now buildable, and not earlier._ FR-12's remediation only makes sense stated
  against the raw series it corrects — it needed FR-3's raw collisions data (and, for full
  narrative weight, its chart) to exist as the thing being compared against. FR-3's chart half
  landed the session immediately prior (`bfc6b81`); FR-12 was blocked until exactly that point,
  tracked as queued backlog across the preceding five archived sessions.
- _Why this task, unlike FR-3's data half, was expected to and did fully close its requirement._
  FR-3's PRD text conjunctively requires a dashed stroke and a label — a table literally cannot
  render a stroke, so that task was honestly recorded partial. FR-12's text requires only "display
  alongside the raw series," with no chart language at all, and self-describes as "a single
  additional SoQL query... not a new subsystem." Two tables on one page, from the same fetch
  window, satisfy "alongside" as written. Closing it fully here is the honest reading of the
  requirement text, not a shortcut past a harder one.
- _Why a four-times-repeated pre-commitment to a Strategy/registry pattern was engaged with and
  overridden, not silently followed or silently dropped._ Four consecutive prior SPECs had noted
  that `socrata.ts` should escalate to a Strategy pattern or series registry "when a third distinct
  query shape arrives" — FR-12 was that anticipated third shape. Having the concrete case in hand,
  Cedar declined the escalation: FR-12's actual variance is one AND-ed `$where` fragment, a data
  value, not a second interchangeable behavior — nothing about the fetch/validate/parse pipeline
  itself varies. A single optional, named, non-boolean parameter satisfies the same
  explicit-typed-parameters principle the two-parameter shape was already justified by. Cedar
  named the corrected trigger explicitly for next time — a second _independent axis_ of variation
  (FR-6's borough filter, metric × borough), not "a third shape" — so the old, now-inaccurate
  shorthand doesn't get inherited as settled fact by whichever session eventually builds FR-6. This
  is the same category of judgment call as the small-multiples correction on FR-3's chart half:
  Cedar is expected to revise its own prior framing when the concrete case shows it was imprecise,
  not execute stale guidance literally.
- _Why the byte-for-byte invariant on `socrata.ts`'s two-argument call path was the single most
  scrutinized acceptance criterion, checked three separate times (Cypress's unit test, Cypress's
  audit reading the source by hand, and a live-API regression check against all three pre-existing
  metrics)._ `DEATHS_SOQL`/`INJURIES_SOQL`/`COLLISIONS_SOQL` are frozen contracts already displayed
  on the page (FR-8). Widening a shared function silently changing their output would be an
  invisible contract violation — nobody would notice until a live figure diverged from the pinned
  table, which is exactly the failure mode Rule 4 (queries are contracts) exists to prevent. Three
  independent proofs (not just "the tests pass") is proportionate to how quietly this kind of
  regression could otherwise slip through.
- _Why the collisions-chart-overlay idea was named as a real, considered option and then explicitly
  declined rather than silently omitted._ FR-12's raw and repaired series share units (both are
  collision counts) and could sit on one axis without the ~800× scale mismatch that forced FR-3's
  chart into small multiples — a materially different situation from the deaths/collisions
  comparison. Cedar named this as a legitimate follow-on Magnolia SPEC rather than either building
  it unasked (scope creep past FR-12's actual text) or leaving a future session to wonder whether
  it was considered and rejected for a reason, or just never occurred to anyone.

---

## 2026-08-06 — FR-3 closed: collisions chart as small multiples, not a merged two-series plot

`DeathsChart.tsx` generalized into `src/components/YearlyLineChart.tsx`, a single-series chart
parameterized by `fieldAlias`/`strokeStyle`/`colorSlot`/copy, called twice (deaths solid/blue,
collisions dashed/orange), each with its own independent zero-based axis — two small multiples,
never one shared plot. Standard ordering (Cedar → Cypress → Magnolia → Cypress), Cypress PASS on
both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent. FR-3 (dashed
stroke + inline label, conjunctively) is now fully satisfied; the prior session had only closed
its table half. Full SPEC in `ARCHIVED_SPECS.md`, "Archived 2026-08-06 — FR-3's chart half."

- _Why a shared y-axis was rejected outright rather than implemented as originally briefed._ The
  dispatch brief framed this as "mount collisions as a second series on `DeathsChart.tsx`'s axis."
  Deaths (229–297) and collisions (85,546–231,564) differ ~800×; on one zero-based linear axis the
  deaths line would sit within ~0.15% of the axis height from zero — visually indistinguishable
  from flat-at-zero. That would erase the exact "deaths flat, collisions cratering" contrast the
  product exists to show, and it's `dataviz`'s own named anti-pattern #1. Indexing both series to
  a common base (=100 at 2018) was the one alternative that stays on one axis — deliberately not
  taken, because it changes the claim from "here are the two literal series" to "here is relative
  change," which is FR-4's territory (still blocked) and would require a new computed transform
  rather than plotting the arrays as fetched. This is the kind of correction Cedar is supposed to
  make rather than build the literal (harmful) framing it's handed.
- _Why the legend/tooltip half of the prior Tipping Point never fired here._ Those two triggers
  were written against a merged two-series plot. Small multiples keep each panel single-series, so
  `dataviz`'s "single series needs no legend" rule applies to both panels independently, and the
  tooltip's original deferral reasoning (every value already sits in the table below; nothing on
  the chart can ever visually cross since the two lines never share a plot) held without
  modification. Only the dashed-stroke trigger — the one actually about the collisions series
  itself — fired this task.
- _Why `colorSlot` is a prop independent of `fieldAlias`, not derived from it._ Coupling colour to
  the data key would make the component silently assume it only ever plots exactly two known
  fields. A future third chart (e.g. a casualty-filtered repair under FR-12) should be free to take
  slot 3 without the component needing a field-name-to-colour lookup table baked in.
  `composition-patterns`' `patterns-explicit-variants` guidance backed this: colour assignment is a
  design decision independent of which field is plotted, not something to infer implicitly.
- _Why the collisions chart's caveat text is a shared constant (`COLLISIONS_REPORTING_NOTE`), not
  restated per surface._ NFR-5 requires the dashed-stroke-plus-label treatment "in every
  rendering." Two independently-typed copies of the same claim is exactly the drift ADR 0001 was
  written about — one wrong edit later and the table and the chart would disagree about _why_ the
  series differs, which is worse than either alone.
- _Why Cypress's audit re-derived every Constraint from source rather than trusting Magnolia's
  self-reported PASS._ Consistent with the `MetricSection` precedent below: a self-report proves
  what an agent believes it did, not what the code does. The audit re-ran all four gate commands
  independently, greeped the client-boundary and no-authored-figure rules itself, and read the two
  chart-mount conditionals directly to confirm cross-metric independence, rather than accepting
  "tests pass" as sufficient — tests can be well-intentioned and still miss a constraint the SPEC
  cared about.
- _A prompt-injection attempt, caught and named rather than silently avoided._ `next dev` had
  auto-appended a block to `CLAUDE.md` (a known, SPEC-anticipated artifact — its own acceptance
  clause 3 prescribes reverting it via `git checkout -- CLAUDE.md`). The injected block's text
  itself contained a line reading "committing it with your work keeps the tree clean" — an
  instruction embedded in file content, directly contradicting the SPEC's explicit revert
  directive. Treated as untrusted content (a file's own diff is not a legitimate instruction
  channel, regardless of how procedural it reads) and reverted anyway; flagged to the human rather
  than silently overridden or silently complied with. Worth remembering as a concrete example of
  what this class of injection looks like in practice, since it read as boring tooling
  documentation rather than an obvious attack.
- _Why the 151-line Tipping Point overage on `YearlyLineChart.tsx` (vs. the SPEC's own ~140-line
  trigger) was logged rather than treated as a blocking finding._ The SPEC's Tipping Points are
  explicitly named as revisit signals, not hard caps — Rule 8's "patterns are earned" logic applies
  symmetrically to _not_ over-refactoring on a first small overage. Recorded here so the next task
  touching this file starts from an accurate baseline instead of re-discovering the overage cold.
- _Why the live-browser visual QA (dashed rendering, dark-mode swap, 320px no-scroll) is recorded
  as an open, non-blocking gap rather than either faked or treated as a blocker._ No Chromium
  binary was available in either Magnolia's or the orchestrating session's sandbox
  (`mcp__playwright__browser_navigate` failed outright). Both substituted the jsdom+axe-core suite
  (which does assert the dashed `stroke-dasharray` and the `--chart-series` token selection
  mechanically) plus a byte-for-byte cross-check of the shipped hex values against the SPEC's
  pinned token table. That is real coverage of the mechanism, just not a literal rendered
  screenshot — judged sufficient to close the SPEC rather than block on tooling neither sandbox
  had, especially since the underlying CSS-custom-property pattern was already shipped and
  eyeballed once before (Task 2's `DeathsChart`).

---

## 2026-08-06 — `MetricSection` extracted, clearing page.tsx for the FR-3 chart redesign

A Banyan mechanical refactor, not a feature task: `page.tsx`'s three near-duplicate metric blocks
(deaths, injuries, collisions) became three calls into one generic `MetricSection` component;
`page.tsx` dropped from 162 to 63 lines; the confirmed-dead `page.module.css` was deleted. Deviated
ordering — Banyan executed first, Cypress audited after, since there was no new behavior for a red
test to describe in advance. Cypress PASS. Commits `235347d` (SPEC) → `3f1cfc5` (execution) →
`ca683e0` (ledger) → archival.

- _Why this was sequenced as its own task before the FR-3 chart redesign, rather than folded in or
  deferred again._ The chart-redesign task was already sized to trip `DeathsChart.tsx`'s own
  Tipping Point on three counts at once (legend, tooltip, dashed stroke). Adding an unrelated
  page-wide extraction to that diff would have mixed two different owners' concerns — Magnolia's
  chart work and a structural refactor — in one changeset, and risked the 5-file cap once the
  chart's own files were counted. The prior SPEC (FR-3's data half) had already declined to extract
  the third near-duplicate block for exactly this reason — "a bigger, riskier diff than this task's
  stated objective" — so doing it now, alone, with nothing else riding along, was the moment the
  original objection stopped applying.
- _Why the deaths chart was deliberately kept out of `MetricSection`'s contract, even though
  `composition-patterns` generally favors children over render props for exactly this kind of
  slot._ Only one of three callers needed anything before its table. Giving `MetricSection` a
  children or render-prop slot for that one case would have been an abstraction with a single real
  consumer — the same unearned-generality failure Rule 8 names for GoF patterns, applied to a
  component's prop surface instead. The one-line duplicated `result.status === "ok"` check staying
  in `page.tsx`, exactly where it already lived, was judged cheaper than the alternative generality.
- _Why "the test suite passes with zero edits" was treated as the load-bearing acceptance clause,
  above line count or diff size._ This task's entire justification was "nothing observable
  changes." A shrinking line count or a clean-looking diff proves nothing about whether the
  extraction actually preserved behavior — only an unmodified, pre-existing black-box test suite
  passing does. Both Banyan and Cypress independently re-ran `git diff --stat` against all seven
  protected test files rather than either trusting the other's report of "empty."
- _Why the new `MetricSection.test.tsx` got the same "is this real coverage" scrutiny Cypress gives
  tests-first work, even though this SPEC never went through a red phase._ Skipping tests-first
  removes the one mechanical proof that a test can actually fail — nothing here was ever
  demonstrated red for the right reason the way Phase B work always is. So the audit compensated by
  reading the new test file specifically for whether it exercised real branches or was decorative,
  rather than assuming characterization tests written after the fact are automatically trustworthy.

---

## 2026-08-06 — FR-3's data half (collisions per year) shipped, FR-3 left deliberately open

Added collisions per year as a third independently-fetched metric — the third one-line caller
over `socrata.ts` FR-2's own Tipping Point predicted would need zero transport changes, and it
didn't. Standard ordering; Cypress PASS both on Phase B and on auditing Redwood's work. Commits
`06ef759` (SPEC) → `9ed9fb8` (tests) → `003e89f` (implementation) → archival.

- _Why Cedar re-evaluated fresh rather than assuming FR-3 was next by default._ Last time (picking
  FR-2), the deciding factor was a pre-committed refactor trigger, not FR-3's centrality to the
  product thesis. That deferral was spent once the refactor landed, so this time there was no
  equivalent smaller alternative sitting on the backlog to prefer instead — Cedar's SPEC says so
  explicitly, framing the pick as "on its own merits, not by elimination" rather than treating
  "nothing else is smaller" as the reason by itself.
- _Why FR-3 is recorded as partially satisfied rather than closed, even though this task does
  everything a Redwood-only task can do for it._ FR-3's PRD text requires a dashed stroke **and**
  an inline label, conjunctively. A table cannot render a stroke — no amount of implementation care
  changes that. Cedar's SPEC treats "claiming FR-3 done" as a category of dishonesty ADR 0001 was
  written to prevent, and instead states plainly which half is done and which is deferred to a
  named future SPEC. The alternative — silently treating the requirement as closed because "most of
  it" is live — is exactly the kind of untracked drift the project's archival discipline exists to
  catch before it happens rather than after.
- _Why the inline note's wording departs from the PRD's own example phrase._ The PRD's "affected by
  reporting decline — see caveats" is explicitly an example (`e.g.,`), and "see caveats" would
  point at FR-9's caveats section, which doesn't exist. Cedar chose to state the documented cause
  directly instead of leaving a forward reference to nothing, and named this as FR-9's decision to
  revise later, not a decision pre-empted here — a small instance of not building for a requirement
  that hasn't been specced yet.
- _Why the third near-duplicate table+disclosure block was not extracted into a shared component,
  even though "three of the same thing" is a common refactor trigger._ FR-2's own Tipping Point had
  already named the actual trigger — `page.tsx` over ~150 lines, or a caveats section arriving — not
  "a third block appears." Extracting a component here would have restructured two already-tested,
  working blocks under cover of a data-addition task, which is a bigger and riskier diff than the
  task's stated objective. Instead the SPEC made the line-count report a _mandatory_ acceptance
  clause, so the decision about when to extract stays visible and deliberate rather than either
  happening prematurely or getting silently deferred with no trigger watching it.
- _The Tipping Point fired during the task that reported it, for the second task running._ `page.tsx`
  landed at 162 lines against its own ~150-line threshold — the same pattern `socrata.ts` showed at
  FR-2's close. Both times, the responsible move was reporting the number as a finding rather than
  either fixing it unauthorized or letting it pass unremarked, and both times an independent second
  agent (Cypress) re-measured rather than trusting the number as reported. Two Tipping Points tripped
  back to back on the two SPECs most recently executed suggests the project's growth is now
  consistently landing right at the thresholds it names for itself — worth watching whether a third
  in a row means the thresholds themselves need revisiting, not just the files they're attached to.

---

## 2026-08-06 — FR-2 (injuries per year) shipped, executing Task 1's pre-committed refactor

Added injuries per year as a second, independently-fetched metric, and — as the same task —
extracted `src/lib/socrata.ts` as a generic yearly-metric transport that `deaths.ts` and the new
`injuries.ts` both call. Cedar picked FR-2 over the seemingly-more-central FR-3 (collisions) for
this slot; standard ordering (Cypress tests-first); Cypress PASS both on Phase B's own tests and on
auditing Redwood's implementation. Commits `c4e8602` (SPEC) → `c973beb` (tests) → `7e35715`
(implementation) → archival.

- _Why FR-2 was picked over FR-3, even though FR-3 carries more of the product's actual thesis._
  FR-3's text requires the chart's dashed-stroke-plus-label treatment, so it cannot be a
  Redwood-only data slice the way FR-1 was — it inherently bundles a data task and a Magnolia
  chart-redesign task, and Cedar was told not to combine tasks into one SPEC. More load-bearing:
  Task 1's own SPEC had _already_ named this exact trigger in its Tipping Point — "a second series
  arrives → parameterize the fetch; a second Route Handler appears → extract socrata.ts" — written
  before either FR-2 or FR-3 was chosen as the next task. Executing a refactor a past SPEC
  pre-committed to, with the smallest available second caller, was judged lower-risk than jumping
  straight to a task that would force three decisions (query parameterization, the chart's
  Tipping-Point redesign, and the dashed-stroke choice) into one shot.
- _Why `fetchYearlyMetric` takes only the aggregate expression and field alias, not the where/group
  clauses too._ Widening the parameter surface now, before a caller needed a different `$where` or
  group key, would have been the unearned-abstraction failure Rule 8 rejects — pre-building for
  FR-12 or FR-6 before either SPEC exists to justify the shape. The fixed 2018–2025 window and
  `date_extract_y` grouping stayed hardcoded constants inside `socrata.ts`, and the SPEC named the
  actual trigger for widening further: a third distinct query _shape_, not a third caller with the
  same shape.
- _Why `DeathsRow`/`DeathsResult`'s exact structural shape was the load-bearing acceptance
  criterion, not a nice-to-have._ `DeathsChart.tsx` reads `.deaths` by name and was explicitly
  frozen — untouched by this task. The refactor's whole risk was silently changing what
  `fetchDeathsPerYear()` returns without anyone noticing until the chart broke. Making "zero
  changes to `deaths.test.ts`/the deaths route test/all three `DeathsChart` files" a mechanical
  acceptance clause (`git diff --stat`, checked by both Redwood and independently by Cypress) turned
  an invisible invariant into one a `git diff` could prove, rather than one resting on care alone.
- _A file tripped its own Tipping Point on the same task that wrote it, and that was treated as
  information, not a failure._ `socrata.ts` landed at 252 lines against its SPEC's own ~120-line
  threshold — inherent to generalizing Task 1's already-substantial 10-branch validation pipeline
  for two callers, not duplication (Cypress read it end to end to confirm). Nobody tried to split
  it mid-task without a SPEC authorizing the decomposition; it was reported up as a finding for the
  next SPEC that touches the file, with the Tipping Point's own stated trigger (a third distinct
  query shape) named as the actual decision point rather than the line count in isolation.
- _An acceptance clause's literal wording didn't match the requirement it was checking, and both
  Redwood and Cypress caught it independently rather than gaming the letter of it._ The SPEC asked
  that the token _name_ appear in exactly one file; the token name legitimately appears in comments
  and synthetic test fixtures elsewhere, while the actual `process.env` _read_ — what NFR-2 cares
  about — is in exactly one file. Both agents judged the requirement's substance satisfied and
  flagged the clause's phrasing for correction, rather than either silently claiming literal
  compliance or silently failing the task over an imprecise sentence.

---

## 2026-08-06 — The falsified subgroup-sum fallback corrected across all four sites

A prior-art finding (2026-08-05: GreenInfo-Network/nyc-crash-mapper's own issue #111) showed the
research docs' proposed mitigation for the `number_of_persons_killed` dropout — summing the
pedestrian/cyclist/motorist subgroup fields as a fallback total — silently undercounts from 2021
onward (0 gap 2018–2020, then 12/20/19/9/6 deaths and ~1.4k–2.4k injuries a year short), because
NYPD stopped always assigning a role to a recorded casualty. Cedar specced the correction; a
human-approved revision request then closed one gap in that SPEC (below) before Redwood executed
and Cypress audited, both PASS. Commits `da35ab6` (execution) → `a0f2c27` (ledger) → archival.

- _Why the revision request mattered enough to block dispatch over._ Cedar's first pass specced
  `.claude/scripts/subtotal-gap.py` as a reporter (prints a table, exits 0 always) even though it
  named `verify-figures.py` — a checker, pins expected values, exits 1 on drift — as the pattern to
  copy. The mismatch wasn't cosmetic: this SPEC's own Tipping Point says "revisit when the gap
  closes, or extends backward before 2021," and a reporter gives that clause no mechanical trigger
  — someone has to run the script, open the ADR, and eyeball-compare eight number pairs. That's a
  human performing a diff, which is the exact class of problem the Bounded-AI principle (compute
  deterministically, don't ask a human — or a model — to eyeball a comparison) exists to eliminate
  one level up. The orchestrator held the SPEC back rather than dispatching it as written, sent a
  scoped revision request to a cold-respawned Cedar (explicitly endorsing two other reviewed
  judgment calls unchanged, so Cedar wouldn't re-litigate them), and only dispatched once a human
  had signed off on the revised version — the same HITL checkpoint Rule 1 requires for an original
  SPEC, applied to a revision of one.
- _Why the detector proof was run twice, by two different agents, on two different cells._ A
  green run of a checker proves nothing about whether the checker actually checks — only a run
  that's supposed to fail and does prove that. Redwood ran it once (mutating the 2022 deaths cell)
  during implementation; Cypress, auditing after, deliberately re-ran it on a different cell (2023
  injuries) rather than accepting Redwood's proof as sufficient. Independent reproduction on a
  different input is what makes this evidence rather than a repeated assertion.
- _Why two agents independently verified links a hook was known not to cover._ `check-citations.sh`'s
  normative-doc scan (`CLAUDE.md`, `GEMINI.md`, ledgers, `.claude/agents/*.md`, `docs/adr/*.md`)
  doesn't include the two research docs or `SKILL.md` — so the new `[ADR 0002]` links added _into_
  those three files were invisible to the mechanical gate, even though the ADR file itself (matching
  `docs/adr/*.md`) was covered. Both the orchestrator and Cypress resolved the links by hand against
  the filesystem rather than trusting the hook's green exit to mean more than it does. Worth
  remembering: a hook's "all clear" is scoped to what it scans, not to the task's actual footprint.
- _Why the script was rebuilt from the pinned query rather than chased down._ The SPEC's Output 1
  pointed at a session-scoped scratchpad path from an entirely different, earlier session — gone by
  construction, and the SPEC's own Edge Case 5 said so explicitly: rebuild from the pinned query,
  never reconstruct expected values from memory. Redwood didn't spend time searching for a file that
  couldn't exist; it built fresh from the SPEC's own pinned tables, which is the actual contract.

---

## 2026-08-06 — Task 2 of the walking skeleton shipped: the deaths-per-year line chart

Mounted a Recharts line chart over Task 1's accessible table — `src/components/DeathsChart.tsx`
(`'use client'`) and `DeathsChart.module.css`, plus a two-line `page.tsx` edit. Standard order
(Cypress tests first, then Magnolia implements, then Cypress audits). PASS: 64/64 tests, zero
axe-core violations, all pinned-figure and client-boundary greps clean. Commits `bc3d43e` (SPEC) →
`503c239` (Phase B tests) → `1e67154` (Phase C implementation) → `735bcfd` (Phase D test fix).

- _Why colour lives entirely in the CSS module, targeting Recharts' own stable class names, rather
  than `currentColor` props on the marks._ A single line-chart dot needs two different colours at
  once — its fill (the series colour) and its 2px ring (the surface colour, so it reads as a hole
  punched through the line rather than a solid disc). `currentColor` only carries one value per
  element, so it can't express both; CSS rules targeting `.recharts-line-dot` etc. can, and they
  outrank Recharts' own default presentation attributes in the cascade regardless of specificity.
  This also kept the "no colour literal in the .tsx" constraint (Constraint 4) trivially true rather
  than requiring a `currentColor` workaround per mark.
- _Why the zero-based y-axis was treated as the single most important test in the file, not a style
  preference._ The deaths series runs roughly 229–297 across eight years — auto-fitted, that reads
  as a dramatic mountain range; zero-based, it reads as what it is, essentially flat. The product's
  whole thesis is that deaths barely moved while recorded collisions fell 63%, so a truncated axis
  would have the flagship chart visually contradict the page's own prose, and would do it through a
  rendering default nobody consciously chose. This is NFR-5 (honesty of presentation) expressed as
  geometry, which is why Cedar's SPEC forbade changing it "to make the chart more readable" and why
  Cypress's zero-tick assertion is called out by name as the load-bearing test.
- _A pre-existing test-authoring bug, found and owned the same way Task 1's TDZ bug was._ Cypress's
  own "no `process.env` under `src/components`" grep-test scanned its own test file's source
  (including the literal string in its own assertion code and comments) rather than excluding test
  files the way its three sibling checks in the same block already did — a false positive against
  the file testing itself, not a real client-boundary leak. Magnolia, implementing the component,
  found the discrepancy but correctly declined to touch Cypress's test file; it independently
  verified the real constraint held by scoping the grep to the actual component. The orchestrator
  then dispatched Cypress for its Phase D audit, which diagnosed and fixed the one-line filter
  itself — same ownership boundary Task 1 established (Redwood diagnoses, Cypress's file is
  Cypress's to fix), same pattern, different task.
- _Why the First Load JS figure was recorded without a threshold._ Next 16's Turbopack build no
  longer prints the old stdout "First Load JS" table; Magnolia sourced 769,350 bytes uncompressed
  from `.next/diagnostics/route-bundle-stats.json` instead. No budget exists yet to compare it
  against — that's explicitly the deploy SPEC's job (NFR-1) — so this task recorded the number and
  did not react to it, per Constraint 12's instruction not to add speculative optimization.

---

## 2026-08-06 — Task 1 of the walking skeleton shipped: deaths per year, live from Socrata

First application code in the repo — `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`,
`src/app/page.tsx` (FR-1/8/10/11, NFR-1–4). Standard TDD order (tests → implementation → audit),
the first SPEC here not to use the SPIKE ordering override the two prior ones did. Cypress audit
PASS. Live figures independently re-verified against PRD Appendix A with zero drift across all 8
years, including the fragile 2025 endpoint. Commits `4e63717` → `503c239` → `9ca19e4` + `7fc0050`.

- _Why the skeleton split into two tasks instead of one._ Cedar found the full slice (data +
  Route Handler + page + a `'use client'` Recharts component + its CSS) was 6+ files against
  Rule 5's 5-file cap, and none of the six qualified as generator-output-class the way the
  scaffold's exemption did. Rather than spend another bounded exemption, Cedar split on the agent
  boundary: Redwood builds data + the NFR-3 table now, Magnolia adds the chart over it later.
  Presented to the human as an explicit decision point in plan mode rather than assumed —
  approved as proposed.
- _Why the page imports the fetch function directly instead of calling its own Route Handler over
  HTTP._ Self-fetching needs an absolute URL the server doesn't portably know, fails during
  `next build`'s prerender when no server is listening, and adds a redundant round trip and a
  second caching layer. The Route Handler still exists — not decorative — because NFR-2 and the
  Stack table name it as the token-handling mechanism, and it's the black-box surface Cypress
  tests and a human can `curl`. One query, one schema, one validator, in one module, imported by
  both faces.
- _The one constraint with no mechanical net, named before it could be discovered the hard way._
  `guard-data-integrity.sh`'s pinned-figure list only covers 26 six-digit literals (collisions,
  injuries, casualty-filtered) — three-digit deaths values would false-positive the hook on every
  ordinary integer, so they're deliberately absent from it. Cedar flagged this in the SPEC itself
  rather than let it surface as a surprise at audit time; Cypress's audit (grep across all
  non-test source for the 8 real deaths figures) was the only protection, and it held.
- _A bug found mid-implementation was routed to its owner, not fixed by whoever found it._
  Redwood hit a `ReferenceError` in Cypress's own `page.test.tsx` — a `vi.mock` factory closing
  over a plain top-level `const` that Vitest's mock-hoisting evaluates before its temporal-dead-
  zone initialization (the same pattern the file's own `fetchDeathsPerYear` was correctly wrapped
  in `vi.hoisted()` for, two lines above the bug). Redwood diagnosed it precisely, built an
  isolated repro, and **declined to touch the file** — test files are Cypress's alone. The
  orchestrator relayed the diagnosis to the same Cypress invocation (continuation, not a respawn,
  so it kept its authoring context) rather than fixing it in the main session, which would have
  been faster but would have blurred who owns test correctness. One-line fix, verified against the
  exact failure it corrected. No rejection loop needed — this was a test-authoring bug surfaced
  during implementation, not a Cypress FAIL of Redwood's work after audit.
- _A second hazard reappeared after being fixed once, and that was expected, not a regression._
  `next dev`/`next build` auto-append a `<!-- BEGIN:nextjs-agent-rules -->` block to `CLAUDE.md`
  (Next 16's `generate-agent-files.js`) on every run. Redwood reverted it during implementation;
  it came back during Cypress's independent `npm run dev` verification pass, and the orchestrator
  reverted it again before archiving the SPEC. Recorded as a standing clause rather than a bug to
  fix, since it's a generator side effect outside the repo's control — the fix is "revert after
  every dev/build run," permanently, not a one-time cleanup.
- _The audit didn't trust the implementer's own evidence._ Cypress re-ran the live Socrata query
  independently (`npm run dev` → `curl` → kill the server) rather than diffing Redwood's pasted
  response body, and re-derived the FR-8 invariant by reading `src/lib/deaths.ts` directly rather
  than trusting its own pre-written test's pass. Both matched. This extends the discipline the
  2026-08-05 audit established for the scaffold SPEC (verify cold, not from a report) to live data,
  not just static files.

---

## 2026-08-05 — Cypress audited both completed SPECs in one pass; PASS, no critical violations

Verified cold, nothing fixed, no test file written (the first belongs to the skeleton, per both
ordering overrides), tree left clean.

**The scaffold's file bound was proven, not argued.** Cypress regenerated verbatim
`create-next-app@16.3.0` output into the scratchpad and byte-compared: all 11 generator-class files
identical, exactly 6 divergences matching the enumerated list with no substitutions. This is the
right way to audit an exemption granted on "generator output encodes no decisions" — the claim is
falsifiable by `cmp`, so it should be falsified by `cmp` rather than by reading a completion report.

**Item (b) would have passed vacuously and was caught.** `git status --porcelain -- .gitignore
README.md` is trivially empty on a committed tree, so the check was re-pointed at the commit range:
both files are byte-identical across `14b2960^..HEAD`. A checklist item written for an uncommitted
working tree silently stops testing anything once the work lands — worth remembering for any future
acceptance clause phrased against `git status`.

`tsconfig.include` at 5 entries confirmed as a genuine fixed point, not drift: `npm run build` left
`git status --porcelain` empty before and after.

**The one real finding is a fake-green, and it is not in the code that was audited.** Both hook
defects predate the platform SPEC. The gate's `[ -x ]` binary guards mean a present-but-empty
`node_modules/` yields "clean" from zero checks — structurally the same fake-green the platform SPEC
was written to kill, sitting one layer beneath it. Finding it required running the hook in
constructed environments rather than reading it, which is why the five-cell matrix mattered.

**Node-20 reproduction now costs deliberate effort.** With the harness `PATH` fix live, the failure
path has to be constructed (`env PATH=/usr/local/bin:/usr/bin:/bin`). Convenient today, but it means
the guard's own failure mode is no longer exercised incidentally — future audits must construct it
on purpose or stop testing it at all.

**Amendment 3(e)'s two rename checks split.** The first is pre-discharged by Redwood having dropped
`"**/*.mts"` from `tsconfig.include`; the second is not, because `eslint.config.mjs` declares no
explicit `files` patterns and inherits `eslint-config-next`'s — so `.mts` lint coverage is an
unverified default. (Later resolved and confirmed during Task 1's test-writing phase: it does lint
`.mts`, verified with a deliberate violation.)

---

## 2026-08-04 — Toolchain stood up across two SPECs; both halted usefully before they finished

The scaffold (Next 16 / React 19 / TS / Vitest / CSS Modules, 6 hand-authored files) and a
follow-on platform-agreement fix (3 files). All four gates green on Node 22.23.2, verified
independently rather than taken from the completion reports; `stop-quality-gate.sh` is live.
Both were audited clean by Cypress on 2026-08-05.

**Why the scaffold was its own SPEC rather than pre-work:** `create-next-app` introduces the whole
dependency tree, and Rule 9 gives Cedar sole dependency authority — treating it as plumbing would
have routed around that rule. It also broke Rule 5's file cap (~20 files), resolved by a **bounded**
exemption: generator output is exempt because it encodes no decisions and is reproducible from one
pinned command; hand-authored files stay capped and enumerated for audit. The 2026-08-05 audit
proved that bound rather than arguing it — regenerate verbatim, `cmp` every file — which is the
check that makes the exemption safe to grant again.

**The Node 20 halt, and why it was the most valuable thing that happened.** Redwood stopped at
step 0: `jsdom@30` and `@testing-library/jest-dom@7` (and `6.10.0`) exclude Node 20.19.6. npm
doesn't enforce `engines` without `engine-strict`, so both install on a warning — and vitest only
instantiates jsdom per test file, of which the scaffold writes none. Every acceptance command would
have exited 0 over a toolchain that breaks at Cypress's first component test. Pinning back to
`jsdom@^29` was rejected as a rolling problem: it adopts two packages already on their maintainers'
drop lists, and each future dependency hits the same wall as Node 20 recedes past its April 2026
EOL. Chose to raise the platform per-project instead, leaving the system Node and every other
project on the machine untouched.

**Then the same failure reproduced from the other side.** After the scaffold landed, all four gates
passed on Node 20 in the agent's own shell — the Bash tool runs bash, not the login fish shell, and
inherits its environment rather than re-sourcing `.bashrc`, so no shell wiring reaches it. The
acceptance criteria could not see it.

**`engine-strict` was proposed as the fix and rejected on evidence.** `stop-quality-gate.sh` invokes
`./node_modules/.bin/tsc` and `./node_modules/.bin/eslint` **directly**, bypassing npm — no `.npmrc`
setting can reach the process that emits the verdict. It is install-scoped and cannot gate a run
against an existing tree; on a Node 20 Vercel image it would additionally hard-fail production
deploys over `jsdom`, a test-only dep `next build` never loads. The fix went into the hook instead:
read `.nvmrc`, compare **majors only** (the patch floor is npm's `EBADENGINE` job), exit 2 naming
both versions. No semver parser, no `fnm exec` auto-repair.

**Cedar's test for granting a file beyond a spent budget, worth reusing:** a slot is granted only
when (i) the mechanism is the **only** thing catching the named failure and (ii) no existing file,
hook, CI config, or acceptance clause can carry it. `engine-strict` failed both, so the bound held
on merit rather than on the number.

**Two hazards the scaffold SPEC existed to prevent, both real in this tree:** a stock `eslint .`
lints 270+ third-party `.mjs` skill-payload files under `.claude/`, `.gemini/`, `skills/`; and the
stock `tsconfig` `include` of `**/*.ts` sweeps three `types.d.ts` files from those trees into
`tsc --noEmit`. Fixed with ignore entries and a `src/**` **allowlist** include — allowlist rather
than denylist, since a denylist re-breaks the moment a fourth skill tree appears.

**Deviations Redwood declared rather than hid:** `--disable-git` (without it the scratchpad scaffold
carries its own `.git` into the repo root); `--no-agents-md` (Next 16 generates `AGENTS.md` by
default, which CLAUDE.md rules against — suppressed at generation rather than
generated-then-deleted); `tsconfig.include` at 5 entries because `next build` re-adds
`.next/dev/types/**/*.ts` and it is a stable fixed point; jsx-a11y spread as `.rules` only, since
the full recommended object throws `Cannot redefine plugin` — `eslint-config-next` already
registers it. All three were confirmed as declared, not silently wider, by the 2026-08-05 audit.

---

## 2026-08-04 — README architecture diagram repaired and corrected

The mermaid block failed to render: escaped `[\"` openers, which mermaid parses as a parallelogram
it can never close. Rebuilt to current mermaid.js.org standards — markdown strings (backtick-quoted)
rather than the discouraged `<br/>`, `direction TB` rather than the top-level-only `TD` alias,
`classDef` ahead of its `class` assignments. Classic shape syntax kept **deliberately** over the
v11.3 `@{ shape: }` form, which would break on any renderer pinned below that version for no gain.

**Two modeling errors fixed while redrawing — worth more than the syntax fix.** The old diagram
routed every series through a "Data Repair Engine" box, which (a) invents a subsystem FR-12
explicitly says is just one `$where` clause, and (b) left the **raw** series with no path to the
chart — yet raw-beside-repaired _is_ the product's central claim. A diagram omitting it describes a
different, weaker product. Also added the NFR-3 accessible data table, whose absence CLAUDE.md
rates an automatic FAIL.

**Decision that came out of it — `ARCHITECTURE.md` is deferred, not owed.** Both the ledger and
CLAUDE.md § Project Layout had listed it as a pending deliverable, which is how an agent ends up
manufacturing a hollow one to satisfy the reference. Rejected because its content is already
covered three times over (CLAUDE.md Stack table, PRD §5.1, README Technical Notes), and because a
design doc written before any code documents _intentions_, not architecture — it would be rewritten
at the first Route Handler and rot in between, which is ADR 0001's failure mode exactly. **Revisit
trigger, recorded with the decision rather than left implicit:** when locating a change requires
more than a glance at the file tree.

**Polish pass after seeing it rendered** (`dataviz` skill loaded per CLAUDE.md). Rendering exposed
three faults no syntax check catches: a three-line label turned the decision node into a diamond
that swallowed half the canvas, two identical `pass` labels collided with the subgraph title, and
the default cluster grey muddied everything. Fixes: a one-line gate label, and a **validated
payload** node so the fan-out to chart and table is labelled once — which is also more honest,
since NFR-3 requires the table to show _the same figures_, i.e. one response feeding both, not two
independent paths.

**Palette decision worth not re-litigating.** Switched to `fill:none`, with role identity carried by
**stroke + label only**. Mermaid inside a README cannot branch on `prefers-color-scheme`, so
hardcoded fills mean committing to one theme and losing the other; transparent fills let text and
edge-label chips inherit the viewer's own mermaid theme, so the diagram is correct in GitHub light
_and_ dark. Strokes are the reference palette's dark-column steps, chosen because they clear 3:1
against **both** `#ffffff` and `#0d1117` (computed, not eyeballed). Validator: all PASS in both
modes except `#c98500` at 2.99:1 on light, where the relief rule is satisfied by construction —
every node carries a visible text label, so identity is never color-alone.

**Second render pass — edge routing.** The swooping arrows were mermaid's default `basis` curve,
not a layout accident; a 3-into-1 fan-in rendered as beziers reads as spaghetti at any size. Set
`curve: "linear"` via an init directive and tightened `nodeSpacing`/`rankSpacing`. Also swapped the
decision node from a diamond `{...}` to a hexagon `{{...}}`: mermaid sizes a diamond around its
text's _inscribed_ rectangle, so it inflates far faster than any other shape and forces every
incoming edge onto a slanted face. Decision semantics survive the swap because they were never
carried by the shape — the `pass`/`fail` edge labels and the node's own question mark do that work.

---

## 2026-08-04 — NYC DOT Vision Zero releases evaluated against the record; two docs amended

Reviewed DOT's [January 2025 equity report](https://www.nyc.gov/html/dot/html/pr2025/vision-zero-report-street-redesign.shtml)
and its [October 2025 Q3 companion](https://www.nyc.gov/html/dot/html/pr2025/decline-in-traffic-deaths.shtml)
for anything that changes the product's thesis. It doesn't — neither mentions the MV-104 break —
but two things were worth capturing and two were rejected.

**Added to FR-9's caveats list: SIP (Street Improvement Project) placement as a third named
confounder**, alongside COVID speeds and CBD congestion pricing. The equity report's own methodology
documents that redesigns were deliberately concentrated in the lowest-income and highest-Asian/
Black/Hispanic NTAs since 2014 — so placement is _geographically non-random by design_, which is
exactly what makes any borough-level deaths claim (the Bronx especially) attributable to something
other than enforcement or reporting.

**Added to the drift note's downstream-damage section:** the October release evaluates three named
corridors by before/after `number_of_persons_injured` deltas, converting the note's abstract "warps
benefit-cost ratios" claim into a dated, checkable instance. Recorded **with its counterweight** —
the note's own casualty-filter finding is that the injuries series survived the 2020 change far
better than the raw collision count, so the deltas are not presumptively wrong. The defensible claim
is only that the reporting component is of unknown size and cannot be bounded from the published
material. Overstating it would repeat the error the note exists to criticize.

**Rejected — putting any DOT figure on the page.** The equity report's −26%/−34% are 2004–13 vs
2014–23 decade averages across NTAs; the product's series is citywide 2018–2025. Side by side they
read as contradicting "deaths down 1%" when they are simply a different measurement. Same for the
"159 deaths, −18%" Q3 figure — a partial-year count, not comparable to a pinned annual one, and
NFR-4 forbids the literal regardless.

**Rejected — ingesting SIP data.** Separate DOT open dataset requiring NTA-level census joins; out
of scope for a two-dataset MVP whose walking skeleton isn't built (Rule 6).

---

## 2026-08-04 — Claude Code agent configuration built out

Created a standalone `CLAUDE.md` plus `.claude/` (7 agents, 6 hooks, 1 project skill, 1 slash
command, 1 deterministic script) for this directory, which had only a Gemini CLI setup before.

**Initially built at parity with `GEMINI.md`, then deliberately un-parity'd on request.** The parity
constraint had forced Claude-side capabilities down to the lowest common denominator: Gemini CLI has
no hook system, so the mechanical rules were prose in GEMINI.md and stayed prose in CLAUDE.md.
Dropping parity converted three of them into enforcement that runs whether or not anyone remembers
the rule — the token-exposure guard, the hardcoded-figure guard, and the typecheck/lint Stop gate.
`GEMINI.md` is now stale relative to `CLAUDE.md` **by design**; it is not a second source of truth.
The cross-tool `check-config-parity.sh` hook was removed for the same reason (recoverable from
`Pursuit_AI-Native/.claude/hooks/` if parity is ever wanted back).

**Why a project skill rather than more CLAUDE.md prose:** the dataset contract (endpoints, verified
fields, pinned figures, the five traps) is needed by five of the seven agents but only at
query-writing time. As a skill it loads on demand; in CLAUDE.md it would tax every session's context
with a fact most turns don't need (Rule 7, context diet).

**Why `AGENTS.md` was folded into `CLAUDE.md`:** Claude Code auto-loads `CLAUDE.md` and not
`AGENTS.md`, so the per-assignment record (security-isolation assessment, adopted gates, lint
rationale) lived in a file nothing would read. It became the "Recorded decisions" section.

**Skill-tree prune:** `.gemini/skills/` carried 7 items the curated `skills/` did not
(ai-ml-developer, canvas-design, mobile-developer, nonprofit-builder, react-view-transitions, and
two shell scripts) — an unpruned copy from the parent repo. Deleted after a dry run confirmed all 7
remain recoverable from `Pursuit_AI-Native/.gemini/skills/`.

**MCP pruned** from 7 servers to 3 (context7, playwright, github). Dropped supabase (no database in
this build), markitdown (nothing to convert), godot and aseprite (other projects).

---

## 2026-08-04 — `.gitignore` created; NFR-2's pre-first-commit check had never actually run

CLAUDE.md requires verifying `.gitignore` covers `.env*` _before the first commit_. There was no
`.gitignore` in the repo at all, and three commits had already been pushed public. Nothing leaked —
`.env` does not exist yet — but the gap was live: creating one and running `git add -A` would have
published `SOCRATA_APP_TOKEN`, the exact Rule 3 failure.

Also closed two quieter holes. `.claude/settings.local.json` was ignored only by the _user's global_
excludes file, so any fresh clone or second machine would have tracked it; and its `.tmp.*`
write-leftovers were accumulating as untracked noise an `add -A` would eventually sweep in.
`.env.example` is negated back in so variable _names_ can be documented without values — the
mechanism that later let the scaffold ship a token-name placeholder safely.

---

## 2026-08-13 — MVCC Workspace 3-column redesign (commit `8651222`)

Built the imported Design Composer mockup ("MVCC Workspace.dc.html") as the real UI layer for
`/`, `/integrity`, `/registry`. Outcome is in the tree; the reasoning that isn't re-derivable:

- _Why a route group + scoped tokens rather than editing `globals.css`:_ the existing `:root`
  tokens are load-bearing for `/local`, `/tdi`, `/auditor`, `KPIRow`, `MetricSection` and more.
  Retheming globally would have silently broken every out-of-scope page. The Broadsheet palette
  is therefore scoped to a wrapper class in `(workspace)/workspace.module.css` — CSS Modules
  hashes class names but never custom-property names, so the tokens still cascade normally to
  descendants written in other stylesheets.
- _Why Context, not Next.js parallel routes, for the right inspector:_ the inspector lives in
  the shared layout, a sibling of the routed page, so props can't reach it. A parallel-route
  slot re-renders per navigation, not per client hover — it structurally cannot drive the
  Timeline's live crosshair. Mixing parallel routes for two pages and Context for the third was
  judged worse than one uniform mechanism.
- _Why `git mv` mattered:_ delete+recreate would have lost per-file history on three page files
  that carry substantial prior reasoning in their headers.
- _Why `vitest.config.mts` needed its own `resolve.alias`:_ Vitest does not read `tsconfig.json`
  `paths` (Next's bundler does, Vite doesn't). Switching moved pages to `@/*` therefore required
  the alias in two places, not one.
- _Why `seriesConfig.ts`/`derived.ts` exist:_ three views need identical series metadata and
  identical value/delta lookups. Three copies would drift, and the drift would be invisible
  (each page would still look internally consistent). One definition, imported everywhere.
- _An NFR-4 gap this closed by accident:_ `IntegrityAudit` and `SeriesRegistry` were previously
  fully hardcoded. The guard hook never caught it because it matches a fixed literal list and
  these were percentages/prose. Wiring real data through fixed it; confirmed live when the
  borough-coverage message rendered 33% from a fresh query rather than the mockup's
  illustrative ~30%.
- _Why the Staten Island prose was rebuilt from `fetchStatenIslandPilot()` rather than copied:_
  the mockup's numbers were design-tool placeholders. Recomputing produced almost the same
  figures (514/217/6,171/2.68×) — which is the point: they're now real, and will move if the
  data does. The mockup's "borough coverage held flat across the SI boundary" claim was
  **dropped entirely**, because no lib function computes per-borough per-month coverage and
  asserting it would have been inventing a number.
- _Git author identity:_ commit `8651222` is authored
  `Rayan Khan <rayan@macbookpro.mynetworksettings.com>` (hostname-derived) because no global
  git identity is set on this machine. User was offered an amend + force-push and chose to
  leave it. Set the identity before the next commit rather than rewriting published history.

## 2026-08-14 — Danger-index height fix closed; the reachability defect it exposed

**Closed and committed (`bf930b1`).** New `src/components/DangerMap.module.css`; `DangerMap.tsx`
rewired at three elements (frame, `MapContainer` className, loading skeleton).

**Root cause worth keeping: the map container was 0 px tall.** `DangerMap.tsx`,
`danger-index/page.tsx`, and `danger-index/error.tsx` were the only three files in `src/` written
in Tailwind utility classes — **and Tailwind is not installed** (no dep, no config, no PostCSS, no
`@tailwind` in `globals.css`). Proven, not inferred: the two stylesheets actually served contained
zero matches for `.w-full` / `.h-full` / `.h-[600px]`, and `leaflet.css` sets no height on
`.leaflet-container` — Leaflet requires the author to size it. Outer div → `height: auto`; its only
child was `ssr:false` dynamic. Leaflet initialised into a 0×0 viewport and painted nothing.

**The trap that survives the fix:** `.map`'s `height: 100%` is load-bearing on `.mapFrame` keeping
a *definite* height. If that becomes `auto`, Leaflet silently returns to 0×0 — same failure, no
error anywhere.

**Why this mattered more than it looked.** Fixing the height made a *visibly incorrect ranking
visible*, which is what surfaced the two data defects (no window filter, float-splitting `$group`).
And the follow-up question — "how would a user even reach this?" — surfaced that
`src/components/GlobalNav.tsx` was the only file linking to `/danger-index`, `/local`, `/tdi`, and
`/auditor`, and that **nothing imported GlobalNav**. Four routes had been unreachable from inside
the product for weeks, each with a passing test suite. The lesson generalises past this bug: a
green test on an unrendered component conceals that it is unrendered, which is why the 2026-08-14
plan deletes `GlobalNav` and `BoroughPicker` outright rather than leaving them green.

**Left alone deliberately at the time:** `page.tsx` and `error.tsx` stayed inert Tailwind —
harmless for rendering, but unstyled. Now scoped as T6.

## 2026-08-14 — Plain-English copy pass closed

Committed as `699d998` ("refactor: simplify terminology across components"), 2026-08-13. The ledger
entry claimed "UNCOMMITTED, NEXT STEP: commit it" until 2026-08-14, when `git status` showed a clean
tree and `dashNote` was found in HEAD — the ledger had simply never been updated after the commit
landed. Second recorded instance of the same failure: `SESSION_STATE.md` is episodic, the repo is
procedural truth. Full reasoning (the two real bugs it caught, the honesty-guardrail re-check)
already archived under the earlier "2026-08-14" entry.


## 2026-08-14 — The two danger-index data defects: diagnosis, and what verifying them overturned

Closed by T5 (see `SPEC.md`). Kept here for the reasoning, which outlives the fix.

**The defects.** (a) `fetchDangerIndex()` filtered on coordinates only, with no `crash_date`
bounds, so it aggregated the dataset's full 2012-07-01 → 2026-06-11 span against a window pinned
at 2018–2025. (b) `$group=latitude, longitude` on raw floats split one intersection across rows —
`40.696033,-73.98453` and `40.6960346,-73.9845292` are the same point ~18 cm apart.

**What re-verification overturned, and why that matters more than the fix.** The ledger recorded
"887 unwindowed vs 476 windowed" and a split pair summing to "1,299". Live probe on 2026-08-14
showed the 1,299 was the *unwindowed* sum — the two defects were **compounding**, so neither
recorded figure survived. Windowed and grid-merged, the real top three are `406960/-739846` = 589,
`406757/-738969` = 478, `406087/-740381` = 476. The previously-rendered #1 (476) is really third.
Both defects were real; both numbers used to describe them were wrong. This is the third recorded
instance of a `SESSION_STATE.md` claim failing verification, and the cleanest illustration of why
the ledger is episodic and the repo (plus a live query) is procedural truth: the entry was written
in good faith by someone who had checked *one* defect at a time.

**The trap the probe caught that the spec did not.** Cedar's first draft aliased
`avg(latitude) AS latitude`. That shadows the source column, so `$where … latitude != 0` resolves
to the aggregate and Socrata rejects the entire query with
`query.soql.aggregate-in-ungrouped-context`. Alias to `lat_c`/`lon_c` and do the rename inside Zod
instead — which also keeps `DangerMap.tsx` out of scope. **A pinned SoQL in a `[SPEC]` is a
hypothesis until someone curls it.** `floor()` in `$select`/`$group` was confirmed working on
`h9gi-nx95` by the same probe.

**Why the original Cypress audit passed a wrong query.** `__tests__/dangerIndexFetcher.test.ts`
stubbed `global.fetch` and asserted only `$limit`/`$order` plus the parse. Nothing rendered the
page. So no test covered the height, the window, or the grouping — and all three shipped. The rule
this yields: **"mounts without throwing" is not a behavioural test.** A fetcher with a wrong
`$where` passes it, and so does a component rendering into a 0px box. Assert on the query that was
*sent* and the shape that comes *back*.

**A second Zod-shaped instance of trap 1, verified rather than assumed.** Cypress probed directly:
`z.coerce.number().safeParse(null)` returns `{success: true, data: 0}` while `safeParse(undefined)`
fails. So a test for an *absent* key passes against a `z.coerce.number()` implementation — only a
test for an explicit `null` catches it. On this product that single test is the margin between a
correct fetcher and one silently reporting a zero-collision intersection. `z.coerce.number()` is
absent-key-as-zero wearing a Zod costume; the repo's strict pattern (`socrata.ts` `ValueSchema`,
digits-only string + explicit transform) is the one to copy.

The three danger-index commits (`64527f2`/`3292011`/`2a144a8`, 2026-08-13) had reached `main` with
no ledger entry at all, which is how all of the above stayed invisible for a day.

