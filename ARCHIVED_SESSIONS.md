# Archived Sessions — MVCC Data

Older `## History` entries moved out of `SESSION_STATE.md` when it crossed the archive threshold
(150 lines / 5 sessions). Condensed per CLAUDE.md § Session Continuity and
`docs/adr/0001-preserve-reasoning-when-condensing.md`: **the reasoning is the payload.** Procedural
detail is dropped freely; why an option was rejected, why a scope line was drawn, and what
constraint forced a design are kept, because those are what a future session cannot re-derive.

---

## 2026-08-06 — FR-2 (injuries per year) shipped, executing Task 1's pre-committed refactor

Added injuries per year as a second, independently-fetched metric, and — as the same task —
extracted `src/lib/socrata.ts` as a generic yearly-metric transport that `deaths.ts` and the new
`injuries.ts` both call. Cedar picked FR-2 over the seemingly-more-central FR-3 (collisions) for
this slot; standard ordering (Cypress tests-first); Cypress PASS both on Phase B's own tests and on
auditing Redwood's implementation. Commits `c4e8602` (SPEC) → `c973beb` (tests) → `7e35715`
(implementation) → archival.

- *Why FR-2 was picked over FR-3, even though FR-3 carries more of the product's actual thesis.*
  FR-3's text requires the chart's dashed-stroke-plus-label treatment, so it cannot be a
  Redwood-only data slice the way FR-1 was — it inherently bundles a data task and a Magnolia
  chart-redesign task, and Cedar was told not to combine tasks into one SPEC. More load-bearing:
  Task 1's own SPEC had *already* named this exact trigger in its Tipping Point — "a second series
  arrives → parameterize the fetch; a second Route Handler appears → extract socrata.ts" — written
  before either FR-2 or FR-3 was chosen as the next task. Executing a refactor a past SPEC
  pre-committed to, with the smallest available second caller, was judged lower-risk than jumping
  straight to a task that would force three decisions (query parameterization, the chart's
  Tipping-Point redesign, and the dashed-stroke choice) into one shot.
- *Why `fetchYearlyMetric` takes only the aggregate expression and field alias, not the where/group
  clauses too.* Widening the parameter surface now, before a caller needed a different `$where` or
  group key, would have been the unearned-abstraction failure Rule 8 rejects — pre-building for
  FR-12 or FR-6 before either SPEC exists to justify the shape. The fixed 2018–2025 window and
  `date_extract_y` grouping stayed hardcoded constants inside `socrata.ts`, and the SPEC named the
  actual trigger for widening further: a third distinct query *shape*, not a third caller with the
  same shape.
- *Why `DeathsRow`/`DeathsResult`'s exact structural shape was the load-bearing acceptance
  criterion, not a nice-to-have.* `DeathsChart.tsx` reads `.deaths` by name and was explicitly
  frozen — untouched by this task. The refactor's whole risk was silently changing what
  `fetchDeathsPerYear()` returns without anyone noticing until the chart broke. Making "zero
  changes to `deaths.test.ts`/the deaths route test/all three `DeathsChart` files" a mechanical
  acceptance clause (`git diff --stat`, checked by both Redwood and independently by Cypress) turned
  an invisible invariant into one a `git diff` could prove, rather than one resting on care alone.
- *A file tripped its own Tipping Point on the same task that wrote it, and that was treated as
  information, not a failure.* `socrata.ts` landed at 252 lines against its SPEC's own ~120-line
  threshold — inherent to generalizing Task 1's already-substantial 10-branch validation pipeline
  for two callers, not duplication (Cypress read it end to end to confirm). Nobody tried to split
  it mid-task without a SPEC authorizing the decomposition; it was reported up as a finding for the
  next SPEC that touches the file, with the Tipping Point's own stated trigger (a third distinct
  query shape) named as the actual decision point rather than the line count in isolation.
- *An acceptance clause's literal wording didn't match the requirement it was checking, and both
  Redwood and Cypress caught it independently rather than gaming the letter of it.* The SPEC asked
  that the token *name* appear in exactly one file; the token name legitimately appears in comments
  and synthetic test fixtures elsewhere, while the actual `process.env` *read* — what NFR-2 cares
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

- *Why the revision request mattered enough to block dispatch over.* Cedar's first pass specced
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
- *Why the detector proof was run twice, by two different agents, on two different cells.* A
  green run of a checker proves nothing about whether the checker actually checks — only a run
  that's supposed to fail and does prove that. Redwood ran it once (mutating the 2022 deaths cell)
  during implementation; Cypress, auditing after, deliberately re-ran it on a different cell (2023
  injuries) rather than accepting Redwood's proof as sufficient. Independent reproduction on a
  different input is what makes this evidence rather than a repeated assertion.
- *Why two agents independently verified links a hook was known not to cover.* `check-citations.sh`'s
  normative-doc scan (`CLAUDE.md`, `GEMINI.md`, ledgers, `.claude/agents/*.md`, `docs/adr/*.md`)
  doesn't include the two research docs or `SKILL.md` — so the new `[ADR 0002]` links added *into*
  those three files were invisible to the mechanical gate, even though the ADR file itself (matching
  `docs/adr/*.md`) was covered. Both the orchestrator and Cypress resolved the links by hand against
  the filesystem rather than trusting the hook's green exit to mean more than it does. Worth
  remembering: a hook's "all clear" is scoped to what it scans, not to the task's actual footprint.
- *Why the script was rebuilt from the pinned query rather than chased down.* The SPEC's Output 1
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

- *Why colour lives entirely in the CSS module, targeting Recharts' own stable class names, rather
  than `currentColor` props on the marks.* A single line-chart dot needs two different colours at
  once — its fill (the series colour) and its 2px ring (the surface colour, so it reads as a hole
  punched through the line rather than a solid disc). `currentColor` only carries one value per
  element, so it can't express both; CSS rules targeting `.recharts-line-dot` etc. can, and they
  outrank Recharts' own default presentation attributes in the cascade regardless of specificity.
  This also kept the "no colour literal in the .tsx" constraint (Constraint 4) trivially true rather
  than requiring a `currentColor` workaround per mark.
- *Why the zero-based y-axis was treated as the single most important test in the file, not a style
  preference.* The deaths series runs roughly 229–297 across eight years — auto-fitted, that reads
  as a dramatic mountain range; zero-based, it reads as what it is, essentially flat. The product's
  whole thesis is that deaths barely moved while recorded collisions fell 63%, so a truncated axis
  would have the flagship chart visually contradict the page's own prose, and would do it through a
  rendering default nobody consciously chose. This is NFR-5 (honesty of presentation) expressed as
  geometry, which is why Cedar's SPEC forbade changing it "to make the chart more readable" and why
  Cypress's zero-tick assertion is called out by name as the load-bearing test.
- *A pre-existing test-authoring bug, found and owned the same way Task 1's TDZ bug was.* Cypress's
  own "no `process.env` under `src/components`" grep-test scanned its own test file's source
  (including the literal string in its own assertion code and comments) rather than excluding test
  files the way its three sibling checks in the same block already did — a false positive against
  the file testing itself, not a real client-boundary leak. Magnolia, implementing the component,
  found the discrepancy but correctly declined to touch Cypress's test file; it independently
  verified the real constraint held by scoping the grep to the actual component. The orchestrator
  then dispatched Cypress for its Phase D audit, which diagnosed and fixed the one-line filter
  itself — same ownership boundary Task 1 established (Redwood diagnoses, Cypress's file is
  Cypress's to fix), same pattern, different task.
- *Why the First Load JS figure was recorded without a threshold.* Next 16's Turbopack build no
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

- *Why the skeleton split into two tasks instead of one.* Cedar found the full slice (data +
  Route Handler + page + a `'use client'` Recharts component + its CSS) was 6+ files against
  Rule 5's 5-file cap, and none of the six qualified as generator-output-class the way the
  scaffold's exemption did. Rather than spend another bounded exemption, Cedar split on the agent
  boundary: Redwood builds data + the NFR-3 table now, Magnolia adds the chart over it later.
  Presented to the human as an explicit decision point in plan mode rather than assumed —
  approved as proposed.
- *Why the page imports the fetch function directly instead of calling its own Route Handler over
  HTTP.* Self-fetching needs an absolute URL the server doesn't portably know, fails during
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
  zone initialization (the same pattern the file's own `fetchDeathsPerYear` was correctly wrapped
  in `vi.hoisted()` for, two lines above the bug). Redwood diagnosed it precisely, built an
  isolated repro, and **declined to touch the file** — test files are Cypress's alone. The
  orchestrator relayed the diagnosis to the same Cypress invocation (continuation, not a respawn,
  so it kept its authoring context) rather than fixing it in the main session, which would have
  been faster but would have blurred who owns test correctness. One-line fix, verified against the
  exact failure it corrected. No rejection loop needed — this was a test-authoring bug surfaced
  during implementation, not a Cypress FAIL of Redwood's work after audit.
- *A second hazard reappeared after being fixed once, and that was expected, not a regression.*
  `next dev`/`next build` auto-append a `<!-- BEGIN:nextjs-agent-rules -->` block to `CLAUDE.md`
  (Next 16's `generate-agent-files.js`) on every run. Redwood reverted it during implementation;
  it came back during Cypress's independent `npm run dev` verification pass, and the orchestrator
  reverted it again before archiving the SPEC. Recorded as a standing clause rather than a bug to
  fix, since it's a generator side effect outside the repo's control — the fix is "revert after
  every dev/build run," permanently, not a one-time cleanup.
- *The audit didn't trust the implementer's own evidence.* Cypress re-ran the live Socrata query
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
chart — yet raw-beside-repaired *is* the product's central claim. A diagram omitting it describes a
different, weaker product. Also added the NFR-3 accessible data table, whose absence CLAUDE.md
rates an automatic FAIL.

**Decision that came out of it — `ARCHITECTURE.md` is deferred, not owed.** Both the ledger and
CLAUDE.md § Project Layout had listed it as a pending deliverable, which is how an agent ends up
manufacturing a hollow one to satisfy the reference. Rejected because its content is already
covered three times over (CLAUDE.md Stack table, PRD §5.1, README Technical Notes), and because a
design doc written before any code documents *intentions*, not architecture — it would be rewritten
at the first Route Handler and rot in between, which is ADR 0001's failure mode exactly. **Revisit
trigger, recorded with the decision rather than left implicit:** when locating a change requires
more than a glance at the file tree.

**Polish pass after seeing it rendered** (`dataviz` skill loaded per CLAUDE.md). Rendering exposed
three faults no syntax check catches: a three-line label turned the decision node into a diamond
that swallowed half the canvas, two identical `pass` labels collided with the subgraph title, and
the default cluster grey muddied everything. Fixes: a one-line gate label, and a **validated
payload** node so the fan-out to chart and table is labelled once — which is also more honest,
since NFR-3 requires the table to show *the same figures*, i.e. one response feeding both, not two
independent paths.

**Palette decision worth not re-litigating.** Switched to `fill:none`, with role identity carried by
**stroke + label only**. Mermaid inside a README cannot branch on `prefers-color-scheme`, so
hardcoded fills mean committing to one theme and losing the other; transparent fills let text and
edge-label chips inherit the viewer's own mermaid theme, so the diagram is correct in GitHub light
*and* dark. Strokes are the reference palette's dark-column steps, chosen because they clear 3:1
against **both** `#ffffff` and `#0d1117` (computed, not eyeballed). Validator: all PASS in both
modes except `#c98500` at 2.99:1 on light, where the relief rule is satisfied by construction —
every node carries a visible text label, so identity is never color-alone.

**Second render pass — edge routing.** The swooping arrows were mermaid's default `basis` curve,
not a layout accident; a 3-into-1 fan-in rendered as beziers reads as spaghetti at any size. Set
`curve: "linear"` via an init directive and tightened `nodeSpacing`/`rankSpacing`. Also swapped the
decision node from a diamond `{...}` to a hexagon `{{...}}`: mermaid sizes a diamond around its
text's *inscribed* rectangle, so it inflates far faster than any other shape and forces every
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
Black/Hispanic NTAs since 2014 — so placement is *geographically non-random by design*, which is
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

CLAUDE.md requires verifying `.gitignore` covers `.env*` *before the first commit*. There was no
`.gitignore` in the repo at all, and three commits had already been pushed public. Nothing leaked —
`.env` does not exist yet — but the gap was live: creating one and running `git add -A` would have
published `SOCRATA_APP_TOKEN`, the exact Rule 3 failure.

Also closed two quieter holes. `.claude/settings.local.json` was ignored only by the *user's global*
excludes file, so any fresh clone or second machine would have tracked it; and its `.tmp.*`
write-leftovers were accumulating as untracked noise an `add -A` would eventually sweep in.
`.env.example` is negated back in so variable *names* can be documented without values — the
mechanism that later let the scaffold ship a token-name placeholder safely.
