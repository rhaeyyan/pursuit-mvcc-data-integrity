# Archived Sessions — MVCC Data

Older `## History` entries moved out of `SESSION_STATE.md` when it crossed the archive threshold
(150 lines / 5 sessions). Condensed per CLAUDE.md § Session Continuity and
`docs/adr/0001-preserve-reasoning-when-condensing.md`: **the reasoning is the payload.** Procedural
detail is dropped freely; why an option was rejected, why a scope line was drawn, and what
constraint forced a design are kept, because those are what a future session cannot re-derive.

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
