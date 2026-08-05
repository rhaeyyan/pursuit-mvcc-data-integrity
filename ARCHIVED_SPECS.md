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
