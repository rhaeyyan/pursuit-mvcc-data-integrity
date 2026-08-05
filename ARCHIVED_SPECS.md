# Archived SPECs — MVCC Data

Completed `SPEC.md` contents, appended on completion so `SPEC.md` only ever holds active
work (CLAUDE.md § Session Continuity).

---

## Archived 2026-08-04 — Kickoff scaffold (COMPLETE)

**Outcome:** delivered 6 of 6 budgeted files; all four gates green on Node 22.23.2;
`stop-quality-gate.sh` live. Halted once at step 0 on a real Node-20 incompatibility, which
produced the platform move to Node 22 recorded in Amendment 2.

# Active SPEC

**Status:** awaiting HITL approval → dispatch to Redwood
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-04
**Executing agent:** Redwood · **Audit:** Cypress (after, not before — see Ordering override)

---

## Amendments resolved before dispatch

These three were open when Cedar emitted the SPEC below. They are settled; the SPEC text is
otherwise verbatim.

1. **Step 0's `engines` check was run early, by the main session** (Cedar has no shell). Results,
   `npm view` on 2026-08-04:

   | Package | Latest | `engines.node` | Node 20.19.6 |
   |---|---|---|---|
   | `next` | 16.3.0 | `>=20.9.0` | pass |
   | `vitest` | 4.1.10 | `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | pass |
   | `@testing-library/react` | 16.3.2 | `>=18` | pass |
   | `recharts` | 3.10.1 | `>=18` | pass |
   | `react` / `react-dom` | 19.2.8 | — | pass |

   No candidate is rejected; no Node upgrade is forced. **Redwood must still run step 0 for the
   remaining packages** (types, lint, the rest of the test set) and record the output — this
   table covers only the version-sensitive ones.

2. **`vitest@^4`, not `^3`.** Cedar's `^3` was a guess made without network access. 4.1.10 is
   current and clears the Node ceiling. Corrected pin: `vitest@^4`.

3. **Styling: CSS Modules** (`--no-tailwind`), per the human's decision on 2026-08-04, on Cedar's
   reversibility grounds — Tailwind can be added later with two dev dependencies and a PostCSS
   config, whereas removing it later means unwinding class attributes across every component
   Magnolia has written by then.

---

## Amendment 2 — Node 22 platform move (2026-08-04, post-halt)

**Redwood halted at step 0 exactly as Constraint 1 / Edge Case 1 prescribed.** Two packages exclude
Node 20.19.6: `jsdom@30.0.1` (`^22.22.2 || ^24.15.0 || >=26.0.0`) and
`@testing-library/jest-dom@7.0.0` (`>=22` — and `6.10.0` also declares `>=22`, so even `^6`
resolves incompatible). Verified independently by the main session, not taken on trust.

**Why the halt mattered more than the version numbers.** npm does not enforce `engines` without
`engine-strict`, so both would have installed on an `EBADENGINE` warning. Vitest instantiates the
jsdom environment per test file and this SPEC writes none, so all four acceptance commands would
have exited 0 over a test toolchain that breaks the moment Cypress writes the first component test.
A passing command that proves nothing is the failure class this product exists to expose.

**Correction, not carried forward:** Redwood also claimed `eslint@10` dropped Node 20. It did not —
`eslint@10.8.0` declares `^20.19.0 || ^22.13.0 || >=24`. Two packages forced this move, not three.
This removes the only platform-based argument for holding `eslint@^9`; see Constraint 2.

**Human decision — raise the platform, per-project.** Executed and verified before this amendment:
`fnm` 1.39.0 at `~/.local/bin/fnm` (release binary, not a piped install script); **Node v22.23.2 /
npm 10.9.8**; `~/.config/fish/conf.d/fnm.fish` created as a new file wiring `fnm env --use-on-cd`;
fnm's `default` alias set to `system` so **only `.nvmrc` directories get Node 22** — a shell started
in `/tmp` or `$HOME` still yields v20.19.6 from `/usr/local/bin/node`, verified. Other projects on
this machine are unaffected.

**Amendment 1's version table is superseded.** It recorded Node 20.19.6 as compatible; step 0
disproved that for the test toolchain. Amendment 1's `vitest@^4` correction and the CSS Modules
decision both still stand.

**Open Question 3 is now forced and resolves yes** — see the new Constraint 9. Its original grounds
for declining assumed the Node version was incidental; step 0 proved it load-bearing.

**Deferred by decision:** a README line naming the Node floor, for the fresh-clone gap (`.nvmrc`
ships, the fnm wiring that reads it does not). Batched into the tracked PRD-amendment docs task
rather than spending a file slot here. Structurally the same gap already recorded for
`.git/hooks/commit-msg`, but it fails *quietly*: a clone on Node 20 installs with warnings, passes
all four acceptance commands, and breaks at the first component test.

---

## [SPEC]

- **Objective**: Initialize the Next.js App Router + TypeScript project at the repo root
  — dependency tree, config, and scripts only — such that `tsc --noEmit`, `eslint .`,
  `vitest`, and `next build` all pass on their first run, and the two hand-authored
  files `.gitignore` and `README.md` survive byte-identical. No application code,
  Route Handler, SoQL query, component, or chart is in scope.
- **Requirement**: Enabling task for PRD §5.3 P0 (FR-1–4, 8–12). Directly satisfies the
  infrastructure clause of **NFR-2** (`.env*` gitignored, token name documented without a
  value) and provisions the toolchain **NFR-3** (`axe-core`, `eslint-plugin-jsx-a11y`) and
  **NFR-4** (Vitest, for pure-function figure tests) are verified with. Satisfies no
  user-facing FR by itself and displays no figure.
- **Inputs/Outputs**:
  - *Input*: **Node v22.23.2 / npm 10.9.8**, provisioned per-project by `fnm` via `.nvmrc` and
    `fnm env --use-on-cd` in `~/.config/fish/conf.d/fnm.fish`. Repo root at the project directory,
    clean tree on `main`.
  - *Step 0a, before anything else*: run `node -v` and `npm -v` and record them. `node -v` **must**
    print `v22.23.2`. fnm's `default` alias is `system`, so a shell started outside this directory
    inherits Node 20.19.6 from `/usr/local/bin/node` and every subsequent `engines` check would be
    evaluated against the wrong platform — silently, and in the direction that reproduces the exact
    failure this amendment exists to fix. If it prints anything else, `cd` into the project root in
    a fresh shell and re-verify. Do not `fnm use` manually to route around it; that masks a broken
    shell integration.
  - *Output*: a runnable toolchain at the repo root. `package.json` with the scripts block
    below; `src/app/` App Router tree from the generator; four hand-authored/hand-modified
    configs. No `.env`, no token value, no fixture, no application logic.
  - *Acceptance is by command, not by file inspection*: `npm run typecheck`, `npm run lint`,
    `npm run test`, `npm run build` each exit 0, and `git status --porcelain -- .gitignore README.md`
    is empty.
- **Query**: none — this task performs no data access. It must not contain a dataset ID,
  a SoQL clause, a fetch, or any numeric figure from Appendix A.
- **Design Pattern**: none — simple case. Variance analysis finds nothing to encapsulate:
  the task authors zero React components and zero runtime behavior. `composition-patterns`
  was consulted and every one of its rule categories (component architecture, state
  management, implementation patterns, React 19 APIs) presupposes a component that this
  task does not create. Per Rule 8 a pattern here would be unearned.
- **Intellectual Control**:
  - *Why generate rather than hand-author*: the App Router boilerplate (`next-env.d.ts`
    handling, `tsconfig` module resolution, the flat-config bridge in `eslint.config.mjs`)
    tracks the Next.js release. Hand-authoring it means a model reproducing a generator's
    output from memory — the same failure class NFR-4 forbids for figures. Use the
    deterministic generator; hand-author only the files that encode *our* decisions.
  - *Why the repo root and not a subdirectory*: `stop-quality-gate.sh` locates the app by
    probing `.`, `app`, `web`, `frontend` in that order. A scaffold anywhere else makes the
    gate silently no-op — it exits 0 with "No package.json yet" and the project ships with
    its quality gate inert. Root placement keeps the gate live by construction.
  - *Why `--src-dir`*: it lets `tsconfig.include` be an **allowlist** (`src/**`) instead of a
    denylist. A denylist (`exclude: [".claude", ".gemini", "skills"]`) silently re-breaks the
    moment a fourth skill tree or any other top-level `.ts` appears; an allowlist cannot.
  - *Why this will not break at scale*: the config surface is four files with no
    cross-references between them. The only coupling is `package.json`'s `lint` script
    mirroring the Stop gate's `eslint .` verbatim — deliberate, so the gate and the script
    can never diverge into "passes locally, blocks the turn."
- **Constraints**:
  1. **Node 22.23.2 is the platform floor.** Step 0 is a deterministic check, executed and its
     output recorded before any install: `npm view <pkg> engines` and `npm view <pkg> peerDependencies`
     for every package below, plus `recharts` and `zod`. Any candidate whose `engines.node`
     excludes 22.23.2 → **halt and request a revised SPEC from Cedar** (Rule 9). Do not downgrade,
     substitute, or `--force` a package on your own authority.

     *Two things changed about what a halt now means.* The old constraint called 20.19.6 a
     **ceiling** — a system-wide binary Cedar could not move. 22.23.2 is a **floor** under a
     per-project version manager, so the resolution space for a future halt now includes raising
     the floor again, which it did not before. That is still Cedar's decision, not Redwood's. And
     raising it is no longer cheap-and-invisible: `.nvmrc` and `engines.node` must move together,
     and both are enumerated files. A halt is still a halt.

     *Already discharged against Node 22.23.2* (verified by the main session; do not redo):
     `jsdom` (`^22.22.2 || ^24.15.0 || >=26.0.0`), `@testing-library/jest-dom` (`>=22`), `next`
     (`>=20.9.0`), `vitest` (`^20 || ^22 || >=24`), `@vitejs/plugin-react` (`^20.19.0 || >=22.12.0`).
     Run step 0 for the remainder — types, the rest of the lint set, `@testing-library/react`,
     `@testing-library/dom`, `@testing-library/user-event`, `axe-core`, `recharts`, `zod`.

     *Note the tight floor.* `jsdom`'s `^22.22.2` clears 22.23.2 by a single minor, and its range
     is disjoint — it excludes 22.0.0–22.22.1, all of 23 and 25, and 24.0–24.14. Do not read
     `^22.22.2` as "Node 22 is fine."
  2. **Candidate pins** (subject to step 0; `^` ranges, `package-lock.json` committed):
     - Runtime: `next@^16`, `react@^19`, `react-dom@^19`
     - Types: `typescript@^5`, `@types/react`, `@types/react-dom`, `@types/node`
     - Lint: `eslint@^9` *(held)*, `eslint-config-next` (major matched to `next`),
       `eslint-config-prettier`, `eslint-plugin-jsx-a11y@^6`, `prettier@^3`
     - Test: `vitest@^4` *(held)*, `@vitejs/plugin-react`, **`jsdom@^30`** *(newly explicit)*,
       `@testing-library/react@^16`, `@testing-library/dom`, `@testing-library/user-event`,
       **`@testing-library/jest-dom@^7`** *(newly explicit)*, `axe-core`

     Reasons, since "the platform now allows it" is not one:
     - **`eslint@^9` holds.** With the Node-20 claim corrected, `eslint@10` was never blocked by the
       platform, so nothing here argues for or against it. The actual discriminator is
       `eslint-config-next@16`'s peer range, which is unverified — **step 0 must run
       `npm view eslint-config-next peerDependencies`**. If that range excludes `^9`, halt; do not
       resolve it by taking `eslint@10` unilaterally, because the flat-config bridge and the plugin
       set move with it. If it permits both, `^9` stands: a major bump with no requirement behind it
       is the same Rule 9 accounting failure Constraint 3 forbids for `recharts` and `zod`.
     - **`jsdom@^30` and `@testing-library/jest-dom@^7` are now explicit** rather than unversioned.
       These two are precisely the packages that broke, so the major that was verified should be the
       major that is recorded — an unversioned entry gives Cypress nothing to audit. `^6` of
       jest-dom earns nothing: 6.10.0 also declares `>=22`, so it is not a lower-risk fallback,
       just an older one.
  3. **Deliberately NOT installed here**: `recharts` and `zod`. Both are in the Stack table
     and both are correct choices; neither has a consumer until the chart SPEC and the first
     Route Handler SPEC respectively. Installing them now would decouple a dependency from
     the requirement that justifies it, which is the accounting Rule 9 exists to preserve.
     Step 0 still checks their compatibility so an incompatibility surfaces now, not mid-skeleton.
     This is an omission by decision — do not "helpfully" add them.
  4. **Do not enable type-aware linting** (`projectService` / `parserOptions.project`). With
     `include` scoped to `src/**`, the root-level `next.config.ts` and `vitest.config.ts` sit
     outside the TS program; type-aware rules would immediately fail them with
     "file not included in your project," breaking `eslint .` on the first run. Next's default
     config is not type-aware — leave it that way.
  5. **No Prettier config file.** Prettier defaults are accepted; the integration is
     `eslint-config-prettier` inside the flat config. A `.prettierrc` would spend a file from
     the budget to restate defaults. `post-edit-lint.sh` invokes `prettier --write` with no
     config and will pick up the same defaults.
  6. **No `.env`.** `.env.example` carries the bare variable name `SOCRATA_APP_TOKEN` with an
     empty value and a comment. Never `NEXT_PUBLIC_SOCRATA_APP_TOKEN` — `guard-data-integrity.sh`
     blocks that name mechanically, and it would be a Rule 3 violation regardless.
  7. **Ordering**: run `npm run build` once **before** ending the turn. `next-env.d.ts` and
     `.next/types/` are build artifacts; `tsc --noEmit` may fail on missing Next JSX types if
     the Stop gate fires before a build has ever run.
  8. `npm audit` after install; report anything at high or critical.
  9. **`engines.node` in `package.json`** — declare exactly:

     ```json
     "engines": { "node": ">=22.22.2" }
     ```

     *Why pin it at all* (Open Question 3, reversed): the original grounds for declining assumed the
     Node version was incidental. Step 0 disproved that — the version is load-bearing, and the cost
     of not recording it was a toolchain that installs clean, passes all four acceptance commands,
     and breaks on the first component test.

     *Why `>=22.22.2` and not `>=22.13.0`*: 22.22.2 is the tightest verified floor in the tree.
     `>=22.13.0` would declare as supported a range (22.13.0–22.22.1) that `jsdom` rejects — it
     would not have caught this failure, which is the entire point of adding the field.

     *Why open-ended upward, rather than mirroring jsdom's disjoint range*: this field states *this
     project's* supported platform, not a re-derivation of a transitive dependency's constraint.
     That copy drifts the moment jsdom republishes, and npm's per-package `EBADENGINE` already
     surfaces those gaps at install time — jsdom's own field is what caught this one, and it keeps
     working. An upper bound would need editing on every Node major for no added protection.

     *`engine-strict` is declined, deliberately.* npm does not enforce `engines` without it. A
     `.npmrc` carrying `engine-strict=true` would be a 7th file, guarding a failure mode that
     `.nvmrc` + `use-on-cd` already prevents by construction locally. **Revisit trigger:** the first
     CI runner or second contributor machine, where no fnm integration exists and the warning
     becomes the only signal.

  **The file cap — resolution and its bound.** Granted as an explicit exemption, on the same
  principle that exempts Banyan's mechanical tree-wide refactors: Rule 5 bounds the *reviewable
  decision surface*, not the byte count, and `create-next-app` output encodes no decisions —
  it is reproducible from one pinned command, so what gets reviewed is the command, not its
  ~20 files. The exemption is bounded and auditable, not open-ended:
  **at most 6 files may differ from verbatim generator output or be authored by hand** (raised from
  5 by Amendment 2). They are enumerated in *Files* below. Cypress audits the bound by confirming
  `git status --porcelain` shows the generated set plus no more than those 6 divergences. If a 7th
  is needed, halt and request a revision — do not spend it.

  **Protecting `.gitignore` and `README.md` — the concrete mechanism.** Chosen approach:
  **scaffold out-of-tree, then copy in under an exclusion allowlist, with git itself as the
  verifier.**
  1. *Deterministic Rehearsal (Rule 5)*: run `create-next-app` into the session scratchpad,
     then `ls -A` it and print the copy plan **before** copying anything.
  2. *Copy in with `.gitignore` and `README.md` excluded by name.* Nothing needs merging:
     the repo's `.gitignore` is already a **strict superset** of what Next generates —
     it covers `.env*` with the `!.env.example` negation, `node_modules/`, `/.next/`, `/out/`,
     `/build/`, `next-env.d.ts`, `*.tsbuildinfo`, `.vercel/`, `/coverage/`, `.yarn/*` with its
     negations, `.pnp*`, `*.pem`, `.DS_Store`, and the log globs. Verified by reading it.
     So protection is pure exclusion with zero reconciliation cost.
  3. *Verify with git, not with bookkeeping*: `git status --porcelain -- .gitignore README.md`
     must print nothing. Git compares against the committed blob, so this proves byte-identity
     with no hashes to record or trust. If it prints anything:
     `git checkout -- .gitignore README.md` and halt with a report.

  Rejected alternatives: running `create-next-app .` in place (it treats both files as
  conflicts and will either abort or overwrite — and `README.md` carries the mermaid diagram
  refined over four commits, including a stroke-only palette validated for light *and* dark);
  and hand-authoring the whole scaffold (see *Intellectual Control*).

  **Making `eslint .` and `tsc --noEmit` green on the first run — the specific hazards found.**
  Both are real in this tree, not precautionary:
  - `eslint.config.mjs` **must** ignore `.claude/**`, `.gemini/**`, and `skills/**`. Those three
    trees currently hold **270+ `.mjs` files** of third-party skill payload (`vercel-optimize`
    alone contributes the bulk). They are not our code, are not in our style, and `eslint .`
    lints them by default. Keep the generator's own ignores for `.next/**`, `out/**`, `build/**`,
    `node_modules/**`, and add `coverage/**` and `next-env.d.ts`.
    `docs/**` and `.githooks/**` need no entry — Markdown and shell are not matched by any
    configured `files` pattern; do not add ignores that earn nothing.
  - `tsconfig.json` `include` **must** be scoped to `["next-env.d.ts", "src/**/*.ts",
    "src/**/*.tsx", ".next/types/**/*.ts"]`. The stock `"**/*.ts"` pulls in
    `.claude/skills/vercel-optimize/lib/gates/types.d.ts` and its two siblings under
    `.gemini/skills/` and `skills/` — three files that would be typechecked as ours.
  - `test` script must be `vitest run --passWithNoTests`. This SPEC creates no test files
    (the first belongs to Cypress under the walking-skeleton SPEC); bare `vitest run` exits
    non-zero on "no test files found."
- **Edge Cases**:
  - A candidate package's `engines.node` excludes **22.23.2** → halt, report, request revision.
    Never install with `--force` or `--legacy-peer-deps` to route around it.
  - **`node -v` prints anything other than `v22.23.2` at step 0a → halt.** Do not proceed on Node
    20; every `engines` result recorded under it is invalid, and the failure is silent in the
    direction that reproduces the original bug.
  - `git status` shows `.gitignore` or `README.md` modified → restore from HEAD, halt, report.
  - The generated `src/app/page.tsx` fails `jsx-a11y` recommended rules → this is the one
    foreseen way the budget runs out. **Halt and request a revision** authorizing a placeholder
    page as a 6th file. Do not silently exceed the bound.
  - `npm audit` reports high/critical → report it; do not auto-remediate with `audit fix --force`,
    which can change majors and is a dependency decision.
  - Scratchpad scaffold fails or is interrupted → delete the scratchpad directory and restart;
    never copy a partial tree in.
- **Files** (max 6 — the hand-authored/hand-modified budget; generator output is exempt per above):
  1. `package.json` — deps + scripts: `dev`, `build`, `start`, `lint` (`eslint .`, mirroring the
     Stop gate exactly), `typecheck` (`tsc --noEmit`), `test` (`vitest run --passWithNoTests`),
     `test:watch` (`vitest`) — **plus the `engines` block from Constraint 9**
  2. `tsconfig.json` — `strict: true`, `include` scoped to `src/**` as specified above
  3. `eslint.config.mjs` — generator base + `eslint-plugin-jsx-a11y` recommended +
     `eslint-config-prettier` last + the three skill-tree ignores
  4. `vitest.config.ts` — `@vitejs/plugin-react`, `environment: 'jsdom'`, no `setupFiles` yet
     (Cypress adds it with the first test), no `globals` — import from `vitest` explicitly
  5. `.env.example` — `SOCRATA_APP_TOKEN=` plus a one-line comment. No value, ever.
  6. **`.nvmrc`** — contains `22`. Already written by the main session; **authorized retroactively
     as item 6.**

  *Why the number moved instead of the category.* `.nvmrc` cannot ride in as generator-output-class:
  "this project runs on Node 22" is a reviewable decision with a rationale, which is exactly what
  Rule 5's cap bounds. And the budget is deliberately **not** recast into "config files" versus
  "platform pins" — that category would have exactly one member and would establish
  exemption-by-reclassification as a move, which is the drift path. A bound that moved once, from 5
  to 6, with the reason recorded, stays auditable. A taxonomy does not.

  *Why `22` and not an exact patch:* `.nvmrc` is a selector, not a range. `22` resolves to the
  latest installed-or-available 22.x, which is ≥22.22.2 today and stays so monotonically. An exact
  `22.23.2` would need editing on every security patch. The pathological case — a fresh machine
  where fnm resolves `22` below the floor — is caught by `engines.node`.

  *The foreseen budget-exhaustion edge case still bites, one slot later.* If the generated
  `src/app/page.tsx` fails `jsx-a11y` recommended rules, that is now a request for a **7th** file,
  not a 6th. Halt and request a revision. The raise is spent; it is not headroom.

  Not touched: `.gitignore`, `README.md`, `CLAUDE.md`, `SESSION_STATE.md`, `docs/**`, `.claude/**`.
- **Tipping Point**: the config is one flat layer today and stays reviewable while it is.
  Decompose when **any one** of these trips:
  - `vitest.config.ts` needs two environments — `jsdom` for components and `node` for Route
    Handler tests. That is the near-certain first trip, and it arrives with the first Route
    Handler test. Split into Vitest `projects` at that point; do not pre-build it now.
  - `eslint.config.mjs` accumulates more than **one** file-scoped override block beyond the
    ignore list (e.g. relaxing a rule for tests, then for config files, then for generated
    types). At two, extract the rule blocks into named exports and compose them.
  - `package.json` scripts exceed **eight**, or any script grows a shell `&&` chain. Move to a
    task file rather than letting the manifest become a build system.
  - `tsconfig.json` needs a second config (`tsconfig.test.json`, or a path-alias set beyond
    `@/*`). One alias is a convenience; two are an architecture, and that is when
    `ARCHITECTURE.md`'s revisit trigger in CLAUDE.md § Project Layout should be re-read.

**Ordering override, stated rather than assumed**: the standard Cypress-writes-failing-tests-first
sequence does not apply — a scaffold has no behavior to assert, and the only meaningful assertions
are the four commands in *Inputs/Outputs*, which are the Stop gate itself. Cypress audits
**after**, per Rule 4's SPIKE clause, against this checklist: (a) the four commands exit 0;
(b) `git status --porcelain -- .gitignore README.md` is empty; (c) hand-modified files number **≤6**
and match the enumerated list, `.nvmrc` included; (d) no token value, no `NEXT_PUBLIC_` name, and no
Appendix A figure appears anywhere in the diff; (e) the step-0 `engines` output was recorded, not
skipped, **and `node -v` was recorded as `v22.23.2`**; (f) **`package.json` contains
`"engines": { "node": ">=22.22.2" }` exactly, and no `.npmrc` exists.**
Cypress's first *test file* belongs to the walking-skeleton SPEC, not to this one.

**Background/reference resources (Constraint of Three)**:
1. `CLAUDE.md` § Stack — the decided technology set (treat as input, not open question).
2. `.claude/hooks/stop-quality-gate.sh` — the exact commands that must pass and how the app
   root is located.
3. `.gitignore` — the file to preserve and the reason it needs no merge.

## [FORCES]

1. **Determinism > Convenience** — the generator and `npm view` produce the tree and the version
   facts; the model records them rather than reproducing them from memory. Same discipline as
   NFR-4, applied to the toolchain.
2. **Mechanical verification > Care** — `.gitignore` and `README.md` are protected by a git check
   that fails loudly, not by an instruction to be careful.
3. **Traceability of dependencies > Installing everything up front** — each package arrives with
   the requirement that needs it, so Rule 9's authority stays auditable.
4. **Simplicity > Pattern purity.**

---

## Carried forward — not part of this SPEC

**Vercel build runtime — half recorded here, half deferred.** The in-repo half lands in this SPEC:
`engines.node` (Constraint 9) is the mechanism Vercel reads to select a build runtime, so the repo
no longer carries an implicit "whatever Vercel defaults to." The dashboard half defers to the deploy
task, because no Vercel project exists and nothing in this repo can set it — **the deploy `[SPEC]`
must verify the project's Node runtime matches `engines.node` and record the result.** Sizing the
risk so the deferral is a judgment rather than a shrug: `jsdom` and `@testing-library/*` are dev
dependencies and `next build` does not run tests, so a Vercel image on Node 20 would still build
green. The divergence would surface only as local-versus-deploy drift in Route Handler behavior —
real, but not this task's.

**Fresh-clone gap on `.nvmrc`.** The file ships; the fnm wiring that reads it lives in
`~/.config/fish/conf.d/fnm.fish`, outside version control. Structurally the same gap already
recorded for `.git/hooks/commit-msg`, but this one fails *quietly* — a clone on Node 20 installs
with `EBADENGINE` warnings, passes all four acceptance commands, and breaks at the first component
test. Mitigation chosen: one README line naming the Node floor, batched into the PRD-amendment docs
task below rather than spending a file slot here. `engine-strict` was the stronger option and was
declined with a revisit trigger (Constraint 9).

**PRD handoff (docs/project-mvcc-data.md, lines ~280–289) is stale.** It instructs kickoff to
"create the assignment's own subdirectory with its `AGENTS.md`, move this PRD into it, and record
the §5.6 security-isolation assessment there." All three clauses are superseded: this repo *is*
the standalone assignment directory (and scaffolding into a subdirectory would silently no-op
`stop-quality-gate.sh`); `AGENTS.md` was folded into `CLAUDE.md` by recorded decision because
Claude Code does not auto-load `AGENTS.md`; and the §5.6 assessment already lives in
`CLAUDE.md` § Recorded decisions. Leftover from when this project lived inside the parent
`Pursuit_AI-Native` repo. Amend the PRD so a future agent does not act on it — a documentation
task, tracked separately.

---

## Archived 2026-08-05 — Platform-agreement verification (COMPLETE)

**Outcome:** delivered 3 of 3 budgeted files; Cypress audit PASS on 2026-08-05, both SPECs in one
pass. Hook matrix verified across five environments (Node 22 standalone/hook, Node 20
standalone/hook, and Node 20 with `stop_hook_active: true`) — exit 2 / exit 0 / cap intact.

**Amendment 3 (a)-(e) below is archived text but its standing clauses still bind.** 3(b) (record
`node -v` in acceptance), 3(c) (`@types/node` major tracks `engines.node`), and 3(d) (`eslint@^9`
is required by `eslint-plugin-jsx-a11y`, not by `eslint-config-next`) are carried in the ledger's
Context Cache. 3(e) (the authorized `vitest.config.ts` -> `.mts` rename) is carried in the ledger's
Active section and is owed to the walking-skeleton SPEC.

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
