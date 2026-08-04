# Active SPEC

**Status:** approved by the human → dispatched to Redwood
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-04
**Executing agent:** Redwood · **Audit:** Cypress (after — same ordering override as the scaffold)

The kickoff scaffold SPEC is **closed** and archived in `ARCHIVED_SPECS.md`. Its Amendments 1 and 2
stand; Amendment 3 below amends the closed SPEC's standing clauses and is recorded here because it
binds this task and every subsequent one.

---

## Human decision recorded before dispatch

**The Stop gate BLOCKS on a platform mismatch** (exit 2), rather than warning. Chosen 2026-08-04.
Cedar's grounds, accepted: it is the same fail-loud logic as FR-11, the once-per-turn
`stop_hook_active` cap bounds the friction, and the remediation command prints in the failure
message. The counter-cost is real and accepted — an agent shell that inherited Node 20 cannot end
*any* turn in this repo, including documentation-only ones, until it re-enters through a fresh
shell. A warning is what let the Node 20 green through in the first place.

---

## Amendment 3 (2026-08-04, post-scaffold)

**3(a) — `engine-strict` DECLINED again, on efficacy grounds rather than budget.** The revisit
trigger in the closed SPEC's Constraint 9 did **not** fire. Three grounds, descending in strength:

1. **Structural, verified by reading the file.** `stop-quality-gate.sh` invokes
   `./node_modules/.bin/tsc` and `./node_modules/.bin/eslint` **directly** (lines 54, 63). npm
   config is not in that call path, so no `.npmrc` setting can reach the process that emits the
   word "clean."
2. **`engine-strict` is install-scoped.** It refuses to *install* an incompatible package; it does
   not gate `npm run test` against an already-installed tree. The demonstrated fake-green survives
   it untouched.
3. **On Vercel it is a genuine footgun.** Vercel installs devDependencies during build. On a Node 20
   image, `engine-strict=true` converts a green production deploy into a hard install failure over
   `jsdom` — a test-only package `next build` never loads. Failing production over a test
   dependency's engine range is the guard that gets commented out under deadline pressure.

**No `.npmrc` exists**; the Cypress audit item forbidding one still binds. *Revised trigger, stated
falsifiably:* adopt only if a CI runner or deploy image performs `npm install` on a Node version it
**cannot** pin from `.nvmrc`. This may never fire — `actions/setup-node` with
`node-version-file: .nvmrc`, and Vercel reading `engines.node`, both *fix* the platform, which
strictly dominates failing on it. If CI lands and can pin, the trigger is **retired**, not deferred.

**The file bound held, and here is the test that keeps it from being "whatever Cedar feels."** A 7th
file is granted only when both hold: (i) the mechanism is the *only* thing that catches the named
failure, and (ii) no existing enumerated file, hook, CI config, or SPEC acceptance clause can carry
it. `engine-strict` fails (i) outright and fails (ii) twice. The slot was not spent because the
request did not clear the test — not because the number was 6.

**3(b) — Standing acceptance clause, binding on this and every subsequent SPEC.** Any SPEC whose
acceptance is by command must record `node -v` alongside the command results, and the recorded
version must satisfy `engines.node`. *A gate that ran on an unverified platform produced an
unverified result; unverified is not PASS.* This is NFR-4 pointed at the toolchain — the same
sentence as "no figure comes from a language model." Costs no file budget in any SPEC; not optional
in any.

**3(c) — `@types/node` moves `^20` → `^22`.** Standing rule so it never needs re-deciding:
`@types/node`'s major **tracks** `engines.node`'s major. It is derived, not chosen; when the
platform floor moves, this moves in the same edit, with no Rule 9 halt required.

**3(d) — `eslint@^9` is REQUIRED, not merely unjustified-to-bump.** The closed SPEC's stated
discriminator was wrong. `eslint-config-next@16`'s peer range is permissive (`eslint: >=9.0.0`) and
decides nothing. The binding constraint is **`eslint-plugin-jsx-a11y@6.10.2`, whose peer range
(`^3 || … || ^9`) excludes eslint 10** — the plugin NFR-3 depends on. Anyone evaluating eslint 10
must check `npm view eslint-plugin-jsx-a11y peerDependencies` first; eslint's own range and
`eslint-config-next`'s are both irrelevant. Do not rediscover this.

**3(e) — `vitest.config.ts` → `vitest.config.mts` AUTHORIZED, deferred to the walking-skeleton
SPEC.** The "ESM syntax in a file loaded as CommonJS" warning is non-blocking today and becomes an
error in a future Vite major. Resolution is the `.mts` rename, **not** `"type": "module"` — the
rename is surgical, whereas `"type": "module"` changes module resolution for every `.js` in the tree
to fix one file. It renames an already-enumerated item, so it costs no new slot, and Cypress must
edit that file anyway to add `setupFiles` with the first test. Batch it there: one edit, not two.
**Two checks required at rename time:** confirm the root file stays outside `tsconfig.include` (the
no-type-aware-linting constraint depends on it), and confirm `eslint.config.mjs`'s `files` patterns
match `.mts`, or the file silently stops being linted.

---

## [SPEC] — Platform-agreement verification

- **Objective**: Make the declared platform and the executing platform provably agree. (1) Move
  `@types/node` to `^22`. (2) Make `stop-quality-gate.sh` refuse to report "clean" when the Node
  running the gates disagrees with `.nvmrc`.
- **Requirement**: Infrastructure clause of NFR-4, applied to the toolchain — no acceptance result
  may be produced by an unverified process. Enabling for PRD §5.3 P0. Displays no figure.
- **Inputs/Outputs**:
  - *Input*: completed scaffold, clean tree, gates currently green.
  - *Step 0*: record `node -v`. If it is not `v22.23.2`, re-enter via `fish -i -c 'cd <root>; and …'`
    or `bash -ic` and re-verify. Do not proceed on Node 20 — every result recorded under it is
    invalid, in the silent direction.
  - *Output (1)*: `package.json` `"@types/node": "^22"`, lockfile updated via `npm install`.
  - *Output (2)*: `stop-quality-gate.sh` reads `.nvmrc` and compares its contents to the **major**
    of the `node` that will run the gates. Mismatch → exit 2 naming both versions, stating the gate
    result is UNVERIFIED rather than clean, and printing the fresh-shell remediation command.
    Match → existing behavior, with the Node version added to the all-clear line.
  - *Acceptance*: all four gates exit 0 **and `node -v` recorded as `v22.23.2`** (Amendment 3(b));
    `./.claude/hooks/stop-quality-gate.sh` standalone prints clean and names the version; the same
    script under a Node 20 shell exits 2; `git status --porcelain -- .gitignore README.md` empty;
    no `.npmrc` created.
- **Query**: none. No dataset ID, no SoQL clause, no fetch, no Appendix A figure.
- **Design Pattern**: none — simple case. One string comparison and one dependency range; there is
  no variation to encapsulate.
- **Intellectual Control**:
  - *Why the hook and not `.npmrc`*: the hook calls `./node_modules/.bin/tsc` and
    `./node_modules/.bin/eslint` directly (lines 54, 63). npm config is not in that call path. Fix
    the process that emits the verdict, not the adjacent boundary.
  - *Why compare `.nvmrc`'s major rather than parse `engines.node`*: division of labor. `.nvmrc` is
    the selector and catches the failure that actually occurred (20 vs 22) with a string compare and
    zero semver logic. The patch-level floor (22.13.0 vs 22.22.2) is already caught by npm's
    per-package `EBADENGINE` at install, which is where it belongs. Adding a semver range parser to
    a bash hook to duplicate a check npm already performs is the bloat Rule 5 exists to stop.
  - *Why fail rather than auto-correct via `fnm exec`*: fnm lives outside version control, so a
    recovery path depending on it fails on exactly the machines the guard is for — and a guard that
    silently repairs teaches no one that the shell was wrong.
  - *Why now for `@types/node`*: nothing imports Node typings yet, so the change cannot break
    anything today and only grows riskier. It stops being inert at the first Route Handler —
    `process.env.SOCRATA_APP_TOKEN` is `@types/node` — and deferring hands the walking-skeleton SPEC
    a platform chore on the very turn token-handling code is written. `package.json` is edited by
    this task regardless, so the file cost is zero.
- **Constraints**:
  1. Preserve both existing no-op paths: absent `package.json` and absent `node_modules` still exit
     0 quietly. The gate must stay inert during config/planning phases.
  2. Absent `.nvmrc` → skip the platform check, do not fail. Same no-op-until-applicable property.
  3. Honor `stop_hook_active` — the existing once-per-turn cap is untouched (Rule 4, cap every loop).
  4. Add **no** npm scripts. The scripts count stays 7 of 8.
  5. Do not create `.npmrc`. Do not touch `engines.node`, `.nvmrc`, `tsconfig.json`,
     `eslint.config.mjs`, or `vitest.config.ts`.
  6. If `@types/node@^22` breaks `tsc --noEmit`, halt and report — do not resolve by loosening
     `strict` or pinning TypeScript.
- **Edge Cases**:
  - `node -v` is not v22.23.2 at step 0 → halt before touching anything.
  - `.nvmrc` contains a full version rather than a major → compare majors only; do not demand exact.
  - Hook exit 2 fires on a doc-only turn → **correct behavior**, explicitly accepted by the human
    above. Do not soften it on your own authority.
- **Files** (max 3):
  1. `package.json`
  2. `package-lock.json`
  3. `.claude/hooks/stop-quality-gate.sh`

  This is a **new task with its own budget**. It is NOT a 7th scaffold file; the scaffold SPEC is
  closed. `.claude/**` was explicitly "not touched" by that SPEC, so this is a separate file list
  rather than a raid on a spent budget.
- **Tipping Point**: if the hook needs a second platform assertion, or real semver range parsing,
  extract to `.claude/scripts/check-platform.sh` and have the hook call it — the same split as
  `verify-figures.py` behind `/verify-figures`. One assertion inline is fine; two is a script.

## [FORCES]

1. **Verified result > green result** — an unverified platform yields an unverified verdict, and
   unverified must never render as PASS. NFR-4, pointed at the toolchain.
2. **Fix the verdict-producer > fix the adjacent boundary** — guard the process that says "clean,"
   not the one that says "installed."
3. **Fail loud > repair silently** — the guard's job is to teach that the shell was wrong.
4. **Simplicity > Pattern purity.**

---

## Carried forward — not part of this SPEC

- **Docs task (two items batched):** the stale PRD handoff at `docs/project-mvcc-data.md` ~280–289,
  and a README line naming the Node floor for the fresh-clone gap.
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result.
- **Walking-skeleton SPEC** inherits Amendment 3(b)'s `node -v` clause and 3(e)'s authorized `.mts`
  rename. It is where `recharts` and `zod` finally arrive, with the requirements that justify them.
