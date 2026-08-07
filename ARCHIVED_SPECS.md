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

---

## Archived 2026-08-06 — Correct the falsified "synthetic fallback total" mitigation (COMPLETE)

**Outcome:** Redwood executed (Redwood-first ordering, per this SPEC's own deviation), Cypress
audited after. 5 of 5 budgeted files: new `.claude/scripts/subtotal-gap.py` (a checker per
Cedar's 2026-08-06 revision — pins `PINNED_GAPS`, exits 1 on drift, mirrors
`verify-figures.py`'s exit-code contract) and new `docs/adr/0002-no-synthetic-subtotal-
fallback.md`; edits to `docs/nyc-collision-analytics-deep-research.md` (3 sites),
`docs/nyc-collision-reporting-drift.md` (1 site), `.claude/skills/mvcc-data/SKILL.md` (trap 1
clause + six subgroup fields, flagged non-reconciling). Baseline run: exit 0, all 16 cells
(8 years × deaths/injuries) matched the pinned table with zero drift. Detector proof verified
**twice independently** — Redwood mutated the 2022 deaths cell, Cypress independently mutated
the 2023 injuries cell — both correctly produced exit 1 naming the exact drifted cell, and
both reverts restored exit 0. `ruff check` clean; citations hook clean (with the orchestrator
and Cypress both independently verifying, by direct filesystem resolution, the 5 `ADR 0002`
links in the three files the hook's normative-doc scan doesn't cover); residual-mention grep
shows exactly one hit, the corrected text itself. Cypress PASS, one non-blocking nitpick (the
SKILL.md trap-1 clause is two sentences where the SPEC asked for one — content correct).
Commits: `da35ab6` (Redwood's execution) → `a0f2c27` (ledger) → this archival.

# Active SPEC

**Status:** approved — ready to dispatch to Redwood
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-05 · **Revised:** 2026-08-06 (see below) ·
**Moved into `SPEC.md` verbatim:** 2026-08-06 (Task 2 closed, per the now-deleted `SPEC-QUEUED.md`'s
protocol) · **Revision human-approved (HITL):** 2026-08-06, Rayan
**Then:** Redwood (execution) → Cypress (audit)
**Ordering:** deviates from Cypress-first by design; rationale is in the SPEC's § Ordering

## Revision history

**2026-08-06 — revision applied, RESOLVED.** A human-approved review on 2026-08-05 flagged one
substantive gap: `.claude/scripts/subtotal-gap.py` was specced as a *reporter* (prints a table,
exits 0) even though the SPEC names `verify-figures.py` — a *checker* (pins `PINNED` values in the
file, exits 1 on drift) — as the style to copy. The cost landed on this SPEC's own Tipping Point,
"the gap closes, or extends backward before 2021," which as a reporter had no mechanical detector —
a human would have to run the script, open ADR 0002, and eyeball-compare eight number pairs, the
same failure the script exists to eliminate one level up. Cedar (respawned cold, since its
authoring invocation was gone) revised **Output 1** and the **Acceptance** section below: the
script now pins `PINNED_GAPS` for both series and exits 1 on any moved cell, mirroring
`verify-figures.py`'s exit codes exactly (0 match / 1 drift / 2 fetch failure), and acceptance
clause 3 forces a mismatch, confirms exit 1, and reverts — a green run alone never proves a
detector detects. Two other flagged judgment calls were reviewed and **endorsed unchanged**: the
`mvcc-data/SKILL.md` edit's placement (the six subgroup fields flagged inline at the field list as
*breakdown fields that do not reconcile*, not appended as unflagged peers — a bare field list reads
as "safe to use," and separating the fields from the caveat would rebuild the exact
fields-here/warning-there split that caused the bug), and the Redwood-first ordering (precedent:
`.claude/scripts/` holds no test files, and `verify-figures.py` — 212 lines, live-network,
exit-code-bearing — shipped without any; a pre-written red test over prose corrections would invent
a convention this repo has already declined twice). Neither the file budget (still 5) nor NFR-4
(these are reference values in a verification script, the same role `PINNED` already plays, and
nothing renders them) were implicated by the revision.

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
    A **checker**, not a reporter — matches `verify-figures.py`'s house style and structure
    exactly, not merely its import list: **stdlib only** (`json`, `os`, `sys`,
    `urllib.request`/`error`/`parse`), `from __future__ import annotations`, a module-level
    `PINNED_GAPS: dict[str, dict[int, int]]` literal holding both tables from the § Query section
    below (`deaths` and `injuries`, 2018–2025 — the exact numbers already pinned there,
    transcribed once and never re-derived), token read from
    `os.environ.get("SOCRATA_APP_TOKEN")` with an anonymous-but-rate-limited fallback and a
    `note:` line on stderr, `def main() -> int`. **No new pip dependency is authorized and none is
    needed** — do not introduce `requests`. For each series and year the script computes the live
    gap (`authoritative_total − subgroup_sum`) from one query, then diffs it against
    `PINNED_GAPS[series][year]` and prints a per-year, per-series status table (`ok` / `DRIFT` /
    `ABSENT`) — the same shape `verify-figures.py` prints, not a bare unlabeled table. **Exit
    codes mirror `verify-figures.py` exactly**: `0` — every cell matches; `1` — at least one cell
    drifted (the script names the series, the year, and the signed delta, e.g.
    `deaths 2022: pinned 20, live 23 (+3)`) or any queried key is absent from the response for a
    year that should have one (the script must itself obey trap 1 rather than printing a gap of 0
    for a missing field — a silent 0 here would be the same failure one level up, which is also
    why ABSENT is folded into the same non-zero exit as DRIFT rather than treated as a pass);
    `2` — the fetch itself failed (network/HTTP/timeout), raised before any comparison is
    attempted, exactly as `verify-figures.py`'s `fetch()` does with `SystemExit(2)`.

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

- **Acceptance, by command** (Redwood runs each and records output; Cypress re-runs 2, 3, 5, and 6):

  1. `./.claude/hooks/check-citations.sh` **before** any edit — baseline recorded (Step 0).
  2. `python3 .claude/scripts/subtotal-gap.py` on the unedited script — exit code `0` recorded,
     full stdout recorded, every row's status `ok`, matching the expected table above. Any other
     exit code here is a **finding** under Edge Case 1: halt and report, write nothing to the docs.
  3. **Detector proof — mandatory, not optional.** Temporarily edit exactly one cell of
     `PINNED_GAPS` in the script (e.g. add `1` to the 2022 deaths entry), re-run, and confirm (a)
     the exit code is `1` and (b) stdout names the mutated series, year, and signed delta. Then
     **revert the edit** and re-run once more, confirming exit `0` is restored before proceeding.
     A green run alone never proves a detector detects — this step is what proves it.
  4. `ruff check .claude/scripts/subtotal-gap.py` exits 0 (or the `post-edit-lint.sh` equivalent
     already applied cleanly).
  5. `./.claude/hooks/check-citations.sh` **after** — no failure that is not in the Step 0
     baseline. Confirms both new ADR links resolve.
  6. **The residual-mention grep**, expected to return only intentional, corrected text:
     `git grep -nEi 'synthetic (fallback|total)' -- docs .claude` → every remaining hit is either
     inside ADR 0002 or is a correction explicitly naming the remedy as falsified. **Zero hits that
     still recommend it.**
  7. `git grep -n 'number_of_pedestrians_killed' -- src` → **zero hits** (proves the correction did
     not leak the subgroup fields into product code).
  8. Confirm `git status` shows exactly the five files, and that none of Constraint 5's Task 2
     paths appear.

- **Background/reference resources (Constraint of Three)**:
  1. `docs/adr/0001-preserve-reasoning-when-condensing.md` — the structural template for 0002, and
     the standing argument for why the *why* is the payload.
  2. `.claude/scripts/verify-figures.py` — the house style the new script copies: stdlib-only
     imports, token-optional fetch, `main() -> int`, `PINNED`-dict-plus-exit-code shape.
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
3. **A re-runnable, self-checking script > a re-derivable number** — the finding is a difference,
   and a model performing that subtraction to refresh a normative doc, or a human eyeballing eight
   cells against stdout, is the same NFR-4 failure one level up.
4. **Preserving why the remedy is wrong > recording that it is wrong** — "rejected" without its
   reasoning is the exact archive failure ADR 0001 was written about.
5. **Three claims kept distinct > one tidy status line** — symptom confirmed, cause unconfirmed,
   remedy falsified; collapsing them would trade one error for another.
6. **Simplicity > Pattern purity.**
```

---

## Archived 2026-08-06 — Injuries per year: parameterize the data layer (FR-2) (COMPLETE)

**Outcome:** 5 of 5 budgeted files. New `src/lib/socrata.ts` (generic yearly-metric
transport), `src/lib/injuries.ts`, `src/app/api/injuries/route.ts`; `src/lib/deaths.ts`
reduced from 219 to 36 lines (thin wrapper, byte-identical `DEATHS_SOQL`, structurally
unchanged `DeathsRow`/`DeathsResult`); `src/app/page.tsx` fetches both metrics via
`Promise.all`, renders them as fully independent branches. Cypress PASS: 104/104 tests,
typecheck/lint/build all exit 0, `git diff --stat` on `deaths.test.ts`/deaths route test/
the three `DeathsChart` files all empty (zero changes — the refactor is provably invisible
to existing consumers), live figures on both endpoints match the pinned table exactly with
zero drift. Two self-reported findings from Redwood, both independently investigated and
judged non-blocking by Cypress: `socrata.ts` (252 raw/194 non-comment lines) already trips
its own SPEC's ~120-line Tipping Point — read cover-to-cover and judged inherent to the
10-branch validation pipeline it generalized, not duplication; and acceptance clause 7's
literal wording ("token name in exactly one file") conflated the env-var name with an
actual read of it — NFR-2 is substantively satisfied (`process.env.SOCRATA_APP_TOKEN` reads
in exactly one file), Cypress recommends Cedar reword the clause in future SPECs.
Commits: `c4e8602` (SPEC) → `c973beb` (Phase B tests) → `7e35715` (implementation).

# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why this task, not FR-3 (Cedar's own reasoning, recorded)

The open P0 backlog after the walking skeleton and the subgroup-sum correction is FR-2 (injuries),
FR-3 (collisions, dashed + inline-label), FR-4 (% change), FR-9 (caveats), FR-12 (casualty-filtered
repair). FR-3 and FR-12 carry the product's actual thesis, and Task 2's own SPEC flagged FR-3 as
the task expected to trip the chart's Tipping Point on three counts at once (legend, tooltip,
dashed stroke). Cedar picked **FR-2 instead** for two reasons: FR-3's text requires the dashed-
stroke chart treatment, so it cannot be a Redwood-only data slice the way FR-1 was — it inherently
bundles a data task and a Magnolia chart-redesign task, and combining them into one SPEC was
explicitly ruled out. More load-bearing: **Task 1's own Tipping Point pre-committed to this exact
trigger** — "a second series (FR-2 injuries) → parameterize the fetch; a second Route Handler →
extract `src/lib/socrata.ts`." Executing that named refactor now, with injuries as the second
caller, is smaller and lower-risk than jumping straight to FR-3, which would force the query-layer
parameterization, the chart's Tipping-Point redesign, and the dashed-stroke design decision into
one shot. FR-3, FR-4 (needs all three metrics), FR-9, and FR-12 remain open backlog, explicitly out
of scope here.

---

```markdown
[SPEC] — Injuries per year: parameterize the data layer for a second series (FR-2)

- **Objective**: Add total persons injured per year (2018–2025) as a second, independently-fetched
  live SoQL aggregate, rendered on `/` as its own accessible table + FR-8 query disclosure —
  mirroring Task 1's exact shape for a new metric. In the same task, execute the refactor Task 1's
  own Tipping Point pre-committed to for this exact moment: extract the shared Socrata transport
  (token, headers, timeout, cache policy, content-type/array guards) into `src/lib/socrata.ts`, and
  parameterize the per-metric fetch on the `$select` aggregate expression and field alias, so
  `deaths.ts` and the new `injuries.ts` are both thin callers of one generic function rather than
  two copy-pasted modules. No chart change: `DeathsChart.tsx`, its stylesheet, and its test are
  untouched. Redwood only — no Magnolia work in this task.

- **Requirement**: **FR-2 [P0]** (injuries per year, `sum(number_of_persons_injured)` grouped by
  `date_extract_y(crash_date)`) — the one new metric in scope; its literal text asks only that the
  system "display" the figure, which a table satisfies, exactly as FR-1's literal text was already
  satisfied by Task 1 before Task 2's chart existed. Also satisfies **FR-8 [P0]** (display the exact
  SoQL, extended to a second, independently-pinned query), **FR-10 [P0]** (defined empty/error state,
  now required independently per metric), **FR-11 [P0]** (absent/null core aggregate → error, never
  a silent zero — trap 1 applies to `number_of_persons_injured` exactly as it does to
  `number_of_persons_killed`), **NFR-1** (ISR caching, inherited via the shared transport layer, and
  strengthened by parallel fetching — see Constraints), **NFR-2** (token read server-side only — this
  task *narrows* the token's reading surface from one file to one, by consolidating both metrics'
  transport into `socrata.ts`), **NFR-3** (a second screen-reader-accessible table), **NFR-4** (every
  figure from SoQL aggregation, no exception).
  Explicitly **not** in scope: **FR-3** (collisions, dashed + labelled — needs a Redwood data task
  *and* a Magnolia chart task; deliberately not combined here), **FR-4** (% change — its text asks
  for "each of the three metrics," so it stays blocked until collisions exists too), **FR-9**
  (caveats), **FR-12** (casualty-filtered repair — needs FR-3's raw collisions series to compare
  against), **FR-13**, and the severable FR-5–7 arrest group. Also **not** in scope: adding injuries
  as `DeathsChart`'s second line — that is the deliberately deferred Magnolia follow-on, and is what
  will trip Task 2's chart Tipping Point (legend, crosshair/tooltip, rename), not this task.

- **Inputs/Outputs**:
  - *Input*: a clean tree with Tasks 1–2 and the subgroup-sum correction merged; `SOCRATA_APP_TOKEN`
    in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must satisfy
    `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/lib/socrata.ts`* (new; server-only by construction; never imported by a
    `'use client'` module). Cedar's intended shape — implementation-detail flexibility is Redwood's
    to absorb, the pinned contract is listed below:
    ```ts
    export type YearlyMetricRow<K extends string> = { year: number } & Record<K, number>;

    export type YearlyMetricResult<K extends string> =
      | { status: "ok"; soql: string; rows: YearlyMetricRow<K>[] }
      | { status: "empty"; soql: string }
      | { status: "error"; soql: string; kind: "upstream" | "contract"; reason: string };

    export function buildYearlySoql(aggregateExpr: string, fieldAlias: string): string;
    export function buildYearlyUrl(aggregateExpr: string, fieldAlias: string): URL;
    export function fetchYearlyMetric<K extends string>(
      aggregateExpr: string,
      fieldAlias: K,
    ): Promise<YearlyMetricResult<K>>;
    ```
    `fetchYearlyMetric` takes **only** `aggregateExpr` and `fieldAlias` as parameters. The
    `$where`/`$group`/`$order` clauses (the fixed 2018–2025 window, `date_extract_y(crash_date)`,
    `year`) are **fixed internal constants inside this module, not parameters** — do not add a
    `whereClause` or `groupClause` parameter. That generality is unearned until a *third distinct
    query shape* arrives (FR-12's extra `$where`, or FR-6's group-key change); this task moves the
    "parameterize at two, encapsulate at three" counter to exactly two, no further. It performs: token
    read + header assembly (warn, don't fail, if absent — Edge Case 8), `fetch` with
    `AbortSignal.timeout(10_000)` and `next: { revalidate: 86400 }`, non-2xx → `error`/`upstream`
    naming the status code, content-type guard → `error`/`upstream`, safe JSON parse →
    `error`/`upstream`, array-shape guard → `error`/`contract`, zero-length → `status: "empty"`,
    per-row Zod validation against `{ year: string|number, [fieldAlias]: /^\d+$/ }` → `error`/
    `contract` naming the year and offending value's type (Trap 1: never coerce absence/null/non-match
    to 0), the same exact-8-year / no-duplicate / no-out-of-window coverage validator Task 1 built
    (ported, generic over `fieldAlias`), and ascending sort by year. If a fully generic Zod schema
    with a computed key proves awkward under strict TypeScript, the sanctioned fallback is: the
    function validates against a neutral `{ year, value }` shape internally and the per-metric caller
    (below) does a one-line `rows.map(r => ({ year: r.year, [fieldAlias]: r.value }))` rename. Either
    is acceptable; the outward `YearlyMetricRow<K>` shape is what's pinned.
  - *Output 2 — `src/lib/deaths.ts`* (edited, not replaced). Becomes a thin wrapper:
    `AGGREGATE_EXPR = "sum(number_of_persons_killed)"`, `FIELD_ALIAS = "deaths" as const`,
    `DEATHS_SOQL` and `buildDeathsUrl()` built by calling `buildYearlySoql`/`buildYearlyUrl` with
    those two constants, `DeathsRow`/`DeathsResult` as `YearlyMetricRow<"deaths">`/
    `YearlyMetricResult<"deaths">`, `fetchDeathsPerYear()` as a one-line call into
    `fetchYearlyMetric`. **`DEATHS_SOQL`'s string value must be byte-identical to today's** — this
    refactor changes *how* the string is built, never *what* it says (Rule 4: the freeze is on the
    query text, not the file's editability; this SPEC is Cedar's sanctioned exception to Task 2's
    "deaths.ts is read-only," which bound Magnolia only, not a future Redwood SPEC).
  - *Output 3 — `src/lib/injuries.ts`* (new). FR-2's twin of the above:
    `AGGREGATE_EXPR = "sum(number_of_persons_injured)"`, `FIELD_ALIAS = "injuries" as const`,
    exporting `INJURIES_SOQL`, `buildInjuriesUrl()`, `InjuriesRow`, `InjuriesResult`,
    `fetchInjuriesPerYear()`.
  - *Output 4 — `src/app/api/injuries/route.ts`* (new). `export async function GET()`, identical
    union-to-HTTP mapping as `api/deaths/route.ts`:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

  - *Output 5 — `src/app/page.tsx`* (edited). Fetch both metrics **in parallel**:
    `const [deathsResult, injuriesResult] = await Promise.all([fetchDeathsPerYear(), fetchInjuriesPerYear()])`
    — not sequential `await`s, per NFR-1. Below the existing deaths block (chart + table +
    disclosure, untouched), add an independent injuries block with the same three-branch shape
    (`ok` → `<table>` with `<caption>NYC traffic injuries per year, 2018–2025</caption>`,
    `<th scope="col">` Year/Injuries; `empty`/`error` → the same visible non-decorative message
    pattern) and its own `<details>` disclosure containing `INJURIES_SOQL`. **The two metrics'
    branches are fully independent** — deaths failing must never suppress or alter the injuries
    render, and vice versa (new edge case this task introduces; Task 1 never had two independent
    result unions on one page). Distinguish the two `<details>` summaries by text (e.g.
    `"SoQL query — deaths"` / `"SoQL query — injuries"`) so they're both reachable by accessible
    name; this changes the existing deaths disclosure's summary text from the current generic
    `"SoQL query"`, which Cypress's test-first pass must account for. Update the intro sentence to:
    *"Reported collisions, injuries, and deaths move very differently over this period; collisions
    are the most discretionary figure (an officer decides whether to file), injuries typically
    involve an ambulance or hospital record, and deaths are the least discretionary, the medical
    examiner's count."* — verbatim, not paraphrased; correlation language only, no causal claim
    (NFR-5).
  - *Acceptance, by command, `node -v` recorded beside results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` and `npm ls recharts` — both unchanged from before this task (no install step is
       expected; if one becomes necessary, halt and request a revised SPEC per Rule 9).
    3. `npm run dev`; `curl -s localhost:3000/api/deaths` still returns `status: "ok"`, 8 rows,
       unchanged; `curl -s localhost:3000/api/injuries` → `status: "ok"`, 8 rows.
    4. `/` renders both the deaths chart/table (unchanged) and the new injuries table, plus both
       disclosures.
    5. **`git diff --stat` shows zero changes to `src/lib/deaths.test.ts` and
       `src/app/api/deaths/route.test.ts`.** If satisfying the acceptance criteria required editing
       either, report exactly which assertion broke and why — do not silently edit Cypress's files.
    6. Both live response bodies pasted verbatim into the `[COMPLETION-REPORT]`. Cypress diffs the
       injuries body against the mvcc-data skill's pinned Injuries column and re-confirms Deaths is
       unchanged. Redwood transports; it does not judge correctness (NFR-4).
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` — the token name now appears in exactly
       **one** source file (`socrata.ts`) plus `.env.example`, a *smaller* surface than before this
       task (previously `deaths.ts`), and a value in none.
    8. `npm audit` run; report high/critical (no install expected, so this is a hygiene check, not
       a response to new risk).

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`. Same window as
  Task 1, only the aggregate differs.

  **Deaths (unchanged, restated for verification only — do not re-derive):**
  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_killed) AS deaths
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  **Injuries (new, pinned by this SPEC):**
  ```
  $select = date_extract_y(crash_date) AS year, sum(number_of_persons_injured) AS injuries
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when non-empty.

  **Expected response shape**, both endpoints — a JSON array of exactly 8 objects, ascending by
  year, every numeric field a string:
  ```json
  [{ "year": "2018", "injuries": "61940" }, ... 8 entries through "2025" ]
  ```

  **Pinned figures (mvcc-data skill, verified 2026-08-03)** — for Cypress's diff, never for a
  literal in `src/**`: Injuries 2018→2025: 61940, 61391, 44615, 51785, 51933, 54252, 54030, 49634.
  Unlike Task 1/2's deaths values (3-digit, a deliberate hook blind spot), **these injuries figures
  are already in `guard-data-integrity.sh`'s 26 pinned-literal list** — a real mechanical net exists
  for this task that didn't exist for deaths. Do not treat that net as license to be careless with
  the deaths side of this refactor, which remains unguarded.

  **Do not alter the deaths clauses' values.** If Socrata rejects the new injuries query as
  constructed, halt and request a revised SPEC — do not repair it in place.

- **Design Pattern**: **none — simple case**, but this task executes the *parameterization* step
  Task 1's own Tipping Point named ("parameterize at two, encapsulate at three"), which is ordinary
  generics over a two-field parameter object, not a GoF pattern. `composition-patterns` was
  consulted: its rule set targets React component props (boolean-prop proliferation, compound
  components), which don't govern a server-only data module — but its underlying principle (explicit,
  typed parameters over a hidden-branching config object) is exactly what `{aggregateExpr,
  fieldAlias}` is: two required, named, non-boolean parameters, no config object, no hidden branch.
  A Strategy or series registry remains unearned until a *third* distinct query shape arrives (FR-12
  or FR-6) — that SPEC is where "encapsulate" is due, not this one.

- **UI Scope**: N/A — no chart, no CSS, no client component. `page.tsx`'s new markup is plain
  semantic HTML inheriting `globals.css` only, exactly as Task 1's UI Scope specified for deaths.

- **Intellectual Control**:
  - *Why the transport extraction happens now, not later.* Task 1's own Tipping Point named "a
    second Route Handler appears" as the near-certain first trip and said the extraction is due
    *then*, not on a hunch beforehand. This task is that exact moment arriving — deferring it again
    would be the second silent inheritance ADR 0001 was written about, this time by Cedar's own
    hand.
  - *Why `fetchYearlyMetric` takes only the aggregate and alias, not the where/group/order.* Widening
    the parameter surface now, before a caller needs a different `$where` or group key, is exactly
    the unearned-abstraction failure Rule 8 rejects — it would pre-build for FR-12/FR-6 before either
    SPEC exists to justify the shape. Keeping the window and grouping as fixed constants inside
    `socrata.ts` means the function can only express "some yearly aggregate over the fixed 2018–2025
    window" — which is precisely and only what deaths and injuries both need today.
  - *Why `DeathsRow`/`DeathsResult` must stay structurally identical.* `DeathsChart.tsx` consumes
    `rows: DeathsRow[]` and reads `.deaths` by name (`dataKey="deaths"`, the end-label renderer,
    Task 2's pinned rendered contract). `YearlyMetricRow<"deaths">` is `{ year: number } &
    Record<"deaths", number>`, which TypeScript resolves to the exact same structural type as
    `{ year: number; deaths: number }` — so this refactor is invisible to every existing consumer and
    every existing test that doesn't reach into `deaths.ts`'s internals. That invisibility is the
    acceptance bar, not a nice-to-have: Constraint and Acceptance-clause 5 make it checkable
    (`git diff --stat` on the two existing test files must show nothing).
  - *Why the two per-metric fetches run in `Promise.all`, not sequential awaits.* NFR-1's 2.5s Slow-4G
    budget was set for one round trip; adding a second server-side fetch sequentially would add its
    full latency on top rather than overlapping it. Both requests are independent and cacheable
    (`revalidate: 86400`), so there is no ordering dependency to preserve.
  - *Why the two branches are independent rather than one combined error state.* Collapsing "deaths
    failed" and "injuries failed" into one shared error would hide a working metric behind an
    unrelated one's failure — the opposite of FR-10's "defined state," which this project has always
    scoped per-metric (Task 1's `DeathsResult` never referenced any other series).
  - *Why this will not break at scale.* `socrata.ts` knows nothing about deaths or injuries by name —
    it takes an aggregate expression and an alias and returns a generically-typed result. Adding a
    third yearly metric with a *matching* shape (same window, same group key, different aggregate)
    costs one new five-line file, zero changes to `socrata.ts`. The moment a metric needs a different
    `$where` or group key, the Tipping Point below says stop parameterizing and encapsulate instead —
    that boundary is named, not guessed at.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` is read **only** inside
     `src/lib/socrata.ts` after this task — `deaths.ts` and `injuries.ts` must not read it directly.
     Never `NEXT_PUBLIC_`; never in a `'use client'` file (none of the three touched/new files may
     ever gain that directive).
  2. **No figure may be authored.** Injuries values are already caught by
     `guard-data-integrity.sh`'s pinned list (unlike deaths); rely on that but do not rely on it
     *only* — no injuries or deaths figure may appear as a literal anywhere in `src/**` outside test
     files, fallback, placeholder, comment, default, or "temporary" mock.
  3. **`DEATHS_SOQL`'s string value is frozen** (Rule 4) — this refactor may change how it's
     assembled, never what it says. `INJURIES_SOQL` is pinned by this SPEC and frozen from this point
     forward; a future SPEC revises it, not a local repair.
  4. **No zero-coercion, anywhere, for either metric** (FR-11, trap 1). An absent key, `null`, or a
     non-matching string for `deaths` or `injuries` in any year of the window produces
     `status: "error"`, `kind: "contract"` for *that metric only*.
  5. **No new dependency.** Zero install expected — `zod@^4` and `recharts@^3.10.1` are already in
     the tree and sufficient. If the generic-Zod-schema approach genuinely requires a new package,
     halt and request a revised SPEC (Rule 9); do not add one silently.
  6. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are untouched.** No
     injuries series on the chart in this task — that is the deferred Magnolia follow-on.
  7. **No CSS authored or edited.** `globals.css`, `page.module.css` untouched; no `.module.css`
     created.
  8. **Files not to touch**: `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
     `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`,
     `src/app/layout.tsx`, `globals.css`, `page.module.css`, `.claude/**`, `CLAUDE.md`, `README.md`,
     `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  9. **`src/app/page.module.css` remains orphaned** — still owed to the next layout SPEC, per
     `SPEC.md`'s carried-forward note. Not this task's to resolve.
  10. **Caching (NFR-1)**: one `next: { revalidate: 86400 }` policy, stated once in `socrata.ts`,
      inherited by both metrics. Do not add `export const dynamic = "force-dynamic"` or a second
      cache directive.
  11. **Bound every request**: `AbortSignal.timeout(10_000)` on each fetch inside `socrata.ts`.
  12. **Existing deaths tests survive unmodified** (Acceptance clause 5). If they don't, that is a
      real FAIL for Cypress's audit, not something to route around by editing them.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **Network failure/DNS/timeout, for either metric independently** → that metric's
     `error`/`upstream`; the other metric renders normally if it succeeded.
  2. **Non-2xx (429, 5xx) from either metric** → `error`/`upstream` naming the status code. No retry
     loop (cap: one attempt, then fail loud).
  3. **Non-JSON response from either metric** → `error`/`upstream`, guarded by content-type check.
  4. **Zero rows for either metric** → `status: "empty"`, HTTP 200, independent of the other metric.
  5. **A year 2018–2025 missing from either metric's response** → `error`/`contract` naming the
     missing year and which metric. **Never zero-fill.**
  6. **A field present but `null`, empty string, non-numeric, or a JSON number instead of a string**
     → `error`/`contract` naming the year, the metric, and the offending value's type.
  7. **More than 8 rows, a duplicate year, or an out-of-window year, for either metric** →
     `error`/`contract`.
  8. **`SOCRATA_APP_TOKEN` unset or empty** → do not fail; omit the header, warn once per call (two
     warnings on one page load — from the two `fetchYearlyMetric` calls — is acceptable and
     non-blocking, not a defect to engineer around).
  9. **One metric `ok`, the other `empty` or `error`, on the same page render.** Both branches render
     independently and correctly; this is new coverage this task must exercise (Test guidance,
     below) — Task 1 never had two independent unions on one page.
  10. **The live 2025 figures (deaths 229, injuries 49,634) have moved.** Report as a finding in the
      `[COMPLETION-REPORT]`; do not adjust, annotate, or "sanity-correct." `/verify-figures` is the
      mechanism.
  11. **`CLAUDE.md` dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`; expected, never
      committed.

- **Files** (max 5 — five used):
  1. **`src/lib/socrata.ts`** — *new.* The generic transport + validation engine
     (`fetchYearlyMetric`, `buildYearlySoql`, `buildYearlyUrl`, `YearlyMetricRow`/
     `YearlyMetricResult`). The only file in the repo that reads the token after this task.
  2. **`src/lib/deaths.ts`** — *edited, not replaced.* Reduced to the four deaths-specific constants
     and thin re-exports over `socrata.ts`. `DEATHS_SOQL`'s value must not change.
  3. **`src/lib/injuries.ts`** — *new.* FR-2's twin of the reduced `deaths.ts`.
  4. **`src/app/api/injuries/route.ts`** — *new.* `GET` only, identical union-to-HTTP mapping as the
     deaths route.
  5. **`src/app/page.tsx`** — *edited.* Parallel fetch of both metrics; the new independent injuries
     block; the updated intro sentence (verbatim, above); the disambiguated disclosure summaries.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects carried
  in the ledger; the deploy SPEC's Vercel/First-Load-JS obligations; `page.module.css`.

  **If Redwood believes a sixth file is required**, halt and request a revision naming (i) the
  specific failure the sixth file is the only thing that catches, and (ii) which of the five cannot
  carry it.

- **Tipping Point**: this is two thin per-metric modules over one generic transport function, one
  new Route Handler, and one page holding two independent series. Decompose or revise when **any
  one** trips:
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough filter,
    which changes the group key). This is where "parameterize" stops paying and a Strategy or small
    series registry is finally earned — *that* SPEC must say so explicitly. This task moves the
    counter to exactly two; it does not cross three.
  - **A third yearly-aggregate metric with the *same* shape arrives** (a hypothetical future metric
    needing only a different `sum()`/`count()` expression). `socrata.ts` absorbs it as a third
    one-line caller module; no change to `fetchYearlyMetric` itself is expected.
  - **`src/app/page.tsx` holds more than one series plus FR-9's caveats section, or exceeds ~150
    lines.** Inherited unchanged from Task 1. This task roughly doubles the file (two metrics, no
    caveats yet); if it lands near or over 150 lines, split the table+disclosure markup into a small
    shared presentational component *at that point* — not preemptively here, since two near-identical
    blocks is still within Rule 8's "earned at three" tolerance for markup duplication.
  - **`src/lib/socrata.ts` exceeds ~120 lines or gains a second exported fetch function** with
    materially different transport behavior (e.g. pagination for a non-aggregated dataset like
    arrests) — split the pagination/offset concern into its own module rather than branching inside
    `fetchYearlyMetric`.
  - **Task 2's chart Tipping Point** (a second series lands on `DeathsChart`, i.e. this task's
    injuries data being wired into the chart) — inherited unchanged from Task 2's SPEC, and is
    **not** tripped by this task. It is the explicit trigger for the next Magnolia SPEC.

**Test guidance for Cypress** (behavioral, per Rule 4 — JSON response shape given a stubbed Socrata
reply, and the rendered page contract, not internal plumbing): assert `/api/injuries`'s `ok`,
`empty`, missing-year-contract, null-value-contract, and non-2xx-upstream paths, mirroring the
existing deaths route tests. Assert the FR-8 invariant for injuries (every clause in `INJURIES_SOQL`
appears encoded in `buildInjuriesUrl()`). **New, required coverage this task introduces:** a page-test
scenario where the deaths fetch mock resolves `ok` and the injuries fetch mock resolves `error` (and
the inverse), asserting each branch renders independently and correctly on the same page — the two
mocks must be discriminated by request URL (or by which SoQL each carries), not by call order. Assert
`git diff` shows zero changes to `src/lib/deaths.test.ts` and `route.test.ts` (a CI-checkable, not
just narrated, claim). Stub responses use obviously synthetic values, never the pinned Appendix A /
mvcc-data figures. Add an `axe-core` assertion on the new injuries table and both `<details>`
disclosures.

**Background/reference resources (Constraint of Three)**:
1. `.claude/skills/mvcc-data/SKILL.md` — the FR-2 query pattern (confirmed identical shape to FR-1),
   trap 1 applied to `number_of_persons_injured`, and the pinned Injuries column.
2. `ARCHIVED_SPECS.md`, Task 1's `[SPEC]` — specifically its Tipping Point (the "parameterize at
   two / second Route Handler → extract socrata.ts" clauses this task executes) and its Intellectual
   Control on why the page imports the lib directly rather than self-fetching its own Route Handler.
3. `.claude/hooks/guard-data-integrity.sh` — confirms injuries figures are already in the pinned
   6-digit-adjacent literal list (unlike deaths), so this task has a real mechanical net Task 1/2
   didn't have on the deaths side.

[FORCES]

1. **Executing a pre-committed refactor now > deferring it again** — Task 1's own Tipping Point
   named this exact trigger; doing it here rather than pushing it into a bigger, chart-bundled FR-3
   task keeps each SPEC's blast radius small and honors ADR 0001's "don't let a second silent
   inheritance happen."
2. **A narrow, two-parameter function > a config object anticipating future shapes** — `$where`/
   `$group` stay fixed constants until a third shape genuinely requires otherwise; building for FR-12
   or FR-6 before either SPEC exists is the unearned abstraction Rule 8 forbids.
3. **Two independent per-metric states > one combined error state** — a failing injuries fetch must
   never hide a working deaths series, or vice versa.
4. **Structural type compatibility > a clean-looking generic rename** — `DeathsRow`/`DeathsResult`
   must stay byte-identical in shape so `DeathsChart.tsx` and every existing test are unaffected by a
   refactor they have no reason to know occurred.
5. **Simplicity > Pattern purity.**
```

---

## Archived 2026-08-06 — Collisions per year: the data half of FR-3 (COMPLETE)

**Outcome:** 3 of 3(-5) budgeted files. New `src/lib/collisions.ts` (third one-line caller
over `socrata.ts`, unmodified) and `src/app/api/collisions/route.ts`; `src/app/page.tsx`
fetches all three metrics via `Promise.all`, renders collisions as a fully independent
table with its own inline reporting-policy note (byte-identical to the SPEC's verbatim text,
confirmed by extracting and diffing the JSX string) and disclosure. Cypress PASS: 145/145
tests, zero drift on all three live endpoints (independently re-fetched, not trusted from
Redwood's pasted bodies), `git diff --stat` on all four protected sibling test files and on
`socrata.ts`/`DeathsChart.*` all empty. **`page.tsx` landed at 162 lines, over its own
~150-line Tipping Point** — reported prominently per the SPEC's mandatory acceptance clause,
not silently fixed or ignored; now a standing trigger for the next SPEC to address before a
fourth metric lands. **FR-3 deliberately left open/partially-satisfied** — the dashed-stroke
chart treatment is a separate, still-undispatched Magnolia SPEC.
Commits: `06ef759` (SPEC) → `9ed9fb8` (Phase B tests) → `003e89f` (implementation).

# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why this task, not something else (Cedar's reasoning, recorded)

The open P0 backlog is FR-3 (collisions, dashed+labelled), FR-4 (% change, blocked on "each of
the three metrics" — PRD line 200), FR-9 (caveats, PRD line 205), FR-12 (casualty-filtered
repair, PRD line 208). FR-3's own text (PRD line 199) bundles two things a single SPEC can't
carry: a data-fetching task (the collision count itself) and a chart-redesign task (the
dashed-stroke-plus-inline-label treatment, which only means something once a chart exists). This
mirrors exactly the split CLAUDE.md names — a Redwood-only data slice now, the Magnolia
chart-redesign SPEC queued next.

Last time, FR-2 was chosen over FR-3 because Task 1's own Tipping Point had *pre-committed* to
the `socrata.ts` extraction as the smaller, lower-risk next step, and because bundling FR-3 then
would have forced the query-layer parameterization, the chart's Tipping-Point redesign, and the
dashed-stroke decision into one shot. That extraction is done. There is no equivalent smaller
alternative left on the backlog — FR-4 is explicitly blocked on this task, FR-9 is prose/caveats
work with no query to pin, and FR-12 needs this task's raw collisions series to compare against.
Re-evaluating fresh: the data half of FR-3 is now the correct next task on its own merits, not by
elimination. It is a near-exact mirror of the FR-2 pattern — a third one-line caller module over
`socrata.ts`'s already-generic transport, which FR-2's own Tipping Point named as the
*unremarkable* case ("a third yearly-aggregate metric with the same shape arrives... absorbed as
a third one-line caller module; no change to `fetchYearlyMetric` itself is expected"). It carries
none of the risk the socrata.ts extraction carried, and it unblocks FR-4 and FR-12 for the
backlog after next.

The chart-redesign half is deliberately **not** in this task. It is queued as the next SPEC,
which will need its own Cedar pass because it inherits `DeathsChart.tsx`'s Tipping Point on three
counts at once (legend, tooltip/crosshair, dashed stroke) — a genuinely different kind of
decision than this one.

---

```markdown
[SPEC] — Collisions per year: the raw reporting-affected series, data half only (FR-3)

- **Objective**: Add total recorded collisions per year (2018–2025) as a third,
  independently-fetched live SoQL aggregate, rendered on `/` as its own accessible table + FR-8
  query disclosure — mirroring FR-2's exact shape for a new metric, now trivially since
  `src/lib/socrata.ts`'s generic transport already exists. Because FR-3's literal text ties this
  specific series to a dashed-stroke *chart* treatment that cannot exist without a chart, this
  task also adds a plain, unstyled inline sentence next to the collisions table stating the
  series is reporting-affected — the one part of NFR-5's "in every rendering" clause that
  *can* be satisfied by a table (a label), as opposed to the part that structurally cannot (a
  stroke). No chart change: `DeathsChart.tsx`, its stylesheet, and its test are untouched.
  Redwood only — no Magnolia work in this task.

- **Requirement**: **FR-3 [P0]** (PRD line 199) — **partially satisfied by this task.** FR-3
  reads: "the system shall display recorded collision counts per year over the same window,
  visually distinguished as the reporting-affected series by a dashed stroke **and** an explicit
  inline label... never by color alone." This task satisfies the "display recorded collision
  counts" clause and the "explicit inline label" clause (via the table's adjacent note, argued
  below). It does **not** satisfy the "dashed stroke" clause — a table has no stroke to dash, and
  that requirement can only be met once the series is charted. FR-3 stays **open** until the
  follow-on Magnolia SPEC lands. Also satisfies **FR-8 [P0]** (display the exact SoQL, extended
  to a third, independently-pinned query), **FR-10 [P0]** (defined empty/error state, now
  required for a third metric independently), **FR-11 [P0]** (absent/null core aggregate →
  error, never a silent zero — trap 1 applies to the collision count exactly as it does to deaths
  and injuries), **NFR-1** (ISR caching inherited via the existing shared transport;
  strengthened by parallel fetching), **NFR-2** (token read stays confined to `socrata.ts`,
  which this task does not touch), **NFR-3** (a third screen-reader-accessible table), **NFR-4**
  (every figure from SoQL aggregation), and the **label** half of **NFR-5** for this rendering
  (the stroke half is inapplicable to a table and is not claimed here).
  Explicitly **not** in scope: the dashed-stroke chart treatment itself (next SPEC, Magnolia);
  **FR-4** (% change — still blocked: its text needs "each of the three metrics" *displayed*,
  which this task achieves, but FR-4 also needs a UI landing spot for the number, which belongs
  with the chart SPEC that finishes FR-3, not this one); **FR-9** (caveats section — separate);
  **FR-12** (casualty-filtered repair — now *unblocked* by this task's existence, since it needs
  a raw collisions series to compare against, but changes the `$where` shape and is its own SPEC
  with its own pinned query); **FR-13**; the severable FR-5–7 arrest group.

- **Inputs/Outputs**:
  - *Input*: a clean tree with FR-1/FR-2 merged; `SOCRATA_APP_TOKEN` in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must satisfy
    `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/lib/collisions.ts`* (new). FR-2's `injuries.ts` twin, unchanged pattern:
    ```ts
    import {
      buildYearlySoql,
      buildYearlyUrl,
      fetchYearlyMetric,
      type YearlyMetricResult,
      type YearlyMetricRow,
    } from "./socrata";

    const AGGREGATE_EXPR = "count(collision_id)";
    const FIELD_ALIAS = "collisions" as const;

    export const COLLISIONS_SOQL = buildYearlySoql(AGGREGATE_EXPR, FIELD_ALIAS);
    export function buildCollisionsUrl(): URL {
      return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS);
    }
    export type CollisionsRow = YearlyMetricRow<"collisions">;
    export type CollisionsResult = YearlyMetricResult<"collisions">;
    export function fetchCollisionsPerYear(): Promise<CollisionsResult> {
      return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS);
    }
    ```
    `socrata.ts` is **read-only to this task** — no edit, no widening of `fetchYearlyMetric`'s
    parameter surface. This is the exact "third yearly-aggregate metric with the same shape"
    case FR-2's Tipping Point pre-named as absorbing with zero changes to the transport.
  - *Output 2 — `src/app/api/collisions/route.ts`* (new). `export async function GET()`,
    identical union-to-HTTP mapping as `api/deaths/route.ts` and `api/injuries/route.ts`:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

  - *Output 3 — `src/app/page.tsx`* (edited). Fetch all three metrics **in parallel**:
    `const [result, injuriesResult, collisionsResult] = await Promise.all([fetchDeathsPerYear(), fetchInjuriesPerYear(), fetchCollisionsPerYear()])`
    — not sequential `await`s (NFR-1). Below the existing injuries block, add an independent
    collisions block with the same three-branch shape:
    - `ok` → `<table><caption>NYC recorded collisions per year, 2018–2025</caption>` with
      `<th scope="col">Year</th><th scope="col">Collisions</th>`, then **immediately after the
      table, before the disclosure**, a plain `<p>` (no `className`, no styling — page.tsx stays
      zero-CSS per Task 2's standing constraint) with this verbatim text: *"This series is
      affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are
      recorded; it is not evidence of a comparable drop in real collisions."* This is the
      table-appropriate half of FR-3's inline-label requirement — see Intellectual Control for
      why this text and not the PRD's dashed-stroke example phrase.
    - `empty`/`error` → the same visible, non-decorative `role="status"`/`role="alert"` message
      pattern the other two metrics use, verbatim copy.
    - Disclosure: `<details><summary>SoQL query — collisions</summary><pre><code>{COLLISIONS_SOQL}</code></pre></details>`,
      unconditional (rendered regardless of status, matching FR-8's existing deaths/injuries
      pattern — a failed fetch still shows what was attempted).
    **All three metrics' branches are fully independent** — one failing must never suppress or
    alter another's render (established in FR-2; this task extends the same guarantee to a third
    metric). No change to the intro paragraph — its existing text already frames collisions as
    "the most discretionary figure (an officer decides whether to file)," which stays accurate
    and needs no rewording.

  - *Acceptance, by command, `node -v` recorded beside results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` and `npm ls recharts` — both unchanged (no install expected; if one becomes
       necessary, halt and request a revised SPEC per Rule 9).
    3. `npm run dev`; `curl -s localhost:3000/api/deaths` and `/api/injuries` unchanged, `status:
       "ok"`, 8 rows each; `curl -s localhost:3000/api/collisions` → `status: "ok"`, 8 rows.
    4. `/` renders the deaths chart/table, the injuries table, and the new collisions table plus
       its inline note, plus all three disclosures.
    5. **`git diff --stat` shows zero changes to `src/lib/deaths.test.ts`,
       `src/lib/injuries.test.ts`, `src/app/api/deaths/route.test.ts`, and
       `src/app/api/injuries/route.test.ts`.** If satisfying acceptance required editing any of
       these, report exactly which assertion broke and why — do not silently edit Cypress's
       files.
    6. The live `/api/collisions` response body pasted verbatim into the `[COMPLETION-REPORT]`.
       Cypress diffs it against the mvcc-data skill's pinned Collisions column and re-confirms
       deaths/injuries are unchanged. Redwood transports; it does not judge correctness (NFR-4).
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` — the token name still appears in
       exactly **one** source file (`socrata.ts`) plus `.env.example`, unchanged surface, value
       in none.
    8. `npm audit`; report high/critical (no install expected — hygiene check, not a response to
       new risk).
    9. **Report the final line count of `src/app/page.tsx`** beside the acceptance results and
       compare it explicitly to the ~150-line Tipping Point FR-2's SPEC named. The file was 112
       lines before this task; this addition is expected to land it near or over that line. This
       is not a blocking gate — report the number and flag it; do not silently decompose the file
       to dodge the number, and do not silently ignore it either.

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`. Same window,
  same `$where`/`$group`/`$order` as deaths and injuries — only the `$select` aggregate differs.

  **Collisions (new, pinned by this SPEC):**
  ```
  $select = date_extract_y(crash_date) AS year, count(collision_id) AS collisions
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
  $group  = date_extract_y(crash_date)
  $order  = year
  ```

  **Deaths and injuries clauses are unchanged — restated nowhere in code, verify against the
  live modules, do not re-derive.**

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when non-empty.

  **Expected response shape** — a JSON array of exactly 8 objects, ascending by year, every
  numeric field a string:
  ```json
  [{ "year": "2018", "collisions": "231564" }, ... 8 entries through "2025" ]
  ```

  **Pinned figures (mvcc-data skill, verified 2026-08-03)** — for Cypress's diff, never for a
  literal in `src/**`: Collisions 2018→2025: 231564, 211486, 112918, 110558, 103887, 96607,
  91316, 85546. Several of these are already in `guard-data-integrity.sh`'s 26 pinned-literal
  list (per Task 2's Constraint 3, the six-digit collisions/injuries/casualty-filtered figures
  are covered; the two 5-digit later years are not — do not treat partial mechanical coverage as
  license to be careless with the rest).

  **`count(collision_id)` chosen over `count(*)`:** `collision_id` is a verified, non-null
  primary-key field (mvcc-data skill), so the two are numerically equivalent here, but naming the
  counted field keeps the FR-8 disclosure self-documenting rather than relying on an implicit
  `*`. **If Socrata rejects this query as constructed, halt and request a revised SPEC — do not
  repair it in place.**

- **Design Pattern**: **none — simple case.** `composition-patterns` was consulted: its rule set
  (boolean-prop avoidance, compound components, explicit variants) targets client component
  props and none apply here — no new component, no boolean prop, no client boundary crossed.
  `collisions.ts` is the third one-line caller over `fetchYearlyMetric`, which FR-2's own Tipping
  Point named as the unremarkable case requiring zero change to the transport. The one duplication
  this task does introduce — a third near-identical table+disclosure JSX block in `page.tsx` — is
  not a composition-pattern violation (it's markup repetition, not prop proliferation) and is
  addressed as a named, deferred item below rather than an in-task extraction.

- **UI Scope**: N/A — no chart, no CSS, no client component. `page.tsx`'s new markup is plain
  semantic HTML inheriting `globals.css` only, exactly as FR-1/FR-2 specified.

- **Intellectual Control**:
  - *Why this genuinely only closes half of FR-3, and why that's the honest scoping rather than
    a shortcut.* FR-3's acceptance criterion is stroke-and-label, conjunctively. A table renders
    neither a stroke by definition, so no amount of care in this task can make FR-3 fully PASS —
    claiming otherwise would be the kind of drift ADR 0001 was written about. Recording FR-3 as
    "partially satisfied, stroke clause pending" is more honest than either closing it early or
    leaving it wholly unaddressed.
  - *Why the inline note uses different wording from FR-3's example phrase.* FR-3's PRD text
    gives "affected by reporting decline — see caveats" as an *example* (`e.g.,`), not verbatim
    required copy — and "see caveats" would point at FR-9's caveats section, which does not exist
    yet. A dangling reference to a nonexistent section is worse than a short self-contained
    sentence. The chosen text states the documented cause directly (mvcc-data skill: "this is
    documented policy, not inference — state it as cause"), which is stronger and more honest
    than a forward reference. When FR-9 lands, that SPEC may replace "This series is affected
    by..." with a cross-reference; that is FR-9's decision to make, not pre-empted here.
  - *Why NFR-5's "in every rendering" clause is honestly split.* NFR-5 says the collision series
    "shall carry FR-3's dashed-stroke-plus-label treatment in every rendering." A table is a
    rendering. The label component of that treatment is renderable in a table (it's just text);
    the stroke component structurally is not. Adding the label now and deferring the stroke to
    the chart SPEC is the closest honest approximation of "every rendering" available before a
    chart exists — omitting the label entirely until the chart lands would under-satisfy NFR-5
    for a rendering surface (the table) that exists today and is live on `/` today.
  - *Why the shared table+disclosure component is **not** extracted in this task, despite this
    being the third near-identical block.* FR-2's own Tipping Point named the trigger precisely:
    "`page.tsx` exceeds ~150 lines" or "holds more than one series plus FR-9's caveats section" —
    not "a third block appears." The caveats-section half of that compound trigger cannot fire
    (FR-9 doesn't exist), and the line-count half is a genuine "report and watch" item this SPEC
    surfaces (acceptance clause 9), not a "decompose now" mandate. Extracting a shared component
    here would restructure two already-tested, working blocks (deaths, injuries) under cover of a
    data-addition task — a bigger, riskier diff than this task's stated objective, and exactly
    the kind of unrequested scope a `[COMPLETION-REPORT]`'s Jevons's-Paradox check exists to
    catch. If the reported line count lands at or over ~150, that is the trigger for a dedicated
    follow-up (Banyan mechanical refactor, or a small Cedar SPEC) — named here, not executed here.
  - *Why FR-4 stays blocked even though "each of the three metrics" now technically exist.* FR-4
    needs a UI landing spot for a computed percentage — some element on the page that displays
    it. That's a rendering decision entangled with where the chart's legend/labels live, which is
    exactly what the next Magnolia SPEC is about to redesign. Building FR-4's display now risks
    building it twice: once against today's page shape, once against the post-chart-redesign
    shape.
  - *Why this will not break at scale.* `collisions.ts` knows nothing about deaths or injuries by
    name; `socrata.ts` remains untouched and un-widened. Adding a fourth yearly-aggregate metric
    with a matching shape costs one more five-line file, zero changes to the transport. The
    moment a metric needs a different `$where` or group key (FR-12, FR-6), the inherited Tipping
    Point says stop parameterizing and encapsulate instead — unchanged and un-triggered by this
    task.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` stays read **only**
     inside `src/lib/socrata.ts`. `collisions.ts` must not read it directly, never
     `NEXT_PUBLIC_`, never in a `'use client'` file (none of the touched/new files gain that
     directive).
  2. **No figure may be authored.** Several collisions values are already caught by
     `guard-data-integrity.sh`'s pinned list; rely on that but not *only* on it — no collisions,
     injuries, or deaths figure may appear as a literal anywhere in `src/**` outside test files,
     fallback, placeholder, comment, default, or "temporary" mock.
  3. **`COLLISIONS_SOQL` is pinned by this SPEC and frozen from this point forward** (Rule 4); a
     future SPEC revises it, not a local repair. `DEATHS_SOQL` and `INJURIES_SOQL` values are
     unchanged and unread by this task except for verification.
  4. **No zero-coercion, anywhere, for any of the three metrics** (FR-11, trap 1). An absent key,
     `null`, or a non-matching string for `collisions` in any year of the window produces
     `status: "error"`, `kind: "contract"` for *that metric only*.
  5. **No new dependency.** Zero install expected. If one genuinely becomes necessary, halt and
     request a revised SPEC (Rule 9).
  6. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are untouched.** No
     collisions series on the chart in this task — that is the deferred Magnolia follow-on.
  7. **No CSS authored or edited.** `globals.css`, `page.module.css` untouched; no `.module.css`
     created. The inline note paragraph carries no `className`.
  8. **Files not to touch**: `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
     `src/lib/socrata.ts`, `src/lib/deaths.ts`, `src/lib/injuries.ts`,
     `src/app/api/deaths/route.ts`, `src/app/api/injuries/route.ts`, `vitest.config.mts`,
     `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`,
     `src/app/layout.tsx`, `globals.css`, `page.module.css`, `.claude/**`, `CLAUDE.md`,
     `README.md`, `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  9. **`src/app/page.module.css` remains orphaned** — still owed to the next layout SPEC.
  10. **Caching (NFR-1)**: inherited `next: { revalidate: 86400 }` from `socrata.ts`, no second
      cache directive added.
  11. **Bound every request**: `AbortSignal.timeout(10_000)`, inherited from `socrata.ts`, no
      change.
  12. **Existing deaths and injuries tests survive unmodified** (Acceptance clause 5). If they
      don't, that's a real FAIL for Cypress's audit, not something to route around by editing
      them.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **Network failure/DNS/timeout, for collisions independently** → `error`/`upstream`; the
     other two metrics render normally if they succeeded.
  2. **Non-2xx (429, 5xx) from collisions** → `error`/`upstream` naming the status code. No retry
     loop (cap: one attempt, then fail loud).
  3. **Non-JSON response from collisions** → `error`/`upstream`, guarded by content-type check.
  4. **Zero rows for collisions** → `status: "empty"`, HTTP 200, independent of the other two
     metrics.
  5. **A year 2018–2025 missing from the collisions response** → `error`/`contract` naming the
     missing year. **Never zero-fill.**
  6. **A field present but `null`, empty string, non-numeric, or a JSON number instead of a
     string** → `error`/`contract` naming the year and the offending value's type.
  7. **More than 8 rows, a duplicate year, or an out-of-window year** → `error`/`contract`.
  8. **`SOCRATA_APP_TOKEN` unset or empty** → do not fail; omit the header, warn once per call
     (three warnings on one page load is acceptable and non-blocking).
  9. **Collisions `ok` while deaths and/or injuries are `empty`/`error`, or vice versa, in any
     combination.** All three branches render independently and correctly; new coverage this
     task must exercise — FR-2 only exercised two independent unions, this is the first
     three-way independence test.
  10. **The live 2025 figures (deaths 229, injuries 49,634, collisions 85,546) have moved.**
      Report as a finding in the `[COMPLETION-REPORT]`; do not adjust, annotate, or
      "sanity-correct." `/verify-figures` is the mechanism.
  11. **`CLAUDE.md` dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`; expected, never
      committed.
  12. **`page.tsx`'s line count lands at or over ~150** → report it prominently in the
      `[COMPLETION-REPORT]`; do not silently extract a shared component to stay under the
      threshold, and do not silently ignore it either (Acceptance clause 9, Intellectual Control).

- **Files** (max 5 — three used):
  1. **`src/lib/collisions.ts`** — *new.* `AGGREGATE_EXPR = "count(collision_id)"`,
     `FIELD_ALIAS = "collisions"`, `COLLISIONS_SOQL`, `buildCollisionsUrl()`, `CollisionsRow`,
     `CollisionsResult`, `fetchCollisionsPerYear()`. FR-2's `injuries.ts` twin.
  2. **`src/app/api/collisions/route.ts`** — *new.* `GET` only, identical union-to-HTTP mapping
     as the deaths and injuries routes.
  3. **`src/app/page.tsx`** — *edited.* Third parallel fetch; the new independent collisions
     block (table, inline note, disclosure); no other change.

  **Not in this budget, and not owed by this task:** the two `stop-quality-gate.sh` defects
  carried in the ledger; the deploy SPEC's Vercel/First-Load-JS obligations; `page.module.css`;
  any shared table+disclosure extraction (named above as deferred debt, not this task's to
  resolve).

  **If Redwood believes a fourth or fifth file is required**, halt and request a revision naming
  (i) the specific failure the extra file is the only thing that catches, and (ii) which of the
  three cannot carry it.

- **Tipping Point**: this is a third one-line caller module over an unmodified generic transport,
  one new Route Handler, and a page holding three independent series. Decompose or revise when
  **any one** trips:
  - **`page.tsx`'s line count is at or over ~150 after this task** (Acceptance clause 9). Split
    the table+disclosure markup into a small shared presentational component **then** — the
    trigger this task's own Intellectual Control section declines to act on preemptively.
  - **A fourth yearly-aggregate metric with the *same* shape arrives.** `socrata.ts` absorbs it
    as a fourth one-line caller module; no change to `fetchYearlyMetric` expected — inherited
    unchanged from FR-2.
  - **A third distinct query *shape* arrives** (FR-12's extra `$where`, or FR-6's borough
    filter). This task does **not** cross that boundary — same shape as deaths/injuries, only
    the aggregate expression differs. The counter Task 1 named ("parameterize at two, encapsulate
    at three") stays at two query *shapes*; this is the second metric-*count* trigger, not the
    shape trigger.
  - **`DeathsChart.tsx`'s own Tipping Point** (a second series lands, i.e. collisions or
    injuries wired into the chart) — inherited unchanged from Task 2's SPEC, and is **not**
    tripped by this task. It is the explicit trigger for the next Magnolia SPEC, which also
    closes the remainder of FR-3.
  - **FR-9 lands.** At that point, re-examine whether the inline note this task added should
    become a cross-reference into the caveats section rather than standalone prose.

[FORCES]

1. Honest partial closure of FR-3's data half > closing the whole requirement prematurely with a table that cannot carry a stroke.
2. Mirroring the proven FR-2 pattern exactly > inventing a new shape for a task that is structurally identical to one already shipped.
3. Simplicity > Pattern purity (deferring the third-block extraction rather than restructuring two working, tested blocks under cover of a data task).
```

---

## Archived 2026-08-06 — MetricSection extraction, page.module.css deletion (COMPLETE)

**Outcome:** 4 of 5 budgeted files. New `src/components/MetricSection.tsx` (generic Server
Component, no CSS, no chart slot) + `MetricSection.test.tsx`; `src/app/page.tsx`'s three
near-duplicate blocks collapsed to three `<MetricSection>` calls, **162 → 63 lines** (61%
reduction); `page.module.css` deleted after a zero-reference grep. Deviated ordering
(Banyan executes first, no pre-written tests — nothing observable was meant to change).
Cypress PASS: 155/155 tests, and critically `git diff --stat` on `page.test.tsx` and all
six other protected sibling test files came back **empty** — independently reconfirmed by
both Banyan and Cypress, not merely asserted. `MetricSection.test.tsx` was specifically
checked for being genuine coverage rather than theater, since this SPEC skipped tests-first;
judged genuine (ok/empty/error, note presence/absence, disclosure unconditionality,
axe-core, all against a synthetic fieldAlias). One non-blocking fragility flagged: a CSS
sibling-selector test assertion, correct today, could silently stop covering its intent if
MetricSection's internal structure changes later.
Commits: `235347d` (SPEC) → `3f1cfc5` (execution) → `ca683e0` (ledger).

# Active SPEC

**Status:** approved — ready to dispatch to Banyan (mechanical refactor, tests-after)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Banyan (execution) → Cypress (audit)
**Ordering:** deviates from standard — Banyan executes first, no pre-written failing tests, since
this is a behavior-preserving mechanical refactor with no new behavior for a red test to describe

## Why this task, not something else (Cedar's reasoning, recorded)

FR-3's data half just closed; four backlog items are queued (FR-3's chart half, FR-4, FR-9, FR-12),
and `SPEC.md`'s own standing clause flagged a competing concern: `src/app/page.tsx` tripped its
~150-line Tipping Point (162 lines, three near-identical status/table/disclosure blocks) at the
exact moment the next task on the list — FR-3's chart redesign — is about to need that same file's
territory to mount a second series with a legend, tooltip/crosshair, and dashed stroke.

**Decision: do the `page.tsx` decomposition first, as its own small SPEC, before the chart redesign
lands** — not folded into the chart-redesign task, and not deferred. The trigger has already fired
(162 > 150, three genuinely-duplicated blocks, not a speculative fourth); the chart-redesign task is
independently large enough to trip `DeathsChart`'s own Tipping Point on three counts at once, so
bolting an unrelated page-wide JSX extraction onto it would blow past the 5-file cap and mix two
different owners' concerns (Magnolia's chart work vs. a structural refactor) in one diff — exactly
the "bigger, riskier diff than this task's stated objective" the FR-3 data-half SPEC itself warned
against doing prematurely. Letting the collision block's shape change again under the chart redesign
before untangling the current duplication would only compound the eventual diff.

This task is scoped as a **Banyan mechanical, behavior-preserving refactor** (not a new-feature
`[SPEC]`): extract a generic `MetricSection` component that the three existing blocks become thin
calls into, with zero visible/DOM change, verified by the existing `page.test.tsx` suite passing
**unmodified**. It also deletes the confirmed-dead, confirmed-unreferenced `src/app/page.module.css`
while in the neighborhood, discharging that other standing debt item cheaply. This clears clean
territory for the FR-3 chart-redesign SPEC to land next.

---

```markdown
[SPEC]

- **Objective**: Extract the three near-identical status/table/disclosure blocks in
  `src/app/page.tsx` (deaths, injuries, collisions) into one shared, generic
  `MetricSection` component, and delete the orphaned, zero-reference
  `src/app/page.module.css`. This is a **mechanical, behavior-preserving refactor**,
  not new product behavior: the rendered DOM, every string of copy, and every
  existing test assertion must survive unchanged. It discharges the two standing
  debt items SPEC.md named at FR-3's close — the ~150-line Tipping Point (162
  lines today) and the orphaned CSS module — so that the next SPEC (FR-3's
  dashed-stroke chart redesign) gets a clean, small `page.tsx` instead of
  competing with this refactor for the same file's diff.

- **Requirement**: **None directly** — this is an internal coupling/bloat refactor
  under CLAUDE.md Workflow Rule 3 ("Banyan invoked... when a coupling/bloat smell
  or refactor is flagged") and Rule 5 (task granularity), triggered by the
  standing clause recorded in `SPEC.md` on 2026-08-06 ("`src/app/page.tsx` has now
  tripped its own ~150-line Tipping Point... this is the standing trigger for the
  next SPEC to address"). It satisfies no new FR/NFR and must not be read as
  progress against one. It **unblocks** the next SPECs cleanly: FR-3 [P0]'s
  remaining chart half, FR-4 [P0] (needs a UI landing spot the chart redesign
  will create), FR-9 [P0] (caveats section — the other half of the compound
  Tipping Point trigger), and FR-12 [P0] (casualty-filtered repair, another
  metric block) will each be adding to or restructuring `page.tsx`; this task
  ensures they do so against ~50 lines of composition, not ~160 lines of
  triplicated markup.

- **Inputs/Outputs**:

  - *Input*: a clean tree with FR-3's data half merged (2026-08-06);
    `SOCRATA_APP_TOKEN` in a gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must
    satisfy `engines.node` (`>=22.22.2`).
  - *Output 1 — `src/components/MetricSection.tsx`* (**new**). A **Server
    Component** — no `'use client'`. It renders plain semantic HTML only (no
    chart, no interactivity), so it stays on the server side of the boundary
    Task 2 established; unlike `DeathsChart.tsx`, there is no NFR-2 concern here
    and no need for a type-only-import trick.

    ```ts
    import type { YearlyMetricResult } from "../lib/socrata";

    export type MetricSectionProps<K extends string> = {
      fieldAlias: K;          // "deaths" | "injuries" | "collisions" — also the
                               // table's row-value key and the disclosure's
                               // "SoQL query — {fieldAlias}" label
      columnLabel: string;    // "Deaths" | "Injuries" | "Collisions" — the
                               // second <th>; a literal, never derived from
                               // fieldAlias by capitalization
      captionText: string;    // the exact existing per-metric <caption> text
      result: YearlyMetricResult<K>;
      soql: string;            // DEATHS_SOQL / INJURIES_SOQL / COLLISIONS_SOQL —
                               // rendered in the disclosure unconditionally,
                               // independent of `result.status`, exactly as today
      note?: string;           // collisions-only inline sentence; rendered only
                               // in the ok branch, after the table, before the
                               // disclosure. Absent for deaths/injuries.
    };

    export function MetricSection<K extends string>(
      props: MetricSectionProps<K>,
    ): React.JSX.Element;
    ```

    Rendered structure (the contract; exact JSX is Banyan's means):

    ```html
    <!-- ok branch -->
    <table>
      <caption>{captionText}</caption>
      <thead><tr><th scope="col">Year</th><th scope="col">{columnLabel}</th></tr></thead>
      <tbody><tr><td>{row.year}</td><td>{row[fieldAlias]}</td></tr>...</tbody>
    </table>
    <p>{note}</p> <!-- only if note is provided -->

    <!-- empty branch -->
    <p role="status">Socrata returned no rows for 2018–2025, so no figures could be produced.</p>

    <!-- error branch -->
    <p role="alert">No figures could be produced: {result.reason}</p>

    <!-- always, regardless of status -->
    <details>
      <summary>SoQL query — {fieldAlias}</summary>
      <pre><code>{soql}</code></pre>
    </details>
    ```

    `ok`/`empty`/`error` are mutually exclusive top-level conditionals exactly as
    in today's `page.tsx`, moved verbatim into this component, not restructured.

  - *Output 2 — `src/components/MetricSection.test.tsx`* (**new**, Cypress).
    Characterization tests proving the component's contract in isolation with
    an obviously-synthetic `fieldAlias` (e.g. `"widgets"`) so the coverage is
    provably generic, not deaths-shaped: ok/empty/error branches render the
    right role and text; `note` renders only when provided and only in the ok
    branch; the disclosure renders unconditionally and independent of status;
    axe-core reports zero violations in the ok state both with and without
    `note`. No real deaths/injuries/collisions figures appear in this file
    (Constraint 6).

  - *Output 3 — `src/app/page.tsx`* (**edited**). Replace each of the three
    blocks with one `<MetricSection>` call, keeping the intro `<h1>`/`<p>` and
    the `Promise.all` fetch untouched:

    ```tsx
    {result.status === "ok" && <DeathsChart rows={result.rows} />}
    <MetricSection
      fieldAlias="deaths" columnLabel="Deaths"
      captionText="NYC traffic deaths per year, 2018–2025"
      result={result} soql={DEATHS_SOQL}
    />

    <MetricSection
      fieldAlias="injuries" columnLabel="Injuries"
      captionText="NYC traffic injuries per year, 2018–2025"
      result={injuriesResult} soql={INJURIES_SOQL}
    />

    <MetricSection
      fieldAlias="collisions" columnLabel="Collisions"
      captionText="NYC recorded collisions per year, 2018–2025"
      result={collisionsResult} soql={COLLISIONS_SOQL}
      note="This series is affected by a 2020 NYPD reporting-policy change that reduced how many minor collisions are recorded; it is not evidence of a comparable drop in real collisions."
    />
    ```

    The `{result.status === "ok" && <DeathsChart .../>}` line **stays directly
    in `page.tsx`**, as a sibling before `<MetricSection>` — it does **not**
    move into `MetricSection` via a children or render-prop slot (see Design
    Pattern / Intellectual Control). This means `page.tsx` and `MetricSection`
    each independently narrow on `result.status === "ok"` once, for the deaths
    case only — a small, deliberate, acceptable duplication, not a defect.

  - *Output 4 — `src/app/page.module.css`* (**deleted**). Confirmed
    zero-reference repo-wide (`git grep -rn "page.module.css" -- src` → no
    hits, re-verified in this SPEC's prep 2026-08-06); it is scaffold leftover,
    never imported by `page.tsx`, which has been CSS-free since Task 1.

  - *Acceptance, by command, `node -v` recorded beside every result*:
    1. Step 0's `node -v`/`npm -v`.
    2. `git grep -rn "page.module.css" -- src` → zero hits, confirmed **before**
       deleting. If a reference exists, halt — do not delete.
    3. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each
       exit 0.
    4. **`git diff --stat -- src/app/page.test.tsx` shows zero changes.** This is
       the primary behavior-preservation gate. If satisfying acceptance required
       editing that file, report exactly which assertion broke and why — do not
       silently edit Cypress's file.
    5. `git diff --stat -- src/lib/deaths.test.ts src/lib/injuries.test.ts src/lib/collisions.test.ts src/app/api/deaths/route.test.ts src/app/api/injuries/route.test.ts src/app/api/collisions/route.test.ts src/components/DeathsChart.test.tsx` →
       zero changes across all seven.
    6. **Report the resulting line count of `src/app/page.tsx`**, compared
       explicitly against the ~150-line Tipping Point (162 today). Do not
       hardcode an expected number — measure and report it.
    7. The no-authored-figure greps, re-run unchanged:
       `git grep -nE '(^|[^0-9.])(229|231|244|268|269|280|290|297)([^0-9]|$)' -- src ':!*test*'`
       and the six-digit collisions/injuries pinned-literal check — zero hits.
    8. `npm run dev`; load `/` in light and dark mode, desktop and 320px width.
       Confirm the deaths chart, all three tables, the collisions note, and all
       three disclosures render identically to before this task (same text,
       same order, same roles). Then `git checkout -- CLAUDE.md`.
    9. `npm audit` — report high/critical; no install expected, none authorized.

- **Query**: **none — this task touches no query, no fetch, no dataset ID, and
  no `$select`/`$where`/`$group`.** `src/lib/socrata.ts`, `deaths.ts`,
  `injuries.ts`, `collisions.ts`, and all three `route.ts` files are read-only
  to this task; `MetricSection` receives an already-fetched, already-validated
  `YearlyMetricResult<K>` as a prop and performs no fetch and no re-validation.

- **Design Pattern**: **none — simple case**, per `composition-patterns`
  (consulted this pass). `architecture-avoid-boolean-props`: `note` is data (an
  optional string), not a behavioral toggle — there is no `showNote` boolean.
  `patterns-explicit-variants`: the three call sites pass explicit, distinct
  literal props (`fieldAlias`, `columnLabel`, `captionText`) rather than a
  `variant: "deaths" | "injuries" | "collisions"` switch that `MetricSection`
  would branch on internally. `patterns-children-over-render-props` is the rule
  that **decided** the chart's placement: a `renderBeforeTable` render-prop was
  considered and rejected specifically because the skill ranks children/plain
  composition above render props for this kind of slot, and here even
  `children` is unneeded — the chart is a plain sibling `page.tsx` composes
  directly, so `MetricSection`'s prop surface stays uniform across all three
  callers instead of carrying a slot only one of them uses.

- **UI Scope**: **N/A — no chart, no CSS, no visible DOM change.** This is a
  refactor of *component composition*, not of the rendered page: the produced
  HTML must be behaviorally identical to today's, mechanically verified by
  `src/app/page.test.tsx` passing with zero edits (Acceptance clause 4). If
  achieving that requires any visible change, that is a FAIL, not a
  judgment call.

- **Intellectual Control**:
  - *Why now, and not folded into the FR-3 chart-redesign SPEC.* The FR-3
    chart-redesign task is already large on its own terms — the dispatch brief
    names it as tripping `DeathsChart`'s own Tipping Point on three counts at
    once (legend, tooltip/crosshair, dashed stroke). Bolting a page-wide
    extraction of the deaths/injuries blocks (which have nothing to do with the
    chart) onto that task would mean one diff owned by two different concerns —
    Magnolia's chart work and a structural refactor — and would risk exceeding
    the 5-file cap once the chart's own files (`DeathsChart.tsx`, its
    stylesheet, its test, `page.tsx`) are counted. Sequencing this first keeps
    each task's diff explicable by its own objective.
  - *Why the extraction is safe to do now, when the prior SPEC declined it.*
    The FR-3 data-half SPEC's stated reason for declining extraction was that
    the compound trigger ("`page.tsx` exceeds ~150 lines" **or** "holds more
    than one series plus FR-9's caveats section") had only the line-count half
    live, and extracting "under cover of a data-addition task" would have been
    a bigger, riskier diff than that task's stated objective. Both objections
    dissolve here: the line-count half has now definitively fired (162 > 150),
    and this task's *entire* objective is the extraction — there is no data
    addition riding along with it to obscure.
  - *Why the chart mount is not threaded through `MetricSection` via children
    or a render prop.* Three options were considered: (a) a `children` slot,
    (b) a `renderBeforeTable(rows)` render prop, (c) leave the chart mount as a
    sibling in `page.tsx`. `composition-patterns`' own priority ordering favors
    children over render props, but neither is needed: only one of three call
    sites has anything to place before the table, so giving `MetricSection` a
    slot at all would be an abstraction with one real consumer — the same
    unearned-generality Rule 8 rejects for GoF patterns applies equally to a
    component's prop surface. Option (c) — the one-line
    `{result.status === "ok" && <DeathsChart rows={result.rows} />}` staying in
    `page.tsx`, exactly where it already lives — costs one small, legible,
    duplicated discriminant check and buys a `MetricSection` whose contract is
    identical for all three callers today and remains identical the day a
    fourth metric arrives with nothing special to prepend.
  - *Why literal props (`columnLabel`, `captionText`) instead of deriving them
    from `fieldAlias`.* A `capitalize(fieldAlias)` helper would make "Deaths"
    from `"deaths"` correctly today but is exactly the kind of implicit string
    transform that silently breaks the day a metric's display label diverges
    from its field name (a per-capita metric, a borough-qualified label). Every
    rendered word stays an explicit, grep-able literal at the call site — the
    same discipline the FR-3 SPEC already used for the collisions note text.
  - *Why `page.module.css` is deleted in this task rather than left for "the
    next layout SPEC."* SPEC.md already named this task's shape ("a `page.tsx`
    decomposition SPEC... is a strong candidate to finally resolve this") as
    the likely place it would land. The file has zero references
    (re-confirmed, Acceptance clause 2) and this task touches no styling, so
    deleting it costs nothing beyond the `git grep` that proves it's safe, and
    avoids a fourth future visit to this exact neighborhood for one dead file.
  - *Why this will not break at scale.* `MetricSection` is generic over `K`
    and knows nothing about deaths, injuries, or collisions by name — a fourth
    yearly-aggregate metric (e.g., FR-12's casualty-filtered series) costs one
    more `MetricSection` call with its own literal props, not a change to this
    component. The moment a caller needs something `MetricSection` cannot
    express — two data series in one table, a filter control, a legend — that
    is this component's own Tipping Point (below), and the answer is an
    explicit new prop or a new sibling component, decided by whichever SPEC
    hits it, not pre-built here on spec.

- **Constraints**:
  1. **Zero behavioral change.** Acceptance clauses 4–5 are the gate: if any
     existing test file needs an edit to pass, that is a FAIL, not a
     negotiation.
  2. **No new dependency.**
  3. **No CSS authored or edited.** `MetricSection.tsx` carries no `className`,
     no CSS-module import — `page.tsx`'s zero-CSS constraint (Task 2) extends
     to its extracted component. `globals.css` untouched.
  4. **Token discipline unaffected.** `MetricSection.tsx` never imports
     `socrata.ts`, `deaths.ts`, `injuries.ts`, or `collisions.ts` as *values* —
     only the `YearlyMetricResult` *type* from `socrata.ts`. It never reads
     `process.env`.
  5. **`DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx` are
     untouched.** The chart-redesign SPEC owns them next.
  6. **No figure may be authored.** `MetricSection.test.tsx` uses an
     obviously-synthetic `fieldAlias` (e.g. `"widgets"`) and obviously-synthetic
     row values — never a real deaths/injuries/collisions figure, per the
     established `page.test.tsx` convention.
  7. **No render-prop or `children` slot added to `MetricSection`** for the
     chart (Design Pattern). If a future SPEC needs one, that SPEC adds it —
     this task does not pre-build it.
  8. **Relative imports only** (standing clause — `@/*` doesn't resolve under
     Vitest).
  9. **`page.module.css` deletion is gated on Acceptance clause 2's grep
     returning zero hits.** If it doesn't, halt and report — do not delete a
     file with a live reference and do not "helpfully" repoint that reference
     instead.
  10. **Files not to touch**: `src/lib/socrata.ts`, `src/lib/deaths.ts`,
      `src/lib/injuries.ts`, `src/lib/collisions.ts`, `src/app/api/deaths/route.ts`,
      `src/app/api/injuries/route.ts`, `src/app/api/collisions/route.ts`,
      `DeathsChart.tsx`, `DeathsChart.module.css`, `DeathsChart.test.tsx`,
      `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`,
      `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`,
      `src/app/globals.css`, `.claude/**`, `CLAUDE.md`, `README.md`,
      `.gitignore`, `docs/**`, `SESSION_STATE.md`.
  11. **Ordering deviation from the standard schema, stated explicitly.** This
      task is executed **Banyan-first, Cypress-audits-after** rather than
      Cypress-writes-failing-tests-first. Reason: this is a behavior-preserving
      mechanical refactor, not new product behavior — there is no new behavior
      for a red test to describe in advance. `page.test.tsx` passing unmodified
      *is* the pre-existing specification; `MetricSection.test.tsx` is
      characterization coverage written against the now-working extraction,
      matching the `[SPIKE]` audit-after model CLAUDE.md already sanctions for
      non-TDD-shaped work, and consistent with the roster's grant of
      "tree-wide mechanical refactors" to Banyan outside the standard loop.
  12. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance
      result.
  13. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **`note` absent (deaths, injuries).** No `<p>` element rendered at all in
     the ok branch — not an empty-string paragraph, not a `<p></p>`.
  2. **A `MetricSection` receiving an `ok` result with an empty `rows` array.**
     Cannot occur through the real pipeline (`socrata.ts` returns `status:
     "empty"` for zero rows, never `"ok"` with an empty array), but the
     component must not crash if it ever did — `.map` over `[]` renders a
     header-only table, no special-casing added on spec.
  3. **All eight ok/empty/error × (deaths, injuries, collisions) combinations
     already exercised by the untouched `page.test.tsx` three-way independence
     suite.** This task's job is to not disturb that guarantee — Acceptance
     clause 4 is the mechanical check, not a re-derivation of the coverage.
  4. **`page.module.css` deletion breaking `next build`** — guarded by
     Acceptance clauses 2 and 3 (grep first, then a real build); if the build
     fails after deletion, that falsifies the "zero-reference" premise and is a
     halt, not a re-add-and-move-on.

- **Files** (max 5 — four used):
  1. **`src/components/MetricSection.tsx`** — *new.* Generic status/table/note/
     disclosure component, Server Component, zero CSS.
  2. **`src/components/MetricSection.test.tsx`** — *new.* Cypress
     characterization tests against a synthetic `fieldAlias`.
  3. **`src/app/page.tsx`** — *edited.* Three blocks replaced by three
     `<MetricSection>` calls; `Promise.all`, `<h1>`, intro `<p>`, and the
     deaths-chart sibling mount unchanged in substance.
  4. **`src/app/page.module.css`** — *deleted.* Confirmed zero-reference.

- **Tipping Point**: `MetricSection`'s own — not `page.tsx`'s, which this task
  resets. Re-open when **either**: (a) a caller needs to render two data series
  in one table (e.g., a combined deaths+collisions row), a filter control, or a
  legend — none of which the current props can express without a boolean flag
  or a mode switch, which is exactly the signal to stop parameterizing and add
  an explicit new prop or a sibling component instead; or (b) FR-9's caveats
  section needs to sit inside this same repeating structure rather than beside
  it. Until then, a fourth yearly-aggregate metric (FR-12) costs exactly one
  more `MetricSection` call plus its own five-line lib file, zero change to
  this component.

[FORCES]
1. Clearing `page.tsx`'s territory before the FR-3 chart-redesign task lands > shipping a new FR this round
2. Simplicity > Pattern purity
```

---

## Archived 2026-08-06 — FR-3's chart half (collisions dashed-stroke chart, small multiples) (COMPLETE)

**Outcome:** delivered 5 of 5 budgeted files (`DeathsChart.tsx`/`.module.css` deleted,
`YearlyLineChart.tsx`/`.module.css` + `page.tsx` edit added); standard ordering throughout,
Cypress PASS on both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent.
FR-3 is now fully satisfied (dashed stroke + inline label, in both the table and this chart, via
one shared constant). Full narrative and reasoning in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Magnolia (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why small multiples, not a merged two-series chart (Cedar's correction, recorded)

The dispatch brief framed this task as "mount collisions as a second series on `DeathsChart.tsx`,"
which implies one shared-axis plot. Cedar rejected that outright rather than implementing it as
briefed. Deaths run 229–297; collisions run 85,546–231,564 — roughly an 800× spread. On one
zero-based linear axis, the deaths line would sit within ~0.15% of the axis height from zero:
visually indistinguishable from flat-at-zero. That erases the exact contrast (deaths essentially
flat, collisions cratering) that Task 2's Constraint 6 wrote the zero-based-axis rule to *protect*,
and it's `dataviz`'s own named anti-pattern #1 (dual/shared axes across incompatible scales invent
a correlation the data doesn't support; the prescribed fix is "two charts, small multiples, or index
both series to a common base"). This SPEC builds **two independently-scaled single-series charts**
instead — small multiples — each keeping its own zero-based axis.

That correction cascades cleanly: because each panel stays single-series, `dataviz`'s legend rule
("mandatory at ≥2 series in *one* plot") never fires, and the deferred tooltip/crosshair's original
justification (every value already reachable in the table below, and no series overlap so nothing
crosses) still holds — small multiples never let two lines cross. The three-way trigger the backlog
note (legend + tooltip + dashed stroke, all at once) was written against the merged-axis reading;
only the dashed-stroke trigger actually fires here.

**Component shape:** `DeathsChart.tsx` generalizes into `src/components/YearlyLineChart.tsx`, a
single-series line-chart component parameterized by explicit props (`fieldAlias`, `seriesLabel`,
`strokeStyle: "solid" | "dashed"`, `colorSlot: 1 | 2`, `ariaLabel`, `captionText`, optional `note`)
— mirroring `MetricSection<K>`'s already-established generic-over-`fieldAlias` shape, not a boolean
flag or config object. Two calls in `page.tsx` (deaths, collisions) replace the one. This is the
exact trigger Task 2's own Tipping Point pre-named ("a second series lands... the component stops
being `DeathsChart`... takes an explicit series list, gets renamed").

**Two copy sub-decisions, human-confirmed as proposed** (no change from the defaults below):
1. Deaths chart's `ariaLabel`/`captionText` stay byte-identical to Task 2's hardcoded strings, now
   passed explicitly as props instead of hardcoded internally.
2. Collisions chart reuses the identical reporting-policy sentence already shipped on the table
   (not a reworded chart-specific variant) — NFR-5's "in every rendering" reads most honestly as
   *the same claim*, not a paraphrase that could drift from it per rendering surface.

---

```markdown
[SPEC]
- **Objective**: Close FR-3's remaining chart half by adding recorded collisions per year as its
  own single-series, dashed-stroke, inline-labelled line chart — **not** a second `<Line>` merged
  onto `DeathsChart.tsx`'s axis. `DeathsChart.tsx` generalizes into
  `src/components/YearlyLineChart.tsx`, a parameterized single-series chart used twice: once for
  deaths (unchanged rendered output, solid, blue/slot-1) and once for collisions (new, dashed,
  orange/slot-2). The two charts are **small multiples**, not one two-series plot — see
  Intellectual Control for why a shared axis is rejected outright, not merely deferred.

- **Requirement**: **FR-3 [P0]** (PRD line 199) — closes the requirement fully. The data-half SPEC
  ("Collisions per year: the raw reporting-affected series") already satisfied the "display
  recorded collision counts" and "explicit inline label" clauses via the table; this task adds the
  "dashed stroke" clause FR-3 explicitly requires conjunctively with the label. Also: **NFR-3**
  (chart data stays available as the pre-existing accessible table; `role="img"` + `figcaption`
  pattern extended, not reinvented), **NFR-4** (no figure computed — both charts plot arrays
  already fetched and validated by `src/lib/socrata.ts`), **NFR-5** (the collision series now
  carries the dashed-stroke-plus-label treatment "in every rendering" — table and chart both;
  copy stays consistent between them, not reworded per surface), **NFR-6** (no new browser API).
  Explicitly **not** in scope: **FR-4** (% change — still blocked; see Tipping Point for why an
  indexed/percent view is a *different* component, not this one), **FR-9** (caveats section),
  **FR-13** (policy-date reference markers — a small-multiples design accommodates these more
  naturally later than a merged chart would have, but they are not added here), the severable
  FR-5–7 arrest group.

- **Inputs/Outputs**:

  **Phase 1 — Cypress (tests first, standard ordering).** This is new rendered behavior on a
  renamed component, so tests precede implementation per Rule 4.

  1. Rename `src/components/DeathsChart.test.tsx` → `src/components/YearlyLineChart.test.tsx`.
     Generalize its setup to `render(<YearlyLineChart {...deathsProps} />)` where `deathsProps`
     reproduces the **exact** current deaths configuration (`fieldAlias="deaths"`,
     `strokeStyle="solid"`, `colorSlot={1}`, the same synthetic 11/22/…/88 fixture, the same
     aria-label and caption strings passed as props instead of hardcoded). **Every existing pinned
     assertion in this file must keep passing unmodified in meaning** — the deaths configuration's
     rendered output does not change, only how its inputs arrive (props instead of internals).
     Add a new `describe("<YearlyLineChart> — collisions configuration (dashed)")` block, using an
     equally synthetic collisions fixture (never the real 231564/…/85546 column — same
     obviously-synthetic-number rule as the deaths fixture), asserting:
     - `strokeStyle="dashed"` produces a non-null, non-`"0"`, non-`"none"` `stroke-dasharray` on
       `.recharts-line-curve` (exact dash values are Magnolia's choice, not pinned here).
     - `colorSlot={2}` — assert via the rendered class/attribute the component actually uses to
       select the token (Magnolia's implementation choice; Cypress asserts the *effect*, e.g. that
       a distinct CSS custom property or class is present, not a literal hex — colour stays
       untestable-by-jsdom exactly as Task 2 established).
     - The `Legend: none` and `Tooltip: none` rows from Task 2's pinned contract still hold for
       **both** configurations (no `.recharts-legend-wrapper`, no tooltip DOM).
     - `note` renders as a second block inside `figcaption` only when provided; omitted (not an
       empty node) when absent — mirrors `MetricSection`'s `note !== undefined` pattern.
     - All of Task 2's marker/x-axis/y-axis/end-label/a11y assertions re-run against the collisions
       configuration too (parameterized test, not copy-pasted), proving genericity rather than
       assuming it.
     - Source-level greps (Constraint block, generalized): Constraint 1's grep changes from
       "exactly one `lib/*` type-only hit" to **"every `lib/socrata` reference under
       `src/components` is `import type`"** — `MetricSection.tsx` already has one such import, this
       task adds a second in `YearlyLineChart.tsx`, so the expected count is now **2**, both
       `import type`. Constraint 3's pinned-figure grep extends to also forbid the eight real
       collisions figures (231564, 211486, 112918, 110558, 103887, 96607, 91316, 85546) as literals
       anywhere in non-test `src/**`, alongside the existing deaths-figure pattern.
  2. Update `src/app/page.test.tsx`: the `vi.mock("../components/DeathsChart", …)` becomes
     `vi.mock("../components/YearlyLineChart", …)`; the stub differentiates calls by
     `props.fieldAlias` (e.g. `data-testid={`yearly-chart-${props.fieldAlias}`}`). Update every
     assertion currently keyed to "`DeathsChart` called once / not called" to check the **deaths**
     instantiation specifically, and add the parallel set for the **collisions** instantiation:
     called once positioned immediately before the collisions table when `collisionsResult.status
     === "ok"`; never called when `"empty"`/`"error"`; and — this is the independence guarantee
     already established for the three `MetricSection` blocks, now extended to charts — **a
     collisions failure must never suppress the deaths chart, and vice versa**. Update the
     `DeathsChartProps` type import to whatever `YearlyLineChart` exports.
  3. All new/changed assertions fail red against the current tree (no `YearlyLineChart.tsx`
     exists yet).

  **Phase 2 — Magnolia (implementation).**

  - *Step 0*: `node -v` / `npm -v` recorded (Amendment 3(b)); `npm ls recharts` — expect the same
    3.x already installed, unchanged. No new dependency this task.

  - *Output 1 — `src/components/YearlyLineChart.tsx`* (**new**, replaces `DeathsChart.tsx`,
    `'use client'`). Exports:

    ```ts
    import type { YearlyMetricRow } from "../lib/socrata"; // import type — see Constraint 1

    export type YearlyLineChartProps<K extends string> = {
      rows: YearlyMetricRow<K>[];
      fieldAlias: K;               // which row key to plot — mirrors MetricSectionProps<K>
      seriesLabel: string;         // Y-axis title text, e.g. "Deaths" | "Collisions"
      strokeStyle: "solid" | "dashed"; // FR-3's treatment; explicit, not a boolean
      colorSlot: 1 | 2;            // dataviz categorical slot — 1 = blue (deaths), 2 = orange (collisions)
      ariaLabel: string;           // role="img" accessible name, full text, caller-supplied
      captionText: string;         // figcaption's primary sentence, caller-supplied
      note?: string;               // FR-3's inline caveat; rendered as a second figcaption block only when present
    };

    export function YearlyLineChart<K extends string>(
      props: YearlyLineChartProps<K>,
    ): React.JSX.Element;
    ```

    No defaults, no options object, no `className`/width/height escape hatch — same discipline as
    Task 2's single-prop rule, just widened to the props that now genuinely vary across two live
    call sites (`composition-patterns`: parameterize what varies, nothing else).

    Rendered structure (contract; JSX shape is Magnolia's):
    ```html
    <figure class="figure">
      <div class="plot" role="img" aria-label="{ariaLabel}">
        <!-- ResponsiveContainer > LineChart > CartesianGrid, XAxis, YAxis, Line -->
      </div>
      <figcaption class="caption">
        {captionText}
        {note && <p>{note}</p>}
      </figcaption>
    </figure>
    ```

  - *Output 2 — `src/components/YearlyLineChart.module.css`* (**new**, replaces
    `DeathsChart.module.css`). Both series' tokens declared together (still **one** component, two
    instantiations — the Tipping Point's "second *component*" trigger for hoisting to
    `globals.css` has not fired):

    | Token | Light | Dark | Role |
    |---|---|---|---|
    | `--chart-series-1` | `#2a78d6` | `#3987e5` | categorical slot 1 — deaths |
    | `--chart-series-2` | `#eb6834` | `#d95926` | categorical slot 2 — collisions |
    | `--chart-grid` | `#e1e0d9` | `#2c2c2a` | shared chrome, unchanged from Task 2 |
    | `--chart-rule` | `#c3c2b7` | `#383835` | shared chrome, unchanged |
    | `--chart-ink` | `#52514e` | `#c3c2b7` | shared chrome, unchanged |

    The component selects between the two series tokens **without a colour literal in the `.tsx`
    file**: set an inline custom property on the `<figure>` whose *value* is a `var()` reference
    to the chosen slot — e.g. `style={{ "--chart-series": `var(--chart-series-${colorSlot})` }}` —
    and have every paint rule in this stylesheet (`.recharts-line-curve`, `.recharts-line-dot`)
    read `var(--chart-series)`, not `var(--chart-series-1)` directly. This is a reference to a
    named token, not a hex/`rgb`/`hsl` value, so Constraint 4 (no colour literal in `.tsx`) holds
    exactly as it did in Task 2. All other selectors (grid, axis line/tick, `.recharts-label`,
    `.endLabel`) carry forward byte-for-byte from `DeathsChart.module.css`.

  - *Output 3 — `src/app/page.tsx`* (**edited**). Replace the single `<DeathsChart rows={...} />`
    mount with two `<YearlyLineChart>` calls, each positioned exactly where its metric's chart
    belongs relative to the existing table blocks (deaths chart stays immediately above the deaths
    table, unchanged position; a new collisions chart is inserted immediately above the collisions
    `<MetricSection>`, at the seam already used for its `note` prop). Define one local constant so
    the chart's caveat text and the table's caveat text cannot drift apart:

    ```ts
    const COLLISIONS_REPORTING_NOTE =
      "This series is affected by a 2020 NYPD reporting-policy change that reduced how many " +
      "minor collisions are recorded; it is not evidence of a comparable drop in real collisions.";
    ```

    used both as `<MetricSection note={COLLISIONS_REPORTING_NOTE} .../>` (replacing today's inline
    literal) and as `<YearlyLineChart note={COLLISIONS_REPORTING_NOTE} .../>`.

    Chart copy, human-confirmed:
    1. Deaths chart: `ariaLabel="Line chart of NYC traffic deaths per year from 2018 to 2025."`,
       `captionText="NYC traffic deaths per year, 2018–2025. Every plotted figure is listed in the
       table below."` — byte-identical to Task 2's hardcoded strings, now passed explicitly.
    2. Collisions chart: `ariaLabel="Line chart of NYC recorded collisions per year from 2018 to
       2025."`, `captionText="NYC recorded collisions per year, 2018–2025. Every plotted figure is
       listed in the table below."`, `note={COLLISIONS_REPORTING_NOTE}`.

  - *Acceptance, by command, `node -v` recorded beside every result*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls recharts` — unchanged 3.x, no reinstall.
    3. `npm run dev`; load `/`, look at it in light **and** dark mode, desktop **and** 320px width:
       both charts render, deaths solid, collisions visibly dashed, no legend box on either, no
       horizontal scroll, no clipped end label on either panel. `git checkout -- CLAUDE.md`
       afterward.
    4. **Palette validation, recorded** (dataviz skill, both slots together since they appear on
       one page and the convention must hold across it):
       - `node <dataviz-base>/scripts/validate_palette.js "#2a78d6,#eb6834" --mode light --surface "#ffffff"`
       - `node <dataviz-base>/scripts/validate_palette.js "#3987e5,#d95926" --mode dark --surface "#0a0a0a"`
       Record resolved path and full output; halt and request a revised SPEC on any FAIL — do not
       re-pick a hue locally (this is why colorSlot 2 is pinned to the *documented* slot-2 orange,
       not an arbitrary "look distinct from blue" choice).
    5. The no-authored-figure grep, extended to the eight real collisions values (Constraint 3,
       generalized) → zero hits.
    6. The client-boundary greps, updated: `git grep -n 'lib/socrata' -- src/components` → exactly
       **2** hits (`MetricSection.tsx`, `YearlyLineChart.tsx`), both beginning `import type`.
       `git grep -n 'process\.env' -- src/components` → no hits (unchanged check).
    7. Report `src/app/page.tsx`'s new line count against the ~150-line Tipping Point.
    8. `npm audit`; report high/critical.

- **Query**: **none.** No `fetch`, dataset ID, or `$select`/`$where`/`$group`/`$order` is touched.
  Both charts consume `rows` already fetched and validated by `src/lib/socrata.ts` via
  `fetchDeathsPerYear()`/`fetchCollisionsPerYear()`, unchanged. `socrata.ts`, `deaths.ts`,
  `collisions.ts`, and both `*_SOQL` constants are **read-only to this task**.

- **Design Pattern**: **none — simple case, parameterization not a GoF pattern.** The variance
  (two metrics needing the same geometry with a different field, stroke, colour slot, and copy) is
  real and was pre-declared as the earned trigger in Task 2's own Tipping Point — but the fix is
  explicit props on one component, exactly `MetricSection<K>`'s already-adopted shape, not a
  Strategy/Factory/compound component. `composition-patterns` was consulted:
  `architecture-avoid-boolean-props` rules out a `showDashed`/`isCollisions` boolean;
  `patterns-explicit-variants` is why `strokeStyle`/`colorSlot` are typed unions, not derived
  implicitly from `fieldAlias` (colour assignment is a design decision independent of which field
  is plotted — a future third metric could need slot 3, not automatically "next available"). A
  merged two-series chart (which *would* justify a real pattern — a small series registry or a
  `<Chart.Line>` compound component) is explicitly rejected below, not merely deferred.

- **UI Scope**: **structural.** A second `role="img"` figure enters the page; a component is
  renamed and its props widen. Bounded exactly as Task 2 bounded it: only the two chart mount
  points and the shared note constant change in `page.tsx`; the `<h1>`, intro paragraph, all three
  tables, and all three disclosures are untouched.

- **Intellectual Control**:
  - *Why a shared y-axis is rejected outright, not deferred.* Deaths (229–297) and collisions
    (85,546–231,564) differ by ~800×. `dataviz`'s anti-pattern #1 names this exact shape of problem
    — a 0–30k series plotted against a 0–800k series — as fabricating an impression the data
    doesn't support, and its own prescribed fix is "two charts, small multiples, or index to a
    common base," never a shared or dual axis. Task 2's Constraint 6 argued zero-basing the deaths
    axis is an *integrity* requirement, not taste, specifically so the flatness of deaths reads
    honestly; putting collisions on that same axis would visually erase the exact thing Constraint
    6 protects. Indexing to a common base (=100 at 2018) is the one alternative the skill offers
    that stays on one axis — deliberately not taken here, because it changes the claim from "here
    are the two literal series" to "here is relative change," which is FR-4's territory (still
    blocked pending its own SPEC) and would require a new computed, tested transform rather than
    plotting the arrays as fetched.
  - *Why this means the "legend + tooltip" half of the prior Tipping Point doesn't fire.* Both
    triggers were written against a merged plot. Small multiples keep each panel single-series, so
    `dataviz`'s "single series needs no legend box" rule (marks-and-anatomy.md) applies to *both*
    panels independently, and the tooltip's original deferral reasoning — every value already sits
    in the table directly below, and nothing on the chart can ever visually cross since the two
    lines never share a plot — still holds without modification. Only the dashed-stroke trigger
    was ever really about the collisions series itself, and it fires here as intended.
  - *Why `colorSlot` is a separate prop from `fieldAlias`, not derived from it.* Coupling colour to
    the data key would make the component silently assume it only ever plots exactly two known
    fields. A future third chart (e.g. FR-12's casualty-filtered repair, if ever charted) should be
    free to take slot 3 (aqua — pre-validated all-pairs per `palette.md`) without the component
    needing a lookup table of field-name-to-colour baked in.
  - *Why `import type { YearlyMetricRow } from "../lib/socrata"` and not from `lib/deaths` or
    `lib/collisions`.* The component now genuinely serves either metric; importing a
    metric-specific module's type would misstate the dependency. `socrata.ts` is still the one file
    that reads the token, so the `import type` discipline from Constraint 1 carries forward
    unchanged — only the import path and the expected hit-count (now 2, matching `MetricSection`'s
    existing import) change.
  - *Why the collisions chart's caveat text is a shared constant, not restated.* NFR-5 requires the
    dashed-stroke-plus-label treatment "in every rendering." Two independently-typed copies of the
    same claim is exactly the drift ADR 0001 was written about — one wrong edit later and the table
    and the chart disagree about *why* the series is different, which is worse than either alone.
  - *Why this will not break at scale.* One component, two call sites, both fully parameterized;
    a third metric costs one more call, zero component change (mirrors `MetricSection`'s own
    already-proven claim). The two charts cannot disagree with their tables because both read the
    same `rows` arrays from the same `Promise.all` fetch; neither can fabricate a figure, since
    both write only `rows[rows.length-1][fieldAlias]` verbatim as their one authored figure.

- **Constraints**:
  1. **Client boundary absolute (NFR-2, Rule 3)**: `YearlyLineChart.tsx` never reads
     `process.env`, never value-imports `socrata.ts`; `import type` only. See acceptance clause 6.
  2. **Query frozen (Rule 4)**: no edit to `socrata.ts`, `deaths.ts`, `collisions.ts`, either route
     handler, or either `*_SOQL` constant.
  3. **No figure may be authored** — extends Task 2's Constraint 3 to the eight real collisions
     values; the mechanical hook covers the six-digit ones only (`96607`/`91316`/`85546` are
     five-digit and uncovered), so the source-grep is the net for all eight, exactly as it already
     is for deaths.
  4. **No colour literal in either `.tsx` file.** Same grep as Task 2, run against
     `YearlyLineChart.tsx`.
  5. **The dashed stroke is spent exactly once, on the collisions instantiation.** The deaths call
     passes `strokeStyle="solid"`; nothing else in the app may pass `"dashed"` this task.
  6. **Zero-based y-axis, linear interpolation, on *both* panels independently.** Neither chart's
     axis may be non-zero or shared with the other.
  7. **No animation, no `accessibilityLayer`** — both panels, unchanged from Task 2's Constraints
     7–8.
  8. **No new dependency.** `recharts` is already installed; nothing else may be added.
  9. **Files not to touch**: `src/lib/socrata.ts`, `src/lib/deaths.ts`, `src/lib/collisions.ts`,
     either route handler, `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`,
     `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`,
     `src/app/page.module.css`, `.claude/**`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/**`,
     `SESSION_STATE.md`.
  10. Amendment 3(b) and `npm audit` reporting, as standing clauses.

- **Edge Cases**:
  1. **Collisions `result.status` is `"empty"`/`"error"`** → no collisions chart at all (mirrors
     Task 2 Edge Case 1), independent of deaths' status.
  2. **Deaths `result.status` is `"empty"`/`"error"`** → no deaths chart, independent of
     collisions' status — the cross-metric independence already established for the tables now
     holds for the charts too.
  3. **jsdom `ResizeObserver`** — reuses the existing `vitest.setup.ts` stub; no change needed
     since it stubs the primitive, not a specific component.
  4. **A collisions row of unexpected magnitude** (e.g. a future year far outside the historical
     range) — the y-axis auto-scales from 0 as it already does; no clamping, no invented bound.
  5. **Very narrow viewport, dark mode** — both panels independently subject to Task 2's Edge
     Cases 6–7, unchanged reasoning.
  6. **Live figures have moved from the pinned table** — not this task's concern; `/verify-figures`
     is the mechanism, per standing policy.

- **Files** (max 5 — five used; test files are Cypress's own budget, not counted here, per Task
  2's established precedent):
  1. `src/components/DeathsChart.tsx` — **deleted**, superseded by Output 1.
  2. `src/components/DeathsChart.module.css` — **deleted**, superseded by Output 2.
  3. `src/components/YearlyLineChart.tsx` — **new.**
  4. `src/components/YearlyLineChart.module.css` — **new.**
  5. `src/app/page.tsx` — **edited.**

  **Not in this budget**: `src/components/YearlyLineChart.test.tsx` (renamed from
  `DeathsChart.test.tsx`) and `src/app/page.test.tsx` are Cypress's Phase 1 work, dispatched first.
  Flagging explicitly: the `page.test.tsx` diff from this rename is larger than usual (every
  `DeathsChart`-mock reference needs updating) — a known, bounded, one-time cost of honoring Task
  2's own pre-declared rename trigger rather than avoiding it.

- **Tipping Point**: revisit when **any one** trips:
  - **A genuine two-series-on-one-axis chart becomes justified** (comparable scales — e.g. an
    indexed-to-100 percent-change view under a future FR-4 SPEC, or arrests vs. deaths if ever
    scale-compatible). That is a **different component** — a real multi-line chart with the legend
    + crosshair/tooltip layer this task deliberately did not build — not a third `YearlyLineChart`
    call. Do not retrofit multi-series support onto `YearlyLineChart` in advance.
  - **A third single-series metric needs a chart** (e.g. FR-12's casualty-filtered repair). Costs
    one more `YearlyLineChart` call with `colorSlot={3}` (aqua, pre-validated all-pairs), zero
    component change — mirrors `MetricSection`'s already-proven claim exactly.
  - **`YearlyLineChart.tsx` exceeds ~140 lines**, or the label renderer grows a second case.
  - **`page.tsx` exceeds ~150 lines**, or holds more than ~4 chart/table pairs.
  - **A second *component* (not a second call site) needs the chart-chrome tokens** — only then do
    they hoist to `globals.css`.
  - **A measured performance problem** (real Slow-4G/Lighthouse number), not a hunch.

[FORCES]
1. Honesty of presentation (NFR-5) > matching the task's literal framing — a shared-axis chart was
   the requested shape, but it would fabricate the deaths-flatness claim the product exists to
   protect; small multiples is the correction, not a scope cut.
2. Earned parameterization (MetricSection's precedent) > a new GoF pattern for two call sites.
3. Simplicity > Pattern purity (always present unless explicitly overridden).
```

---

## Archived 2026-08-06 — FR-12: casualty-filtered "repaired" collisions, data half (COMPLETE)

**Outcome:** delivered 4 of 4 budgeted files (`socrata.ts` widened with an optional `extraWhere`
param, `repairedCollisions.ts` + its API route new, `page.tsx` gets a fourth independent table);
standard ordering throughout, Cypress PASS on both the Phase 1 red-test check and the Phase 3
audit — no rejection loop spent. FR-12 is fully closed (its text has no stroke/chart requirement,
unlike FR-3). The byte-identical invariant on `socrata.ts`'s 2-argument call path was verified
both by unit test and against the live API — all three pre-existing metrics' figures unchanged.
Full narrative in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why this task, not the seven candidates it was picked over (Cedar's reasoning, recorded)

Cedar was handed a backlog of seven candidates (deploy SPEC, FR-4, FR-9, FR-13, FR-5–7 arrest
group, the two hook defects — already fixed — and the live-browser QA gap) and instead recommended
**FR-12 — the casualty-filtered "repaired" collision series, data half only** — found by re-reading
the PRD directly rather than working only from the candidate list. FR-12 is **P0**, unshipped, and
the PRD's own text names it as the single most important remaining piece: *"the verified
remediation, which turns the product from diagnosis-only into diagnosis-plus-fix... it is P0
because without it the product diagnoses a problem and offers no usable number in its place."* The
page currently shows the break (deaths flat, collisions cratering) but never delivers the tagline's
second half — "the number you should use instead." FR-12 is that number. It was tracked across the
last five archived SPECs as queued backlog and was explicitly *blocked* until FR-3's chart half
landed, because it needs a raw collisions series to compare against — that landed the session
immediately before this one (`bfc6b81`). It is now, for the first time, genuinely unblocked.

Against the seven listed candidates: FR-4 (percent-change) and FR-9 (caveats) are both P0 and
legitimate next-in-line, but neither is thesis-central the way FR-12 is — FR-4 summarizes series
that already exist, FR-9 is prose around findings already shown; FR-12 adds a series nobody has
seen yet, the one the whole product exists to hand the reader. FR-13 and the FR-5–7 arrest group
are P1, and FR-5–7 additionally carries real design risk (secondary axis, borough-code trap, the
"enforcement caused deaths" misreading NFR-5 warns against). The deploy SPEC has a genuine open
question Cedar couldn't resolve unilaterally (is a Vercel project even connected?) — flagged for a
direct check rather than guessed at. The live-browser QA gap is tooling, not a spec-shaped task.
The two hook fixes are already done, correctly excluded.

The task itself is unusually well-scoped: the PRD pins the exact `$where` clause, the `mvcc-data`
skill pins the exact expected 8-year figures, and the PRD explicitly frames this as *"a single
additional SoQL query with a `$where` clause, not a new subsystem."* Unlike FR-3, FR-12's text
imposes no stroke/chart requirement — only "display... alongside the raw series" — so this task,
Redwood-only, is positioned to **fully close FR-12** rather than partially.

**A four-times-repeated pre-commitment, engaged with rather than silently followed or ignored.**
FR-12 was named in four consecutive prior SPECs as the trigger for widening `socrata.ts` past two
parameters ("parameterize at two, encapsulate at three... a Strategy or series registry is finally
earned" when a third distinct query *shape* arrives). Having the concrete case in hand, Cedar
declined that escalation: FR-12's actual variance is one additional AND-ed `$where` fragment — a
data value, not a second algorithm. A GoF Strategy pattern encapsulates interchangeable *behavior*;
nothing about `fetchYearlyMetric`'s fetch/validate/parse pipeline varies across any of the four
metrics, only three small strings do. Widening the signature with one more **optional, named,
non-boolean** parameter (`extraWhere?: string`) is the same "explicit typed parameters over a
hidden-branching config object" principle the FR-2 SPEC already used to justify the *current*
two-parameter shape. The real encapsulation trigger isn't "a third shape," it's **a second
independent axis of variation** — FR-6's borough filter (metric × borough), not FR-12 (metric, with
one shape variant). That correction is named explicitly here so it doesn't get silently inherited
as unexamined fact by the next session.

---

```markdown
[SPEC] — Casualty-filtered "repaired" collisions per year (FR-12), data half — the corrected number

- **Objective**: Add a fourth, independently-fetched yearly SoQL aggregate — recorded collisions
  where `number_of_persons_injured > 0 OR number_of_persons_killed > 0` — rendered on `/` as its
  own accessible table + FR-8 query disclosure, alongside the existing raw-collisions table. This
  is the product's stated "fix": the corrected trend the raw series (down 63%, an artifact of the
  2020 NYPD reporting-policy change) cannot provide. Unlike FR-3, FR-12's text imposes no
  stroke/chart requirement — it requires "display... alongside the raw series," which two tables
  on the same page satisfy — so this task is expected to **fully close FR-12**, not partially.
  Redwood only; no Magnolia work in this task.

- **Requirement**: **FR-12 [P0]** (PRD line 208) — casualty-filtered repaired collision series,
  fully satisfied by this task (see Intellectual Control for why, unlike FR-3, no follow-on
  chart SPEC is owed to close it). Also satisfies **FR-8 [P0]** (exact SoQL shown, a fourth
  independently-pinned query), **FR-10 [P0]** (defined empty/error state for a fourth metric,
  independent of the other three), **FR-11 [P0]** (absent/null core aggregate → error, never a
  silent zero — trap 1 applies here exactly as to deaths/injuries/collisions), **NFR-1** (ISR
  caching inherited via the shared transport; parallel fetch), **NFR-2** (token read stays
  confined to `socrata.ts`), **NFR-3** (a fourth screen-reader-accessible table), and **NFR-4**
  (every figure from SoQL aggregation — this task authors zero literals). Explicitly **not** in
  scope: any chart/visual overlay of this series (named as an optional, non-required future
  enhancement below, not owed); **FR-4** (% change — still blocked on a UI landing spot, unrelated
  to this task); **FR-9** (caveats — separate); **FR-13**; the severable FR-5–7 arrest group.

- **Inputs/Outputs**:
  - *Input*: a clean tree with FR-3's chart half merged (`bfc6b81`); `SOCRATA_APP_TOKEN` in a
    gitignored `.env`.
  - *Step 0*: run and record `node -v` / `npm -v` (Amendment 3(b), binding); must satisfy
    `engines.node` (`>=22.22.2`).

  - *Output 1 — `src/lib/socrata.ts`* (**edited**). Widen `buildYearlySoql`, `buildYearlyUrl`, and
    `fetchYearlyMetric` to accept a third, **optional** parameter, `extraWhere?: string`, AND-ed
    onto the fixed `WHERE_CLAUSE` when present:
    ```ts
    function whereClause(extraWhere?: string): string {
      return extraWhere ? `${WHERE_CLAUSE} AND ${extraWhere}` : WHERE_CLAUSE;
    }
    ```
    Replace the two literal `WHERE_CLAUSE` references in `buildYearlySoql`/`buildYearlyUrl` with
    `whereClause(extraWhere)`; add the parameter to `fetchYearlyMetric`'s signature and forward it
    to both builders. **`$group`/`$order` stay fixed constants, untouched — do not parameterize
    them here.** This is the sole change to the file. When `extraWhere` is omitted (all three
    existing callers), output must be **byte-for-byte identical** to today's — this is the load
    -bearing invariant, checked mechanically (Acceptance clause 5).

  - *Output 2 — `src/lib/repairedCollisions.ts`* (**new**). Fourth thin wrapper, same shape as
    `collisions.ts` plus the new third argument:
    ```ts
    import {
      buildYearlySoql,
      buildYearlyUrl,
      fetchYearlyMetric,
      type YearlyMetricResult,
      type YearlyMetricRow,
    } from "./socrata";

    const AGGREGATE_EXPR = "count(collision_id)";
    const FIELD_ALIAS = "repaired" as const;
    const EXTRA_WHERE =
      "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)";

    export const REPAIRED_COLLISIONS_SOQL = buildYearlySoql(
      AGGREGATE_EXPR,
      FIELD_ALIAS,
      EXTRA_WHERE,
    );
    export function buildRepairedCollisionsUrl(): URL {
      return buildYearlyUrl(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);
    }
    export type RepairedCollisionsRow = YearlyMetricRow<"repaired">;
    export type RepairedCollisionsResult = YearlyMetricResult<"repaired">;
    export function fetchRepairedCollisionsPerYear(): Promise<RepairedCollisionsResult> {
      return fetchYearlyMetric(AGGREGATE_EXPR, FIELD_ALIAS, EXTRA_WHERE);
    }
    ```
    `FIELD_ALIAS` is the lowercase single-word `"repaired"`, matching the `deaths`/`injuries`/
    `collisions` naming convention exactly (not `repairedCollisions` — an untested camelCase SoQL
    alias is an avoidable risk when a plain word already reads clearly in context: the module
    name, the table caption, and the column label all carry "repaired collisions"; the bare field
    key does not need to repeat it).

  - *Output 3 — `src/app/api/repaired-collisions/route.ts`* (**new**). `export async function
    GET()`, identical union-to-HTTP mapping as the three existing routes:

    | `status` / `kind` | HTTP | Body |
    |---|---|---|
    | `ok` | 200 | `{ status, soql, rows }` |
    | `empty` | 200 | `{ status, soql }` |
    | `error` / `upstream` | 502 | `{ status, soql, kind, reason }` |
    | `error` / `contract` | 422 | `{ status, soql, kind, reason }` |

  - *Output 4 — `src/app/page.tsx`* (**edited**). Fetch all four metrics **in parallel**:
    `const [result, injuriesResult, collisionsResult, repairedResult] = await Promise.all([...,
    fetchRepairedCollisionsPerYear()])` — not a sequential fifth `await` (NFR-1). After the
    existing collisions `MetricSection`, add a fourth, independent block:
    ```tsx
    <MetricSection
      fieldAlias="repaired"
      columnLabel="Repaired collisions"
      captionText="NYC collisions with a recorded injury or death per year, 2018–2025"
      result={repairedResult}
      soql={REPAIRED_COLLISIONS_SOQL}
      note={REPAIRED_COLLISIONS_NOTE}
    />
    ```
    `REPAIRED_COLLISIONS_NOTE` is a new local constant, sibling to the existing
    `COLLISIONS_REPORTING_NOTE`, verbatim text: *"This series counts only collisions with a
    recorded injury or death — records that still required an officer response after the 2020
    policy change, unlike the property-damage-only collisions the raw count above stopped
    capturing. It tracks close to the injuries trend and is the more reliable figure for judging
    whether collisions actually declined."* Correlation language only, no causal claim beyond the
    documented policy mechanism (mvcc-data skill: "this is documented policy, not inference").
    **All four metrics' branches stay fully independent** — one failing must never suppress or
    alter another's render, extending the guarantee established at three metrics to a fourth.

  - *Acceptance, by command, `node -v` recorded beside results*:
    1. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` each exit 0.
    2. `npm ls zod` and `npm ls recharts` — both unchanged; zero installs expected.
    3. `npm run dev`; `curl -s localhost:3000/api/deaths`, `/api/injuries`, `/api/collisions`
       unchanged, `status: "ok"`, 8 rows each; `curl -s localhost:3000/api/repaired-collisions` →
       `status: "ok"`, 8 rows.
    4. `/` renders all four tables (deaths, injuries, collisions, repaired collisions) plus both
       charts (deaths, collisions) plus all four disclosures, unchanged from before for the first
       three.
    5. **`git diff --stat` shows zero changes to `src/lib/deaths.test.ts`,
       `src/lib/injuries.test.ts`, `src/lib/collisions.test.ts`, `src/app/api/deaths/route.test.ts`,
       `src/app/api/injuries/route.test.ts`, `src/app/api/collisions/route.test.ts`, and
       `src/components/MetricSection.test.tsx`.** This is the mechanical proof that widening
       `socrata.ts`'s signature left the 2-argument call path byte-identical. If satisfying
       acceptance required editing any of these, report exactly which assertion broke and why —
       do not silently edit Cypress's files.
    6. The live `/api/repaired-collisions` response body pasted verbatim into the
       `[COMPLETION-REPORT]`. Cypress diffs it against the mvcc-data skill's pinned
       "Casualty-filtered" column and re-confirms the other three metrics are unchanged. Redwood
       transports; it does not judge correctness (NFR-4).
    7. `git grep -n SOCRATA_APP_TOKEN -- src .env.example` — token name still appears in exactly
       **one** source file (`socrata.ts`) plus `.env.example`, value in none.
    8. `npm audit`; report high/critical.
    9. **Report the final line count of `src/app/page.tsx`** beside the acceptance results,
       compared explicitly to the ~150-line Tipping Point. Not a blocking gate — report and flag,
       don't silently decompose or silently ignore it.

- **Query** (pinned; a contract, not an implementation detail — Rule 4):

  Dataset `h9gi-nx95`, base `https://data.cityofnewyork.us/resource/h9gi-nx95.json`. Same window
  and grouping as the other three metrics; the aggregate and the `$where` extension are new.

  **Repaired collisions (new, pinned by this SPEC):**
  ```
  $select = date_extract_y(crash_date) AS year, count(collision_id) AS repaired
  $where  = crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'
            AND (number_of_persons_injured > 0 OR number_of_persons_killed > 0)
  $group  = date_extract_y(crash_date)
  $order  = year
  ```
  Deaths, injuries, and raw-collisions clauses are **unchanged** — restated nowhere in code,
  verify against the live modules, do not re-derive.

  Header: `X-App-Token: <SOCRATA_APP_TOKEN>`, set only when non-empty.

  **Expected response shape** — a JSON array of exactly 8 objects, ascending by year, every
  numeric field a string:
  ```json
  [{ "year": "2018", "repaired": "45774" }, ... 8 entries through "2025" ]
  ```

  **Pinned figures (mvcc-data skill, verified 2026-08-03)** — for Cypress's diff, never a literal
  in `src/**`: Repaired collisions 2018→2025: 45774, 45439, 33362, 38809, 39336, 40472, 40229,
  37420 (−18.2% across the window). **All eight values are already in
  `guard-data-integrity.sh`'s pinned-literal list** — a real mechanical net exists here, same as
  the injuries/collisions figures did.

  **`count(collision_id)` chosen over `count(*)`**, matching `collisions.ts`'s established
  reasoning: a verified non-null primary-key field, so numerically equivalent, kept for a
  self-documenting FR-8 disclosure. **If Socrata rejects this query as constructed, halt and
  request a revised SPEC — do not repair it in place.**

- **Design Pattern**: **none — simple case**, with an explicit refinement of the multi-SPEC
  pre-commitment ("parameterize at two, encapsulate at three... a Strategy or series registry is
  finally earned" at a third query shape). Having the concrete third case in hand, a Strategy
  pattern is not earned by it: FR-12's variance is a single additional data value (one AND-ed
  `$where` fragment), not a second interchangeable *behavior* — `fetchYearlyMetric`'s fetch/
  validate/parse pipeline is identical across all four metrics; only three small strings differ
  per caller. `composition-patterns`' actual principle (explicit, typed, non-boolean parameters
  over a hidden-branching config object) is satisfied by a third **optional, named** parameter
  exactly as the first two were satisfied by two required ones — the object-oriented escalation
  the old shorthand anticipated is not the smallest thing that could work. **Correction recorded
  for the next session:** the real encapsulation trigger isn't "a third query shape," it's a
  **second independent axis of variation** — FR-6's borough filter, which multiplies against the
  metric axis (metric × borough) rather than adding one more optional field to it. That is where a
  small series registry stops being optional; this task does not cross that boundary.

- **UI Scope**: N/A — no chart, no CSS, no client component. `page.tsx`'s new markup is plain
  semantic HTML inheriting `globals.css` only, exactly as the collisions data-half task specified.
  A follow-on Magnolia SPEC could optionally overlay this series on the existing collisions chart
  panel (raw dashed, repaired solid — same units, no axis-mismatch problem the deaths/collisions
  split had) for a stronger visual "corrected vs. artifact" comparison; **named here as a future
  enhancement, not required by FR-12's text and not owed by this task.**

- **Intellectual Control**:
  - *Why this task, unlike FR-3's data half, is expected to fully close its requirement.* FR-3's
    text conjunctively requires a dashed stroke **and** a label — a table cannot render a stroke,
    so FR-3's data half was honestly recorded as partial. FR-12's text requires only "display...
    alongside the raw series" and explicitly self-describes as "a single additional SoQL query...
    not a new subsystem" — no stroke, no chart language at all. Two tables on the same page,
    fetched from the same window, literally satisfy "alongside." Recording this as fully closing
    FR-12 is the honest reading of the requirement as written, not a shortcut past it.
  - *Why `extraWhere` is a single optional string, not a config object or a richer query builder.*
    Widening the parameter surface further than the one dimension that actually varies (the
    `$where` clause) would be building for FR-6 before its SPEC exists to justify the shape — the
    same unearned-abstraction failure Rule 8 rejected when `fetchYearlyMetric` was first
    generalized. `$group`/`$order` remain fixed constants; only `$where` gained an extension point,
    because that is the only clause FR-12 actually needs to change.
  - *Why the byte-for-byte invariant on the 2-argument call path is the load-bearing acceptance
    criterion.* `DEATHS_SOQL`, `INJURIES_SOQL`, and `COLLISIONS_SOQL` are frozen contracts (Rule 4)
    displayed on the page today (FR-8). Silently changing their output while "just adding a
    parameter" would be an invisible contract violation nobody would notice until Cypress's live
    `curl` diverged from the pinned table. Acceptance clause 5's unmodified-test-file check turns
    that invisible invariant into something `git diff --stat` can prove.
  - *Why the note is affirmative framing, not another caveat.* Every existing inline note on this
    page (`COLLISIONS_REPORTING_NOTE`) tells the reader a series is *unreliable*. This is the first
    note telling the reader a series is *the one to trust*, tying that claim to the same documented
    policy mechanism (officers still respond to casualty collisions) rather than asserting it
    independently — correlation/documented-fact language only, consistent with NFR-5.
  - *Why this will not break at scale.* `repairedCollisions.ts` knows nothing about deaths,
    injuries, or raw collisions by name. A fifth yearly-aggregate metric with a matching shape
    (same window, same group key, an aggregate and optionally one `$where` fragment) costs one
    more five-line file and zero further changes to `socrata.ts`. The real remaining boundary —
    a second independent axis (FR-6's borough filter) — is named above and un-triggered by this
    task.

- **Constraints**:
  1. **Token discipline (NFR-2, Rule 3).** `process.env.SOCRATA_APP_TOKEN` stays read **only**
     inside `src/lib/socrata.ts`. `repairedCollisions.ts` must not read it directly; no
     `NEXT_PUBLIC_`, no `'use client'` on any touched/new file.
  2. **No figure may be authored.** All eight repaired-collision values are in
     `guard-data-integrity.sh`'s pinned list — rely on that but not only on it; no figure from any
     of the four metrics may appear as a literal anywhere in `src/**` outside test files.
  3. **`REPAIRED_COLLISIONS_SOQL` is pinned by this SPEC and frozen from this point forward**
     (Rule 4). `DEATHS_SOQL`/`INJURIES_SOQL`/`COLLISIONS_SOQL` are unchanged and unread by this
     task except for verification.
  4. **No zero-coercion, anywhere, for any of the four metrics** (FR-11, trap 1). An absent key,
     `null`, or a non-matching string for `repaired` in any year of the window produces `status:
     "error"`, `kind: "contract"` for *that metric only*.
  5. **`socrata.ts`'s 2-argument call path must be byte-identical to today's output** — verified
     by Acceptance clause 5, not merely asserted.
  6. **No new dependency.** Zero install expected; halt and request a revised SPEC if one becomes
     necessary (Rule 9).
  7. **`DeathsChart.tsx`, `YearlyLineChart.tsx`/`.module.css`/`.test.tsx`, `MetricSection.tsx`
     untouched.** No chart change in this task.
  8. **No CSS authored or edited.** `globals.css`, `page.module.css` untouched.
  9. **Files not to touch**: `YearlyLineChart.tsx`, `YearlyLineChart.module.css`,
     `YearlyLineChart.test.tsx`, `MetricSection.tsx`, `src/lib/deaths.ts`, `src/lib/injuries.ts`,
     `src/lib/collisions.ts`, `src/app/api/deaths/route.ts`, `src/app/api/injuries/route.ts`,
     `src/app/api/collisions/route.ts`, `vitest.config.mts`, `vitest.setup.ts`, `tsconfig.json`,
     `eslint.config.mjs`, `next.config.ts`, `src/app/layout.tsx`, `globals.css`,
     `page.module.css`, `.claude/**`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/**`,
     `SESSION_STATE.md`.
  10. **`src/app/page.module.css` remains orphaned** — still owed to a future layout SPEC (FR-9
      remains the most likely owner).
  11. **Caching (NFR-1)**: inherited `next: { revalidate: 86400 }`, no second cache directive.
  12. **Bound every request**: `AbortSignal.timeout(10_000)`, inherited, unchanged.
  13. **Amendment 3(b)** binds: `node -v` recorded beside every acceptance result.
  14. `npm audit`; report high/critical, never `audit fix --force`.

- **Edge Cases**:
  1. **Network failure/timeout, for repaired collisions independently** → `error`/`upstream`; the
     other three metrics render normally if they succeeded.
  2. **Non-2xx from repaired collisions** → `error`/`upstream` naming the status code. No retry.
  3. **Non-JSON response from repaired collisions** → `error`/`upstream`, content-type guarded.
  4. **Zero rows for repaired collisions** → `status: "empty"`, HTTP 200, independent of the other
     three.
  5. **A year 2018–2025 missing from the repaired-collisions response** → `error`/`contract`
     naming the missing year. **Never zero-fill.**
  6. **A field present but `null`, empty string, non-numeric, or a JSON number instead of a
     string** → `error`/`contract` naming the year and offending value's type.
  7. **More than 8 rows, a duplicate year, or an out-of-window year** → `error`/`contract`.
  8. **`SOCRATA_APP_TOKEN` unset or empty** → omit the header, warn once per call (four warnings
     on one page load is acceptable).
  9. **Repaired collisions `ok` while any of the other three are `empty`/`error`, or vice versa,
     in any combination.** All four branches render independently — first four-way independence
     test; the existing three-way guarantee (FR-3 data half) must extend cleanly.
  10. **Deaths/injuries/raw-collisions `buildYearlySoql`/`buildYearlyUrl` output has changed at
      all** (even whitespace) when called with two arguments → this is a regression, not a valid
      SPEC outcome; halt.
  11. **The live 2025 figures have moved.** Report as a finding in the `[COMPLETION-REPORT]`; do
      not adjust or "sanity-correct." `/verify-figures` is the mechanism.
  12. **`CLAUDE.md` dirty after `dev`/`build`** → `git checkout -- CLAUDE.md`; expected, never
      committed.
  13. **`page.tsx`'s line count lands at or over ~150** → report prominently; do not silently
      extract a shared component to dodge it, and do not silently ignore it (Acceptance clause 9).

- **Files** (max 5 — four used):
  1. **`src/lib/socrata.ts`** — *edited.* Add optional third param `extraWhere` to
     `buildYearlySoql`/`buildYearlyUrl`/`fetchYearlyMetric`; no other change.
  2. **`src/lib/repairedCollisions.ts`** — *new.* `AGGREGATE_EXPR = "count(collision_id)"`,
     `FIELD_ALIAS = "repaired"`, `EXTRA_WHERE`, `REPAIRED_COLLISIONS_SOQL`,
     `buildRepairedCollisionsUrl()`, `RepairedCollisionsRow`, `RepairedCollisionsResult`,
     `fetchRepairedCollisionsPerYear()`.
  3. **`src/app/api/repaired-collisions/route.ts`** — *new.* `GET` only, identical
     union-to-HTTP mapping as the three existing routes.
  4. **`src/app/page.tsx`** — *edited.* Fourth parallel fetch; the new independent
     repaired-collisions `MetricSection` block plus `REPAIRED_COLLISIONS_NOTE`; no other change.

  **Not in this budget, and not owed by this task:** the deploy SPEC's Vercel/First-Load-JS
  obligations; `page.module.css`; any shared-component extraction beyond what's already in
  `MetricSection`; a chart overlay of this series (named above as optional future work).

  **If Redwood believes a fifth file is required**, halt and request a revision naming (i) the
  specific failure the extra file is the only thing that catches, and (ii) which of the four
  cannot carry it.

- **Tipping Point**: this is the fourth yearly-aggregate metric, the first to use the widened
  `extraWhere` parameter, and a page holding four independent series plus two charts. Decompose
  or revise when **any one** trips:
  - **`page.tsx`'s line count is at or over ~150 after this task** (Acceptance clause 9). Split
    the table+disclosure markup further, or move the per-metric constants out of `page.tsx` into
    their own module, then — not preemptively.
  - **A fifth yearly-aggregate metric with a *matching* shape arrives** (no new `$where`).
    Absorbed as a fifth one-line caller module; zero further changes to `socrata.ts` expected.
  - **A second independent axis of variation arrives** (FR-6's borough filter: metric × borough,
    not metric-with-one-more-optional-field). This is the corrected trigger for a small series
    registry — named explicitly here rather than left as the old, now-inaccurate "third shape"
    shorthand.
  - **FR-9 lands.** At that point, re-examine whether `REPAIRED_COLLISIONS_NOTE` and
    `COLLISIONS_REPORTING_NOTE` should become cross-references into the caveats section rather
    than standalone prose (the same deferred question named at FR-3's data-half close).

[FORCES]

1. Delivering the product's promised "number you should use instead" (FR-12, now unblocked) > continuing to add summary/context features (FR-4, FR-9) around a diagnosis with no fix on the page yet.
2. Honoring a four-times-repeated pre-commitment by engaging with it explicitly > either silently ignoring it or silently over-building a Strategy pattern the concrete case doesn't warrant.
3. Simplicity > Pattern purity (one optional parameter, not a config object or registry, for one data value that varies).
```

---

## Archived 2026-08-06 — FR-4: 2018→2025 percent-change summary line (COMPLETE)

**Outcome:** delivered 2 of 2 Redwood-budgeted files (`percentChange.ts` new,
`MetricSection.tsx` edited, +5 lines net, landed at 101 lines vs. the SPEC's own 115–120
estimate); standard ordering throughout, Cypress PASS on both the Phase 1 red-test check and the
Phase 3 audit — no rejection loop spent. FR-4 fully closed for all four metrics (the three named
by the requirement's text plus repaired collisions, a deliberate, named side effect of
`MetricSection`'s shared-component design, not scope creep). The `-0%` rendering trap Cypress
flagged in advance was verified fixed by hand-derivation, not just a passing test. Full narrative
in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why FR-4 over FR-9, and the two P1 candidates (Cedar's reasoning, recorded)

Re-reading the PRD directly rather than trusting the six-item candidate list handed to it, Cedar
confirmed deaths (FR-1), injuries (FR-2), collisions (FR-3, both halves), the SoQL disclosure
(FR-8), the error/empty state (FR-10), the fail-loud absent-aggregate guard (FR-11), and the
repaired-collisions "fix" (FR-12) are all closed. Two **P0** requirements remain: **FR-4**
(percent-change 2018→2025 for each metric) and **FR-9** (the caveats section). FR-4 was picked
over FR-9 this round on scope-readiness grounds, not centrality — FR-9 is also P0 and arguably
more thesis-central, but the ledger itself flags an unresolved design question on it (whether the
two existing inline notes, `COLLISIONS_REPORTING_NOTE` and `REPAIRED_COLLISIONS_NOTE`, should
become cross-references once FR-9 lands), which is a real judgment call worth its own dedicated
SPEC rather than folding in now. FR-4 has no such open question: it's a derived value computed
entirely from data already fetched and already validated by `socrata.ts` (no new query, no new
dataset access), it's mechanically enforceable as a pure, tested function (satisfying Rule 1/NFR-4
directly — the same "compute deterministically" pattern the project already uses everywhere else),
and it fits cleanly in 4 files, under the 5-file cap. FR-13 and FR-5–7 (both P1) and the deploy
obligation (a genuine open question about whether a Vercel project is even connected) were all
weighed and declined in favor of the two remaining P0 items.

The design deliberately computes from the first/last row of whatever array `MetricSection` is
given, never hardcoding 2018/2025 as a second copy of the analysis window `socrata.ts` already owns
exclusively per Rule 4. As a named, deliberate side effect, this also gives the already-shipped
repaired-collisions series (FR-12) a percent-change line, beyond FR-4's literal "three metrics," at
zero extra cost — accepted explicitly below, not snuck in.

This is a Redwood-owned task, not a Magnolia one: no chart, no layout restructuring, no styling —
a derived number rendered as text next to an existing table, the same category of work as the
FR-2/FR-3-data-half/FR-12 tasks that came before it.

---

```markdown
[SPEC]
- **Objective**: Compute and display the 2018→2025 percentage change for each yearly metric
  currently rendered by `MetricSection`, derived entirely from data already fetched and validated
  — no new query.
- **Requirement**: FR-4 [P0] — "The system shall compute and display the percentage change from
  2018 to 2025 for each of the three metrics independently."
- **Inputs/Outputs**:
  - `src/lib/percentChange.ts` exports:
    - `type ChangeSummary<K extends string> = { startYear: number; endYear: number; startValue: number; endValue: number; percentChange: number }` (percentChange is the unrounded float)
    - `computeChange<K extends string>(rows: YearlyMetricRow<K>[], fieldAlias: K): ChangeSummary<K> | null` — uses `rows[0]` as the start point and `rows[rows.length - 1]` as the end point (never hardcodes 2018/2025 — see Intellectual Control). Returns `null` if `rows.length < 2` or if the start value is `0` (division undefined).
    - `formatPercentChange(percentChange: number): string` — `Math.round`, whole-percent precision (matches PRD Appendix A's own "−63%"/"−20%"/"−1%" precision), a leading `+` only when the rounded value is strictly positive, no leading `+`/`-` glyph substitution beyond JS's native negative sign.
    - `formatChangeSummary<K extends string>(change: ChangeSummary<K>): string` — exact template: `` `${startYear}–${endYear} change: ${formatPercentChange(percentChange)} (${startValue} → ${endValue})` ``. No thousands separators — matches the existing table cells' unformatted-number convention (`page.tsx`/`MetricSection.tsx` render raw numbers today; introducing `Intl.NumberFormat` here would make this line inconsistent with the table two lines above it).
  - `MetricSection` (ok branch only): after the table, before the optional `note`, calls
    `computeChange(result.rows, fieldAlias)`; if non-null, renders
    `<p>{formatChangeSummary(change)}</p>`; if `null`, renders nothing (same "omitted entirely,
    not an empty paragraph" convention `note` already uses).
- **Query**: None. This task adds no new SoQL, fetch, or dataset access, and touches no
  `$select`/`$where`/`$group` clause or the analysis window — all of which stay exclusively owned
  by `src/lib/socrata.ts` per Rule 4. It operates purely on `result.rows`, the same
  already-fetched, already-validated array `MetricSection` already renders into its `<table>`
  (sourced from `DEATHS_SOQL`/`INJURIES_SOQL`/`COLLISIONS_SOQL`, and — see Accepted Scope below —
  incidentally `REPAIRED_COLLISIONS_SOQL` too).
- **Design Pattern**: none — simple case. One pure function, reused generically through
  `MetricSection`'s existing `<K extends string>` type parameter — the same generic-transport shape
  `socrata.ts` and `MetricSection` already established. No interchangeable behavior to encapsulate.
- **UI Scope**: N/A — not chart/layout/styling work. A derived text value appended to an existing
  presentational component, same category as FR-2/FR-3-data-half/FR-12 (Redwood-owned, no chart or
  layout change). One new `<p>` element is added to the DOM, but the layout it's added to is
  unchanged.
- **Intellectual Control**: `computeChange` takes the *first and last row of whatever array it's
  given* rather than parameterized `startYear=2018`/`endYear=2025` literals. This keeps
  `MetricSection` fully decoupled from the specific analysis window — which `socrata.ts` already
  owns exclusively per Rule 4 — and avoids a second, driftable copy of "2018"/"2025" living in a
  presentation component. It also means zero changes are needed to `MetricSection.test.tsx`'s
  existing 2-row synthetic fixture's *year values* (2018/2019) to exercise this feature — a smaller,
  more honest diff than hardcoding boundary years would have produced. Because `MetricSection` is
  called identically for all four current metrics, this fires for the repaired-collisions series
  too, not just the three FR-4 names by number — named and accepted explicitly below rather than
  either silently building it or silently declining it.
- **Accepted scope beyond FR-4's literal text**: FR-4 names "the three metrics" (deaths, injuries,
  collisions — FR-1–3). Because `MetricSection` is the single shared component all four current
  metrics render through, the repaired-collisions series (FR-12) gets a percent-change line too, at
  zero extra implementation cost. This is accepted deliberately: it reinforces FR-12's own claim (the
  PRD's Appendix A already states the repaired series' change as −18.2%, independently re-derivable
  here from live-fetched rows, never a hardcoded copy of that figure) and costs nothing beyond what
  the generic design already produces. If a future reviewer wants it *suppressed* for repaired
  collisions specifically, that's a one-line follow-up, not a re-architecture.
- **Constraints**:
  - No new NPM/PIP dependency — native `Math`/template strings suffice; no `Intl.NumberFormat`.
  - No PRD Appendix A figure (real or otherwise) appears as a literal in `percentChange.ts` or
    `MetricSection.tsx` — `guard-data-integrity.sh` enforces the known pinned list mechanically;
    Cypress's audit additionally confirms no *unlisted* real figure (e.g. any deaths-column value,
    which the guard's list omits) was pasted in either.
  - `percentChange.test.ts` uses synthetic, non-pinned fixture values only, matching
    `MetricSection.test.tsx`'s existing "no real deaths/injuries/collisions figures anywhere in this
    file" convention.
  - `formatPercentChange`/`formatChangeSummary` must not throw or render `NaN%`/`Infinity%`/`-0%`
    under any input `computeChange` can legally produce (it cannot produce a `0`-division case since
    that path returns `null` upstream, but `formatPercentChange` is tested standalone against `-0`
    and `0` regardless, since it is a separately exported, separately testable unit).
- **Edge Cases**:
  - `rows.length < 2` → `computeChange` returns `null` → nothing rendered. (Cannot occur for any of
    today's four real ok-status results, since `socrata.ts`'s `validateYearCoverage` guarantees
    exactly 8 rows before status can be `"ok"` — this branch exists for `MetricSection`'s own
    generic/synthetic test coverage and future callers, not today's real data.)
  - `rows[0][fieldAlias] === 0` → `computeChange` returns `null` (division undefined) → nothing
    rendered, never `Infinity%`.
  - Multiple `MetricSection` instances on one page (today: deaths, injuries, collisions, repaired
    collisions) each compute and render their own change line independently — proven once
    generically in `MetricSection.test.tsx`, not re-proven per real metric in `page.test.tsx` (no
    change expected/needed there; see Files).
  - This is *not* a Rule 4 / FR-11 fail-loud case: FR-11's absent-key-as-zero mandate is scoped to
    "the core yearly aggregates" (deaths/injuries/collisions/arrests), already protected upstream by
    `socrata.ts` before `MetricSection` ever sees an `"ok"` result. A missing/undefined-baseline
    percent-change is a secondary, derived summary line — omitting it silently loses nothing the
    full table beneath it doesn't already show in full.
- **Files** (4, under the 5-file cap):
  1. `src/lib/percentChange.ts` (new)
  2. `src/lib/percentChange.test.ts` (new)
  3. `src/components/MetricSection.tsx` (edit)
  4. `src/components/MetricSection.test.tsx` (edit — extend fixtures/assertions; note in particular
     that the existing "does not render a `<p>` note element at all when note is absent" test
     currently asserts via `container.querySelector("table + p")` and **will now find the new
     change-summary `<p>`** if it renders immediately after the table — that test's *original
     intent* (no *note* paragraph without a `note` prop) must be preserved by scoping it to the note
     text/element specifically, not "no `<p>` anywhere after the table." This is a necessary,
     in-scope update, not scope creep — same category as the disclosure-count bumps in prior SPECs.)
  - `src/app/page.tsx` and `src/app/page.test.tsx` are **not** touched: `MetricSection` computes
    internally from the `result` it already receives, so no new prop needs threading from `page.tsx`,
    and no existing `page.test.tsx` assertion does exact-equality text/child-count matching that a
    new sibling paragraph would break (verified by reading the file: all body-text assertions use
    `.toContain`/`.toBeGreaterThan`, never exact match; table-scoped row-count assertions are scoped
    to `within(table)`, unaffected by a sibling `<p>`).
- **Tipping Point**: `MetricSection.tsx` is 96 lines today; this task is expected to land it around
  115–120. Revisit (extract the change-line rendering into its own small component, or reconsider
  `MetricSection`'s single-file shape) at ~140 lines, or if a second independent computed-derivative
  feature (beyond percent-change) needs its own render branch — whichever comes first.

[FORCES]
1. Derive from already-fetched data > add a new query — the figure is arithmetic on data the page
   already trusts, not a new Socrata round-trip.
2. Generic (first/last row) > window-specific (hardcoded 2018/2025) — keeps the analysis-window
   contract owned solely by `socrata.ts`, per Rule 4.
3. Simplicity > Pattern purity (always present).
```

---

## Archived 2026-08-06 — FR-9: caveats section, five items (COMPLETE)

**Outcome:** delivered 2 of 2 Redwood-budgeted files (`Caveats.tsx` new at 61 lines, within the
60–80 estimate; `page.tsx` edited, +4 net production lines); standard ordering throughout, Cypress
PASS on both the Phase 1 red-test check and the Phase 3 audit — no rejection loop spent. FR-9
fully closed — the sole remaining P0 requirement. Cedar resolved its own twice-flagged open design
question (additive, not a consolidation of the two existing inline notes) without needing a
`/grill-me` round. The verbatim-prose constraint was independently re-verified byte-for-byte by
Cypress's audit via a standalone script diff against SPEC.md's pinned text, not just a passing
test. Full narrative in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why FR-9, and why no `/grill-me` round was needed (Cedar's reasoning, recorded)

FR-9 is the sole remaining P0 requirement — FR-1–4, FR-8, FR-10–12 are all closed. This round the
two axes from the last two picks (centrality vs. scope-readiness) don't conflict: re-reading the
PRD directly confirms nothing else P0 is hiding in the text, and the "open design question" flagged
twice on the ledger turns out to be resolvable, not genuinely ambiguous — no `/grill-me` needed.
Reading FR-9's actual text (§5.3 item 9) against the two existing inline notes
(`COLLISIONS_REPORTING_NOTE`, `REPAIRED_COLLISIONS_NOTE`) shows they don't overlap in content at
all: the notes never mention the two policy dates, borough-coverage drift, the COVID confounder,
congestion pricing, or DOT SIP placement. There's nothing to consolidate or deduplicate, so this
isn't a "cross-reference vs. coexist" dilemma — it's additive. The one real, previously-deferred
decision (flagged explicitly in the FR-3 data-half archive: *"Cedar chose to state the documented
cause directly instead of leaving a forward reference to nothing... named this as FR-9's decision
to revise later"*) is closed here: both notes gain a one-sentence forward pointer to the new
section. FR-13 (policy-date markers, P1, Magnolia chart work) and FR-5–7 (severable P1, still
carrying its named design risks) stay deferred — not urgent this round, and FR-13 in particular
benefits from sequencing after FR-9 since it will want the same two dates FR-9 pins as prose. The
deploy `[SPEC]` obligation is still blocked on the same unresolved "is a Vercel project connected?"
question as the last two rounds — flagging again rather than guessing. The chart-overlay idea and
the live-browser QA gap are noted but not picked; nothing changed to promote either over the last
P0 item.

This is a Redwood-owned task — no chart, no CSS, no visual design decision, same category as FR-3's
data-half note and FR-12's new section, both of which added new DOM structure to `page.tsx` without
becoming Magnolia work.

---

```markdown
[SPEC]
- **Objective**: Add a standalone, page-level caveats section covering the five items FR-9 names,
  and close the forward-reference gap the FR-3 data-half SPEC deliberately deferred by pointing
  both existing inline notes at it.
- **Requirement**: FR-9 [P0] — "The system shall display a caveats section covering: the
  reporting-drift finding with its two documented policy dates (Staten Island pilot 2019-03-18;
  citywide 2020-04-06), the borough-coverage drift, the COVID/vehicle-speed confounder, the
  January 2025 launch of Manhattan CBD congestion pricing..., and the geographically non-random
  placement of NYC DOT Street Improvement Projects..."
- **Inputs/Outputs**:
  - `src/components/Caveats.tsx` — a zero-prop Server Component (no `'use client'`; static
    content only, same posture as `MetricSection`). Renders:
    ```html
    <section aria-labelledby="caveats-heading">
      <h2 id="caveats-heading">Caveats</h2>
      <p>{INTRO}</p>
      <h3>The 2019–2020 reporting-policy change</h3>
      <p>{ITEM_1}</p>
      <h3>Borough-field coverage isn't complete or constant</h3>
      <p>{ITEM_2}</p>
      <h3>The pandemic-era rise in deaths, 2020–2021</h3>
      <p>{ITEM_3}</p>
      <h3>Manhattan congestion pricing, January 2025</h3>
      <p>{ITEM_4}</p>
      <h3>Street Improvement Project placement</h3>
      <p>{ITEM_5}</p>
    </section>
    ```
    Exact text, to be reproduced verbatim (matches the `COLLISIONS_NOTE_TEXT`/`REPAIRED_NOTE_TEXT`
    "copied exactly, not paraphrased" convention already established for note strings):
    - `INTRO`: "The figures above are accurate to what NYPD recorded, but the record itself has
      documented limits. Five are covered here."
    - `ITEM_1`: "Every collision-count figure on this page after early 2020 is affected by a
      documented change in NYPD procedure, not a change in how many collisions actually happened.
      NYPD piloted a policy of no longer dispatching officers to property-damage-only collisions in
      Staten Island on 2019-03-18, and made it permanent citywide on 2020-04-06. Drivers in those
      crashes now exchange information themselves and file a report with the state DMV, and those
      filings never reach the dataset this page reads from. The deaths and injuries series above are
      largely unaffected — both still require an officer or a hospital record — which is why they
      hold roughly flat while the raw collision count falls."
    - `ITEM_2`: "This dataset's borough field is left blank on a substantial share of rows, and how
      completely it's filled in has changed over the 2018–2025 window rather than staying constant.
      Any claim broken out by borough should be read alongside that fact, not as if the field were
      fully and evenly populated across every year."
    - `ITEM_3`: "Deaths and injuries both rose in 2020–2021 even as recorded collisions fell.
      Nationwide, average vehicle speeds increased during pandemic-era lockdowns as roads emptied,
      which independently raises crash severity. This page does not attribute the 2020–2021 rise, or
      any later change, to enforcement activity or its absence — it shows the series moving together
      and names this as one of the reasons a causal reading isn't supported."
    - `ITEM_4`: "Manhattan's Central Business District congestion pricing program began in January
      2025 and reduced traffic entering that zone. Any claim about Manhattan specifically that runs
      through a 2025 endpoint should be read with that launch in mind as a possible contributor,
      separate from anything this page attributes to reporting or enforcement."
    - `ITEM_5`: "NYC DOT's own reporting states that street-redesign investment since 2014 was
      concentrated deliberately in lower-income neighborhoods and communities of color, including
      several in the Bronx. A borough's deaths trend can therefore reflect a targeted infrastructure
      intervention rather than, or in addition to, anything this page measures about reporting or
      enforcement."
  - `src/app/page.tsx`: mount `<Caveats />` as the last child of `<main>`, after the repaired-
    collisions `MetricSection`, unconditionally (not gated on any `result.status`). Add one new
    shared constant:
    ```ts
    const SEE_CAVEATS_POINTER =
      " See Caveats, below, for the two policy dates and other limits on this figure.";
    ```
    and append it (string concatenation, not a rewrite) to the end of both
    `COLLISIONS_REPORTING_NOTE` and `REPAIRED_COLLISIONS_NOTE`.
- **Query**: None. No SoQL, no new fetch, no dataset access. All five items are static, dated,
  already-verified prose sourced from PRD §5.3 FR-9's own text and the "documented cause" section
  of Appendix A — not a live aggregate, so nothing here is a "displayed figure" NFR-4 governs.
- **Design Pattern**: none — simple case. A fixed list of five static items with no interchangeable
  behavior and no variance to encapsulate.
- **UI Scope**: structural — a new `<section>` landmark and heading hierarchy are added to the DOM.
  Assigned to Redwood, not Magnolia, per the precedent set by FR-3's data-half note and FR-12's new
  `MetricSection` block: no chart, no new CSS, no color/motion/responsive decision — plain semantic
  HTML content addition, the same category of work as those two prior tasks.
- **Intellectual Control**:
  - A dedicated component, not inline `page.tsx` prose, for the same reason `MetricSection` was
    extracted: keeps `page.tsx` thin (currently 122 lines; five inline paragraphs would push it well
    past its own historical ~150-line Tipping Point) and makes the section independently testable.
  - Renders unconditionally, independent of all four metrics' fetch status. Unlike `MetricSection`,
    Caveats has no data dependency — a reader is arguably most in need of these caveats exactly when
    something *has* gone wrong (an error state showing), so gating it behind any `result.status`
    would be actively wrong, not merely unnecessary.
  - The two policy dates (2019-03-18, 2020-04-06) are hardcoded as prose deliberately: they are
    fixed historical facts named directly in FR-9's and FR-13's own PRD text, not Socrata-derived
    aggregates — the same category as the "2018–2025" window text already hardcoded throughout the
    codebase's `captionText` strings, not a figure NFR-4 restricts.
  - No percentage or count (borough-coverage rate, Manhattan enforcement delta, etc.) appears
    anywhere in `Caveats.tsx`. Those numbers' authoritative home is FR-7's not-yet-built persistent
    borough-filter warning; restating them here would be a second, driftable copy of a figure this
    task has no mechanism to keep in sync (ADR 0001's exact failure mode). FR-9's list item is
    satisfied qualitatively — "covering... the borough-coverage drift" — without needing the number.
  - **Declined optimization, named rather than silently skipped**: FR-13 will also need these two
    dates (as chart-axis reference-marker positions, a different shape of need — a coordinate, not
    a sentence). Pre-extracting a shared `policyDates.ts` module now, before FR-13 has its own SPEC,
    would be the unearned-generality failure Rule 8 rejects — the same discipline the FR-3 data-half
    SPEC applied to "don't build for a requirement that hasn't been specced yet." Revisit when FR-13
    is actually specced.
  - The cross-reference is a plain trailing sentence appended to the existing note strings, not a
    hyperlink. Making it a real anchor link would require widening `MetricSection`'s and
    `YearlyLineChart`'s `note?: string` prop to accept `ReactNode`, touching two additional frozen,
    already-tested component contracts for a one-line addition — declined in favor of the minimal
    change that still closes the deferred decision. The section heading still carries
    `id="caveats-heading"` so a future SPEC can add real anchors cheaply if wanted.
- **Constraints**:
  - No new NPM/PIP dependency.
  - `Caveats.tsx` stays a Server Component — no `'use client'`, no interactivity, matching
    `MetricSection`'s precedent.
  - Prose above must be reproduced verbatim, not paraphrased — Cypress will assert against it with
    `toContain`, matching the `COLLISIONS_NOTE_TEXT`/`REPAIRED_NOTE_TEXT` convention.
  - Heading hierarchy must not skip a level: `page.tsx`'s existing `<h1>` → Caveats' `<h2>` →
    Caveats' five `<h3>`s — axe-core's heading-order rule is part of the acceptance gate.
  - `SEE_CAVEATS_POINTER` is defined once and appended to both notes via concatenation — not two
    independently typed copies (same ADR 0001 discipline `COLLISIONS_REPORTING_NOTE`'s own header
    comment already names).
- **Edge Cases**:
  - Caveats renders identically regardless of whether any/all of the four `Promise.all` fetches
    return `"ok"`, `"empty"`, or `"error"` — assert this directly (mock all four to error, confirm
    the Caveats heading and all five item headings are still present).
  - `guard-data-integrity.sh`'s pinned-figure list must stay green — none of the five items or the
    pointer sentence contain any of the guarded literals (verify by running the hook standalone
    post-edit, not just trusting the PostToolUse pass).
  - The appended pointer text must not break any existing `toContain(COLLISIONS_NOTE_TEXT)` /
    `toContain(REPAIRED_NOTE_TEXT)` assertion in `page.test.tsx` — those are substring checks against
    the *original* (unappended) constants defined in the test file itself, so they remain valid
    against the longer, pointer-appended strings in `page.tsx` without modification. Confirm this by
    reading the test file, not by assuming.
- **Files** (4, under the 5-file cap):
  1. `src/components/Caveats.tsx` (new)
  2. `src/components/Caveats.test.tsx` (new)
  3. `src/app/page.tsx` (edit — mount `<Caveats />`; add `SEE_CAVEATS_POINTER`; append it to both
     existing note constants)
  4. `src/app/page.test.tsx` (edit — assert Caveats renders, assert it renders unconditionally
     across all four metrics' error/empty paths, assert the pointer sentence is present in both
     notes' rendered text)
- **Tipping Point**: `Caveats.tsx` is expected to land around 60–80 lines. Revisit (split items into
  their own data-driven list, or reconsider the flat five-`<h3>` shape) if a sixth item is ever
  named, or once FR-13/FR-5–7 land and this file's static dates start wanting to be shared with
  chart code — the trigger named above, not a line count in isolation.

[FORCES]
1. Additive, standalone section > rewriting the two existing inline notes — the two content
   surfaces don't overlap, so consolidating them would manufacture a merge neither requirement asks
   for.
2. Qualitative caveat text > restating a pinned percentage — the borough-coverage and enforcement
   numbers belong to FR-7's not-yet-built warning; a second copy here is exactly the drift ADR 0001
   was written about.
3. Simplicity > Pattern purity (always present).
```

---

## Archived 2026-08-07 — FR-13: policy-date reference markers, both charts (COMPLETE)

**Outcome:** delivered 5 of 5 budgeted files (`policyDates.ts` new, `YearlyLineChart.tsx`/
`.module.css`/`.test.tsx` edited, `policyDates.test.ts` new); standard ordering throughout,
Cypress PASS on both the Phase 1 red-test check and the Phase 3 audit. One retry-adjacent event,
not a rejection-loop cycle: Magnolia's implementation was correct against the SPEC (318/319 tests)
but surfaced a stale pre-existing test in Cypress's own file (a Task-2-era "no paragraph when note
absent" assertion that FR-13's new unconditional caption paragraph legitimately violated) — the
same bug class Cypress had already caught once on a different file during FR-4. Routed back to
Cypress to fix its own test rather than treated as a Magnolia defect; 319/319 after the fix, full
audit PASS on the same pass. Magnolia's session was also interrupted mid-verification by a usage
limit and resumed from transcript rather than respawned, catching and fixing one genuine bug
(`isFront` isn't a valid Recharts `ReferenceLine` prop) before the interruption. FR-13 fully
closed — the product now visually locates the 2019/2020 reporting-policy break on both the deaths
and collisions charts, not just in FR-9's prose. Full narrative in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-06 · **Human-approved (HITL):** 2026-08-06, Rayan
**Then:** Cypress (failing tests first) → Magnolia (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## Why FR-13, and the deploy-SPEC question resolved to a plain ask (Cedar's reasoning, recorded)

Checked the deploy-SPEC question fresh rather than declining it on inherited faith a fourth time:
there is no `.vercel/` directory, no `vercel.json`, and no `vercel` entry anywhere in
`package.json` — nothing in this repo shows a locally-linked Vercel project. But that check is
necessarily inconclusive: a Vercel project imported through the dashboard from the GitHub remote
(`github.com/rhaeyyan/pursuit-mvcc-data-integrity`, confirmed in `.git/config`) leaves **no trace
in the repo at all** unless someone has run `vercel link` locally — so absence of `.vercel/` proves
"not linked from this machine," not "not linked." This is genuinely external state Cedar cannot
resolve by reading files. Not spending a task slot on it, but it no longer needs re-flagging as
unattempted — it's now a one-line factual question for the human ("is a Vercel project connected to
this GitHub repo?"), not a standing mystery.

FR-5–7 stays out this round on the same grounds three straight sessions have named: it bundles a
new dataset fetch, the borough-code trap, a dual-axis chart, and the "enforcement caused deaths"
misreading NFR-5 explicitly warns against — real design risk (PRD §7 rates it Med/Med and names
"default the enforcement series off" as a live mitigation option), not a single 5-file task. It
stays queued, not because it's unimportant, but because nothing forces it ahead of a cleanly-scoped
P1 that's sitting ready.

The repaired-vs-raw chart overlay stays declined for the same reason it was declined when FR-12
named it: no FR's literal text requires it, FR-12 is already fully closed by two side-by-side
tables, and Rule 8 doesn't let it get built just because it would look nice. The live-browser QA
gap is confirmed environment-blocked (`sudo` required, no password in this sandbox) and isn't
spec-shaped — noted, not picked.

FR-13 is the one candidate that's both well-motivated *now* (FR-9 shipped and already pins these
exact two dates as prose, and FR-9's own closing SPEC named "FR-13 gets specced" as the explicit
trigger to stop deferring a shared `policyDates.ts` module) and cleanly scoped: no new SoQL (both
dates are already-verified static facts, not a query result — NFR-4 doesn't apply), touches only
`YearlyLineChart.tsx`/its CSS/a new tiny data module, and fits in 5 files including tests without
touching `page.tsx` at all. The one real design question — Recharts' category x-axis
(`type="category"`, one tick per year) can't express a day-level date position, only a year — is
resolvable with a defensible engineering call rather than a `/grill-me` round: snap each marker to
its containing year's category tick, and carry the actual day-level precision in the marker's text
label instead of its position, which is the same "never encode meaning by position/color alone,
always pair it with explicit text" discipline NFR-5 already establishes for the dashed collisions
stroke.

---

```markdown
[SPEC]
- **Objective**: Mark the two documented NYPD reporting-policy dates as labelled vertical reference
  lines on every `YearlyLineChart` instance, and extract the two dates into a shared, reusable data
  module — closing the deferred extraction FR-9's own closing SPEC named as FR-13's trigger.
- **Requirement**: **FR-13 [P1]** (PRD §5.3 item 13) — "The system shall mark the two documented
  policy dates on the time axis — 2019-03-18 (Staten Island pilot) and 2020-04-06 (citywide) — as
  labelled reference markers, so the structural break is located visually rather than only
  described in prose."
- **Inputs/Outputs**:
  - `src/lib/policyDates.ts` (new) — the single source of truth both the visual markers and the
    accessible caption sentence below are generated from, so the two can never independently drift:
    ```ts
    export type PolicyDateMarker = {
      year: number;      // the category-axis tick this marker snaps to
      isoDate: string;   // the actual day, carried in text only — the axis cannot express it
      label: string;     // pinned verbatim below, asserted by Cypress with toBe
    };

    export const POLICY_DATE_MARKERS: readonly PolicyDateMarker[] = [
      { year: 2019, isoDate: "2019-03-18", label: "Staten Island pilot begins" },
      { year: 2020, isoDate: "2020-04-06", label: "Citywide policy takes effect" },
    ];
    ```
  - `src/components/YearlyLineChart.tsx` (edit) — import `ReferenceLine` from `recharts` and
    `POLICY_DATE_MARKERS`/`PolicyDateMarker` (type) from `../lib/policyDates`. Add:
    - A pure helper (same posture as the existing `makeEndLabelRenderer`) that filters
      `POLICY_DATE_MARKERS` to markers whose `year` appears in `rows` (defensive — a future
      narrower panel, e.g. a Staten-Island-only story, may not cover both years) and returns
      that filtered list.
    - One `<ReferenceLine>` per surviving marker, `x={marker.year}`, rendered inside `<LineChart>`
      alongside the existing `<Line>` — **unconditional**, not behind a new prop. No boolean prop is
      introduced (`composition-patterns` — `architecture-avoid-boolean-props`): every current and
      foreseeable call site (deaths, collisions, and any future single-series chart over the same
      fixed 2018–2025 window) wants the same two markers, so there is no real variance to gate.
    - A new pure function generating the accessible caption sentence from the same filtered marker
      list:
      ```ts
      function buildPolicyMarkerCaption(markers: PolicyDateMarker[]): string {
        const parts = markers.map((m) => `${m.isoDate} (${m.label})`).join(" and ");
        return `Vertical reference lines mark ${parts} — see Caveats, below, for details.`;
      }
      ```
      For the current full 2018–2025 window (both markers present), this renders verbatim as:
      `"Vertical reference lines mark 2019-03-18 (Staten Island pilot begins) and 2020-04-06
      (Citywide policy takes effect) — see Caveats, below, for details."`
      Rendered as an unconditional third `<p>` inside `<figcaption>` (after `captionText` and the
      optional `note`), present on **every** instantiation (deaths and collisions both), not gated
      by the `note` prop — the deaths chart currently has no `note` and must still carry this
      sentence, since the marker text is the only place a screen-reader user (who cannot see the
      vertical lines) learns the markers exist at all. When the filtered marker list is empty,
      render nothing (no empty `<p>`).
  - `src/components/YearlyLineChart.module.css` (edit) — a new token pair, same `.figure`-scoped /
    `prefers-color-scheme: dark` pattern already used for `--chart-series-1`/`-2`:
    ```css
    .figure {
      --chart-annotation: <light value, AA-contrast-validated>;
    }
    @media (prefers-color-scheme: dark) {
      .figure { --chart-annotation: <dark value, AA-contrast-validated>; }
    }
    .figure :global(.recharts-reference-line line) {
      stroke: var(--chart-annotation);
    }
    .figure :global(.recharts-reference-line .recharts-text) {
      fill: var(--chart-annotation);
    }
    ```
    `--chart-annotation` must be visually and numerically distinct from both `--chart-series-1` and
    `--chart-series-2` in both modes (a reference line must never be mistakable for a third data
    series), and its `stroke-dasharray` must be a real, non-empty pattern **different from** the
    `"8 6"` pattern `DASH_PATTERN` already spends on the reporting-affected collisions line — pick a
    finer pattern (e.g. a short dot/dash) so an annotation is visually distinguishable from a dashed
    *series* on sight, not just by a legend that doesn't exist here.
- **Query**: None. No SoQL, no new fetch. Both dates are static, already-verified historical facts —
  the same pinned values `Caveats.tsx`/FR-9 already renders as prose and the `mvcc-data` skill
  carries under "The documented cause." Nothing here is a Socrata-derived figure, so NFR-4 governs
  only in the negative sense: these two literals may be hardcoded (they are not aggregates), unlike
  a deaths/injuries/collisions count.
- **Design Pattern**: none — simple case. Two fixed markers, applied identically at every call site;
  no interchangeable behavior, no per-caller customization needed. The `policyDates.ts` extraction is
  duplication avoidance (single source of truth for the marker data), not a GoF pattern.
- **UI Scope**: structural — the chart's DOM gains two `<ReferenceLine>` elements, their label text,
  and a new always-rendered `<figcaption>` paragraph; this is new content, not a style-only change to
  the existing layout. Assigned to **Magnolia**.
- **Intellectual Control**:
  - **The categorical-axis compromise, stated rather than hidden.** `XAxis` is `type="category"`
    over discrete year values (`YearlyLineChart.tsx:118`) — there is no continuous time scale a
    day-precision date could sit on. Snapping `x={marker.year}` to the containing year's tick is the
    only geometrically honest placement available; day-level precision is preserved in the label text
    (`isoDate`) instead of implied by pixel position. This mirrors NFR-5's existing rule for the
    dashed collisions stroke: never let a visual encoding alone carry more precision than it actually
    has — pair it with exact text.
  - **Why markers render on both the deaths and the collisions chart, not collisions alone.** FR-13's
    stated purpose is locating the structural break "visually rather than only in prose." The
    product's whole small-multiples design (FR-3) exists to let a reader compare a discretionary
    metric against a non-discretionary one across the same window — showing the same two markers on
    the deaths panel lets a reader see, directly, that deaths didn't move across the exact boundary
    where collisions did. Omitting it from one panel would be an arbitrary asymmetry the requirement
    text gives no reason for.
  - **Why `policyDates.ts` is built now and not before.** FR-9's closing SPEC explicitly declined this
    extraction, naming "FR-13 has no SPEC yet to define what shape it needs" as the reason (Rule 8 —
    unearned generality). FR-13 now defines that shape precisely: `{ year, isoDate, label }`, a
    coordinate-shaped need distinct from FR-9's prose-shaped need. Building it now is the trigger
    firing, not a preemptive build.
  - **Why `Caveats.tsx` is deliberately *not* touched to import from this new module.** It would
    remove one instance of literal-date duplication, but `Caveats.tsx`'s five items are under a
    verbatim-prose test contract (`Caveats.test.tsx` diffs the shipped text character-for-character
    against `SPEC.md`'s pinned strings) — editing it for an unrelated task risks that contract for a
    cosmetic DRY gain on two fixed historical-fact literals, which is not the kind of duplication
    Rule 4 (query-as-contract) or ADR 0001 was written about: these are dates, not a SoQL clause that
    could silently diverge in meaning. Named here as a considered, bounded duplication, not an
    oversight — revisit only if `Caveats.tsx` is touched for its own reasons.
  - **Why the accessible sentence is generated from `POLICY_DATE_MARKERS`, not hand-typed per call
    site.** Two independently-authored copies of "the markers say X and Y" — one in the visual layer,
    one in text — is exactly the drift ADR 0001 exists to prevent. Deriving both from one array makes
    that drift structurally impossible rather than a matter of remembering to keep them in sync.
- **Constraints**:
  - No new NPM/PIP dependency — `ReferenceLine` ships in the already-installed `recharts@^3.10.1`.
  - No colour literal (`#rrggbb`/`rgb()`/`hsl()`) in `YearlyLineChart.tsx` — unchanged Constraint 4,
    extended to cover the new annotation code path.
  - No literal `"2019-03-18"`/`"2020-04-06"`/`"2019"`/`"2020"` date string in `YearlyLineChart.tsx`
    itself — both values must be read from `POLICY_DATE_MARKERS`, never re-typed.
  - `--chart-annotation`'s light and dark values must independently clear WCAG 2.2 AA contrast
    against `--background` in both modes — computed via the `dataviz` skill's validator, not
    eyeballed, matching the precedent set on the README diagram's palette work.
  - `prefers-reduced-motion` — unaffected; `isAnimationActive={false}` already applies chart-wide and
    reference lines introduce no new animation.
- **Edge Cases**:
  - A `rows` array that doesn't include one or both marker years (a hypothetical narrower future
    panel) must render only the markers whose year is present — never throw, never render a marker at
    an undefined position. The accessible caption sentence must reflect exactly the markers actually
    rendered (0, 1, or 2), never claim a marker that isn't drawn.
  - The existing "renders 2018 and 2025 as category ticks" / "never invents a fractional-year tick"
    tests in `YearlyLineChart.test.tsx` must still pass unmodified — reference lines must not add or
    alter any XAxis tick.
  - The existing end-value label and series-axis-label tests must still pass unmodified — the two new
    marker `<text>` label nodes must be distinguishable from both by content (marker `label` text
    never collides with a fixture's numeric last-value string or the `seriesLabel` word).
  - `guard-data-integrity.sh`'s pinned-figure grep must stay green — `2019`/`2020`/the two ISO date
    strings are not on its pinned-literal list (verify by running the hook standalone post-edit, same
    discipline as FR-9's close-out).
- **Files** (5, at the cap):
  1. `src/lib/policyDates.ts` (new)
  2. `src/lib/policyDates.test.ts` (new — Cypress: exact shape, exact pinned label/isoDate strings)
  3. `src/components/YearlyLineChart.tsx` (edit)
  4. `src/components/YearlyLineChart.module.css` (edit)
  5. `src/components/YearlyLineChart.test.tsx` (edit — extend `runSharedContract` with marker-count,
     marker-position-relative-to-XAxis-tick, dash-pattern-distinct-from-8-6, caption-sentence, and
     axe-core assertions for both configurations, plus a new fixture exercising the "marker year
     absent from rows" edge case)
- **Tipping Point**: `YearlyLineChart.tsx` was already logged over its own ~140-line threshold at 151
  lines after the FR-3 chart-half task; this task adds a second, larger increment on top of that
  (expect ~190–210 lines). Per Rule 8, a second small overage is still not itself a refactor trigger.
  The named trigger for extracting chart annotations (end-label + policy markers) into a dedicated
  module is: **a third annotation layer arrives** (e.g. per-borough shading under FR-6, or an
  indexed/percent secondary view) — not a line count in isolation.

[FORCES]
1. Text-carried precision over position-implied precision — a categorical axis cannot express a day,
   so the label carries the date and the tick carries only the year, honestly.
2. Single source of truth (`policyDates.ts`) over two independently-typed copies of the same two
   dates in the chart's visual and accessible layers.
3. Simplicity > Pattern purity (always present).
```

---

## Archived 2026-08-07 — FR-5: arrests as a fifth small-multiples panel (COMPLETE)

**Outcome:** delivered 3 of 3 budgeted files (`arrests.ts` new — self-contained transport for the
`8h9b-rp9u` dataset, `api/arrests/route.ts` new, `page.tsx` edited to a fifth independent panel);
standard ordering throughout, Cypress PASS on the Phase 1 red-test check and, after one self-fix,
the Phase 3 audit. This is the first task this session to go through a `/grill-me` interview
before Cedar, given FR-5–7's flagged design risk across three prior planning rounds — the
interview resolved the small-multiples-vs-secondary-axis tension and explicitly deferred FR-6/FR-7
to their own future round. One retry-adjacent event, not a rejection-loop cycle: Redwood's
implementation was correct against the SPEC (373/374 tests) but surfaced a stale pre-existing
confinement test in `repairedCollisions.test.ts` (asserting only `socrata.ts` reads the token, an
assumption FR-5's own SPEC-approved exception legitimately violated) — the third occurrence this
session of the same bug shape (an old test's absolute claim invalidated by new, legitimate
behavior; see FR-4 and FR-13 for the first two). Routed back to Cypress, which had already written
the correct generalized pattern once in its own Phase 1 file and ported it; 374/374 after the fix,
full audit PASS on the same pass. FR-5 fully closed — the product now shows a fifth independent
witness (arrest counts) alongside deaths/injuries/collisions/repaired-collisions, without touching
`socrata.ts` or any of the four existing metrics. Full narrative in `ARCHIVED_SESSIONS.md`.


# Active SPEC

**Status:** approved — ready to dispatch to Cypress (tests first, standard ordering)
**Author:** Cedar (Tech Lead) · **Created:** 2026-08-07 · **Human-approved (HITL):** 2026-08-07, Rayan
**Then:** Cypress (failing tests first) → Redwood (execution) → Cypress (audit)
**Ordering:** standard, no deviation — Cypress writes failing tests first per Rule 4

## How the `/grill-me` interview shaped this SPEC (Cedar's reasoning, recorded)

The interview locked in small multiples over the PRD's literal FR-5 text ("second series on a
secondary axis") — the right call, and one this codebase already has direct precedent for: FR-3's
chart-half rejected an identical dual-axis framing for the identical reason (deaths ~229–297 vs.
arrests ~8,330–29,007 is the same order-of-magnitude mismatch as deaths vs. collisions was), citing
the same risk-register line (§5.4, "a two-line dual-axis chart invites the 'enforcement caused
deaths' misreading") and the same `dataviz` anti-pattern. FR-6/FR-7 are out of scope entirely per
the human's explicit choice, and their eventual shape (a global filter across all five series) is
recorded in the ledger, not restated here.

Where this deviated from the two-SPEC FR-3 template: FR-3 needed a data-half *and* a chart-half
because the chart-half built a brand-new generic component from scratch (`YearlyLineChart`, its
CSS module, a color-token decision) — a real 5-file task on its own. Here, `YearlyLineChart<K>` and
`MetricSection<K>` are already fully generic; mounting arrests as a fifth panel costs zero new
component/CSS work if it reuses an existing color slot rather than earning a third one. So this
ships as **one combined SPEC**, three files total (`arrests.ts`, `api/arrests/route.ts`,
`page.tsx`), well under the cap — splitting it just to mirror FR-3's precedent would be
pattern-purity over simplicity (Rule 8's own default force).

The one non-obvious build decision: **don't widen `socrata.ts`**. It hardcodes `h9gi-nx95`/
`crash_date`, and a prior SPEC already declined to make `$group`/`$order` parameters ("that
generality remains unearned"). Widening the one file every P0 metric depends on, to serve a
feature the PRD explicitly names as *droppable* (§5.2: "dropping FR-5–7 shrinks the product
without breaking it"), is the wrong trade — it would make severability a documentation claim
instead of a code fact. `arrests.ts` ships self-contained, duplicating socrata.ts's fetch/validate
scaffold (~130 lines) rather than sharing it; the Tipping Point below names exactly when that
duplication should be resolved instead.

---

```markdown
[SPEC]
- **Objective**: Ship FR-5 — traffic-enforcement arrest counts per year (2018–2025), filtered to
  the PRD §5.2 five-category offense list, as a fifth independently-scaled small-multiples panel
  (chart + accessible table), reusing the already-generic `YearlyLineChart<K>` and
  `MetricSection<K>` components with zero changes to either.
- **Requirement**: FR-5 [P1, severable — PRD §5.2/§5.3]. FR-6 (borough filter) and FR-7 (its
  contingent coverage warning) are explicitly **not** part of this SPEC — deferred per the
  human's interview answer, to be planned as their own dedicated SPEC (likely needing its own
  `/grill-me` pass on implementation shape, per the requirements block's recorded assumption).
- **UI Scope**: structural — a new chart panel and a new table enter the page.

- **Query** (dataset `8h9b-rp9u`, NYPD Arrests Data Historic):
  ```
  $select=date_extract_y(arrest_date) AS year, count(*) AS arrests
  $where=arrest_date >= '2018-01-01T00:00:00' AND arrest_date < '2026-01-01T00:00:00'
    AND (ofns_desc = 'VEHICLE AND TRAFFIC LAWS'
      OR ofns_desc = 'OTHER TRAFFIC INFRACTION'
      OR ofns_desc = 'INTOXICATED & IMPAIRED DRIVING'
      OR ofns_desc = 'INTOXICATED/IMPAIRED DRIVING'
      OR ofns_desc = 'HOMICIDE-NEGLIGENT-VEHICLE')
  $group=date_extract_y(arrest_date)
  $order=year
  ```
  Both `ofns_desc` spellings are required (Trap 4 — losing either loses ~10% of the series).
  Vehicle-theft categories (`GRAND LARCENY OF MOTOR VEHICLE`, `UNAUTHORIZED USE OF A VEHICLE`) are
  deliberately absent — already settled, PRD §5.2, not open. `arrest_boro` does not appear
  anywhere in this query or this task's code; FR-6 is out of scope, not merely unused.
  **Expected response shape**: a JSON array of up to 8 objects, each
  `{ year: string | number, arrests: string }` (Socrata numeric-as-string convention, `count(*)`
  included — same asymmetric-strictness casting socrata.ts's `ValueSchema` already applies). This
  is a pinned contract: if Socrata rejects `count(*)` or any clause above, that is a halt and a
  request for a revised SPEC (Rule 4), never a silent substitution.

- **Inputs/Outputs**:
  - `fetchArrestsPerYear(): Promise<YearlyMetricResult<"arrests">>` — zero-arg, matching
    `fetchDeathsPerYear()`'s signature. Reuses `YearlyMetricRow<K>`/`YearlyMetricResult<K>` from
    `src/lib/socrata.ts` via `import type` only (generic, dataset-agnostic types; zero coupling,
    zero edit to that file).
  - `ARRESTS_SOQL: string` — the exact SoQL above, built once as a module constant so the
    displayed query (FR-8) and the sent request can never drift apart, mirroring
    `REPAIRED_COLLISIONS_SOQL`'s pattern in `repairedCollisions.ts`.
  - `GET /api/arrests` — identical three-way status→HTTP mapping as the four existing routes:
    `ok`/`empty` → 200, `error` with `kind: "upstream"` → 502, `error` with `kind: "contract"` →
    422. Same JSON body shape as `src/app/api/collisions/route.ts`.
  - `page.tsx` additions: `fetchArrestsPerYear()` added to the existing `Promise.all`; one
    `<YearlyLineChart>` mount and one `<MetricSection>` call, inserted after the repaired-
    collisions `MetricSection` and before `<Caveats />`.
  - Pinned strings (byte-exact, Cypress tests against these verbatim — ADR 0001 discipline):
    - `columnLabel`: `"Arrests"`
    - table `captionText`: `"NYC traffic-enforcement arrests per year, 2018–2025 (five offense categories)"`
    - chart `captionText`: `"NYC traffic-enforcement arrests per year, 2018–2025. Every plotted figure is listed in the table below."`
    - `ariaLabel`: `"Line chart of NYC traffic-enforcement arrest counts per year from 2018 to 2025."`
    - `seriesLabel` (Y axis): `"Arrests"`
    - `fieldAlias`: `"arrests"`
    - `strokeStyle`: `"solid"` (arrests carry no reporting-decline artifact — the dash pattern is
      reserved for that specific semantic, per `YearlyLineChart.tsx`'s own header comment; using
      it here would falsely imply the same caveat)
    - `colorSlot`: `1` (reuse — see Intellectual Control)
    - No `note` prop passed to either the chart or the table — see Intellectual Control.

- **Design Pattern**: none — simple case. The genuine variance (which series render) was already
  encapsulated by `MetricSection<K>` and `YearlyLineChart<K>` across the four prior metrics; this
  task is a fifth instantiation of an already-earned generic, not a new pattern decision.

- **Intellectual Control**:
  1. **Why small multiples, not a secondary axis, overriding the PRD's literal FR-5 text.**
     Arrests range ~8,330–29,007; deaths range 229–297 — a ~30–100× spread, the same class of
     problem FR-3's chart-half already solved for deaths (229–297) vs. collisions (85,546–
     231,564). A shared zero-based linear axis would flatten the deaths line to visual noise, and
     `dataviz`'s own anti-pattern #1 names dual/shared axes across incompatible scales as
     inventing a correlation the data doesn't support. The risk register (PRD §5.4) names exactly
     this misreading as Med/Med; small multiples on an independently-scaled panel is the
     mitigation, matching FR-3's own precedent rather than a fresh decision.
  2. **Why `arrests.ts` is a self-contained sibling module, not a widened `socrata.ts`.**
     `socrata.ts` hardcodes `BASE_URL` (`h9gi-nx95`) and `crash_date`-keyed `$group`/`$order` as
     fixed constants — its own header states this was a deliberate prior decision ("that
     generality remains unearned"). Widening it to accept a dataset ID and date-field parameter
     would touch the one file every P0 metric (deaths, injuries, collisions, repaired) depends on,
     for the benefit of a feature PRD §5.2 explicitly marks droppable. Severability should be a
     code fact, not just a requirements-doc claim: with `arrests.ts` self-contained, dropping
     FR-5 later means deleting one lib file, one route, and reverting three `page.tsx` additions —
     `socrata.ts` and the four P0 metrics are never at risk. The cost is real duplication (~130
     lines of fetch/parse/coverage-validation logic reimplemented) — named honestly, not hidden,
     with a Tipping Point below for when to stop paying it.
  3. **Why this ships as one SPEC, not a data-half/chart-half split like FR-3.** FR-3's chart-half
     was substantial on its own (new `YearlyLineChart` component, new CSS module, a validated
     color-token pair) — a genuine 5-file task. Here, `YearlyLineChart<K>` already exists and
     `colorSlot: 1` is a reuse, not a new token; the entire task is 3 files. Splitting it to mirror
     FR-3's shape would be ceremony without a corresponding risk to sequence around.
  4. **Why `colorSlot: 1` (reuse), not a new `colorSlot: 3`.** Color reuse is a comprehension risk
     only when two elements sharing meaning must be visually distinguished in the same context
     (a legend, a merged chart). These are five separate `<figure>` elements, never juxtaposed in
     one plot, each with its own caption and axis label — reusing deaths' blue costs nothing here.
     A new `--chart-series-3` token would require re-running `dataviz`'s CVD-separation validator
     against both existing tokens, the annotation token, and both light/dark surfaces (see
     `YearlyLineChart.module.css`'s own comment on why the FR-13 marker got a *separate* token
     instead of a third series slot) — real, avoidable scope for zero comprehension benefit.
  5. **Why no new inline `note` and no `Caveats.tsx` edit.** `Caveats.tsx`'s `ITEM_3` already
     states, page-wide: "This page does not attribute the 2020–2021 rise, or any later change, to
     enforcement activity or its absence — it shows the series moving together." That sentence
     already covers arrests without modification. Deaths and injuries — two of the four existing
     metrics — carry no bespoke inline `note` either; only collisions and repaired-collisions do,
     because their caveat (the reporting-policy artifact) is specific and non-obvious. Arrests'
     relevant caveat (NFR-5's correlation-only framing) is general and already covered page-wide,
     so following the deaths/injuries precedent — no inline note — is the honest reading of
     "matching the independence guarantee already established," not a gap.

- **Constraints**:
  1. No secondary/dual axis, no merged chart with any other metric.
  2. `arrest_boro`, `perp_race`, `perp_sex`, `age_group` excluded entirely — no reference in code,
     comments, or query (PRD §6, permanent, not open here).
  3. `src/lib/socrata.ts` is not edited. Its file-header comment ("the only file in the repo that
     reads `SOCRATA_APP_TOKEN`") becomes imprecise once `arrests.ts` also reads it — accepted,
     non-blocking; `arrests.ts`'s own header states it explicitly and points back to this SPEC's
     severability reasoning, so the record stays honest without touching the frozen file.
  4. NFR-1 caching/timeout values copied exactly from `socrata.ts`: `next: { revalidate: 86400 }`,
     `AbortSignal.timeout(10_000)`.
  5. No new dependency — `zod` and `recharts` are already installed; nothing else may be added.
  6. Query is a frozen contract (Rule 4): a Socrata rejection of any clause is a halt and a
     request for a revised SPEC, never a local substitution.
  7. NFR-5: `captionText`/`ariaLabel`/`seriesLabel` above are purely descriptive — no causal or
     even correlational language in this task's own copy; the confounder framing lives in
     `Caveats.tsx` per Intellectual Control point 5.
  8. **Files not to touch**: `src/lib/socrata.ts`, `src/lib/deaths.ts`, `src/lib/injuries.ts`,
     `src/lib/collisions.ts`, `src/lib/repairedCollisions.ts`, `src/components/YearlyLineChart.tsx`,
     `src/components/YearlyLineChart.module.css`, `src/components/MetricSection.tsx`,
     `src/components/Caveats.tsx`, the four existing route handlers, `vitest.config.mts`,
     `vitest.setup.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`,
     `src/app/layout.tsx`, `src/app/globals.css`, `.claude/**`, `CLAUDE.md`, `docs/**`,
     `SESSION_STATE.md`.
  9. Amendment 3(b) and `npm audit` reporting, as standing clauses.

- **Edge Cases**:
  1. **Absent or invalid `arrests` aggregate for any of the 8 expected years** → `error` status,
     never a defaulted zero (Trap 1, FR-11) — same `validateYearCoverage`-shaped check as
     `socrata.ts`, reimplemented in `arrests.ts`.
  2. **Zero rows returned** → `empty` status (FR-10), rendered via `MetricSection`'s existing
     empty-state paragraph, unmodified.
  3. **Upstream failure** (network error, timeout, non-2xx, non-JSON body) → `error`/`upstream` →
     502 in the route.
  4. **Malformed row, duplicate year, or a year outside 2018–2025** → `error`/`contract` → 422.
  5. **Arrests fetch failing must not affect deaths/injuries/collisions/repaired rendering**, and
     vice versa — `Promise.all` plus fully independent per-branch rendering, unchanged from the
     existing four-metric pattern.
  6. **Both `ofns_desc` spellings must independently appear and both be tested** — Cypress asserts
     both literal strings are present in `ARRESTS_SOQL`'s `$where`, not just one.

- **Files** (max 5 — three used):
  1. `src/lib/arrests.ts` — *new.* Self-contained transport: SoQL builders, fetch, Zod validation,
     8-year coverage check, mirroring `socrata.ts`'s internal shape but scoped to `8h9b-rp9u`.
  2. `src/app/api/arrests/route.ts` — *new.* Same union-to-HTTP mapping as the four existing
     routes.
  3. `src/app/page.tsx` — *edited.* `fetchArrestsPerYear()` added to `Promise.all`; one
     `<YearlyLineChart>` mount and one `<MetricSection>` call added after the repaired-collisions
     section, before `<Caveats />`.

  **Not in this budget**: `src/lib/arrests.test.ts`, `src/app/api/arrests/route.test.ts`, and the
  `page.test.tsx` diff for the fifth metric are Cypress's Phase 1 work, dispatched first — test
  files are Cypress's own budget, not counted here, per this project's established precedent
  (FR-3's chart-half SPEC).

- **Tipping Point**: `arrests.ts`'s self-contained duplication of `socrata.ts`'s fetch/validate
  scaffold is deliberate, not an oversight — but it is a one-time exception, not a pattern to
  repeat. Re-open when a **second** `8h9b-rp9u` caller needs its own yearly-aggregate query (the
  most plausible trigger: a future FR-6 implementation that turns out to need a per-borough SoQL
  variant rather than a client-side re-scope filter — note the interview's recorded default
  expectation is a *global client-side* filter re-scoping all five series at once, which would
  never fire this trigger at all). At that point, extract a shared generic transport parameterized
  by base URL + date field + `$group`/`$order`, mirroring `socrata.ts`'s own extraction history
  (Task 1 → Task 3's `fetchYearlyMetric`). Do not duplicate a third time.

[FORCES]
1. Severability of the FR-5–7 group (PRD §5.2: "dropping FR-5–7 shrinks the product without breaking it") > code reuse via widening socrata.ts
2. Matching FR-3's small-multiples precedent (avoiding the scale-mismatch misreading the risk register names) > the PRD's literal FR-5 "secondary axis" text
3. Simplicity > Pattern purity
```
