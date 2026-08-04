#!/usr/bin/env bash
# Verify that every Markdown link in the repo's *normative* docs resolves.
#
# Rationale (docs/adr/0001): rules that cite evidence are only as good as the
# citation. Three documentation-vs-reality drifts occurred in a single session
# on 2026-07-28, including stale file:/// links in SESSION_STATE.md and, more
# consequentially, AGENTS.md and .claude/agents/aspen.md coming to depend on a
# worked example that a condensation pass had silently deleted. A broken
# citation in a rule is a defect, not cosmetics: it is how a rule quietly loses
# its justification.
#
# Scope is deliberately narrow. Only Markdown links -- [text](target) -- and
# file:// URIs are checked, because those are unambiguous. Backtick-quoted
# paths are NOT checked: the normative docs are full of illustrative ones
# (`docs/adr/NNNN-slug.md`, `notebook/week-N/`, `<file.eml>`) that are templates
# rather than claims, and flagging them would make this noisy enough to ignore.
#
# Usage:
#   ./.claude/hooks/check-citations.sh          standalone, prints an all-clear
#   ./.claude/hooks/check-citations.sh --quiet   silent on success
#   ./.claude/hooks/check-citations.sh --hook     Stop-hook mode (reads stdin JSON)
#   exit 0 = all citations resolve; exit 2 = at least one is broken.
#
# Stop-hook mode honors the CLAUDE.md "cap every autonomous loop" rule: it blocks
# at most once per turn via stop_hook_active, so an unfixable link escalates to
# the human instead of looping.
set -u

mode="${1:-}"
quiet=0

if [ "$mode" = "--hook" ]; then
  quiet=1
  input=$(cat)
  printf '%s' "$input" | grep -q '"stop_hook_active": *true' && exit 0
elif [ "$mode" = "--quiet" ]; then
  quiet=1
fi

proj="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$proj" || exit 0

# The normative set: docs that carry rules or agent behavior. Session ledgers are
# included because their file:// links have drifted before. CLAUDE.md and GEMINI.md
# are independent standalone files (no longer symlinked to a shared AGENTS.md), so
# both are checked.
targets=$(ls CLAUDE.md GEMINI.md SESSION_STATE.md ARCHIVED_SESSIONS.md 2>/dev/null
          ls .claude/agents/*.md docs/adr/*.md 2>/dev/null)

broken=0
report=""

for src in $targets; do
  [ -f "$src" ] || continue
  srcdir=$(dirname "$src")

  # Extract link targets: [text](target) plus bare file:// URIs.
  while IFS= read -r target; do
    [ -n "$target" ] || continue

    # Skip external schemes and pure in-page anchors.
    case "$target" in
      http://*|https://*|mailto:*|\#*) continue ;;
    esac

    # Skip obvious templates/placeholders rather than reporting them as broken.
    case "$target" in
      *NNNN*|*'<'*|*'>'*|*week-N*|*'{'*) continue ;;
    esac

    frag=""
    path="$target"
    case "$target" in
      *\#*) path="${target%%#*}"; frag="${target#*#}" ;;
    esac
    [ -n "$path" ] || continue

    # file:// URIs are absolute; everything else resolves against the citing file.
    case "$path" in
      file://*) abs="${path#file://}" ;;
      /*)       abs="$path" ;;
      *)        abs="$srcdir/$path" ;;
    esac

    if [ ! -e "$abs" ]; then
      report="${report}  $src -> $target (no such file)"$'\n'
      broken=$((broken + 1))
      continue
    fi

    # Anchor check: only for Markdown files, and only when the fragment looks
    # like a heading slug we can verify. Unresolvable anchors are reported but
    # kept distinct from missing files.
    if [ -n "$frag" ] && [ -f "$abs" ] && case "$abs" in *.md) true ;; *) false ;; esac; then
      slugs=$(grep '^#\{1,6\} ' "$abs" 2>/dev/null \
        | sed 's/^#\{1,6\} *//; s/[^[:alnum:] -]//g' \
        | tr '[:upper:] ' '[:lower:]-')
      if ! printf '%s\n' "$slugs" | grep -qxF "$frag"; then
        report="${report}  $src -> $target (file exists, no heading matches #$frag)"$'\n'
        broken=$((broken + 1))
      fi
    fi
  done <<EOF
$(grep -oE '\[[^]]*\]\([^)]+\)' "$src" 2>/dev/null | sed 's/.*(\(.*\))/\1/'
  grep -oE 'file://[^ )`"]+' "$src" 2>/dev/null)
EOF
done

if [ "$broken" -gt 0 ]; then
  printf 'Broken citation(s) in normative docs -- %d found:\n%s' "$broken" "$report" >&2
  printf 'A rule that cites a missing file has lost its justification (docs/adr/0001). Fix the link or the target.\n' >&2
  exit 2
fi

[ "$quiet" -eq 1 ] || echo "All citations in normative docs resolve."
exit 0
