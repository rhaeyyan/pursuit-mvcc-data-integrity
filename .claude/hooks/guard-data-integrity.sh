#!/usr/bin/env bash
# PostToolUse hook for Edit|Write: mechanize the two project constraints that
# prose cannot enforce, because both fail silently and both are unrecoverable
# once shipped.
#
#   1. Token exposure (NFR-2). The Socrata App Token is server-side only. A
#      NEXT_PUBLIC_ prefix or a process.env read inside a 'use client' module
#      ships it in the browser bundle to every visitor. The assignment brief
#      explicitly says to treat the token like a password.
#
#   2. Hardcoded figures (NFR-4). Every number on the page must come from SoQL
#      aggregation or a pure tested function. A verified figure pasted into a
#      component is the exact failure this product exists to criticize -- and it
#      is invisible in review precisely because the value is *correct today*.
#
# Deliberately narrow: it only inspects the file just written, only flags the
# pinned figures from PRD Appendix A, and skips test/fixture/doc files where a
# literal expected value is the whole point.
#
# exit 2 feeds stderr back to Claude as context to fix immediately.
set -u

input=$(cat)
file=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)

[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

violations=""

# --- Check 1: token exposure ------------------------------------------------
if grep -qE 'NEXT_PUBLIC_[A-Z_]*(SOCRATA|APP_TOKEN|TOKEN)' "$file"; then
  violations="${violations}  - A NEXT_PUBLIC_* name is used for the Socrata token in $file. Anything
    NEXT_PUBLIC_ is inlined into the client bundle and served to every visitor.
    Use SOCRATA_APP_TOKEN (unprefixed) and read it only inside a Route Handler.
"
fi

# 'use client' must appear in the first few lines to be a directive at all.
if head -n 5 "$file" | grep -qE "^[[:space:]]*['\"]use client['\"]" \
   && grep -qE 'process\.env\.[A-Z_]*(SOCRATA|TOKEN)' "$file"; then
  violations="${violations}  - $file is a client component ('use client') and reads a token from
    process.env. Move the fetch into a server-side Route Handler; the client
    should receive aggregated JSON, never the credential.
"
fi

# --- Check 2: hardcoded verified figures ------------------------------------
# Skip tests and fixtures: asserting a known value there is correct behavior.
case "$file" in
  *test*|*spec*|*__tests__*|*fixture*|*.d.ts) ;;
  *)
    # Pinned yearly values from PRD Appendix A (collisions, injuries, deaths,
    # casualty-filtered). Matched with optional separators (231564 / 231_564 /
    # "231,564") but bounded so unrelated numbers do not trip it.
    pinned='231564|211486|112918|110558|103887|96607|91316|85546|61940|61391|44615|51785|51933|54252|54030|49634|45774|45439|33362|38809|39336|40472|40229|37420|185790|48126'
    if hits=$(grep -nE "(^|[^0-9._])(${pinned})([^0-9]|$)" "$file" 2>/dev/null | head -n 3) && [ -n "$hits" ]; then
      violations="${violations}  - $file contains a pinned figure as a literal:
$(printf '%s\n' "$hits" | sed 's/^/      /')
    Every displayed number must come from the API response or a pure function
    (NFR-4). A correct-today literal silently goes stale and is unreviewable.
"
    fi
    ;;
esac

if [ -n "$violations" ]; then
  printf 'Data-integrity guard blocked this edit:\n%s' "$violations" >&2
  exit 2
fi

exit 0
