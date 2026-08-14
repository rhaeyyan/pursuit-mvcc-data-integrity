#!/usr/bin/env bash
# Stop hook: the "test-quality gate" CLAUDE.md Rule 9 lists as a candidate,
# adopted for this project. Blocks turn-end if the app does not typecheck or
# lint clean.
#
# Rationale: the PostToolUse lint hook catches per-file violations as they are
# written, but nothing catches a type error that only appears once two files
# disagree -- exactly the class of bug a Route-Handler-to-component response
# shape produces. Cypress catches it at audit; this catches it a turn earlier.
#
# No-ops entirely until there is an app to check (no package.json => this is
# still the config/planning phase). Honors the "cap every autonomous loop" rule:
# blocks at most once per turn via stop_hook_active, then escalates to the human.
#
# Usage:
#   ./.claude/hooks/stop-quality-gate.sh          standalone, prints an all-clear
#   ./.claude/hooks/stop-quality-gate.sh --hook   Stop-hook mode (reads stdin JSON)
#   exit 0 = clean or not applicable; exit 2 = platform mismatch, or
#   typecheck/lint failed.
set -u

mode="${1:-}"
quiet=0

if [ "$mode" = "--hook" ]; then
  quiet=1
  input=$(cat)
  printf '%s' "$input" | grep -q '"stop_hook_active": *true' && exit 0
fi

proj="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$proj" || exit 0

# Hook shells are not interactive: they inherit a bare PATH
# (/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin), never read
# ~/.bashrc, and therefore have no nvm and no node at all. Without this block
# `node -v` below is unconditionally "not found", so the platform check reports
# UNVERIFIED on every single turn even when the workspace is spotless -- and a
# gate that always blocks is a gate nobody can read a signal from.
#
# This deliberately does NOT relax the check below. nvm is asked for the version
# .nvmrc names; if nvm is absent, or that exact version is not installed, PATH is
# left untouched, `node -v` still comes back "not found", and the mismatch branch
# fires exactly as before. Making a version manager reachable is not the same as
# trusting whatever it hands back -- the comparison against .nvmrc still decides.
#
# Asking nvm to resolve .nvmrc (rather than hardcoding a bin path in settings)
# is what keeps this from rotting on the next `nvm install`: this project has
# already had three toolchain regressions of exactly that shape.
#
# `set +u` around the source is required -- nvm.sh dereferences unset variables
# and would abort this hook under `set -u`.
export NVM_DIR="${NVM_DIR:-${HOME:-/nonexistent}/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1
  [ -f .nvmrc ] && nvm use >/dev/null 2>&1
  set -u
fi

# Locate the app root: repo root, or a single obvious subdirectory.
appdir=""
for candidate in . app web frontend; do
  if [ -f "$candidate/package.json" ]; then appdir="$candidate"; break; fi
done

if [ -z "$appdir" ]; then
  [ "$quiet" -eq 1 ] || echo "No package.json yet — quality gate not applicable."
  exit 0
fi

# Nothing installed yet => nothing to run against.
if [ ! -d "$appdir/node_modules" ]; then
  [ "$quiet" -eq 1 ] || echo "node_modules absent in $appdir — quality gate skipped."
  exit 0
fi

# Platform agreement (Amendment 3(b)): the Node about to run the gates must be
# the one .nvmrc selects. A shell that inherited the system Node still exits 0
# on every check -- vitest never instantiates jsdom under --passWithNoTests, so
# nothing loads the packages that reject the wrong major. That green is fake,
# and reporting it as clean is the toolchain form of a silently-coerced zero.
# Only the major is compared; the patch floor is npm's EBADENGINE job at install.
# No .nvmrc => nothing declared => nothing to disagree with, so stay inert.
if [ -f .nvmrc ]; then
  want=$(tr -dc '0-9.' < .nvmrc | cut -d. -f1)
  have_full=$(node -v 2>/dev/null || echo "not found")
  have=${have_full#v}
  have=${have%%.*}
  if [ -n "$want" ] && [ "$want" != "$have" ]; then
    cat >&2 <<EOF
Platform mismatch — the quality gate result is UNVERIFIED, not clean.
  .nvmrc expects: Node v${want}.x
  actually running: ${have_full}
This hook already tried to load nvm and select .nvmrc's version, so this is not
merely an unsourced shell. Either nvm is not installed where NVM_DIR points
(${NVM_DIR}), or Node v${want}.x is not installed under it, or something ahead
of it on PATH is shadowing the selection. Running the checks anyway would report
on a platform this project does not target.
  installed versions: $(nvm ls --no-colors 2>/dev/null | tr -d ' ' | tr '\n' ' ' || echo "nvm unavailable")
Fix the platform, or re-enter through a fresh interactive shell and retry, e.g.:
  fish -i -c 'cd ${proj}; and npm run typecheck; and npm run lint'
  bash -ic 'cd ${proj} && npm run typecheck && npm run lint'
EOF
    exit 2
  fi
fi

report=""
failed=0

# A missing/non-executable binary here is not a legitimate skip: node_modules
# exists (checked above), so an expected binary being absent means a partial
# or corrupted install, not "nothing to run against." That must fail loud,
# same as the toolchain-mismatch case above -- a silent skip here is the same
# fake-green bug in different words.
if [ -f "$appdir/tsconfig.json" ]; then
  if [ -x "$appdir/node_modules/.bin/tsc" ]; then
    if ! out=$(cd "$appdir" && ./node_modules/.bin/tsc --noEmit 2>&1); then
      report="${report}typecheck (tsc --noEmit) failed:
$(printf '%s\n' "$out" | head -n 20)
"
      failed=$((failed + 1))
    fi
  else
    report="${report}typecheck NOT RUN: tsconfig.json present but $appdir/node_modules/.bin/tsc is missing or not executable — incomplete or corrupted install, not a clean state.
"
    failed=$((failed + 1))
  fi
fi

if [ -x "$appdir/node_modules/.bin/eslint" ]; then
  if ! out=$(cd "$appdir" && ./node_modules/.bin/eslint . 2>&1); then
    report="${report}lint (eslint .) failed:
$(printf '%s\n' "$out" | head -n 20)
"
    failed=$((failed + 1))
  fi
else
  report="${report}lint NOT RUN: $appdir/node_modules/.bin/eslint is missing or not executable — incomplete or corrupted install, not a clean state.
"
  failed=$((failed + 1))
fi

if [ "$failed" -gt 0 ]; then
  printf 'Quality gate failed (%d check(s)) — fix before ending the turn:\n%s' "$failed" "$report" >&2
  exit 2
fi

node_version=$(node -v 2>/dev/null); [ -n "$node_version" ] || node_version="unknown"
[ "$quiet" -eq 1 ] || echo "Quality gate clean: typecheck and lint pass (Node $node_version)."
exit 0
