# Active SPEC

**Status:** none active. Awaiting the walking-skeleton `[SPEC]` from Cedar.

The platform-agreement SPEC closed on 2026-08-05 (Cypress audit PASS) and is archived in
`ARCHIVED_SPECS.md`, alongside the kickoff scaffold. Both audits are discharged; neither has
outstanding critical violations.

---

## Standing clauses that bind the next SPEC

Archived with the SPECs that introduced them, restated here because they are obligations on
whatever comes next rather than history:

- **Amendment 3(b) — acceptance-by-command must record `node -v`**, and the recorded version must
  satisfy `engines.node`. A gate that ran on an unverified platform produced an unverified result;
  unverified is not PASS. Costs no file budget; not optional in any SPEC.
- **Amendment 3(c) — `@types/node`'s major tracks `engines.node`'s major.** Derived, not chosen;
  moves in the same edit as the floor, no Rule 9 halt required.
- **Amendment 3(d) — `eslint@^9` is required.** The binding constraint is
  `eslint-plugin-jsx-a11y@6.10.2`, whose peer range excludes eslint 10 — *not* `eslint-config-next`,
  which is permissive and decides nothing. Check that package first before evaluating eslint 10.
- **Amendment 3(e) — `vitest.config.ts` → `vitest.config.mts` is AUTHORIZED**, deferred to the
  walking-skeleton SPEC and batched with Cypress's first `setupFiles` edit (one edit, not two). It
  renames an already-enumerated item, so it costs no new file slot. Of its two required checks,
  Cypress found on 2026-08-05 that **the first is already pre-discharged** — Redwood dropped the
  generator's `"**/*.mts"` from `tsconfig.include`, so a root `.mts` sits outside the TS program by
  construction. **The second still needs doing:** `eslint.config.mjs` declares no explicit `files`
  patterns and inherits `eslint-config-next`'s, so whether `.mts` is linted is an unverified
  inherited default. Verify with `eslint --debug` or a deliberate error before assuming coverage.
- **The 7th-file test (Cedar, reusable).** A file beyond a spent budget is granted only when both
  hold: (i) the mechanism is the *only* thing that catches the named failure, and (ii) no existing
  enumerated file, hook, CI config, or acceptance clause can carry it.
- **`engine-strict` is retired-on-condition, not deferred.** Adopt only if a CI runner or deploy
  image performs `npm install` on a Node version it cannot pin from `.nvmrc`. If CI lands and can
  pin (`actions/setup-node` with `node-version-file: .nvmrc`, or Vercel reading `engines.node`),
  the trigger is **retired** — fixing the platform strictly dominates failing on it.

## Carried forward — owed, not yet specced

- **Two hook defects found by the 2026-08-05 audit**, both in `.claude/hooks/stop-quality-gate.sh`,
  both pre-existing rather than regressions from `4f396e1`. They belong to the next SPEC that
  touches that file; Cypress may not edit it.
  1. **Fake-green when `node_modules/` exists but the binaries do not** (lines 81, 90). The `[ -x ]`
     guards skip both checks, `failed` stays 0, and the gate prints "clean" having run nothing —
     reproduced on an empty `node_modules/`. Same failure class the platform SPEC existed to
     eliminate, one layer down; fires on any interrupted `npm install`.
  2. **The all-clear line can print an empty version** (line 104). It re-invokes `node -v` in a
     command substitution instead of reusing the already-captured value, so with `.nvmrc` absent
     and `node` unresolvable it emits `(Node )` — in the exact line that exists to make the
     platform auditable.
- **Docs task (two items batched):** the stale PRD handoff at `docs/project-mvcc-data.md` ~280–289,
  and a README line naming the Node floor for the fresh-clone gap.
- **Deploy `[SPEC]` obligation:** verify Vercel's project Node runtime matches `engines.node` and
  record the result.
- **`zod` pin, when it arrives.** `zod@4.4.3` is already in the tree transitively via
  `eslint-config-next → eslint-plugin-react-hooks`, marked `dev: true`. Rule 9's accounting is
  intact (it is not a declared dependency), but Cedar should pin the major deliberately rather than
  let it silently dedupe against a lint plugin's transitive pick.
- **Step-0 `engines` transcription, partial.** Cypress discharged the underlying risk mechanically —
  all 450 installed packages' `engines.node` evaluated against 22.23.2 via `semver.satisfies`, all
  compatible — but the per-package ranges for `zod` (no `engines` field at all), `axe-core`,
  `@testing-library/dom`, `@testing-library/user-event`, `typescript`, `prettier`,
  `eslint-config-prettier`, and `@types/*` were never transcribed into a durable record.
