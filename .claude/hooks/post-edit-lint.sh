#!/usr/bin/env bash
# PostToolUse hook for Edit|Write: auto-fix the file that was just changed,
# then lint what's left. Formatting/import-order nits get fixed silently;
# only genuine violations that survive the auto-fix get sent back to Claude
# (exit 2 feeds stderr back as context to fix immediately).
set -u

input=$(cat)
file=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)

if [ -z "$file" ] || [ ! -f "$file" ]; then
  exit 0
fi

# Hook shells are not interactive: they inherit a bare PATH, never read
# ~/.bashrc, and therefore have no nvm and no node. That matters here even
# though this hook never calls `node` directly -- node_modules/.bin/eslint is a
# script with a `#!/usr/bin/env node` shebang, so without this block it dies at
# exec with "/usr/bin/env: 'node': No such file or directory".
#
# That failure used to be indistinguishable from a lint violation: the eslint
# invocation below captures stderr and any non-zero status, so a missing
# interpreter was reported as "eslint reported problems ... that could not be
# auto-fixed" and exited 2. Agents then hunted a lint error that did not exist.
# Commit f260705 fixed this class of bug in stop-quality-gate.sh but not here.
#
# Mirrors that hook deliberately: ask nvm for the version .nvmrc names, and if
# nvm is absent or that version is not installed, leave PATH untouched and let
# the reachability check below decide. Resolving via .nvmrc rather than a
# hardcoded bin path is what keeps this from rotting on the next `nvm install`
# -- this project has had three toolchain regressions of exactly that shape.
#
# `set +u` around the source is required: nvm.sh dereferences unset variables
# and would abort this hook under `set -u`.
export NVM_DIR="${NVM_DIR:-${HOME:-/nonexistent}/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1
  proj="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
  [ -f "$proj/.nvmrc" ] && (cd "$proj" && nvm use >/dev/null 2>&1) && nvm use >/dev/null 2>&1
  set -u
fi

# Emits a non-blocking "file changed under you" notice via PostToolUse's
# additionalContext (informational — does not interrupt the turn).
emit_reread_notice() {
  python3 -c '
import json, sys
f, tools = sys.argv[1], sys.argv[2]
msg = f"{f} was auto-formatted ({tools}) after your edit; re-read it before further edits, since whitespace/quotes/imports may have changed."
print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": msg}}))
' "$1" "$2"
}

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
    # Walk up to the nearest package.json so the project's own eslint/prettier config is used.
    dir=$(dirname "$file")
    while [ "$dir" != "/" ]; do
      if [ -f "$dir/package.json" ]; then
        eslint_bin="$dir/node_modules/.bin/eslint"
        prettier_bin="$dir/node_modules/.bin/prettier"
        if [ -x "$eslint_bin" ]; then
          # A missing interpreter is an infrastructure fault, not a finding
          # about the file. Exiting 2 here would tell the agent its code has
          # unfixable lint errors when nothing is wrong with it -- the exact
          # false accusation this branch used to produce. Say what actually
          # happened, exit 0, and let stop-quality-gate.sh be the backstop:
          # it runs `eslint .` tree-wide and does block.
          if ! command -v node >/dev/null 2>&1; then
            python3 -c '
import json, sys
msg = (f"post-edit-lint.sh could not lint {sys.argv[1]}: node is not on PATH "
       "(nvm did not resolve in this non-interactive hook shell). This is an "
       "environment fault, NOT a lint failure in the file -- do not go looking "
       "for a violation. The file was left exactly as written; the Stop-hook "
       "quality gate still checks the tree before turn-end.")
print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": msg}}))
' "$file"
            exit 0
          fi

          before=$(cat "$file")
          tools="eslint --fix"
          (cd "$dir" && "$eslint_bin" --fix "$file") >/dev/null 2>&1
          if [ -x "$prettier_bin" ]; then
            (cd "$dir" && "$prettier_bin" --write "$file") >/dev/null 2>&1
            tools="$tools + prettier"
          fi
          after=$(cat "$file")

          if ! out=$(cd "$dir" && "$eslint_bin" "$file" 2>&1); then
            echo "eslint reported problems in $file that could not be auto-fixed — fix them:" >&2
            echo "$out" >&2
            exit 2
          fi

          if [ "$before" != "$after" ]; then
            emit_reread_notice "$file" "$tools"
          fi
        fi
        break
      fi
      dir=$(dirname "$dir")
    done
    ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      before=$(cat "$file")
      ruff check --fix "$file" >/dev/null 2>&1
      ruff format "$file" >/dev/null 2>&1
      after=$(cat "$file")

      if ! out=$(ruff check "$file" 2>&1); then
        echo "ruff reported problems in $file that could not be auto-fixed — fix them:" >&2
        echo "$out" >&2
        exit 2
      fi

      if [ "$before" != "$after" ]; then
        emit_reread_notice "$file" "ruff check --fix + ruff format"
      fi
    fi
    ;;
esac

exit 0
