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

**Still open, deliberately not folded in:** whether to pin `engines.node` / ship a `.nvmrc`
(Cedar's Open Question 3). Not included. Node 20 passed LTS EOL in April 2026, so the pin would
become a maintenance liability at the first move to Node 22, and `next@16` runs on both.

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
  - *Input*: Node v20.19.6 / npm 10.8.2; repo root at the project directory, clean tree on `main`.
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
  1. **Node 20.19.6 is a hard ceiling and Node 20 is past LTS EOL (April 2026).** Step 0 is a
     deterministic check, executed and its output recorded before any install:
     `npm view <pkg> engines` and `npm view <pkg> peerDependencies` for every package below,
     plus `recharts` and `zod`. Any candidate whose `engines.node` excludes 20.19.6 →
     **halt and request a revised SPEC from Cedar** (Rule 9). Do not downgrade, substitute, or
     `--force` a package on your own authority.
     *(Partially discharged — see Amendment 1. Run it for the remainder.)*
  2. **Candidate pins** (subject to step 0; `^` ranges, `package-lock.json` committed):
     - Runtime: `next@^16`, `react@^19`, `react-dom@^19`
     - Types: `typescript@^5`, `@types/react`, `@types/react-dom`, `@types/node`
     - Lint: `eslint@^9`, `eslint-config-next` (major matched to `next`), `eslint-config-prettier`,
       `eslint-plugin-jsx-a11y@^6`, `prettier@^3`
     - Test: `vitest@^4` *(amended)*, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react@^16`,
       `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`,
       `axe-core`
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

  **The 5-file cap — resolution and its bound.** Granted as an explicit exemption, on the same
  principle that exempts Banyan's mechanical tree-wide refactors: Rule 5 bounds the *reviewable
  decision surface*, not the byte count, and `create-next-app` output encodes no decisions —
  it is reproducible from one pinned command, so what gets reviewed is the command, not its
  ~20 files. The exemption is bounded and auditable, not open-ended:
  **at most 5 files may differ from verbatim generator output or be authored by hand.** They are
  enumerated in *Files* below. Cypress audits the bound by confirming `git status --porcelain`
  shows the generated set plus no more than those 5 divergences. If a 6th is needed, halt and
  request a revision — do not spend it.

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
  - A candidate package's `engines.node` excludes 20.19.6 → halt, report, request revision.
    Never install with `--force` or `--legacy-peer-deps` to route around it.
  - `git status` shows `.gitignore` or `README.md` modified → restore from HEAD, halt, report.
  - The generated `src/app/page.tsx` fails `jsx-a11y` recommended rules → this is the one
    foreseen way the budget runs out. **Halt and request a revision** authorizing a placeholder
    page as a 6th file. Do not silently exceed the bound.
  - `npm audit` reports high/critical → report it; do not auto-remediate with `audit fix --force`,
    which can change majors and is a dependency decision.
  - Scratchpad scaffold fails or is interrupted → delete the scratchpad directory and restart;
    never copy a partial tree in.
- **Files** (max 5 — the hand-authored/hand-modified budget; generator output is exempt per above):
  1. `package.json` — deps + scripts: `dev`, `build`, `start`, `lint` (`eslint .`, mirroring the
     Stop gate exactly), `typecheck` (`tsc --noEmit`), `test` (`vitest run --passWithNoTests`),
     `test:watch` (`vitest`)
  2. `tsconfig.json` — `strict: true`, `include` scoped to `src/**` as specified above
  3. `eslint.config.mjs` — generator base + `eslint-plugin-jsx-a11y` recommended +
     `eslint-config-prettier` last + the three skill-tree ignores
  4. `vitest.config.ts` — `@vitejs/plugin-react`, `environment: 'jsdom'`, no `setupFiles` yet
     (Cypress adds it with the first test), no `globals` — import from `vitest` explicitly
  5. `.env.example` — `SOCRATA_APP_TOKEN=` plus a one-line comment. No value, ever.

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
(b) `git status --porcelain -- .gitignore README.md` is empty; (c) hand-modified files number ≤5
and match the enumerated list; (d) no token value, no `NEXT_PUBLIC_` name, and no Appendix A
figure appears anywhere in the diff; (e) the step-0 `engines` output was recorded, not skipped.
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

**PRD handoff (docs/project-mvcc-data.md, lines ~280–289) is stale.** It instructs kickoff to
"create the assignment's own subdirectory with its `AGENTS.md`, move this PRD into it, and record
the §5.6 security-isolation assessment there." All three clauses are superseded: this repo *is*
the standalone assignment directory (and scaffolding into a subdirectory would silently no-op
`stop-quality-gate.sh`); `AGENTS.md` was folded into `CLAUDE.md` by recorded decision because
Claude Code does not auto-load `AGENTS.md`; and the §5.6 assessment already lives in
`CLAUDE.md` § Recorded decisions. Leftover from when this project lived inside the parent
`Pursuit_AI-Native` repo. Amend the PRD so a future agent does not act on it — a documentation
task, tracked separately.
