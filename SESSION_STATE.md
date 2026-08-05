# Sprint Ledger — MVCC Data

**Current objective:** the walking skeleton — one chart, one metric (deaths per year), rendering
from a live server-side SoQL call (PRD handoff, Rule 6). The toolchain now exists; no app code does.

## Active

- **Both completed SPECs are audited and closed.** Cypress PASS on 2026-08-05, one pass covering
  the scaffold (checklist a–f) and the platform guard (acceptance clause + constraints 1–8). No
  critical violations; seven non-blocking recommendations, all recorded in `SPEC.md` § Carried
  forward. `SPEC.md` is now reset and holds no active work.
- **Committed and pushed** (2026-08-04) — `14b2960` scaffold, `4f396e1` platform guard, `d2cedb9`
  SPECs + ledger. Split by concern rather than by edit order, so the guard's rationale isn't buried
  in the scaffold commit. *Audit note:* this means SPEC 2's `@types/node` and lockfile changes
  actually landed in `14b2960`, not `4f396e1` — all three file outputs are present and correct,
  only the commit boundary differs from the SPEC's file list. Not a violation.
- **Two hook defects the audit surfaced**, both in `.claude/hooks/stop-quality-gate.sh` and both
  **pre-existing** (they predate `4f396e1`), so neither is a regression from the platform SPEC:
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90) — the `[ -x ]`
     guards skip both checks, `failed` stays 0, and the gate prints "clean" having run nothing.
     Reproduced on an empty `node_modules/`. This is the same failure class the platform SPEC
     existed to eliminate, one layer down, and it fires on any interrupted `npm install`.
  2. **The all-clear line can print an empty version** (line 104) — it re-invokes `node -v` rather
     than reusing the captured value, so an unresolvable `node` yields `(Node )` in the very line
     that exists to make the platform auditable.

  Both belong to the next SPEC that touches that file. Cypress may not edit it; Redwood or Banyan
  must. Neither blocks the skeleton.
- **Next session, in order:**
  1. **Docs task** — the two batched items below. Higher priority than it looks: a fresh clone now
     needs **three** out-of-band setup steps (fnm + Node 22, the `settings.local.json` env block,
     and `.git/hooks/commit-msg`), none of which are discoverable from the repo. The audit
     independently reached the same ranking: the guard now means a clone without fnm cannot end
     *any* turn, so the gap hardened from quiet to loud.
  2. **Walking-skeleton `[SPEC]` from Cedar** — the actual objective. It inherits Amendment 3(b)'s
     `node -v` clause and 3(e)'s authorized `.mts` rename, and it is where `recharts` and `zod`
     finally arrive with the requirements that justify them. Standing clauses and everything owed
     to it are enumerated in `SPEC.md`.
- **Still no application code exists.** No Route Handler, no chart, no test file, no figure
  rendered. The toolchain is real; the product is not started.
- **Harness platform fix CONFIRMED LIVE** (2026-08-05): `node -v` in the Bash tool now prints
  `v22.23.2` and `which node` resolves under the fnm v22 tree. The block below is retained for its
  reasoning; the "until this session ends" caveat has expired. One consequence: reproducing the
  Node 20 failure path now takes deliberate effort — `env PATH=/usr/local/bin:/usr/bin:/bin`.
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

- **2026-08-05 — Cypress audited both completed SPECs in one pass; PASS, no critical violations.**
  Verified cold, nothing fixed, no test file written (the first belongs to the skeleton, per both
  ordering overrides), tree left clean.
  - *The scaffold's file bound was proven, not argued.* Cypress regenerated verbatim
    `create-next-app@16.3.0` output into the scratchpad and byte-compared: all 11 generator-class
    files identical, exactly 6 divergences matching the enumerated list with no substitutions. This
    is the right way to audit an exemption granted on "generator output encodes no decisions" — the
    claim is falsifiable by `cmp`, so it should be falsified by `cmp` rather than by reading a
    completion report.
  - *Item (b) would have passed vacuously and was caught.* `git status --porcelain -- .gitignore
    README.md` is trivially empty on a committed tree, so the check was re-pointed at the commit
    range: both files are byte-identical across `14b2960^..HEAD`. A checklist item written for an
    uncommitted working tree silently stops testing anything once the work lands — worth
    remembering for any future acceptance clause phrased against `git status`.
  - *`tsconfig.include` at 5 entries confirmed as a genuine fixed point*, not drift: `npm run build`
    left `git status --porcelain` empty before and after.
  - *The one real finding is a fake-green, and it is not in the code that was audited.* Both hook
    defects predate the platform SPEC. The gate's `[ -x ]` binary guards mean a present-but-empty
    `node_modules/` yields "clean" from zero checks — structurally the same fake-green the platform
    SPEC was written to kill, sitting one layer beneath it. Finding it required running the hook in
    constructed environments rather than reading it, which is why the five-cell matrix mattered.
  - *Node-20 reproduction now costs deliberate effort.* With the harness `PATH` fix live, the
    failure path has to be constructed (`env PATH=/usr/local/bin:/usr/bin:/bin`). Convenient today,
    but it means the guard's own failure mode is no longer exercised incidentally — future audits
    must construct it on purpose or stop testing it at all.
  - *Amendment 3(e)'s two rename checks split.* The first is pre-discharged by Redwood having
    dropped `"**/*.mts"` from `tsconfig.include`; the second is not, because `eslint.config.mjs`
    declares no explicit `files` patterns and inherits `eslint-config-next`'s — so `.mts` lint
    coverage is an unverified default. Carried into `SPEC.md`.

Older entries are in `ARCHIVED_SESSIONS.md` (the two-SPEC toolchain build-out — the bounded
generator-output exemption, the Node 20 halt and the per-project platform raise, and
`engine-strict`'s rejection on efficacy; README diagram rebuild and the `ARCHITECTURE.md`
deferral; NYC DOT Vision Zero evaluation and the SIP confounder; initial Claude Code agent
configuration and the GEMINI.md parity drop; the `.gitignore` / NFR-2 gap).
