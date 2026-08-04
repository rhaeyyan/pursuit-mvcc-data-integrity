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
