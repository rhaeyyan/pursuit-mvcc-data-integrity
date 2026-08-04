#!/usr/bin/env bash
# PreToolUse hook for Bash: ask for confirmation before destructive git commands.
# This mechanizes the Git Safety Protocol (never force-push, never reset --hard
# without asking) instead of relying on prose alone — "not honor system"
# (CLAUDE.md's Team Roster note) applies to git operations too.
set -u

input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)

[ -z "$cmd" ] && exit 0

reason=""

case "$cmd" in
  *git\ push*)
    case "$cmd" in
      *--force-with-lease*) ;;
      *--force*|*' -f '*|*' -f')
        reason="git push --force (without --force-with-lease) can silently overwrite remote commits."
        ;;
    esac
    ;;
esac

case "$cmd" in
  *git\ reset*--hard*)
    reason="${reason:+$reason }git reset --hard discards uncommitted working-tree changes irreversibly."
    ;;
esac

if [ -n "$reason" ]; then
  python3 -c '
import json, sys
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "ask",
        "permissionDecisionReason": sys.argv[1],
    }
}))
' "$reason"
fi

exit 0
