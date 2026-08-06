# Queued SPEC — not active

`SPEC.md` holds the **active** contract, currently Task 2 of the walking skeleton (Phase C
pending). This file holds a SPEC that is approved-for-dispatch but deliberately **not started**,
so the contract survives compaction without displacing the in-flight one.

**Protocol:** when Task 2 closes and `SPEC.md` is archived to `ARCHIVED_SPECS.md`, the block below
moves into `SPEC.md` verbatim and this file is deleted. Nothing reads this file automatically; it
is not dispatched until a human says so.

- **Authored by:** Cedar, 2026-08-05
- **Status:** **not dispatchable as written** — one revision request is owed to Cedar first (below)
- **Then:** Redwood (execution) → Cypress (audit), awaiting Task 2 close-out
- **Ordering:** deviates from Cypress-first by design; rationale is in the SPEC's § Ordering

---

## Pending revision request — send to Cedar before this is dispatched

Raised by the orchestrator on 2026-08-05, human-approved. **Send to Cedar as a revision request,
not a rewrite** — the SPEC is Cedar's contract, and Rule 9's halt-and-request discipline applies to
the orchestrator too. Cedar's original invocation is gone with the session, so this respawns cold:
give it the SPEC block below plus this section, since it will not remember authoring either.

Two of the three flagged judgment calls were reviewed and **endorsed unchanged** — do not reopen
them, and say so explicitly so Cedar does not re-litigate:

1. **The `mvcc-data/SKILL.md` edit stands as specified.** The six subgroup fields are flagged
   inline at the field list as *breakdown fields that do not reconcile*, not appended as peers of
   `crash_date`/`borough`. That placement is the point: a bare field list reads as "safe to use,"
   and shipping six new ones with the caveat three sections away in trap 1 would rebuild the exact
   fields-here/warning-there split that caused the bug.
2. **The Redwood-first ordering stands.** Precedent, not just argument: `.claude/scripts/` holds no
   test files, and `verify-figures.py` — 212 lines, live-network, exit-code-bearing — shipped
   without any. A pre-written red test over prose corrections would invent a convention this repo
   has already declined twice.

**The one change requested — `.claude/scripts/subtotal-gap.py` is specced as a reporter, but the
house pattern it cites is a checker.** The SPEC names `verify-figures.py` as the style to copy,
then diverges from it structurally:

| | `verify-figures.py` (existing) | `subtotal-gap.py` (as specced) |
|---|---|---|
| Expected values | `PINNED` dict, in the file (line 36) | live only in the SPEC and ADR 0002 |
| On drift | exits 1, names the drifted figure | prints a table, exits 0 |
| Exit codes | 0 match / 1 drift / 2 fetch failed | 0 / non-zero only on an absent key |

The cost lands on the SPEC's own **Tipping Point**, "the gap closes, or extends backward before
2021," which as written has no detector: someone must run the script, open ADR 0002, and compare
eight pairs of numbers by eye. That is a human performing a diff — the same failure the script
exists to eliminate one level up, and the same NFR-4 argument Cedar used to justify the file in the
first place, applied one step further.

**Requested:** the script pins `PINNED_GAPS` for both series and exits 1 on any moved cell,
mirroring `verify-figures.py`'s exit codes exactly (0 match / 1 drift / 2 fetch failure). ADR 0002
then cites the script as the *detector* rather than as the *record*.

- This is **not** a hardcoded displayed figure. These are reference values in a verification
  script — the identical role `PINNED` plays today — and nothing renders them. NFR-4 is not in
  play; `guard-data-integrity.sh` does not scan `.py` in any case (see the SPEC's Edge Case 6).
- It does **not** widen the file budget. Same file, written to the pattern already chosen.
- **One acceptance command should be added** with it: force a mismatch (edit one pinned cell, run,
  confirm exit 1, revert). A passing green run never proves a detector detects.

---

```markdown
[SPEC] — Correct the falsified "synthetic fallback total" mitigation

- **Objective**: Replace the empirically falsified subgroup-sum fallback mitigation at all four
  live sites with the correct behavior (fail loud, per FR-11), preserve the reasoning that
  falsified it in a durable ADR, and give the measuring script a permanent home so the finding is
  re-verifiable rather than re-derivable. **No product behavior changes.** No file under `src/`
  is edited, no query contract moves, no requirement is amended.

- **Requirement**: Defends **FR-11 [P0]** (fail loud on an absent core aggregate) and **NFR-4**
  (no displayed figure produced by a language model). FR-11's text is **correct as written and is
  not being revised** — the correction is to a *proposed mitigation* recorded in the research
  layer, which currently contradicts the requirement it was meant to serve.

- **Inputs/Outputs**:

  - *Input*: clean tree; `SOCRATA_APP_TOKEN` in the gitignored `.env` (optional — the script
    must run anonymously, matching `verify-figures.py`'s behavior).

  - *Step 0 — baseline the citation hook before editing anything.* Run
    `./.claude/hooks/check-citations.sh` and record its full output. `docs/nyc-collision-analytics-
    deep-research.md` lines 206–210 contain cross-links inherited from the fellowship repo
    (`../../wiki/DataAnalytics.md`, `../week-4/...`) that may already fail to resolve here. **Any
    link already broken at Step 0 is pre-existing and out of scope — do not fix it.** Only a link
    this task newly breaks is this task's problem. Re-run after editing and diff against baseline.

  - *Output 1 — `.claude/scripts/subtotal-gap.py`* (**new**; port of the session script at
    `/tmp/claude-1000/-home-rayan-Documents-data-projects-pursuit-mvcc-data-integrity/8f8bde0b-ca03-43cb-a172-aaeaedcc4e73/scratchpad/subtotal_gap.py`).
    Must match `verify-figures.py`'s house style exactly: **stdlib only** (`json`, `os`, `sys`,
    `urllib.request`/`error`/`parse`), `from __future__ import annotations`, token read from
    `os.environ.get("SOCRATA_APP_TOKEN")` with an anonymous-but-rate-limited fallback and a
    `note:` line on stderr, `def main() -> int`. **No new pip dependency is authorized and none is
    needed** — do not introduce `requests`. Prints the per-year table of
    `authoritative_total − subgroup_sum` for both deaths and injuries, and exits non-zero if any
    queried key is absent (the script must itself obey trap 1 rather than printing a gap of 0 for
    a missing field — a silent 0 here would be the same failure one level up).

  - *Output 2 — the four prose corrections.* Content requirements are pinned below; wording is the
    executing agent's, except the two table cells given verbatim.

  - *Output 3 — `docs/adr/0002-no-synthetic-subtotal-fallback.md`* (**new**), mirroring ADR 0001's
    structure exactly: `# 0002 — <title>`, then `- **Status**: Accepted`, `- **Date**: 2026-08-05`,
    `- **Supersedes / Superseded by**: none`, then `## Context`, `## Decision`, `## Consequences`.

- **Query** (the reproduction contract — dataset `h9gi-nx95`, verified live 2026-08-05):

  ```
  $select = date_extract_y(crash_date) AS year,
            sum(number_of_persons_killed) AS killed,
            sum(number_of_pedestrians_killed) AS k_ped,
            sum(number_of_cyclist_killed) AS k_cyc,
            sum(number_of_motorist_killed) AS k_mot,
            sum(number_of_persons_injured) AS injured,
            sum(number_of_pedestrians_injured) AS i_ped,
            sum(number_of_cyclist_injured) AS i_cyc,
            sum(number_of_motorist_injured) AS i_mot
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  *Expected response shape*: a JSON array of exactly 8 objects, one per year 2018–2025, every
  value a **string** (cast explicitly — skill rule). Aggregated server-side to 8 rows, so trap 5's
  1,000-row default limit is not in play and no `$limit` is needed.

  *Field-provenance note, so this is not mistaken for an unpinned query*: the `mvcc-data` skill's
  "Verified fields" list names only five `h9gi-nx95` fields and does **not** yet include the six
  subgroup fields above. They are nonetheless verified by two independent sources — the live
  2026-08-05 run, and `docs/nyc-collision-analytics-deep-research.md` lines 46–47, which confirm
  the pedestrian/cyclist/motorist fields remain populated. Output 4 below adds them to that list,
  which is why this SPEC may pin them.

  *Expected diff (`authoritative − subgroup_sum`)* — **this is a value to diff against, never a
  value to transcribe**:

  | Year | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
  |---|---|---|---|---|---|---|---|---|
  | deaths gap | 0 | 0 | 0 | 12 | 20 | 19 | 9 | 6 |
  | injuries gap | 23 | 1 | 0 | 2,132 | 2,392 | 2,411 | 1,835 | 1,405 |

  **NFR-4 chain of custody, binding.** The figures written into the corrected docs must be
  transcribed from `subtotal-gap.py`'s own stdout on a fresh run — **not** copied from this SPEC,
  not retyped from prose, not adjusted. This table is the expected result of that run. If the run
  disagrees at any cell, that is a **finding**: halt, report the diff, and do not write either
  number. (PRD §7 flags 2025 as a fragile preliminary endpoint; a moved cell is exactly the signal
  `/verify-figures` exists to catch, and adjudicating it is not this task's job.)

- **Design Pattern**: **none — simple case.** Variance analysis per Rule 8 found nothing varying to
  encapsulate: this is a fixed correction to four static prose sites plus one script. There is no
  axis of change here, and the project's live axis (the set of series rendered) is untouched.

- **Intellectual Control**:

  - *Why the correction is not confined to the one line quoted in the goal.* A mitigation that
    survives in three other places has not been corrected; it has been relocated. The
    `nyc-collision-reporting-drift.md` line 257 instance is the most dangerous of the four because
    it sits in a two-column comparison table whose whole purpose is to tell a reader which defect
    they are looking at and what to do about it — read in isolation it presents the fallback as the
    settled answer, with none of the surrounding hedging the research doc's table row has.
  - *Why the skill is edited even though its trap 1 is already correct.* Trap 1 says "never coerce
    to zero." It does not say "never substitute the subgroup sum," and those are different errors:
    the subgroup sum is not a zero, it is a plausible non-zero number that is quietly wrong in a
    direction that flatters the data. Under the context-diet rule an agent cites the FR and does
    not load the research docs, but it is *required* to load `mvcc-data` before any query, chart,
    or figure-asserting test. Correcting only the docs would leave the one file on the re-invention
    path uncorrected. This edit passes the 7th-file test's limb (i): it is the only mechanism in
    the mandatory-load path.
  - *Why the script earns a durable file rather than the query text sufficing.* A pinned query
    reproduces the *inputs*; the finding is the *difference*. If only the query survives, the next
    session to ask "is this still true?" must run two aggregations and subtract them — and a model
    performing that subtraction to produce a number that then appears in a normative doc is the
    precise NFR-4 violation this project exists to criticize. "Compute deterministically, summarize
    generatively" names `verify-figures.py` as the pattern to copy; this is the same shape of
    problem and gets the same shape of answer. It is also the only way the gap stays measurable as
    it moves, and it has moved: it was zero for three years and then wasn't.
  - *Why the status change must not be overstated.* Three distinct claims are in play and the
    correction must keep them apart: the **symptom** (post-2026-05-05 dropout) was and remains
    *confirmed*; the **cause** was and remains *unconfirmed* — one Help Desk ticket, no official
    diagnosis; only the **proposed remedy** changes state, from untested-suggestion to *falsified*.
    Nothing in this task may upgrade or downgrade the first two. The research doc's existing
    "Unconfirmed" root-cause label at line 156 is correct and stays exactly as it is.
  - *Why the residual-category pattern is recorded but not adopted.* Crashmapper's "Other/Unknown"
    fourth category is the constructive half and belongs on the record. It is **not** implemented
    here, and the ADR must state why: we currently render no casualty-by-role breakdown at all, so
    there is no total for a residual to reconcile against — the pattern has no site to apply to.
    More importantly it must **not** be conflated with our property-damage-only tier. The PDO tier
    is `raw − casualty-filtered`, a residual over *collision records*; crashmapper's is
    `persons_injured − sum(role-assigned persons)`, a residual over *people within a record*. They
    rhyme structurally and are different quantities over different denominators. Adopting the
    pattern for FR-2 or any future breakdown requires its own `[SPEC]`, named as such in the ADR.
  - *Why this will not break at scale.* The output is four short prose edits, one ~80-line stdlib
    script, and one ADR. Nothing is imported by anything; nothing runs in CI; nothing ships to a
    client. The only durable coupling created is the ADR's inbound links, which
    `check-citations.sh` verifies mechanically.

- **Constraints**:

  1. **FR-11 is not amended, and neither is any other requirement.** `docs/project-mvcc-data.md`
     is **not in this task's file list** and must not be opened for editing. Its FR-11 (line 207)
     and risk register (line 262) were both checked and already specify fail-loud with no fallback.
     If the executing agent believes the PRD needs a change, **halt and request a revised `[SPEC]`**.
  2. **No file under `src/` is touched.** `src/lib/deaths.ts` was verified correct: `RawRowSchema`
     requires `deaths: z.string().regex(/^\d+$/)`, `parseRow` returns an error (never a 0) on any
     missing/null/empty value, and `SELECT_CLAUSE` selects only `number_of_persons_killed` — the
     subgroup fields are never fetched, making the fallback unreachable rather than merely unused.
     Do not "improve," comment, or defensively harden it.
  3. **Query contracts are frozen (Rule 4).** The query in this SPEC is for the standalone
     verification script only. It does **not** become a Route Handler, is not wired into the app,
     and `DEATHS_SOQL` does not change.
  4. **Chain of custody on every figure** — see the Query section. Transcribe from script stdout;
     halt on disagreement.
  5. **Task 2 isolation.** Touch none of: `package.json`, `package-lock.json`,
     `src/components/DeathsChart.tsx`, `src/components/DeathsChart.module.css`, `src/app/page.tsx`,
     `src/app/page.test.tsx`, `src/components/DeathsChart.test.tsx`, `vitest.setup.ts`, `SPEC.md`.
     `SPEC.md` is occupied by Task 2 and is the main session's to manage, not this task's.
  6. **No new dependency**, pip or npm. Stdlib only. This is not a Rule 9 halt — it is a design
     requirement, since `verify-figures.py` already proves stdlib suffices for this exact job.
  7. **Do not repair pre-existing broken cross-links** surfaced by `check-citations.sh` at Step 0
     (Output/Step 0 above). Scope creep into the fellowship-inherited link paths would blow the
     budget on an unrelated problem.
  8. **The two `stop-quality-gate.sh` defects carried in the ledger are not owed here** — this task
     does not touch that file.
  9. **Headings must not change** in either research doc. Other files link to these documents and
     `check-citations.sh` verifies anchors; renaming a heading would break inbound anchors for no
     gain. Edit cell contents and body prose only.

- **The four correction sites** (content pinned; the two table cells verbatim):

  1. **`docs/nyc-collision-analytics-deep-research.md` line 156** — the Aggregate Nullification
     row's **Mitigation** cell. Root-cause cell (`**Unconfirmed** — …`) stays untouched. New cell:

     > **Fail loud — never a synthetic total.** Raise the error state when the primary field is
     > absent. The subgroup sum is **not** a valid substitute: it undercounts by a margin that is
     > 0 for 2018–2020 then opens from 2021 (see [ADR 0002](adr/0002-no-synthetic-subtotal-fallback.md))

  2. **`docs/nyc-collision-analytics-deep-research.md` lines 168–171** — the **Data engineers**
     strategic-recommendation bullet. Strike the "computes synthetic fallback totals" clause and
     replace with schema validation that *fails loud* on an absent primary aggregate, with a
     one-clause note that the obvious fallback was tried in production by another team and failed.
     The spatial pre-filtering clause in the same bullet is unaffected — leave it.

  3. **`docs/nyc-collision-reporting-drift.md` line 257** — the comparison table's **Fix** row,
     right-hand cell only. The left cell (`Casualty filter (validated above)`) is untouched.
     Verbatim replacement:

     > Fail loud on the absent aggregate (FR-11). **Not** a synthetic subgroup-sum total — that
     > remedy is falsified; see [ADR 0002](adr/0002-no-synthetic-subtotal-fallback.md)

  4. **`docs/nyc-collision-analytics-deep-research.md` lines 40–48** — the trust note's item 4.
     A **narrow** addition only: the symptom stays confirmed, the cause stays unconfirmed, and one
     new sentence records that the report's *proposed remedy* has since been independently
     falsified, pointing at ADR 0002. Do not re-litigate the root cause and do not soften the
     existing "unconfirmed speculation dressed up as a citation" language — it is still accurate.

- **The skill edit** (`.claude/skills/mvcc-data/SKILL.md`), deliberately minimal — two changes:

  - **Trap 1** gains one clause: the subgroup fields are **not** a substitute for an absent
    primary aggregate; the sums genuinely disagree from 2021 onward because NYPD records a
    casualty without always assigning that person a role; fail loud is the only behavior. One
    sentence plus a pointer to ADR 0002. **Do not paste the gap table into the skill** — it is
    loaded before every query, it is volatile, and a stale table there would be worse than a
    pointer to a dated one.
  - **Verified fields** gains the six subgroup fields for `h9gi-nx95`, flagged as *breakdown
    fields that do not reconcile to the totals* so their addition cannot be read as an
    endorsement of summing them.

- **ADR 0002 — required content** (structure mirrors ADR 0001):

  - *Context*: the falsified mitigation and where it was recorded; the prior art
    (GreenInfo-Network/nyc-crash-mapper, crashmapper.org, React/Redux/Leaflet over CARTO, same
    `h9gi-nx95`, ~1M rows, maintained through Oct 2025; issue **#111** "Investigate sum
    discrepancies 2021-2024", opened on a user-reported mismatch against NYC Open Data); the root
    cause in their words — NYPD records a casualty on the crash record without always assigning
    that person a role, so the subgroup sum is **"casualties we could classify," not
    "casualties"**; their four-part fix (authoritative field for grand totals; an "Other/Unknown"
    category showing `total − sum(categories)`; 968 repairable records backfilled; About copy
    explaining that some injuries have no role ascribed); and our own measurement over 2018–2025.
  - *Decision*: fail loud, per FR-11. The subgroup sum is never a fallback, a default, a
    placeholder, or a cross-check that overrides the primary field.
  - *Consequences* — must include all four:
    (a) **Why the shape of the gap matters more than its size**: exactly 0 for 2018–2020, opening
        in 2021 and persisting. A fatality series built on the subgroup sum would slope down more
        steeply than the real one, with the extra steepness manufactured entirely by a change in
        classification practice — the same failure mode as the 2020 reporting break, one field
        down, and the precise thing this product exists to expose. This is the payload; a future
        session must be able to reach it without re-deriving it.
    (b) The remedy is **falsified**, while the dropout's cause remains **unconfirmed** — the two
        must not be conflated.
    (c) The residual-as-category pattern is recorded as the constructive half, with the explicit
        warning from § Intellectual Control that it is a different residual from our PDO tier and
        needs its own `[SPEC]` before it is applied anywhere.
    (d) Re-verification is `.claude/scripts/subtotal-gap.py`, dated, not a re-derivation.
  - Also record that the same 2026-08-05 live run **re-confirmed all 8 pinned deaths figures in
    PRD Appendix A with zero drift** — a dated corroboration worth keeping next to the finding.

- **Edge Cases**:

  1. **A gap cell disagrees with the expected table** → halt and report; write nothing. Do not
     adjudicate, do not update the pinned table, do not average.
  2. **`SOCRATA_APP_TOKEN` is unset** → the script runs anonymously with a stderr `note:`, exactly
     as `verify-figures.py` does. Absence degrades throughput, never correctness. Not a failure.
  3. **A queried key is absent from the response** → the script exits non-zero and names the field.
     It must never print a gap computed from a missing operand.
  4. **`check-citations.sh` reports a link failure after the edit** → compare against the Step 0
     baseline. Newly broken (e.g. a mistyped ADR path or a wrong relative depth from
     `docs/` to `docs/adr/`) is this task's to fix. Already broken at baseline is not.
  5. **The scratchpad script is gone** (session-scoped storage) → rebuild it from the pinned query
     above; the query, not the file, is the contract. Do not reconstruct expected values from
     memory.
  6. **The pinned deaths figures reappear as literals** — the script legitimately prints figures.
     `guard-data-integrity.sh` exits 0 on any non-JS/TS extension (lines 29–32), so neither the
     `.py` nor the `.md` files can be blocked by it. That means **the hook is not a net here**;
     the constraint is honored by the chain-of-custody rule, not by tooling.
  7. **`post-edit-lint.sh` runs `ruff` on the new Python file** → expected. Fix what it flags;
     do not disable it.

- **Files** (max 5 — five used):

  1. **`docs/nyc-collision-analytics-deep-research.md`** — correction sites 1, 2, and 4.
  2. **`docs/nyc-collision-reporting-drift.md`** — correction site 3 (line 257 cell only).
  3. **`.claude/skills/mvcc-data/SKILL.md`** — trap 1 clause + six subgroup fields.
  4. **`docs/adr/0002-no-synthetic-subtotal-fallback.md`** — *new.*
  5. **`.claude/scripts/subtotal-gap.py`** — *new.*

  **Verified correct and deliberately excluded**: `docs/project-mvcc-data.md` (FR-11 line 207 and
  the risk register line 262 both already specify fail-loud), `src/lib/deaths.ts`,
  `src/app/api/deaths/route.ts`.

  **Not counted against this budget, by standing project convention**: `SESSION_STATE.md` (the
  main session writes the ledger; `stop-session-state.sh` enforces it) and `SPEC.md` (main session
  persists it, and it is occupied by Task 2 until that task closes).

  **If a sixth file seems required**, halt and request a revision naming (i) the specific failure
  it is the only thing that catches and (ii) which of the five cannot carry it.

- **Tipping Point**: revisit when **any one** trips —
  - **A third normative document acquires a "what to do about Aggregate Nullification" statement.**
    Four sites are already one too many for prose to stay consistent; at five, the guidance moves
    into the skill as the single source and the docs cite it rather than restating it.
  - **The gap closes, or extends backward before 2021.** Either would mean NYPD changed
    classification practice again, which is a new finding and needs a re-run plus an ADR
    supersession — not an edit to 0002.
  - **We render any casualty-by-role breakdown** (a future FR-2 elaboration). That is the moment
    the "Other/Unknown" residual category stops being a recorded pattern and needs its own `[SPEC]`.
  - **`.claude/scripts/` reaches a third script** — at three, the shared Socrata fetch/token/cast
    logic is duplicated twice and should be extracted into a small local module. At two, extracting
    it is the unearned abstraction Rule 8 rejects.

- **Ordering — deliberate deviation from the standard `[SPEC]` sequence, stated so it is a decision
  and not drift.** The default is Cypress-first, red tests before implementation. **Redwood
  executes first here, and Cypress audits after.** Writing failing tests for prose corrections
  would be ceremony — there is no behavior to specify, and the only genuinely mechanical assertions
  (greps and a script re-run) are verification, not specification, so they are worth more pointed
  at the finished artifact than written against nothing. Redwood rather than Magnolia because the
  deliverable that carries real risk is a deterministic Socrata script in `.claude/scripts/`, which
  is Redwood's domain; nothing here is chart, layout, or styling work. Rule 2's "match ceremony to
  the task" governs. Redwood emits a `[COMPLETION-REPORT]`; Cypress then emits a
  `[COMPLIANCE-REPORT]` against the acceptance clauses below.

- **Acceptance, by command** (Redwood runs each and records output; Cypress re-runs 2, 4, and 5):

  1. `./.claude/hooks/check-citations.sh` **before** any edit — baseline recorded (Step 0).
  2. `python3 .claude/scripts/subtotal-gap.py` — full stdout recorded; every cell matches the
     expected table above, or the run is a halt-and-report.
  3. `ruff check .claude/scripts/subtotal-gap.py` exits 0 (or the `post-edit-lint.sh` equivalent
     already applied cleanly).
  4. `./.claude/hooks/check-citations.sh` **after** — no failure that is not in the Step 0
     baseline. Confirms both new ADR links resolve.
  5. **The residual-mention grep**, expected to return only intentional, corrected text:
     `git grep -nEi 'synthetic (fallback|total)' -- docs .claude` → every remaining hit is either
     inside ADR 0002 or is a correction explicitly naming the remedy as falsified. **Zero hits that
     still recommend it.**
  6. `git grep -n 'number_of_pedestrians_killed' -- src` → **zero hits** (proves the correction did
     not leak the subgroup fields into product code).
  7. Confirm `git status` shows exactly the five files, and that none of Constraint 5's Task 2
     paths appear.

- **Background/reference resources (Constraint of Three)**:
  1. `docs/adr/0001-preserve-reasoning-when-condensing.md` — the structural template for 0002, and
     the standing argument for why the *why* is the payload.
  2. `.claude/scripts/verify-figures.py` — the house style the new script copies: stdlib-only
     imports, token-optional fetch, `main() -> int`.
  3. `src/lib/deaths.ts` — **read-only**, to confirm rather than assume that fail-loud is already
     implemented correctly (`parseRow`, `RawRowSchema`, and a `SELECT_CLAUSE` that never fetches
     the subgroup fields). Cited so the "no source change owed" claim is verifiable, not asserted.

  The **`mvcc-data` skill load is mandatory and is not a reference item** — this task edits it, and
  traps 1 and 5 both bear directly on the pinned query.

[FORCES]

1. **Correcting every instance > correcting the one that was reported** — a falsified mitigation
   surviving in three other files has been relocated, not corrected.
2. **Inoculating the file that gets read > inoculating the file that is right** — the skill is the
   mandatory pre-query load; the research docs are deliberately not routinely read.
3. **A re-runnable script > a re-derivable number** — the finding is a difference, and a model
   performing that subtraction to refresh a normative doc is the NFR-4 failure itself.
4. **Preserving why the remedy is wrong > recording that it is wrong** — "rejected" without its
   reasoning is the exact archive failure ADR 0001 was written about.
5. **Three claims kept distinct > one tidy status line** — symptom confirmed, cause unconfirmed,
   remedy falsified; collapsing them would trade one error for another.
6. **Simplicity > Pattern purity.**
```
