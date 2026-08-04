---
description: Re-query the live Socrata API and diff every displayed figure against the pinned table (PRD Appendix A)
allowed-tools: Bash(./.claude/scripts/verify-figures.py *), Read, Grep, Glob
---

Run the deterministic verifier and report what it found:

!`./.claude/scripts/verify-figures.py`

Then interpret the output above — do not recompute anything yourself, and do not restate a figure
the script did not print:

1. **If everything matched**, say so in one line and stop. No further work needed.
2. **If a figure DRIFTED**, the collisions feed has been revised (it is flagged preliminary and
   ingestion was paused mid-window, so this is expected rather than alarming). Report the affected
   years and magnitudes, then check whether the 2025 endpoint moved — if it did, the PRD risk
   register calls for switching headline deltas to 2018–19 vs 2024–25 two-year averages rather
   than restating a single-year number. Recommend re-pinning `docs/project-mvcc-data.md`
   Appendix A and `.claude/skills/mvcc-data/SKILL.md` together; they must never disagree.
3. **If a figure is ABSENT**, this is the fail-loud case (FR-11) and the more serious one: the
   known `number_of_persons_killed` dropout may have extended backwards into the analysis window.
   Do not treat it as zero, do not work around it. Report it as a blocker and stop.

If the app already renders figures, also grep the source for any of the pinned values appearing as
hardcoded literals — a figure baked into a component is an NFR-4 violation regardless of whether
it currently happens to be correct.
