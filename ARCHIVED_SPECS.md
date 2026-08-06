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

---

## Archived 2026-08-06 — Walking skeleton Task 1: deaths per year, live from Socrata (COMPLETE)

**Outcome:** delivered 5 of 5 budgeted files (Redwood) plus Cypress's test files and the
Amendment 3(e) vitest.config rename/setupFiles edit. Cypress audit PASS on 2026-08-06, standard
ordering (tests first, then implementation, then audit) — the first SPEC in this repo to use the
standard order rather than the SPIKE override the two prior SPECs used. All four gates green;
live `/api/deaths` figures independently re-verified by Cypress against PRD Appendix A with zero
drift across all 8 years, including the fragile 2025 endpoint (229, unchanged).

**First application code in the repo.** `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, and
`src/app/page.tsx` are the first Route Handler, first data-fetching module, and first real page
this project has shipped. FR-1, FR-8, FR-10, FR-11, NFR-1, NFR-2, NFR-3, NFR-4 are all live and
tested end to end for the deaths metric.

**A real bug surfaced and was routed to the right owner, not the fastest fixer.** Redwood found a
temporal-dead-zone bug in Cypress's own `page.test.tsx` (a `vi.mock` factory closing over a plain
top-level `const` that Vitest's hoisting evaluates before its initialization) while implementing
against it. Redwood correctly declined to touch a test file outside its authority and reported it
instead; the orchestrator relayed the finding back to the same Cypress invocation (continuation,
not a respawn) to fix, since only Cypress may edit tests. One-line-class fix, verified against the
failure it corrected. No rejection loop was needed — this was a test-authoring bug found during
implementation, not a Cypress FAIL of Redwood's work after audit.

**A second, unrelated hazard reappeared and was handled the same way both times.** `next dev`/
`next build` auto-appends a `<!-- BEGIN:nextjs-agent-rules -->` block to `CLAUDE.md` via
`node_modules/next/dist/server/lib/generate-agent-files.js` — a Next 16 feature, not a bug, but
`CLAUDE.md` is explicitly off-limits (Constraint 8) and this block carries no project decision.
Redwood reverted it once during implementation; it reappeared during Cypress's independent
`npm run dev` verification and the main session reverted it again before archiving this SPEC. Not
recorded as a defect — it's expected generator behavior — but worth naming here so a future agent
running `next dev`/`next build` in this repo isn't surprised to find `CLAUDE.md` dirty afterward and
knows to `git checkout -- CLAUDE.md` rather than either committing the block or debugging it.

# Active SPEC

**Status:** approved by the human → dispatched to Cypress (tests first), then Redwood
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-05
**Executing agent:** Redwood · **Tests first:** Cypress · **Audit:** Cypress (standard order —
not the SPIKE ordering override the two prior SPECs used)

This is **Task 1** of a two-task walking-skeleton split. The full slice (data + Route Handler +
page + a `'use client'` Recharts component + its CSS) is 6+ files, over Rule 5's 5-file cap, and
none of the six qualifies as generator-output-class the way the scaffold's exemption did. Rather
than spend another bounded exemption, Cedar split the work on the agent boundary: this task builds
the data path and the NFR-3-mandated accessible table (Redwood, 5 files, zero Recharts, zero CSS);
**Task 2** (pre-declared at the bottom of this file, not dispatched yet) adds the chart over that
table (Magnolia, ~3 files), once this task closes and is audited. Human-approved via plan mode on
2026-08-05.

---

## Standing clauses that bind this and every subsequent SPEC

Archived with the SPECs that introduced them, restated here because they are live obligations:

- **Amendment 3(b) — acceptance-by-command must record `node -v`**, and the recorded version must
  satisfy `engines.node`. A gate that ran on an unverified platform produced an unverified result;
  unverified is not PASS. Costs no file budget; not optional in any SPEC.
- **Amendment 3(c) — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Amendment 3(d) — `eslint@^9` is required.** The binding constraint is
  `eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes eslint 10 — *not* `eslint-config-next`,
  which is permissive and decides nothing. Check that package first before evaluating eslint 10.
- **Amendment 3(e) — `vitest.config.ts` → `vitest.config.mts` is AUTHORIZED**, batched with
  Cypress's first `setupFiles` edit in **this task's Phase B** (one edit, not two). It renames an
  already-enumerated item, so it costs no new file slot in either agent's budget. Of its two
  required checks, the first is already pre-discharged — a root `.mts` sits outside
  `tsconfig.include` by construction. **The second still needs doing:** `eslint.config.mjs`
  declares no explicit `files` patterns and inherits `eslint-config-next`'s, so whether `.mts` is
  linted is an unverified inherited default. Verify with `eslint --debug` or a deliberate error
  before assuming coverage.
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) the mechanism is the *only* thing that catches the named failure, and (ii) no existing
  enumerated file, hook, CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`. If CI lands and can
  pin (`actions/setup-node` with `node-version-file: .nvmrc`, or Vercel reading `engines.node`),
  the trigger is **retired** — fixing the platform strictly dominates failing on it.

## Carried forward — owed, not part of this task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it,
  and this task does not touch it either.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all 450
  installed packages, so this is a documentation gap, not an open risk).

---

## [SPEC] — Walking skeleton Task 1: deaths per year, live from Socrata

- **Objective**: Render the eight yearly traffic-death figures for 2018–2025 on `/`, produced by a
  single live server-side SoQL aggregation, with the exact query displayed beside them and a
  defined error state when any year is absent. Three layers, one metric: a server-only data module
  that owns the query and its validation, a Route Handler that exposes it as the tested JSON
  contract, and a Server Component page that renders it as a semantic table. No chart, no Recharts,
  no CSS, no second metric.

- **Requirement**: **FR-1 [P0]** (deaths per year 2018–2025 from `sum(number_of_persons_killed)`
  grouped by `date_extract_y(crash_date)`) — the one metric in scope. Also satisfies **FR-8 [P0]**
  (display the exact SoQL), **FR-10 [P0]** (defined empty/error state), **FR-11 [P0]** (strings
  cast explicitly; absent/null core aggregate triggers FR-10, never a silent zero), **NFR-1** (ISR
  caching of an immutable historical aggregate), **NFR-2** (token read server-side only), **NFR-3**
  (the screen-reader-accessible table twin, built before the chart it will twin), **NFR-4** (every
  figure from SoQL aggregation).
  Explicitly **not** in scope: FR-2 (injuries), FR-3 (collisions, dashed + labelled), FR-4 (%
  change), FR-9 (caveats), FR-12 (casualty-filtered repair), FR-13 (policy-date markers), and all
  of the severable FR-5–7 arrest group. Per Rule 6, everything else grows from this slice.

- **Inputs/Outputs**:
  - *Input*: the completed toolchain on a clean tree; `SOCRATA_APP_TOKEN` in a gitignored `.env`
    (create it locally from `.env.example`; never committed, never printed).
  - *Step 0, before anything else* (Amendment 3(b), binding): run and record `node -v` and
    `npm -v`. `node -v` must satisfy `engines.node` (`>=22.22.2`); on this machine that is
    `v22.23.2`. If it prints a v20, halt and re-enter through a fresh shell in the project root. Do
    not `fnm use` around it. Then run and record `npm view zod engines` and
    `npm view zod peerDependencies`. Cypress established on 2026-08-05 that `zod` declares **no**
    `engines` field at all — recording "none declared" is the result, not permission to skip the
    command.
  - *Output 1 — `src/lib/deaths.ts`* (server-only by construction; never imported by a
    `'use client'` module). Exports:
    - The four SoQL clause constants, verbatim as pinned under **Query** below.
    - `DEATHS_SOQL: string` — the human-readable query for FR-8, assembled from those same
      constants. Not a retyped copy: **built from the constants, so the displayed text and the
      sent request cannot drift.**
    - `buildDeathsUrl(): URL` — the request URL, encoded with `URLSearchParams` from those same
      constants. No hand-rolled `encodeURIComponent` concatenation.
    - `fetchDeathsPerYear(): Promise<DeathsResult>`.
  - *The result type* (a plain discriminated union; see Design Pattern for why this is not a
    "pattern"):

    ```ts
    export type DeathsRow = { year: number; deaths: number };

    export type DeathsResult =
      | { status: "ok"; soql: string; rows: DeathsRow[] }          // exactly 8 rows, 2018..2025
      | { status: "empty"; soql: string }                          // FR-10: zero rows returned
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };
    ```

    `reason` is a human-readable diagnostic naming what failed (e.g. `"no aggregate returned for
    2024"`, `"Socrata responded 429"`). It is rendered to the user; it must never contain the
    token.
  - *Output 2 — `src/app/api/deaths/route.ts`*: `export async function GET()`, calling
    `fetchDeathsPerYear()` and mapping the union onto HTTP:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

    The two error codes are distinguished on purpose: 502 means Socrata failed us; 422 means
    Socrata answered and the answer violated the pinned contract. Those demand different responses
    from a human, so they must be different codes.
  - *Output 3 — `src/app/page.tsx`*: an `async` Server Component that awaits
    `fetchDeathsPerYear()` **directly** (see Intellectual Control for why it does not re-fetch its
    own Route Handler) and renders:
    - an `<h1>` and one sentence of neutral framing — correlation language only, no causal claim;
    - on `ok`: a `<table>` with a `<caption>`, `<th scope="col">` on Year and Deaths, one `<tr>`
      per year, ascending;
    - on `empty` / `error`: a visible, non-decorative message stating that no figures could be
      produced and why (`reason`). **Never an empty table, never a rendered zero, never a crash.**
    - in all three states: a `<details>` disclosure labelled "SoQL query" containing
      `DEATHS_SOQL` in a `<pre><code>` (FR-8). It renders in the error states too — the query is
      most useful precisely when it failed.
  - *Acceptance, by command, with `node -v` recorded beside the results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` recorded — one deduped entry, resolved version `4.x`.
    3. `npm run dev`, then `curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/deaths` →
       200, and `curl -s localhost:3000/api/deaths` → `status: "ok"` with exactly 8 rows.
    4. `/` renders eight rows and the query disclosure.
    5. `npm audit` run; anything high or critical reported (not auto-fixed).
    6. **The live response body is pasted verbatim into the `[COMPLETION-REPORT]`.** Cypress diffs
       it against PRD Appendix A's Deaths column. Redwood does not perform that comparison and
       does not state whether the numbers "look right" — it transports them. (NFR-4: the figure is
       compared, never authored.)
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` shows the name in exactly three places
       and a **value in none**.

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`.

  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when the variable is non-empty.

  **Expected response shape** — a JSON array of exactly 8 objects, ascending by year, every
  numeric field a **string** (verified live 2026-08-03, re-verified 2026-08-04):

  ```json
  [{ "year": "2018", "deaths": "..." }, ... 8 entries through "2025" ]
  ```

  **Zod schema, and its deliberate asymmetry.** `deaths` is `z.string().regex(/^\d+$/)` — strict,
  because that is where the integrity claim lives and because the skill's contract says every
  numeric field arrives as a string. `year` accepts `z.union([z.string(), z.number()])` and is
  normalized, because a year cannot be silently wrong in a way that fabricates a safety
  improvement; only the measure can. Cast with `Number(...)` **after** the regex passes. Do not use
  `z.coerce`, `parseInt` on unvalidated input, `Number()` on a value that has not been asserted, or
  any `?? 0` / `|| 0` / `Number(x) || 0` anywhere in the parse path.

  **No `$limit`, on purpose.** The 1,000-row default is irrelevant once `$group` collapses the
  response to 8 rows, and adding `$limit=8` would silently *truncate* a drifted response where the
  validator's exact-eight-years assertion would instead *catch* it. The stronger check wins.

  **Do not alter any clause.** If Socrata rejects alias ordering (`$order=year`), or any clause
  errors, **halt and request a revised `[SPEC]` from Cedar.** Do not repair the query in place.

- **Design Pattern**: **none — simple case.** Variance analysis per Rule 8: the fixed 2018–2025
  window and the dataset ID are stable; the axis that genuinely varies is the *set of series*.
  Today there is exactly one series, so there is nothing to encapsulate — a Strategy, a series
  registry, or a provider here would be an abstraction with one implementation, the unearned-
  pattern failure Rule 8 names. `composition-patterns` was consulted: the only component authored
  is a Server Component rendering a table, with no boolean props, no compound structure, and no
  shared state, so all four of its rule categories presuppose a component this task does not
  create. The `DeathsResult` discriminated union is **not** a pattern claim — it is a return type,
  chosen so FR-10's error state is a rendering branch rather than a `try`/`catch` straddling the
  server boundary. Write the lib so a second series would be a second call, and then **stop**; do
  not parameterize in advance. See Tipping Point.

- **UI Scope**: **structural** — `src/app/page.tsx` is replaced outright and the page's DOM is
  created here. But **no visual design is in scope**: no CSS module, no colors, no spacing, no
  layout system. Semantic HTML inheriting `globals.css` only. All styling, and the chart itself,
  belong to Magnolia's follow-on SPEC (Task 2, below). Redwood must not open a stylesheet.

- **Intellectual Control**:
  - *Why the page imports the lib directly instead of fetching its own Route Handler over HTTP.*
    Self-fetching requires an absolute URL the server does not portably know (it becomes
    `VERCEL_URL` juggling in production and `localhost:3000` guesswork locally), fails during
    `next build` when the page is prerendered and no server is listening, adds a full HTTP round
    trip inside a single process against NFR-1's caching budget, and yields two caching layers to
    reason about instead of one. Importing the module is in-process, prerenders cleanly, and puts
    the `revalidate` policy in exactly one place. The token is equally server-side in both designs,
    so the self-fetch buys nothing it costs.
  - *Then why does the Route Handler exist at all, if the page does not call it?* Two reasons,
    neither decorative. **NFR-2 names the Route Handler as the mechanism** for token handling and
    the Stack table names Route Handlers as the data-access layer — a PRD-level choice not to be
    reinterpreted away. And Rule 4's testing doctrine says the behavioral test target for data work
    is "a Route Handler's JSON response shape given a stubbed Socrata reply": the endpoint is what
    Cypress can black-box and what a human can `curl` when the page looks wrong. It is the
    inspectable, tested face of the same function the page renders — not a parallel path that
    could disagree with it, because there is only one query string, one schema, and one validator,
    in one module, imported by both.
  - *Why the shared function is a separate file rather than an export from `route.ts`.* Next's App
    Router treats `route.ts` as a special module and validates its exports; a non-HTTP-method
    export is a type error in the generated `.next/types`, so
    `import { fetchDeathsPerYear } from './api/deaths/route'` is not merely ugly, it does not
    typecheck. It would also couple the page's import path to a URL path, so moving the endpoint
    would break the page. The lib file is not a layer added for symmetry; it is the only place the
    shared function can legally live.
  - *Why the table before the chart.* NFR-3 requires the table regardless, and CLAUDE.md is
    explicit that even a two-line chart is not perceivable without it. Built first, it is the data
    surface the chart must agree with; built second, it becomes a chore appended to a chart that
    already looks finished. The `dataviz` form heuristic was checked and does **not** argue for a
    stat tile here: FR-1 asks for deaths *per year* across eight years, which is a line chart's
    job — that chart arrives in Magnolia's SPEC, over this table, unchanged.
  - *Why this will not break at scale.* The whole surface is one module with four exported symbols
    and no cross-file state. The only coupling is deliberate and load-bearing: `DEATHS_SOQL` and
    `buildDeathsUrl()` are derived from the same four constants, so FR-8's displayed query is
    mechanically the query that was sent. Cypress can assert that invariant directly — every clause
    in the displayed string appears, encoded, in the built URL — which is what keeps FR-8 honest
    after the fourth series exists.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` is read **only** inside
     `src/lib/deaths.ts`. Never a `NEXT_PUBLIC_` name; never in a module carrying a `'use client'`
     directive; never logged, never echoed into `reason`, never written to a fixture or a commit.
     `guard-data-integrity.sh` blocks the first two mechanically. None of the three files created
     here may ever gain a `'use client'` directive.
  2. **No figure may be authored — and the hook will not catch you here.**
     `guard-data-integrity.sh` pins 26 six-digit literals (collisions, injuries, casualty-filtered).
     The deaths values are three digits and are **deliberately absent from that list**, because a
     pattern matching them would fire on every ordinary small number. So for *this* task the
     mechanical net does not exist. No deaths figure may appear as a literal in `src/**` — not as a
     fallback, not as a placeholder, not in a comment, not in a default value, not in a "temporary"
     mock. If the fetch fails, the page shows the error state; it does not show a remembered
     number.
  3. **The query is frozen** (Rule 4). No clause may be edited, reordered, extended, or "fixed."
     Any Socrata rejection is a halt and a request for a revised SPEC, not a local repair.
  4. **No zero-coercion, anywhere** (FR-11, trap 1). An absent key, a `null`, or a non-matching
     string for `deaths` in any year of the window produces `status: "error"`, `kind: "contract"`.
     `sum()` over a group whose rows are all null returns *no key at all* — that is the exact shape
     the confirmed post-2026-05-05 dropout takes, and coercing it to 0 would fabricate a safety
     improvement. There is no acceptable default value for a missing fatality count.
  5. **One new dependency: `zod@^4`**, authorized here under Rule 9 because FR-11's boundary
     validation is its first real consumer. `zod@4.4.3` is already in the tree transitively via
     `eslint-config-next → eslint-plugin-react-hooks` marked `dev: true`; declaring it as a direct
     production dependency is the deliberate pin the ledger asked for, not a silent dedupe against
     a lint plugin's transitive pick. Record `npm ls zod` after install; if it resolves below 4,
     halt. Import from the package root (`import { z } from "zod"`), not `zod/v3`.
  6. **`recharts` is NOT installed here.** It has no consumer in this task, and installing a
     dependency ahead of the requirement that justifies it is precisely the Rule 9 accounting the
     scaffold SPEC protected. It is pre-authorized for Magnolia's follow-on SPEC (Task 2) at
     `recharts@^3` (3.10.1, `engines.node >= 18`, already discharged in the scaffold's Amendment 1
     table). Do not helpfully add it.
  7. **No CSS, no chart, no client component.** No `.module.css` authored or edited; `globals.css`
     untouched; no `'use client'` file created.
  8. **Files not to touch**: `vitest.config.ts`/`.mts` (Cypress's, per Amendment 3(e) — see
     Ordering), `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`,
     `globals.css`, `.claude/**`, `README.md`, `.gitignore`, `docs/**`.
  9. **`src/app/page.module.css` is left orphaned, by decision.** Replacing `page.tsx` strips its
     only importer, along with the `next/image` references to `public/next.svg` and `vercel.svg`.
     Deleting them would spend a file slot on cleanup that Magnolia's SPEC will either repurpose or
     remove with context this task does not have. Cypress should not flag the orphan; Redwood
     should not spend a slot on it.
  10. **Caching (NFR-1)**: the Socrata `fetch` carries `next: { revalidate: 86400 }`. One cache
      policy, stated once, in the lib — inherited by both the page's prerender and the Route
      Handler. Do **not** add `export const dynamic = "force-dynamic"`. Do not add a second,
      route-segment-level cache directive; if Next 16 warns about the fetch-level option, report it
      rather than layering a second mechanism on top.
  11. **Bound the request**: `AbortSignal.timeout(10_000)` on the fetch. An unbounded call to a
      third-party API inside a prerender can hang `next build` indefinitely.
  12. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  13. `npm audit` after install; report high/critical, do not `audit fix --force`.

- **Edge Cases**:
  1. **Network failure, DNS failure, or timeout** → `error`/`upstream`, 502, page error state.
  2. **Non-2xx from Socrata** (including **429 rate limit** and 5xx) → `error`/`upstream` with the
     status code named in `reason`. Do not retry in a loop; a single attempt, then fail loud (Rule
     4: cap every autonomous loop — the cap here is one).
  3. **Response is not JSON** (Socrata serves HTML for some error and throttle pages) → check the
     content type / guard the parse; `error`/`upstream`. Never `JSON.parse` a body blind.
  4. **Zero rows returned** → `status: "empty"`, HTTP 200, distinct user-facing message from a
     failure. "We got an answer and it was empty" and "we could not get an answer" are different
     facts, and FR-10 requires the state to be *defined*, not merely non-crashing.
  5. **A year in 2018–2025 is missing from the response** → `error`/`contract`, 422, `reason`
     naming the missing year. **Never zero-fill.** This is trap 1 and the single most likely real
     failure.
  6. **`deaths` present but `null`, empty string, non-numeric, or a JSON number instead of a
     string** → `error`/`contract` naming the year and the offending value's type. If this
     reproduces against the live feed, **halt and request a revised SPEC** — a type change in the
     feed is a contract change, and widening the schema on Redwood's own authority is exactly what
     Rule 4 forbids.
  7. **More than 8 rows, a duplicate year, or a year outside the window** → `error`/`contract`. Any
     of the three means the `$where` or `$group` no longer means what the SPEC says it means.
  8. **`SOCRATA_APP_TOKEN` is unset or empty** → **do not fail.** Omit the header entirely, emit
     one server-side warning, and proceed. The token is a rate-limit attribution token, not an
     authorization secret (CLAUDE.md § Recorded decisions), so its absence degrades throughput, not
     correctness — and hard-failing would mean a fresh clone can never see the skeleton at all.
     **Never** send the literal header value `undefined` or `null`.
  9. **The live 2025 figure has moved materially from the pinned 229.** Do not adjust anything, do
     not annotate, do not "sanity-correct." Report the observed value in the `[COMPLETION-REPORT]`;
     `/verify-figures` is the mechanism and PRD §7 already names the two-year-average fallback as
     the response. This is a finding, not a bug.
  10. **The Route Handler test cannot construct a Web `Request`/`Response` under the `jsdom`
      environment.** This is the scaffold SPEC's own named first tipping point arriving. The
      surgical resolution is a per-file `// @vitest-environment node` docblock in the route test,
      which costs no file; splitting `vitest.config` into Vitest `projects` is the escalation if a
      second such file appears. Cypress's call, in Cypress's budget — flagged here so it is not
      rediscovered at test-writing time.

- **Files** (max 5):
  1. **`package.json`** — add `zod@^4` to `dependencies`. No new scripts (the count stays 7 of the
     8-script tipping point).
  2. **`package-lock.json`** — install artifact; committed, per the scaffold SPEC.
  3. **`src/lib/deaths.ts`** — *new.* The four clause constants, `DEATHS_SOQL`, `buildDeathsUrl()`,
     the Zod schema, the pure year-coverage validator, `fetchDeathsPerYear()`, and the
     `DeathsResult` type. The only file in the repo that reads the token. Earns its own file
     because `route.ts` cannot legally export it (see Intellectual Control).
  4. **`src/app/api/deaths/route.ts`** — *new.* `GET` only; the union-to-HTTP mapping above. The
     black-box contract Cypress tests and a human curls.
  5. **`src/app/page.tsx`** — *replaced.* Server Component: heading, one neutral sentence, the
     accessible table, the FR-8 query disclosure, the FR-10 error/empty states.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger. This SPEC does not touch that file, so per the ledger's own rule they stay with
  the next SPEC that does. They do not block the skeleton.

  **The 7th-file test does not apply** — this budget is not spent, it is *sized*. Five files, five
  used. If Redwood believes a sixth is required, halt and request a revision; state which named
  failure the sixth file is the only thing that catches, and which of the five cannot carry it.

- **Tipping Point**: this is one module, one endpoint, one page, and it stays reviewable while it
  is. Decompose when **any one** trips:
  - **`src/lib/deaths.ts` gains a second series (FR-2 injuries).** That series differs only in the
    `$select` aggregate, so *parameterize* — one function taking the aggregate expression. Do not
    build the abstraction now for a caller that does not exist.
  - **A third distinct query *shape* arrives** — FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key rather than the aggregate. Parameterizing stops paying there.
    **That is where a Strategy (or a small series registry) is finally earned**, and where the SPEC
    introducing it must say so explicitly. Shorthand: *parameterize at two, encapsulate at three.*
  - **A second Route Handler appears.** The token read, header assembly, timeout, cache policy, and
    content-type guard are shared infrastructure the moment there are two callers — extract
    `src/lib/socrata.ts` then, leaving `deaths.ts` holding only the query and its validation. This
    is the near-certain first trip.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section**, or exceeds ~150
    lines. Decompose into components then — and that is also the moment to re-read
    `ARCHITECTURE.md`'s revisit trigger in CLAUDE.md § Project Layout.
  - **`src/lib/deaths.ts` exceeds ~120 lines or exports a second fetch function** → split the
    schema and validator into their own module.

**Ordering** (standard `[SPEC]`, no override): **Cypress writes failing tests first**, then
Redwood implements. Cypress's own budget — not Redwood's five — covers the test files and, per
**Amendment 3(e)**, the authorized `vitest.config.ts` → `vitest.config.mts` rename batched with
adding `setupFiles`. That rename costs **no file slot in either agent's budget**; it renames an
already-enumerated item, and Cypress must edit that file anyway. Redwood must not perform it, must
not duplicate it, and must not contest it. Of its two required checks, the first is pre-discharged
(a root `.mts` sits outside `tsconfig.include` by construction). **The second is still owed at
rename time:** `eslint.config.mjs` declares no explicit `files` patterns and inherits
`eslint-config-next`'s, so whether `.mts` is linted is an unverified default — verify with
`eslint --debug` or a deliberate error before assuming coverage.

**Test guidance for Cypress** (behavioral, per Rule 4 — the JSON response shape given a stubbed
Socrata reply, not the fetch plumbing): assert the `ok` path, the `empty` path, the missing-year
contract failure, the null-`deaths` contract failure, the non-2xx upstream failure, and the FR-8
invariant that every clause in `DEATHS_SOQL` appears encoded in `buildDeathsUrl()`. **Stub
responses must use obviously synthetic values (11, 22, 33…), never PRD Appendix A's real deaths
column** — a passing test must never be confusable with evidence that the live data is correct.
Add an `axe-core` assertion on the rendered table for NFR-3.

**Background/reference resources (Constraint of Three)**:
1. `.claude/skills/mvcc-data/SKILL.md` — the dataset contract: the FR-1 query pattern, trap 1
   (absent-key-as-zero), trap 5 (the 1,000-row default), and the string-typing rule.
2. `.claude/hooks/guard-data-integrity.sh` — what is mechanically caught, and specifically what is
   **not** (Constraint 2).
3. `docs/project-mvcc-data.md` lines 197–217 — FR-1, FR-8, FR-10, FR-11 and NFR-1–4, verbatim.

## [FORCES]

1. **Fail loud > render something** — an absent fatality aggregate must reach the user as an
   error, never as a zero. A silent zero here would manufacture the exact safety improvement this
   product exists to disprove.
2. **One source of truth for the query > convenient duplication** — the displayed SoQL (FR-8) and
   the sent request are derived from the same four constants, so they cannot drift, and the
   invariant is machine-assertable rather than maintained by care.
3. **In-process composition > an HTTP round trip to ourselves** — the page imports the shared
   function; the Route Handler is the tested, inspectable face of that same function, not a second
   path that could disagree with it.
4. **Traceability of dependencies > installing what we will obviously need** — `zod` arrives with
   FR-11, which needs it; `recharts` waits for the chart that needs it.
5. **Simplicity > Pattern purity.**

---

## Task 2 — pre-declared, NOT dispatched (Magnolia, ~3 files)

Drafted in full after Task 1's Cypress audit PASS, not now. Sketch, so the pair can be reasoned
about together: install `recharts@^3`; add `src/components/DeathsChart.tsx` (`'use client'`,
single line series, 2px stroke, round join/cap, ≥8px end markers, hairline gridlines, direct
end-of-line label, `prefers-reduced-motion` respected) plus its CSS module; edit `src/app/page.tsx`
to mount the chart inside a `<figure>` whose table-view toggle reveals the table Task 1 already
built. UI Scope: structural. It touches `src/app/page.tsx`, which Task 1 also touches — the two
are **strictly sequential, not parallel worktrees.**

---

## Archived 2026-08-06 — Task 2: the deaths-per-year line chart (COMPLETE)

**Outcome:** delivered 5 of 5 budgeted files (`package.json`, `package-lock.json`,
`DeathsChart.tsx`, `DeathsChart.module.css`, `page.tsx`); Cypress audit PASS — 64/64 tests,
zero axe-core violations, all pinned-figure and client-boundary greps clean;
`typecheck`/`lint`/`build` all exit 0 on Node v22.23.2. `npm audit`: 0 vulnerabilities.
Palette validator PASS both modes; `--chart-ink` contrast independently computed at
7.94:1 (light) / 11.05:1 (dark), clearing AA's 4.5:1 floor. First Load JS for `/`:
769,350 bytes uncompressed, recorded for the deploy SPEC's NFR-1 budget. One test-authoring
bug found and fixed by Cypress during its own audit (a missing `isTestFile` filter on its
own `process.env` grep, causing a false-positive self-match — the bug was in Cypress's file,
so Cypress fixed it, not Magnolia, mirroring Task 1's TDZ-bug ownership precedent).
Commits: `bc3d43e` (SPEC) → `503c239` (Phase B tests) → `1e67154` (Phase C implementation)
→ `735bcfd` (Phase D test fix). All pushed to `origin/main`.

# Active SPEC

**Status:** approved by the human via plan mode → dispatched to Cypress (tests first), then
Magnolia
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06
**Executing agent:** Magnolia · **Tests first:** Cypress · **Audit:** Cypress (standard order)

This is **Task 2**, the second and final task of the walking-skeleton split declared in Task 1's
SPEC. Task 1 (closed 2026-08-06, Cypress PASS) built the data path, the Route Handler, and the
NFR-3 accessible table. This task mounts the chart over that table and stops. It adds **zero new
queries, zero new fetches, and zero new metrics** — it is a pure rendering layer over the
already-fetched, already-validated `DeathsRow[]`.

The pre-dispatch sketch that stood here was written by Cedar before Task 1 existed and is
superseded in three places: the file count is 5 (not ~3), the `<figure>` lives inside the chart
component (not in `page.tsx`), and the table-view **toggle** the sketch assumed is deliberately
**not** built.

---

## Standing clauses that bind this and every subsequent SPEC

Archived with the SPECs that introduced them, restated here because they are live obligations:

- **Amendment 3(b) — acceptance-by-command must record `node -v`**, and the recorded version must
  satisfy `engines.node`. A gate that ran on an unverified platform produced an unverified result;
  unverified is not PASS. Costs no file budget; not optional in any SPEC.
- **Amendment 3(c) — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Amendment 3(d) — `eslint@^9` is required.** The binding constraint is
  `eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes eslint 10 — *not* `eslint-config-next`,
  which is permissive and decides nothing. Check that package first before evaluating eslint 10.
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) the mechanism is the *only* thing that catches the named failure, and (ii) no existing
  enumerated file, hook, CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`. If CI lands and can
  pin (`actions/setup-node` with `node-version-file: .nvmrc`, or Vercel reading `engines.node`),
  the trigger is **retired** — fixing the platform strictly dominates failing on it.
- **`vitest.config.mts` exists and lints correctly.** Amendment 3(e)'s rename is done; both its
  required checks passed. Nothing further owed.
- **`@/*` path-alias imports don't resolve under Vitest.** `tsconfig.json`'s `paths` map is
  honored by `tsc`/`next build` but `vitest.config.mts` has no matching `resolve.alias`/
  `tsconfig-paths` plugin. **Binding on this task:** every file created or edited here is
  test-covered, so every import in `src/components/DeathsChart.tsx` and `src/app/page.tsx` is
  **relative** (`../lib/deaths`, `../components/DeathsChart`). An `@/` import will typecheck and
  build and then fail only under Vitest — the most expensive way to find it. Adding
  `vite-tsconfig-paths` is a new dependency and therefore Cedar's call in a future SPEC, not a
  workaround available here.
- **`next dev`/`next build` auto-dirty `CLAUDE.md`.** Next 16's `generate-agent-files.js` appends
  a `<!-- BEGIN:nextjs-agent-rules -->` block on every dev/build run. `CLAUDE.md` is off-limits to
  every SPEC and this block carries no project decision — `git checkout -- CLAUDE.md` after any
  `dev`/`build` run, don't commit it and don't try to suppress it as a fix. This task runs both
  commands, so it *will* happen; confirm a clean `git status` for that path before reporting.

## Carried forward — owed, not part of any dispatched task's budget

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing. They belong to the next SPEC that touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90).
  2. **The all-clear line can print an empty version** (line 104).
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. **This task adds a second item to that SPEC's list:** record `/`'s First Load
  JS after Recharts lands and hold it against NFR-1's caching budget (Constraint 12).
- **`src/app/page.module.css` is orphaned for the second time, now with an expiry.** Task 1 left it
  unimported and deferred the decision to "Magnolia's SPEC" — this is that SPEC, and the decision
  is **leave it, delete it in the next SPEC that touches page-level layout** (realistically FR-9's
  caveats section or the first real layout pass). Reasoning is in this SPEC's § Files. It is now a
  tracked debt with a named owner rather than an inherited silence; if that SPEC lands without
  removing it, Cypress should flag the miss.
- **Step-0 `engines` transcription, partial.** Per-package `engines.node` ranges for `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record (the
  underlying compatibility risk was discharged mechanically via `semver.satisfies` across all
  installed packages, so this is a documentation gap, not an open risk).

---

## [SPEC] — Walking skeleton Task 2: the deaths-per-year line chart

- **Objective**: Render the eight yearly traffic-death figures Task 1 already fetches as a single
  line series, mounted directly above the existing table on `/`, inside a `<figure>` the chart
  component owns. One series, one `<figure>`, one new component and its stylesheet. **No new data
  access of any kind**: no `fetch`, no Route Handler, no SoQL, no second metric, no borough filter,
  no percentage change. The chart consumes the exact `DeathsRow[]` the Server Component already has
  in hand and renders it without sorting, filtering, formatting, interpolating, or re-deriving a
  single value.

- **Requirement**: **FR-1 [P0]** — the deaths-per-year series, now *displayed as a chart* rather
  than only as a table. Also satisfies, or holds intact, **NFR-3** (WCAG 2.2 AA: the chart's data
  remains available as the screen-reader-accessible table Task 1 built; `prefers-reduced-motion`
  respected; AA contrast on every stroke and label), **NFR-4** (no displayed figure is computed,
  rounded, or re-derived here — the chart plots the array it is handed), **NFR-5** (correlation
  language only in the new caption copy; the dashed-stroke treatment stays *reserved* — Constraint
  5), and **NFR-6** (Recharts renders SVG; no browser-specific API is introduced). Explicitly
  **not** in scope: FR-2 (injuries), FR-3 (collisions, dashed + inline-labelled), FR-4 (% change),
  FR-9 (caveats), FR-12 (casualty-filtered repair), FR-13 (policy-date reference markers), and the
  whole severable FR-5–7 arrest group. FR-8's query disclosure and FR-10/FR-11's empty and error
  states are Task 1's and must survive this task byte-for-byte in behavior.

- **Inputs/Outputs**:

  - *Input*: a clean tree with Task 1 merged; `SOCRATA_APP_TOKEN` in a gitignored `.env`.

  - *Step 0, before anything else* (Amendment 3(b), binding): run and record `node -v` and
    `npm -v`. `node -v` must satisfy `engines.node` (`>=22.22.2`); on this machine that is
    `v22.23.2`. If it prints a v20, halt and re-enter through a fresh shell in the project root.
    Then, **before installing anything**, run and record:
    - `npm view recharts version` — the current 3.x release.
    - `npm view recharts engines` — its `node` range must admit the recorded `node -v`.
    - `npm view recharts peerDependencies` — its `react` range must admit `react@19.2.8`.

    The scaffold SPEC's Amendment 1 table discharged `recharts@^3` (3.10.1, `engines.node >= 18`)
    on 2026-08-04. That was two days and an unknown number of releases ago, and a pre-authorization
    is not a substitute for a fact. **Re-verify; do not cite the old table as evidence.** If either
    range excludes this platform, **halt and request a revised `[SPEC]`** — a dependency that does
    not fit the platform is Cedar's problem under Rule 9, not something to work around locally.

  - *Output 1 — `src/components/DeathsChart.tsx`* (**new**, `'use client'`). Exports:

    ```ts
    import type { DeathsRow } from "../lib/deaths";

    export type DeathsChartProps = { rows: DeathsRow[] };

    export function DeathsChart({ rows }: DeathsChartProps): React.JSX.Element;
    ```

    One prop. Not optional, not nullable, no defaults, no boolean flags, no options object, no
    `className` passthrough, no width/height escape hatch. `rows` is the same array `page.tsx`
    already destructures for the table, so the chart and the table are provably plotting and
    listing the same objects — not two reads of one source that could drift.

    **The `import type` keyword is load-bearing, not stylistic.** `src/lib/deaths.ts` is the only
    module in the repo that reads `SOCRATA_APP_TOKEN`. A *value* import of it from a `'use client'`
    module would pull it into the client graph and ship the token read to every visitor — the exact
    NFR-2 failure `guard-data-integrity.sh` exists to catch, except the hook's check-2 only fires on
    a literal `process.env.*TOKEN` in the client file itself and would **not** catch this. A
    type-only import is erased at compile time and cannot. See Constraint 1 for the grep that does
    catch it.

    Rendered structure (this is the contract; the JSX shape is Magnolia's):

    ```html
    <figure class="figure">
      <div class="plot" role="img"
           aria-label="Line chart of NYC traffic deaths per year from 2018 to 2025.">
        <!-- ResponsiveContainer > LineChart > CartesianGrid, XAxis, YAxis, Line -->
      </div>
      <figcaption class="caption">
        NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the table below.
      </figcaption>
    </figure>
    ```

  - *Output 2 — `src/components/DeathsChart.module.css`* (**new**). Owns **every colour value in
    this task.** `DeathsChart.tsx` contains no colour literal at all — see Constraint 4. Tokens,
    with the light value first and the `prefers-color-scheme: dark` value second, scoped to
    `.figure` and mirroring the pattern `globals.css` already uses:

    | Token | Light | Dark | Role (dataviz) |
    |---|---|---|---|
    | `--chart-series-1` | `#2a78d6` | `#3987e5` | categorical slot 1 — the deaths line and its markers |
    | `--chart-grid` | `#e1e0d9` | `#2c2c2a` | hairline gridline, one step off surface |
    | `--chart-rule` | `#c3c2b7` | `#383835` | axis line |
    | `--chart-ink` | `#52514e` | `#c3c2b7` | secondary ink — axis ticks, the "Deaths" label, the end label |

    The marker's 2px ring uses **`var(--background)`**, the token `globals.css` already defines
    (`#ffffff` / `#0a0a0a`) — the chart's surface *is* the page's surface, so the ring is defined
    against the real thing rather than a second near-white that would show as a seam.

  - *Output 3 — `src/app/page.tsx`* (**edited, minimally**). Exactly two changes:
    1. `import { DeathsChart } from "../components/DeathsChart";`
    2. `<DeathsChart rows={result.rows} />` rendered **only** in the `result.status === "ok"`
       branch, **immediately above the existing `<table>`** — the insertion seam Task 1 left after
       the intro `<p>`.

    Nothing else moves. The `<h1>`, the intro paragraph, the `<table>` and its caption and headers,
    the `role="status"` empty message, the `role="alert"` error message, and the `<details>` FR-8
    disclosure are all untouched, so every assertion in the existing `src/app/page.test.tsx`
    continues to describe live behavior. `page.tsx` gains no `className`, no CSS-module import, and
    no `'use client'` directive — it stays a Server Component with zero styling, exactly as Task 1
    specified. **This is why the `<figure>` lives inside the component and not on the page:** the
    caption and layout are the chart's concern, they need the chart's stylesheet, and putting them
    in `page.tsx` would drag a CSS-module import into a file that has deliberately never had one.

  - *Acceptance, by command, with `node -v` recorded beside every result*:
    1. Step 0's four `npm view` / version recordings, above.
    2. `npm install recharts@^3` (or the exact 3.x pinned by Step 0). Then `npm ls recharts` —
       record it; expect one deduped 3.x entry.
    3. `npm audit` — report anything high or critical. Do **not** run `audit fix --force`.
    4. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    5. From the `npm run build` output, **record `/`'s First Load JS**. No threshold is set here
       and none may be invented: the number is evidence for the deploy SPEC's NFR-1 check, which
       owns the budget. Report it; do not react to it.
    6. `npm run dev`, then load `/` and look at it — in light mode and in dark mode (OS setting),
       at a desktop width and at a 320px width. Confirm: the line renders, the y-axis starts at 0,
       all eight markers are visible, the end label is not clipped, no horizontal scrollbar
       appears, and both modes are legible. The `dataviz` procedure's step 7 is "render it and look
       at it"; the validator checks colour, not layout. Then `git checkout -- CLAUDE.md` and
       confirm `git status` is clean for that path.
    7. **Palette validation, recorded.** Load the bundled `dataviz` skill, note its base directory,
       and run its validator against **this project's actual surfaces**, both modes:
       - `node <dataviz-base>/scripts/validate_palette.js "#2a78d6" --mode light --surface "#ffffff"`
       - `node <dataviz-base>/scripts/validate_palette.js "#3987e5" --mode dark --surface "#0a0a0a"`

       Record the resolved path and the full output. If a flag name differs, run the script's
       `--help` and record what it actually accepts — the requirement is *the recorded output of
       the real tool*, not a particular command string. The skill's non-negotiable is "never
       eyeball whether a palette is safe — run the script"; Cedar's contrast arithmetic in §
       Intellectual Control is orientation only and is **not** the evidence. If a check FAILs, halt
       and request a revised `[SPEC]` with the failing output attached — do not re-pick a hue
       locally.
    8. **The no-authored-figure grep**, run by Magnolia on its own work and again by Cypress:
       `git grep -nE '(^|[^0-9.])(229|231|244|268|269|280|290|297)([^0-9]|$)' -- src ':!*test*'` →
       zero hits. See Constraint 3 for why this grep, and not the hook, is the net here.
    9. **The client-boundary greps**, all three expected empty:
       - `git grep -n 'process\.env' -- src/components` → no hits.
       - `git grep -n '@/' -- src/components src/app/page.tsx` → no hits.
       - `git grep -n 'lib/deaths' -- src/components` → exactly one hit, and it begins
         `import type`.

- **Query**: **none — this task issues no query and touches no query.** It adds no `fetch`, no
  dataset ID, no `$select`/`$where`/`$group`/`$order`, and no new Route Handler. Every figure it
  displays arrives as the `rows` prop, already produced by Task 1's pinned SoQL aggregation,
  already validated by `src/lib/deaths.ts`'s Zod schema and year-coverage check. `src/lib/deaths.ts`,
  `src/app/api/deaths/route.ts`, and `DEATHS_SOQL` are **read-only to this task** — Magnolia may
  not edit, extend, re-export, or "helpfully tidy" any of them. FR-8's disclosure already renders
  the query in all three states and needs nothing from this task.

- **Design Pattern**: **none — simple case.** Variance analysis per Rule 8: the fixed 2018–2025
  window and the dataset ID are stable, and the axis that genuinely varies — the *set of series*
  rendered — still has exactly one member today. A chart-type Strategy, a series registry, a
  `<Chart>`/`<Chart.Line>` compound component, or a config-object prop would each be an abstraction
  with one implementation, which is the unearned-pattern failure Rule 8 names. `composition-patterns`
  was consulted and its highest-priority rule is the one that decides the prop signature:
  `architecture-avoid-boolean-props` — hence a single `rows: DeathsRow[]`, not
  `{ data, showGrid, showLegend, variant }`. Its `patterns-explicit-variants` rule pre-answers the
  next question too: when FR-2's injuries series arrives, the answer is an explicit second
  component or an explicit `series` prop *introduced by that SPEC*, never a `showInjuries` boolean
  bolted onto this one. Task 1's Tipping Point already fixed where encapsulation is earned —
  *parameterize at two, encapsulate at three* — and pinned "three" to a third distinct **query
  shape**. This task adds **zero** query shapes, so it moves that counter not at all.

- **UI Scope**: **structural.** New DOM enters the page: a `<figure>`, a `role="img"` plot
  wrapper, a `<figcaption>`, and an SVG subtree that did not exist before. A new component and a
  new stylesheet are created. This is not a restyle of an existing layout, and Magnolia should not
  treat it as one — but it is also **bounded**: the only structural change to `page.tsx` is the
  single element inserted at the seam. Restyling the `<h1>`, the intro paragraph, the table, the
  error states, or the `<details>` disclosure is **out of scope** and would be a silent re-scope of
  a file Task 1 owns. Page-level layout and typography belong to a later SPEC.

- **Intellectual Control**:

  - *Why the chart takes `DeathsRow[]` and nothing else.* The alternative shapes each buy a
    problem. A config object (`{ data, height, colors }`) is the boolean-prop failure wearing a
    different hat: every future need becomes a new key, and the component's contract becomes
    unreadable without reading its body. Passing the whole `DeathsResult` union would force the
    chart to re-branch on `status`, duplicating the decision `page.tsx` already makes and creating
    a second place where the error state could be got wrong. Fetching its own data would be a
    client-side `fetch` — the token is server-side only, the Route Handler exists precisely so the
    page needn't do this, and it would ship a loading state, a second cache, and an error path for
    data the server already had in memory. `rows` is the narrowest thing that suffices, and it is
    serializable, which the server→client boundary requires.
  - *Why the figure and caption live in the component rather than the page.* Three reasons, in
    priority order. **Ownership:** the caption describes the chart, so it belongs with the chart,
    and the same stylesheet that themes the marks themes the caption. **Diff surface:** `page.tsx`'s
    change becomes an import and one element, so Task 1's existing tests keep testing what they
    were written to test instead of being rewritten around a restructure. **Boundary hygiene:** a
    CSS-module import in `page.tsx` would be the first styling that file has ever carried, against
    Task 1's explicit "Redwood must not open a stylesheet" line; keeping it out preserves a clean
    server/presentation split that a later layout SPEC can build on rather than unwind.
  - *Why the y-axis must start at zero, and why this is an integrity requirement and not taste.*
    The deaths series runs roughly 229–297 across eight years. On an auto-fitted axis those figures
    fill the plot and the line reads as a mountain range — a dramatic rise and a dramatic collapse.
    Zero-based, the same data reads as what it is: **essentially flat**. The product's entire thesis
    is that *deaths barely moved while recorded collisions fell 63%*; a truncated axis would have
    the flagship chart visually contradict the argument the page makes in prose, and would do it
    through a rendering default nobody chose. This is NFR-5 (honesty of presentation) expressed as
    geometry, and it is not negotiable at implementation time. The same reasoning forbids
    `type="monotone"`: a spline draws values *between* the yearly aggregates that no query produced,
    which is a language-model-free way of putting an invented figure on the page. `type="linear"`
    connects measured points and asserts nothing between them.
  - *Why no hover layer, when the `dataviz` skill ships one by default.* The skill's own stated
    rationale for the tooltip is that a reader must be able to get a value off the chart, and its
    own hard rule is "tooltips enhance, they never gate — every value a tooltip shows is also
    reachable without it." Here, **every** value is already reachable without it: eight rows sit in
    a permanent table directly below the figure, and the endpoint is directly labelled on the line.
    A tooltip would add a WCAG 2.2 §1.4.13 obligation (dismissible / hoverable / persistent), a
    keyboard-parity obligation, a themed tooltip surface in both modes (Recharts' default is a
    white box that is unreadable on the dark surface), and a cursor treatment — for zero
    information gain over the table. That is ceremony, and the walking-skeleton rule says build the
    thinnest slice that works. It stops being ceremony the moment a **second series** lands: with
    two lines and no per-point labels, "one tooltip, every series" becomes the only reasonable way
    to read a crossing, and the crosshair earns itself. That trigger is written into the Tipping
    Point so the deferral expires on a condition rather than on someone remembering.
  - *Why the chart is `role="img"` and the table stays the accessible representation.* An
    unlabelled `<svg>` is announced as nothing useful; Recharts' own `accessibilityLayer` is the
    other option and it takes `role="application"` plus a bespoke keyboard model, which would
    create a *second* accessible representation of the same eight numbers that could disagree with
    the table and would need its own AT testing to trust. One representation, tested, is worth more
    than two that might drift. So the plot wrapper carries `role="img"` and a short label that names
    the form and the window and deliberately **contains no figure at all** — a label reciting
    values would be a hand-maintained copy of the data, which is precisely the NFR-4 failure mode,
    and it would go stale the first time the feed revises. The `<figcaption>` then points explicitly
    at the table, so a screen-reader user reaches the numbers by following a stated route rather
    than by guessing that the table below is the same data.
  - *Why colour lives entirely in CSS and geometry entirely in props.* SVG presentation attributes
    do not resolve `var()`, so a hex passed as a Recharts prop cannot switch between light and dark.
    Splitting on that seam turns an annoyance into a rule with teeth: `DeathsChart.tsx` may contain
    **no colour literal**, which is a one-line grep, and every mode-dependent value therefore lives
    in one stylesheet where a reviewer can check contrast in a single place. It also draws the test
    boundary honestly — jsdom applies no CSS-module styles, so Cypress asserts what is genuinely
    assertable there (attributes, class names, structure, tick text) and colour is verified by the
    validator and by looking at the page, rather than by a test that only appears to check it.
  - *Why the test harness adapts to the component, and not the reverse.* jsdom has no
    `ResizeObserver` and reports zero-size elements, so `<ResponsiveContainer>` renders an empty
    chart there. The tempting fix is a `width`/`height` prop "for tests" — which is a
    production-visible escape hatch existing only to make a test pass, the first crack through
    which config props arrive. The harness is the right place to fix a harness limitation, so
    `vitest.setup.ts` stubs the observer and the dimensions (Cypress's file, Cypress's budget) and
    the component's contract stays clean.
  - *Why this will not break at scale.* The whole surface is one component with one prop, one
    stylesheet with four tokens, and a two-line mount. The chart cannot disagree with the table
    because they render the same array from the same render pass; it cannot disagree with the
    displayed SoQL because it never sees a query; and it cannot fabricate a figure because it
    performs no arithmetic — the only value it writes to the screen that the table doesn't is the
    end label, which is `rows[rows.length - 1].deaths` verbatim.

- **Constraints**:

  1. **The client boundary is absolute (NFR-2, Rule 3).** `src/components/DeathsChart.tsx` carries
     `'use client'` and must never read `process.env`, never import `src/lib/deaths.ts` as a value,
     and never receive a token by any route. The `DeathsRow` import is `import type` — the `type`
     keyword is required, not implied. `guard-data-integrity.sh` will **not** catch a value import
     here (its client check greps for `process.env.*TOKEN` in the file itself), so acceptance
     clause 9's three greps are the mechanism.
  2. **The query is frozen and is not this task's to touch** (Rule 4). No edit to
     `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, or `DEATHS_SOQL`. If the chart appears to
     need a differently shaped row, **halt and request a revised `[SPEC]`**; do not reshape the
     data in the component and do not add a transform step.
  3. **No figure may be authored, and the hook will not catch you here.**
     `guard-data-integrity.sh` pins 26 six-digit literals (collisions, injuries,
     casualty-filtered). The deaths values are three digits and are **deliberately absent** from
     that list, because a pattern matching them would fire on every ordinary small number —
     including `r={4}`, `strokeWidth={2}`, and `height={320}` in this very component. So for *this*
     task the mechanical net does not exist, exactly as it did not for Task 1. No deaths figure may
     appear anywhere in `src/**` outside test files — not as a fallback, a placeholder, a comment, a
     default, a `domain` bound, a tick array, or a "temporary" mock while the chart is wired up.
     Acceptance clause 8's grep is the net; run it before reporting, not after being asked.
  4. **`DeathsChart.tsx` contains no colour literal.** No `#rrggbb`, no `rgb()`, no named CSS
     colour, no `hsl()`. Colour-bearing props are either omitted (letting the stylesheet own them)
     or set to `"currentColor"`. Every hex in this task lives in `DeathsChart.module.css`.
     Mechanically checkable: `git grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|hsl\(' -- src/components/DeathsChart.tsx`
     → zero hits.
  5. **The dashed stroke is reserved and must not be spent here.** FR-3 assigns the
     dashed-stroke-plus-inline-label treatment to the **collisions** series, because that is the
     reporting-affected one. Deaths are the medical-examiner-mandated figure — the *least*
     discretionary series in the dataset and the reason it is the walking skeleton's metric. A
     dashed deaths line would mis-signal the product's central distinction before the collisions
     series even exists. The deaths line is **solid**, and Cypress asserts the absence of a dash
     pattern on it.
  6. **Zero-based y-axis, linear interpolation.** `domain={[0, "auto"]}` stated explicitly rather
     than inherited from a library default, and `type="linear"` on the `<Line>`. Neither may be
     changed to make the chart "more readable"; see Intellectual Control.
  7. **No animation at all.** `isAnimationActive={false}`. NFR-3 requires respecting
     `prefers-reduced-motion`; a chart with no motion satisfies that unconditionally and needs no
     media query, no state, and no branch. Entrance animation on a static historical aggregate is
     decoration, and it also makes the rendered DOM time-dependent, which makes tests flaky. Do not
     add a `@media (prefers-reduced-motion: reduce)` block for motion that does not exist.
  8. **Recharts' `accessibilityLayer` stays off.** See Intellectual Control; enabling it creates a
     second, untested accessible representation and a `role="application"` that fights the
     `role="img"` contract.
  9. **One new dependency: `recharts@^3`**, authorized here under Rule 9 because this is the first
     task with a chart to draw. Nothing else may be installed — not a Recharts plugin, not a colour
     library, not `clsx`, not a charting helper, not `vite-tsconfig-paths`. If something appears
     necessary, halt and request a revised `[SPEC]`.
  10. **Relative imports only** in both touched source files (standing clause above).
  11. **Files not to touch**: `src/lib/deaths.ts`, `src/app/api/deaths/route.ts`, any
      `*.test.ts(x)`, `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`,
      `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.module.css`,
      `.claude/**`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/**`, `SESSION_STATE.md`.
      `globals.css` is on that list deliberately: the four chart tokens have exactly one consumer
      today, and hoisting them to a global stylesheet before a second consumer exists is the same
      unearned-abstraction move Rule 8 rejects for patterns. The Tipping Point names when they move.
  12. **Performance is measured, not asserted (NFR-1).** Record `/`'s First Load JS from the build
      output. Do not add `next/dynamic`, a lazy boundary, a manual chunk split, or any other
      optimization on speculation — there is no measurement yet that justifies one, and the deploy
      SPEC owns the budget.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. **`npm audit` after install**; report high/critical, never `audit fix --force`.

- **Pinned rendered contract** (what Cypress asserts against the produced SVG — this, not a prop
  spelling, is the binding requirement):

  | Element | Pinned outcome |
  |---|---|
  | Line stroke | `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"` |
  | Line dash | **no** `stroke-dasharray`, or `0`/`none` — solid (Constraint 5) |
  | Line shape | straight segments between points (`type="linear"`); no spline |
  | Markers | one per row — `rows.length` of them, never a hardcoded 8 — radius ≥ 4 (≥8px across), `stroke-width="2"` for the surface ring |
  | Gridlines | horizontal only, 1px, solid, no dash pattern |
  | Y-axis | domain starts at 0; a `0` tick is rendered |
  | Y-axis label | the word **"Deaths"**, rendered **horizontally** with no rotation transform, near the top of the axis. Never `angle={-90}` — a rotated axis title is the least readable label on any chart, and the figcaption plus the table's `Deaths` column header already carry the unit |
  | X-axis | category scale over `year`; ticks `2018` and `2025` always present; interior ticks may be dropped by the library at narrow widths. Never a numeric scale — it invents fractional-year ticks like `2017.5` |
  | Direct label | **exactly one** value label, on the last point, positioned to its right, in `--chart-ink` (never the series colour — dataviz: text wears text tokens). Its text is `rows[rows.length - 1].deaths` verbatim: no `toLocaleString`, no separator, no rounding, no unit suffix |
  | Legend | **none.** dataviz is explicit that a single series needs no legend box — the caption already says what is plotted, and a one-swatch legend restates the title and costs space |
  | Tooltip / crosshair | **none** in this task (see Intellectual Control and the Tipping Point) |
  | Animation | none |
  | Container | `ResponsiveContainer` at `width="100%"`, `height={320}`; a fixed height reserves space so nothing shifts on hydration, and 320 includes the x-axis band rather than clipping it into a nested scroll |
  | Margin | right ≥ 48px so the end label has room and is never clipped; no `overflow: hidden` anywhere in the module |

  **Prop-name drift is Magnolia's to absorb, not to halt on.** The props implied above
  (`ResponsiveContainer`, `LineChart`, `CartesianGrid vertical={false}`, `XAxis dataKey="year"`,
  `YAxis domain={[0,"auto"]}`, `Line type="linear" dataKey="deaths" strokeWidth={2}
  isAnimationActive={false}`, a `dot` config carrying `r` and `strokeWidth`, and a custom label
  renderer that returns content only at the last index) are Cedar's intended means. If a name or
  signature differs in the installed `recharts@3.x`, use the equivalent that produces the **pinned
  rendered outcome** and record the substitution in the `[COMPLETION-REPORT]`. Rule 4's freeze
  covers queries, not library call signatures, so this needs no revision cycle. What *does* require
  a halt: an outcome in the table above that cannot be produced at all.

- **Deliberate deviations from the `dataviz` skill** (named here so they are decisions on the
  record, not drift):

  1. **No hover/tooltip layer**, which the skill ships by default on line charts. Argued in
     Intellectual Control; expires at the second series (Tipping Point).
  2. **Axis and label ink is the secondary step (`#52514e` / `#c3c2b7`), not the muted step
     (`#898781`).** The muted step measures roughly 3:1 against this project's surfaces, which is
     fine for chrome but short of WCAG 2.2 AA's 4.5:1 for text — and axis ticks are text. `axe-core`
     historically does not evaluate contrast inside SVG, so this would have passed the mechanical
     gate while failing the standard NFR-3 names. Where the project's own floor is stricter than a
     skill default, the floor wins.
  3. **The chart surface is the page background (`#ffffff` / `#0a0a0a`), not the skill's reference
     surfaces (`#fcfcfb` / `#1a1a19`).** This page has one plane; inserting a card surface *darker*
     than the page in light mode would invert the relationship the reference intends. `palette.md`'s
     own instruction covers this — "when you swap in your own palette, re-run against your own
     surfaces" — which is exactly what acceptance clause 7 does.

  Not deviations, recorded so they are not mistaken for oversights: no legend (the skill's rule for
  a single series), no texture (opt-in only), no stat tile (FR-1 is a time series over eight years —
  the form heuristic was checked in Task 1 and re-checked here, and the answer is still a line
  chart).

- **Edge Cases**:

  1. **`result.status` is `"empty"` or `"error"`** → the chart does not render **at all**. No empty
     axes, no zero baseline, no "no data" placeholder inside a `<figure>`, no skeleton. An axis
     drawn with no line is indistinguishable at a glance from a series that fell to nothing, which
     is the fabricated-safety-improvement failure in visual form. Task 1's `role="status"` and
     `role="alert"` messages remain the entire response, unchanged.
  2. **jsdom has no `ResizeObserver` and reports zero-size elements**, so `<ResponsiveContainer>`
     renders nothing under Vitest and every SVG assertion would vacuously fail. This is the
     equivalent of Task 1's Edge Case 10 arriving for the UI layer. Sanctioned resolution, in
     **Cypress's** budget and file (`vitest.setup.ts`, already enumerated as Cypress's): stub
     `globalThis.ResizeObserver` and override the element-dimension getters to a fixed plot size.
     Sanctioned fallback if that proves insufficient after one honest attempt: `vi.mock("recharts",
     …)` replacing **only** `ResponsiveContainer` with a fixed-size passthrough, leaving every other
     export real so the inner assertions stay genuine. **Not sanctioned:** adding width/height props
     to the component, or downgrading the assertions to "a `<figure>` exists".
  3. **A hydration warning or an SSR mismatch from `ResponsiveContainer`** (it cannot know a width
     on the server). If one appears, the sanctioned lever is Recharts' `initialDimension` on the
     container — recorded in the `[COMPLETION-REPORT]`. Not sanctioned: `next/dynamic` with `ssr:
     false`, which trades a warning for a layout shift and a blank frame, against NFR-1.
  4. **A row with `deaths: 0`.** Legal, and must render as a point on the baseline. Never filtered,
     never treated as missing, never made to look like an absent year. (Task 1's validator makes an
     *absent* year impossible to reach the chart — that path ends in the error state — but a genuine
     zero is data.)
  5. **`rows` in an unexpected order, or a length other than 8.** The chart renders `rows` in the
     order given and plots `rows.length` markers. It does **not** sort, re-sort, slice, pad, or
     assert a count — `src/lib/deaths.ts` already guarantees exactly eight ascending years, and
     duplicating that guarantee in the view creates a second place for it to be wrong. Concretely:
     no `EXPECTED_YEARS` array, no `.sort()`, no `.filter()`, no `.slice()` in this component.
  6. **Very narrow viewport (320px).** `ResponsiveContainer` at `width="100%"` with `min-width: 0`
     on the plot wrapper. The library may drop interior x-ticks; that is acceptable because the
     table lists every year. What is **not** acceptable: a clipped end label, a horizontal
     scrollbar, or `overflow: hidden` used to hide either (an anti-pattern the skill names
     explicitly — it crops characters and is worse than no label). Verified by eye in acceptance
     clause 6, not by assumption.
  7. **Dark mode.** Driven by `prefers-color-scheme` only, mirroring `globals.css`. This project
     has no theme toggle, so `palette.md`'s dual-scope `[data-theme]` guidance does not apply and a
     toggle must not be invented to match it.
  8. **`recharts@3.x` fails Step 0's engine or peer check** → halt, request a revised `[SPEC]`. Do
     not install with `--force` or `--legacy-peer-deps`.
  9. **`CLAUDE.md` is dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`. Expected, not a
     defect; never committed, never "fixed" at the source.
  10. **The live 2025 figure has moved from the pinned 229.** Not this task's concern to adjudicate
      and absolutely not this task's to correct — the chart plots what it is handed. If it is
      noticed, report it as a finding; `/verify-figures` is the mechanism and PRD §7 names the
      two-year-average fallback as the response.

- **Files** (max 5 — five used):

  1. **`package.json`** — add `recharts@^3` to `dependencies` (production: it renders the page).
     No new scripts; the count stays 7 against the 8-script tipping point.
  2. **`package-lock.json`** — install artifact; committed, per the scaffold SPEC.
  3. **`src/components/DeathsChart.tsx`** — *new.* `'use client'`; the `DeathsChartProps` type,
     the `<figure>`/`role="img"`/`<figcaption>` structure, the Recharts composition, and the
     last-point-only label renderer. Earns its own file because Recharts is client-only and
     `page.tsx` must stay a Server Component — this is the client boundary, and it is the only one.
  4. **`src/components/DeathsChart.module.css`** — *new.* The four tokens in both modes, the mark
     and text colours, and the figure's layout. Earns its own file because SVG presentation
     attributes cannot resolve `var()`, so mode-dependent colour has nowhere else to live; and
     co-locating it with the component (rather than extending `page.module.css` or `globals.css`)
     keeps the chart's theme in the chart's own scope until a second consumer exists.
  5. **`src/app/page.tsx`** — *edited.* One import, one element, inside the existing `ok` branch.
     Nothing else in the file changes.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger (this SPEC does not touch that file), and `src/app/page.module.css`.

  **On `page.module.css`, the decision this SPEC was asked to make.** Three options were weighed.
  *Repurpose it as the chart's stylesheet* — rejected: it is `src/app/page.module.css`, a
  page-scoped module, and the chart lives in `src/components/`; a component's styles belong beside
  the component, and the file's actual contents (`.ctas`, `.logo`, button hover states,
  `--font-geist-*` bindings) are scaffold furniture for a page that no longer exists, so
  "repurposing" means deleting 150 lines and writing new ones in a file with a misleading name.
  *Delete it* — rejected on budget: the deletion is the sixth file, and the **7th-file test**
  (which applies to any file beyond a sized budget) fails on limb (i): the orphan causes no failure
  that deletion is the only thing to catch. It is dead CSS that no bundle ships, because nothing
  imports it. *Leave it orphaned* — adopted, with the difference from Task 1 being that it is no
  longer deferred to an unnamed future: it is now in § Carried forward with an owner (the next SPEC
  that touches page-level layout) and a Cypress flag if that SPEC lands without it. A second silent
  inheritance would have been the drift ADR 0001 was written about.

  **If Magnolia believes a sixth file is required**, halt and request a revision naming (i) the
  specific failure the sixth file is the only thing that catches and (ii) which of the five cannot
  carry it.

- **Tipping Point**: this is one component, one prop, one stylesheet, and it stays reviewable
  while it is. Decompose or revise when **any one** trips:

  - **A second series lands (FR-2 injuries, or FR-3 collisions).** Three things become due in the
    same SPEC, and none of them may be retrofitted here in advance: a **legend** (dataviz: mandatory
    at ≥2 series, because identity must never rest on colour-matching alone), the **crosshair +
    tooltip** layer deferred above (with its §1.4.13 and keyboard-parity obligations), and FR-3's
    **dashed stroke plus inline "affected by reporting decline" label** on the collisions series
    specifically. That is also the moment the component stops being `DeathsChart`: it takes an
    explicit series list, gets renamed, and the four colour tokens move from the module to
    `globals.css` because they finally have two consumers.
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key). Inherited unchanged from Task 1: *parameterize at two, encapsulate
    at three* — that is where a Strategy or a small series registry is finally earned. This task
    moves the counter by zero.
  - **`DeathsChart.tsx` exceeds ~130 lines, or its custom label renderer grows a second case** (e.g.
    also labelling the extreme). Split the label renderer and the axis configuration into their own
    module then; a chart component that is mostly renderer callbacks has stopped being readable as
    a chart.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section, or exceeds ~150
    lines.** Inherited from Task 1: decompose into components, and re-read `ARCHITECTURE.md`'s
    revisit trigger in CLAUDE.md § Project Layout at the same time.
  - **A measured performance problem** — a real Lighthouse or Slow-4G number from the deploy SPEC,
    not a hunch about bundle size. `next/dynamic` around the chart is the documented lever, and it
    is to be pulled *after* a measurement, never before.
  - **A second component needs the chart tokens.** Hoist them to `globals.css` in that SPEC. Not
    before — one consumer is not a design system.

**Ordering** (standard `[SPEC]`, no override): **Cypress writes failing tests first**, then
Magnolia implements, then Cypress audits and emits the `[COMPLIANCE-REPORT]`. Cypress's own budget
— not Magnolia's five — covers `src/components/DeathsChart.test.tsx` (new), edits to
`src/app/page.test.tsx`, and the `vitest.setup.ts` jsdom stubs from Edge Case 2. Cypress installs
nothing; `package.json` is Magnolia's file, so Cypress's first run will fail on an unresolved
`recharts` import, which is the correct red.

**Test guidance for Cypress** (behavioral, per Rule 4 — assert the rendered output, not Recharts'
internals). Use an obviously synthetic 8-row fixture (`11, 22, 33 … 88`), **never** PRD Appendix
A's real deaths column: a passing test must never be confusable with evidence that the live data is
correct. Assertions worth writing:

- On `ok`: a `<figure>` exists; its `<figcaption>` names the window and points at the table; the
  plot wrapper exposes `role="img"` with a non-empty accessible name containing no digits other
  than the window years.
- Exactly `rows.length` data markers render (drive it off the fixture's length, not the literal
  8), each with radius ≥ 4 and a 2px ring.
- The series path carries `stroke-width="2"`, round cap and join, and **no** dash pattern.
- The y-axis renders a `0` tick — the zero-baseline assertion, which is the single most important
  test in this file.
- The x-axis renders `2018` and `2025`.
- Exactly one direct value label exists, its text equals the fixture's last `deaths` value (`88`)
  with no formatting applied, and it is not inside the y-axis tick group.
- A horizontal `Deaths` label exists with no rotation transform.
- The curve's `d` attribute is non-empty on the first synchronous render (no entrance animation).
- `axe-core` over the rendered `<figure>` → zero violations; and the existing whole-page axe
  assertion still passes with the chart mounted.
- On `empty` and on `error`: no `<figure>`, no `<svg>`, and Task 1's existing message and FR-8
  disclosure assertions still hold.
- Source-level greps (they are tests too, and they are the only net for three of the constraints):
  no colour literal in `DeathsChart.tsx`; no `process.env` under `src/components`; no `@/` import
  in either touched file; the sole `lib/deaths` reference under `src/components` is an `import
  type`; and the eight real deaths figures appear nowhere in non-test `src/**`.

**Background/reference resources (Constraint of Three)**. Two **skill loads** are mandatory and are
not reference items: **`mvcc-data`** (CLAUDE.md requires it before any chart that displays a figure
— trap 1 and the string-typing rule are what Task 1's validator implements upstream of this
component) and **`dataviz`** (required before the first line of chart code;
`references/marks-and-anatomy.md`, `references/palette.md`, and `references/anti-patterns.md` are
the three files that decide the mark spec, the hexes, and the failure catalog). The `dataviz` skill
is bundled, not vendored in this repo — there is no `.claude/skills/dataviz/` here, so its
validator's absolute path is session-dependent; record the resolved path when you run it. The
three reference items are:

1. `ARCHIVED_SPECS.md`, Task 1's `[SPEC]` — specifically its Constraint 2 (why the integrity hook
   does not cover three-digit deaths figures), its Constraint 9 (the `page.module.css` orphan
   decision this SPEC now closes), and its Tipping Point (which this task inherits unchanged).
2. `src/app/page.tsx` and `src/lib/deaths.ts` — the insertion seam, the `ok`/`empty`/`error`
   branches that must survive untouched, and the `DeathsRow` type. Read both; edit only the first,
   and only as specified.
3. `.claude/hooks/guard-data-integrity.sh` — what is mechanically caught (a `NEXT_PUBLIC_*` token
   name; `process.env.*TOKEN` inside a `'use client'` file; 26 six-digit pinned literals) and, more
   importantly, what is not (a value import of the token-reading module; any three-digit deaths
   figure).

## [FORCES]

1. **An honest axis > a dramatic one** — zero-based y, linear interpolation, no smoothing. The
   flagship chart of a data-integrity product may not owe its shape to a rendering default.
2. **An always-present accessible table > a toggle that hides one** — NFR-3 asks that the data *be
   available*, and unconditional availability is strictly stronger than availability behind a
   control. Nothing is built to satisfy a mental model the requirement does not contain.
3. **A pinned rendered contract > a pinned prop spelling** — Cypress asserts SVG attributes, so the
   requirement survives a library API Cedar cannot verify from here, and the test proves geometry
   rather than existence.
4. **The harness adapts to the component > a test-only prop on the component** — jsdom's missing
   `ResizeObserver` is fixed in `vitest.setup.ts`, never with a width prop that would live in
   production forever.
5. **One representation of the data, tested > two that might disagree** — the table is the
   accessible representation; the chart is `role="img"` with a label that recites no figures.
6. **Simplicity > Pattern purity.**

---

## What comes after this task

Not declared, not scoped, and deliberately not sketched here — Task 1's sketch of Task 2 had to be
rewritten from scratch two days later, which is the argument against pre-declaring the next one.
The open P0 work is FR-2 (injuries), FR-3 (collisions with the dashed + inline-label treatment),
FR-4 (% change per metric), FR-12 (the casualty-filtered repaired series), and FR-9 (caveats). FR-3
and FR-12 carry the product's actual thesis, and FR-3 is the first task that will trip this SPEC's
Tipping Point on all three counts at once.
