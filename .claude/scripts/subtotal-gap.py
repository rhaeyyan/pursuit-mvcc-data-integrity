#!/usr/bin/env python3
"""Measure the deaths/injuries subtotal gap against the pinned finding.

Checks, not reports: this reproduces the "authoritative total minus subgroup
sum" gap that falsified the synthetic-fallback mitigation recorded in
docs/adr/0002-no-synthetic-subtotal-fallback.md. The gap is exactly 0 for
2018-2020, then opens from 2021 onward — NYPD records a casualty on the crash
record without always assigning that person a role, so the subgroup sum is
"casualties we could classify," not "casualties." Never use it as a fallback
for an absent primary aggregate (FR-11).

Deterministic by design (CLAUDE.md, Bounded AI): this script computes the
diff; the agent only summarizes what it prints. No figure in this project may
be produced, rounded, or inferred by a language model.

The pinned gap table was queried live 2026-08-05 against h9gi-nx95. A drifted
cell is itself a finding — see docs/adr/0002-no-synthetic-subtotal-fallback.md
Consequences (a) for why the gap's *shape* matters more than its size.

Usage:
    ./.claude/scripts/subtotal-gap.py

Exit codes: 0 = every gap cell matches; 1 = at least one cell drifted or a
required field was absent from the live response; 2 = fetch failed.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

CRASHES = "https://data.cityofnewyork.us/resource/h9gi-nx95.json"
YEARS = list(range(2018, 2026))
WINDOW = "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00'"

SELECT = (
    "date_extract_y(crash_date) AS year, "
    "sum(number_of_persons_killed) AS killed, "
    "sum(number_of_pedestrians_killed) AS k_ped, "
    "sum(number_of_cyclist_killed) AS k_cyc, "
    "sum(number_of_motorist_killed) AS k_mot, "
    "sum(number_of_persons_injured) AS injured, "
    "sum(number_of_pedestrians_injured) AS i_ped, "
    "sum(number_of_cyclist_injured) AS i_cyc, "
    "sum(number_of_motorist_injured) AS i_mot"
)

# series -> (authoritative field, subgroup fields whose sum is diffed against it)
SERIES_FIELDS: dict[str, tuple[str, tuple[str, str, str]]] = {
    "deaths": ("killed", ("k_ped", "k_cyc", "k_mot")),
    "injuries": ("injured", ("i_ped", "i_cyc", "i_mot")),
}

# Expected (authoritative - subgroup_sum), transcribed once from the live
# 2026-08-05 run pinned in SPEC.md's Query section -- never re-derived.
# See docs/adr/0002-no-synthetic-subtotal-fallback.md for the finding this
# reproduces.
PINNED_GAPS: dict[str, dict[int, int]] = {
    "deaths": {
        2018: 0,
        2019: 0,
        2020: 0,
        2021: 12,
        2022: 20,
        2023: 19,
        2024: 9,
        2025: 6,
    },
    "injuries": {
        2018: 23,
        2019: 1,
        2020: 0,
        2021: 2132,
        2022: 2392,
        2023: 2411,
        2024: 1835,
        2025: 1405,
    },
}


def fetch() -> dict[int, dict[str, int]]:
    """Query the yearly casualty totals and subgroup fields in one request.

    Returns:
        Mapping of year to the fields present in that row, cast to int. A
        field Socrata omits for a given year is omitted here too -- never
        coerced to 0 (trap 1).

    Raises:
        SystemExit: If the request fails or the response cannot be parsed.
    """
    params = {
        "$select": SELECT,
        "$where": WINDOW,
        "$group": "date_extract_y(crash_date)",
        "$order": "year",
    }
    url = f"{CRASHES}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})

    token = os.environ.get("SOCRATA_APP_TOKEN")
    if token:
        req.add_header("X-App-Token", token)

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            rows = json.load(resp)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"fetch failed: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc

    out: dict[int, dict[str, int]] = {}
    for row in rows:
        if "year" not in row or row["year"] is None:
            continue
        year = int(float(row["year"]))
        fields: dict[str, int] = {}
        for key in (
            "killed",
            "k_ped",
            "k_cyc",
            "k_mot",
            "injured",
            "i_ped",
            "i_cyc",
            "i_mot",
        ):
            value = row.get(key)
            if value is not None:
                fields[key] = int(float(value))
        out[year] = fields
    return out


def main() -> int:
    if not os.environ.get("SOCRATA_APP_TOKEN"):
        print(
            "note: SOCRATA_APP_TOKEN unset — querying anonymously (rate-limited)\n",
            file=sys.stderr,
        )

    live = fetch()
    drifted = 0
    absent = 0

    for series, (total_field, part_fields) in SERIES_FIELDS.items():
        pinned = PINNED_GAPS[series]
        print(f"\n{series}")
        print(f"  {'year':<6}{'pinned':>10}{'live':>10}{'delta':>10}  status")
        for year in YEARS:
            row = live.get(year, {})
            required = (total_field, *part_fields)
            missing = [field for field in required if field not in row]
            want = pinned[year]

            if missing:
                absent += 1
                print(f"  {year:<6}{want:>10}{'—':>10}{'':>10}  ABSENT")
                print(f"    <-- {series} {year}: missing field(s) {', '.join(missing)}")
                continue

            got = row[total_field] - sum(row[field] for field in part_fields)
            delta = got - want
            if got == want:
                print(f"  {year:<6}{want:>10}{got:>10}{delta:>+10}  ok")
            else:
                drifted += 1
                print(f"  {year:<6}{want:>10}{got:>10}{delta:>+10}  DRIFT")
                print(
                    f"    <-- {series} {year}: pinned {want}, live {got} ({delta:+d})"
                )

    print()
    if absent:
        print(
            f"{absent} year/series cell(s) had a field ABSENT from the live response. "
            "This is the fail-loud case (FR-11 / trap 1) — a gap is never computed "
            "from a missing operand."
        )
    if drifted:
        print(
            f"{drifted} cell(s) drifted from the pinned gap table — see "
            "docs/adr/0002-no-synthetic-subtotal-fallback.md before adjudicating."
        )
    if not drifted and not absent:
        print("All gap cells match the pinned table.")

    return 1 if (drifted or absent) else 0


if __name__ == "__main__":
    sys.exit(main())
