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
#   exit 0 = clean or not applicable; exit 2 = typecheck/lint failed.
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

[ "$quiet" -eq 1 ] || echo "Quality gate clean: typecheck and lint pass."
exit 0
