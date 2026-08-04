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
This shell inherited the system Node rather than the version manager's, so the
checks would report on a platform this project does not target.
Re-enter through a fresh interactive shell and retry, e.g.:
  fish -i -c 'cd ${proj}; and npm run typecheck; and npm run lint'
  bash -ic 'cd ${proj} && npm run typecheck && npm run lint'
EOF
    exit 2
  fi
fi

report=""
failed=0

if [ -x "$appdir/node_modules/.bin/tsc" ] && [ -f "$appdir/tsconfig.json" ]; then
  if ! out=$(cd "$appdir" && ./node_modules/.bin/tsc --noEmit 2>&1); then
    report="${report}typecheck (tsc --noEmit) failed:
$(printf '%s\n' "$out" | head -n 20)
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
fi

if [ "$failed" -gt 0 ]; then
  printf 'Quality gate failed (%d check(s)) — fix before ending the turn:\n%s' "$failed" "$report" >&2
  exit 2
fi

[ "$quiet" -eq 1 ] || echo "Quality gate clean: typecheck and lint pass (Node $(node -v))."
exit 0
