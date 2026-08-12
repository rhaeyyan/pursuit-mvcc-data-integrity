# Active SPEC

[SPEC]

- **Objective**: Build the deterministic *mechanism* for the PRD §7 risk mitigation — "commit a
  dated JSON snapshot of the eight-year aggregate as a documented fallback fixture" for when
  Socrata is rate-limited, slow, or down at demo time. This SPEC produces the fixture-generation
  script, one committed fixture (deaths — the walking-skeleton metric), and a pure, tested,
  metric-agnostic function that decides when to substitute it. **Wiring this into `page.tsx` with
  a visible "showing a cached snapshot" banner is a deliberate follow-up SPEC**, mirroring this
  project's own precedent of splitting a data/mechanism half from a UI/wiring half (FR-3, the
  NFR-1 borough-caching fix, the Staten Island pilot panel — all three did this before this one).
  **No new SoQL. No new dependency.**

- **Requirement**: PRD §7 risk register: "Socrata API is rate-limited, slow, or down at demo
  time | Med | High | Server-side caching (NFR-1) means the demo does not depend on a live call;
  commit a dated JSON snapshot... as a documented fallback fixture." Cuts across NFR-1
  (availability) and NFR-4 (every figure traceable to a deterministic source, never typed in).

- **Inputs/Outputs**:
  - New script `scripts/generate-fallback-fixture.ts`, run manually via
    `node --experimental-strip-types scripts/generate-fallback-fixture.ts` (Node 22.6+ built-in;
    zero new dependency — this is the same mechanism Redwood already used this session for the
    Staten Island pilot's live-verification check).
  - New committed artifact `src/lib/fixtures/deaths-fallback.json`, shape:
    ```json
    { "asOf": "2026-08-11T21:00:00.000Z", "soql": "<DEATHS_SOQL, verbatim>", "rows": [ {"year": 2018, "deaths": 231}, ... 8 rows ... ] }
    ```
  - New module `src/lib/fallback.ts`:
    ```ts
    export type YearlyMetricResultWithSource<K extends string> =
      | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[]; source: "live" }
      | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[]; source: "cache"; asOf: string }
      | { status: "empty"; soql: string }
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };

    export function withFallback<K extends string>(
      live: YearlyMetricResult<K>,
      fixture: { asOf: string; rows: YearlyMetricRow<K>[] } | undefined,
    ): YearlyMetricResultWithSource<K>;
    ```

- **Query**: **None new.** The generator imports and calls `fetchDeathsPerYear()` from
  `src/lib/deaths.ts` directly — it does not construct, duplicate, or re-derive `DEATHS_SOQL` in
  any form. This is stronger than mere reuse: the fixture's numbers are the serialized return
  value of a call to already-tested, already-shipped code, not a second implementation that could
  silently drift from the first. Rule 4 applies with zero exposure here — there is no clause in
  this SPEC's scope for Rule 4 to protect, because none is introduced.

- **Design Pattern**: none — simple case. `withFallback` is a single pure function with one
  substitution rule (upstream failure + fixture present → substitute; everything else →
  passthrough). Genericizing it over `YearlyMetricResult<K>` is not premature — that generic
  already exists one layer down in `socrata.ts` with four real, current callers (`deaths.ts`,
  `injuries.ts`, `collisions.ts`, `repairedCollisions.ts` all export `YearlyMetricResult<K>`
  aliases; `arrests.ts` does too, confirmed by reading its source) — reusing an existing, proven
  shared type is matching structure, not inventing flexibility on spec.

- **UI Scope**: N/A. No component, no page, no banner in this task — see Objective.

- **Intellectual Control**:
  1. **Why this design cannot become a Rule-1/NFR-4 violation, verified against the actual
     mechanical guard, not assumed.** `guard-data-integrity.sh` (read directly before writing this
     SPEC) only scans `*.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs`, and separately exempts any path
     containing `fixture` even within those extensions. `src/lib/fixtures/deaths-fallback.json` is
     doubly exempt — wrong extension *and* an explicitly named exception — matching the hook's own
     stated intent ("skips test/fixture/doc files where a literal expected value is the whole
     point"). More importantly: the JSON's numbers are never typed by anyone into any Edit/Write
     tool call. They are the stdout of running a script that calls existing, tested code — "compute
     deterministically, summarize generatively," the project's own Bounded-AI pattern, applied to
     an artifact instead of a chat response.
  2. **Why the substitution logic lives in a new, separate `fallback.ts` rather than inside
     `socrata.ts` or `deaths.ts`.** Those files' whole job is query transport — CLAUDE.md's Rule 4
     protects them as a frozen contract specifically so a performance/availability concern never
     has a reason to touch a data-integrity-critical file. Fallback substitution is an orthogonal
     concern (what to render when transport fails) and stays in its own file for exactly the same
     reason the NFR-1 borough-caching fix kept `boroughs.ts` out of its file list.
  3. **Why only `kind: "upstream"` triggers substitution, never `kind: "contract"`.** An upstream
     failure means "Socrata was unreachable" — the fixture safely stands in. A contract violation
     means the query itself returned something wrong or absent (this is exactly trap 1's
     absent-key-as-zero territory) — papering over that with a stale cache would hide the specific
     failure mode this entire product exists to surface. `withFallback` passes contract errors
     through untouched, on purpose.
  4. **Why the fixture is citywide-only, and why that's named as a limitation rather than solved
     here.** Falling back to a citywide snapshot while a borough filter is active would silently
     show all-NYC deaths under what looks like a Brooklyn-filtered page — a real honesty violation,
     not a hypothetical one. Scoping this SPEC to the citywide case only (which is also almost
     certainly what any actual demo uses) avoids that failure mode entirely rather than half-solving
     it; a borough-aware fixture set is deferred to the wiring follow-up, if ever needed.
  5. **Why deaths, not all five metrics, and why that's not scope-cutting for its own sake.**
     Rule 6: "the first task must be the walking skeleton." Proving the mechanism on one metric
     with a shared, generic `withFallback` costs one JSON file; extending to injuries/collisions/
     repaired-collisions/arrests once wiring exists is four near-identical repetitions of a proven
     pattern, not four new designs.

- **Constraints**:
  - No new dependencies (Rule 9). `node --experimental-strip-types` is a Node 22.6+ built-in.
  - The generator must assert `fetchDeathsPerYear()` returned `status: "ok"` before writing
    anything — never commit a fixture built from an error/empty result. Exit non-zero and write
    nothing on any other status.
  - `withFallback` must not mutate its inputs and must not perform I/O — pure function, matching
    `percentChange.ts`'s existing precedent for this codebase's derived/pure modules.
  - Do not touch `socrata.ts`, `deaths.ts`, `boroughs.ts`, or any Route Handler.
  - Confirm empirically (do not assume) that `node --experimental-strip-types` resolves
    `scripts/generate-fallback-fixture.ts`'s relative import of `../src/lib/deaths` correctly, and
    that `tsconfig.json`'s `resolveJsonModule` (if the fixture is ever statically imported by a
    future SPEC) is already enabled — Next.js's generated config typically has it on by default,
    but this project verifies rather than assumes such things.

- **Edge Cases**:
  1. Live fetch succeeds (`status: "ok"`) → `withFallback` returns it verbatim, tagged
     `source: "live"`. No fixture read.
  2. Live fetch fails upstream (`status: "error"`, `kind: "upstream"`) and a fixture is provided →
     return a synthesized `"ok"` result from the fixture's rows, tagged `source: "cache"` and the
     fixture's own `asOf`.
  3. Live fetch fails upstream and no fixture is provided (`undefined`) → pass the original error
     through unchanged. Never fabricate a fixture that doesn't exist.
  4. Live fetch fails with `kind: "contract"` → pass through unchanged regardless of whether a
     fixture is provided (Intellectual Control point 3 — never mask a contract violation).
  5. Live fetch returns `status: "empty"` → pass through unchanged (an empty result is not an
     upstream failure; substituting a non-empty fixture for a genuinely empty live result would
     misrepresent what Socrata actually returned).
  6. The generator script itself hits an upstream/contract/empty result → exit non-zero, print the
     reason, write no file. A broken fixture is worse than a missing one.

- **Files** (4 — one slot of headroom against the cap of 5):
  1. `scripts/generate-fallback-fixture.ts` — imports `fetchDeathsPerYear`, runs it once, asserts
     `status: "ok"`, writes `src/lib/fixtures/deaths-fallback.json`.
  2. `src/lib/fixtures/deaths-fallback.json` — generated output of #1, committed. Not
     hand-authored; rides with #1's implementation, not separately reviewed as logic.
  3. `src/lib/fallback.ts` — `withFallback()` + `YearlyMetricResultWithSource<K>`.
  4. `src/lib/fallback.test.ts` — Cypress's tests: the six Edge Cases above as pure unit tests, plus
     one sanity test reading the actual committed fixture and asserting its *shape* (exactly 8 rows,
     years 2018–2025 present, `deaths` values positive integers) — not asserting the pinned figures
     as literals inside the test, consistent with this project's own NFR-4 discipline even where
     the hook wouldn't technically block it.

- **Tipping Point**: the moment a second metric's fallback is wired in, or `page.tsx` starts
  consuming `withFallback` for any metric, is the trigger for the named follow-up SPEC (wiring +
  banner UI). If a borough-aware fixture set is ever requested, that is a second, larger follow-up
  — do not fold it into the first without a fresh SPEC, since it reopens Intellectual Control
  point 4's citywide-only decision.

## Acceptance criteria

Tests first (Cypress), then implementation (Redwood). Per Amendment 3(b), **record `node -v`
beside every result; it must read v22.x.** Prefix every command:
```
export NVM_DIR="$HOME/.nvm"; . /usr/local/opt/nvm/nvm.sh; nvm use >/dev/null
```
Baseline verified 2026-08-11 immediately before this SPEC: **613/613 in 24 files, `tsc --noEmit`
clean, `eslint .` 0 errors / 2 known pre-existing warnings.** `/verify-figures` also re-run
2026-08-11: all 32 pinned figures matched live Socrata exactly, zero drift.

1. Full suite green — 613 plus whatever Cypress's new tests add; state the new total.
2. `tsc --noEmit` clean; `eslint .` 0 errors, allowing only the 2 known pre-existing warnings.
3. The generator, run live and unstubbed, produces `src/lib/fixtures/deaths-fallback.json` with
   exactly 8 rows whose values match the current live-verified deaths figures (231, 244, 269, 297,
   290, 280, 268, 229 for 2018–2025) — this is the non-closable check, matching this project's own
   FR-6-Phase-1 and Staten-Island-panel precedent of never trusting a query mechanism from
   recollection.
4. `git status` confirms the committed fixture's `asOf` timestamp is from this SPEC's own
   implementation run, not stale or hand-edited.
5. No existing file outside this SPEC's list was modified.

[FORCES]

1. **Prove the mechanism on one metric > wire all five now.** Rule 6's walking-skeleton discipline
   applies to a cross-cutting reliability concern exactly as it did to the original chart.
2. **A generated artifact > a typed one.** The fixture's trustworthiness rests entirely on being
   the literal output of running tested code, not on anyone (human or model) believing the numbers
   are right.
3. Simplicity > Pattern purity.
