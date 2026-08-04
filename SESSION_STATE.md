# Sprint Ledger — MVCC Data

**Current objective:** the walking skeleton — one chart, one metric (deaths per year), rendering
from a live server-side SoQL call (PRD handoff, Rule 6). The toolchain now exists; no app code does.

## Active

- **Committed and pushed** (2026-08-04) — `14b2960` scaffold, `4f396e1` platform guard, `d2cedb9`
  SPECs + ledger. Tree clean, no stashes, `origin/main` synced. Split by concern rather than by
  edit order, so the guard's rationale isn't buried in the scaffold commit.
- **Next session, in order:**
  1. **Cypress audit of both completed SPECs.** Both carry an explicit ordering override — neither
     has behavior to write failing tests against, so Cypress audits *after*; its first **test file**
     belongs to the skeleton, not to either completed SPEC. Audit checklist is in `ARCHIVED_SPECS.md`
     (scaffold, items a–f) and `SPEC.md` (platform, plus: run the hook under both Node 20 and 22 and
     confirm exit 2 / exit 0).
  2. **Docs task** — the two batched items below. Higher priority than it looks: a fresh clone now
     needs **three** out-of-band setup steps (fnm + Node 22, the `settings.local.json` env block,
     and `.git/hooks/commit-msg`), none of which are discoverable from the repo.
  3. **Walking-skeleton `[SPEC]` from Cedar** — the actual objective. It inherits Amendment 3(b)'s
     `node -v` clause and 3(e)'s authorized `.mts` rename, and it is where `recharts` and `zod`
     finally arrive with the requirements that justify them.
- **Still no application code exists.** No Route Handler, no chart, no test file, no figure
  rendered. The toolchain is real; the product is not started.
- **Harness platform fixed at the root — applies from the NEXT session.** `stop-quality-gate.sh`
  exits 2 on a platform mismatch, and the harness runs both its Bash tool and its Stop hooks under
  the **system Node 20**, so the guard fired on every turn and nothing inside a turn could change
  the shell. Fix: `env.PATH` in **`.claude/settings.local.json`** prepending
  `~/.local/share/fnm/node-versions/v22.23.2/installation/bin`. Chosen over letting the hook
  re-exec itself, which would have contradicted Cedar's "a guard that silently repairs teaches no
  one the shell was wrong" *and* left the Bash tool on Node 20 — so agents would still get
  wrong-platform results, just uncaught. This fixes both surfaces at once.
  - *Why `settings.local.json` and not `settings.json`:* the value is an absolute path under
    `/home/rhaeyyan`. Committing it would break every other clone. `settings.local.json` is
    gitignored (`.gitignore:36`), which is exactly the right scope for machine-specific config —
    and it means **a fresh clone must re-do this**, alongside the fnm install and the
    `.git/hooks/commit-msg` guard.
  - *Version-pinned path is a known cost.* It names `v22.23.2` explicitly and will need updating
    when Node moves. Accepted as the price of not hardcoding a `$PATH` expansion whose support is
    unverified.
  - **Until this session ends, `node -v` in the Bash tool is still v20.19.6** and the Stop gate will
    keep blocking. That is correct behavior, not a regression. Verify via `bash -ic 'cd <root> &&
    …'` or `fish -i -c 'cd <root>; and …'` and confirm `node -v` is `v22.23.2` first.
- **Docs task owed, two items batched:**
  1. PRD handoff (`docs/project-mvcc-data.md` ~280–289) is stale — it tells kickoff to create an
     assignment subdirectory with its own `AGENTS.md` and record the §5.6 assessment there. All
     three clauses are superseded (this repo *is* that directory; `AGENTS.md` was folded into
     `CLAUDE.md`; §5.6 is already recorded there). Acting on it would also silently no-op
     `stop-quality-gate.sh`, which probes `.`, `app`, `web`, `frontend` for the app root.
  2. A README line naming the Node floor, for the fresh-clone gap — `.nvmrc` ships but the fnm
     wiring that reads it does not.
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result. Deferred rather than blocking because `jsdom`/`@testing-library/*` are dev deps
  and `next build` doesn't run tests — a Vercel image on Node 20 would still build green, so the
  divergence surfaces only as local-vs-deploy drift in Route Handler behavior.
- **Machine changes outside the repo, needing re-doing on any other machine:**
  `~/.config/fish/conf.d/fnm.fish` (new) and an appended block in `~/.bashrc` (existing file
  edited). Both silence fnm's "Using Node" banner in non-interactive shells — it lands on **stdout**
  and would contaminate parsed command output.
- `ARCHITECTURE.md` is **deferred by decision, not pending**; its absence is not a gap to close.
  Rationale and revisit trigger in `CLAUDE.md` § Project Layout.

## Context Cache

- Analysis window is **fixed at 2018–2025**; datasets are `h9gi-nx95` (primary) and `8h9b-rp9u`
  (arrests, severable P1). Full contract in the `mvcc-data` skill — read that, not the PRD, for
  routine schema and figure questions.
- Every pinned figure in PRD Appendix A was **re-verified live on 2026-08-04** via
  `.claude/scripts/verify-figures.py`: all 32 values across four series matched exactly. The
  preliminary-feed revision risk has not materialized as of that date.
- **Platform: Node v22.23.2 / npm 10.9.8**, per-project via `fnm` + `.nvmrc`. fnm's `default` alias
  is `system`, so only `.nvmrc` directories switch; `/tmp` and `$HOME` still yield the system
  v20.19.6. `engines.node` is `>=22.22.2`.
- **Standing rule — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Standing acceptance clause (Amendment 3(b)), binds every future SPEC:** acceptance-by-command
  must record `node -v` beside the results, and it must satisfy `engines.node`. A gate that ran on
  an unverified platform produced an unverified result; unverified is not PASS. NFR-4 pointed at
  the toolchain.
- **`eslint@^9` is required, not merely unbumped.** The discriminator is *not* `eslint-config-next`
  (permissive, `>=9.0.0`) — it is **`eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes
  eslint 10**, the plugin NFR-3 depends on. Check that package first before evaluating eslint 10.
- **Styling is CSS Modules**, not Tailwind — chosen on reversibility, not taste. Tailwind is two dev
  deps and a PostCSS config to add later; removing it means unwinding class attributes across every
  component Magnolia will have written by then.

## History

- **2026-08-04 — Toolchain stood up across two SPECs; both halted usefully before they finished.**
  The scaffold (Next 16 / React 19 / TS / Vitest / CSS Modules, 6 hand-authored files) and a
  follow-on platform-agreement fix (3 files). All four gates green on Node 22.23.2, verified
  independently rather than taken from the completion reports; `stop-quality-gate.sh` is live.
  - *Why the scaffold was its own SPEC rather than pre-work:* `create-next-app` introduces the whole
    dependency tree, and Rule 9 gives Cedar sole dependency authority — treating it as plumbing
    would have routed around that rule. It also broke Rule 5's file cap (~20 files), resolved by a
    **bounded** exemption: generator output is exempt because it encodes no decisions and is
    reproducible from one pinned command; hand-authored files stay capped and enumerated for audit.
  - *The Node 20 halt, and why it was the most valuable thing that happened.* Redwood stopped at
    step 0: `jsdom@30` and `@testing-library/jest-dom@7` (and `6.10.0`) exclude Node 20.19.6. npm
    doesn't enforce `engines` without `engine-strict`, so both install on a warning — and vitest
    only instantiates jsdom per test file, of which the scaffold writes none. Every acceptance
    command would have exited 0 over a toolchain that breaks at Cypress's first component test.
    Pinning back to `jsdom@^29` was rejected as a rolling problem: it adopts two packages already on
    their maintainers' drop lists, and each future dependency hits the same wall as Node 20 recedes
    past its April 2026 EOL. Chose to raise the platform per-project instead, leaving the system
    Node and every other project on the machine untouched.
  - *Then the same failure reproduced from the other side.* After the scaffold landed, all four
    gates passed on Node 20 in the agent's own shell — the Bash tool runs bash, not the login fish
    shell, and inherits its environment rather than re-sourcing `.bashrc`, so no shell wiring
    reaches it. The acceptance criteria could not see it.
  - *`engine-strict` was proposed as the fix and rejected on evidence.* `stop-quality-gate.sh`
    invokes `./node_modules/.bin/tsc` and `./node_modules/.bin/eslint` **directly**, bypassing npm —
    no `.npmrc` setting can reach the process that emits the verdict. It is install-scoped and
    cannot gate a run against an existing tree; on a Node 20 Vercel image it would additionally
    hard-fail production deploys over `jsdom`, a test-only dep `next build` never loads. The fix
    went into the hook instead: read `.nvmrc`, compare **majors only** (the patch floor is npm's
    `EBADENGINE` job), exit 2 naming both versions. No semver parser, no `fnm exec` auto-repair.
  - *Cedar's test for granting a file beyond a spent budget, worth reusing:* a slot is granted only
    when (i) the mechanism is the **only** thing catching the named failure and (ii) no existing
    file, hook, CI config, or acceptance clause can carry it. `engine-strict` failed both, so the
    bound held on merit rather than on the number.
  - *Two hazards the scaffold SPEC existed to prevent, both real in this tree:* a stock `eslint .`
    lints 270+ third-party `.mjs` skill-payload files under `.claude/`, `.gemini/`, `skills/`; and
    the stock `tsconfig` `include` of `**/*.ts` sweeps three `types.d.ts` files from those trees
    into `tsc --noEmit`. Fixed with ignore entries and a `src/**` **allowlist** include — allowlist
    rather than denylist, since a denylist re-breaks the moment a fourth skill tree appears.
  - *Deviations Redwood declared rather than hid:* `--disable-git` (without it the scratchpad
    scaffold carries its own `.git` into the repo root); `--no-agents-md` (Next 16 generates
    `AGENTS.md` by default, which CLAUDE.md rules against — suppressed at generation rather than
    generated-then-deleted); `tsconfig.include` at 5 entries because `next build` re-adds
    `.next/dev/types/**/*.ts` and it is a stable fixed point; jsx-a11y spread as `.rules` only,
    since the full recommended object throws `Cannot redefine plugin` — `eslint-config-next`
    already registers it.

Older entries are in `ARCHIVED_SESSIONS.md` (README diagram rebuild and the `ARCHITECTURE.md`
deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude Code agent
configuration and the GEMINI.md parity drop; the `.gitignore` / NFR-2 gap).
