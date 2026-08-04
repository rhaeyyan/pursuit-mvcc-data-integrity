#!/usr/bin/env python3
"""Re-verify the MVCC Data pinned figures against the live Socrata API.

Deterministic by design (CLAUDE.md, Bounded AI): this script computes the diff;
the agent only summarizes what it prints. No figure in this project may be
produced, rounded, or inferred by a language model.

The pinned table is PRD Appendix A, queried live 2026-08-03. A mismatch is a
finding, not an error to paper over: the collisions feed is flagged preliminary
and ingestion paused mid-window, so late amendments are expected. Report the
drift and, if 2025 moved materially, switch headline deltas to two-year averages
per the PRD risk register.

Usage:
    ./.claude/scripts/verify-figures.py            all series
    ./.claude/scripts/verify-figures.py --json     machine-readable output

Exit codes: 0 = every figure matches; 1 = at least one drifted; 2 = fetch failed.
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
CASUALTY = "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)"

# PRD Appendix A, verified 2026-08-03.
PINNED: dict[str, dict[int, int]] = {
    "collisions": {
        2018: 231564,
        2019: 211486,
        2020: 112918,
        2021: 110558,
        2022: 103887,
        2023: 96607,
        2024: 91316,
        2025: 85546,
    },
    "injuries": {
        2018: 61940,
        2019: 61391,
        2020: 44615,
        2021: 51785,
        2022: 51933,
        2023: 54252,
        2024: 54030,
        2025: 49634,
    },
    "deaths": {
        2018: 231,
        2019: 244,
        2020: 269,
        2021: 297,
        2022: 290,
        2023: 280,
        2024: 268,
        2025: 229,
    },
    "casualty_filtered": {
        2018: 45774,
        2019: 45439,
        2020: 33362,
        2021: 38809,
        2022: 39336,
        2023: 40472,
        2024: 40229,
        2025: 37420,
    },
}

SERIES: dict[str, tuple[str, str]] = {
    # name -> (aggregate expression, extra $where clause)
    "collisions": ("count(*)", ""),
    "injuries": ("sum(number_of_persons_injured)", ""),
    "deaths": ("sum(number_of_persons_killed)", ""),
    "casualty_filtered": ("count(*)", f" AND {CASUALTY}"),
}


def fetch(aggregate: str, extra_where: str) -> dict[int, int]:
    """Query one yearly series from the crashes dataset.

    Args:
        aggregate: SoQL aggregate expression, e.g. ``sum(number_of_persons_killed)``.
        extra_where: Additional ``$where`` predicate appended to the window, or "".

    Returns:
        Mapping of year to the aggregated value, cast to int.

    Raises:
        SystemExit: If the request fails or the response cannot be parsed.
    """
    params = {
        "$select": f"date_extract_y(crash_date) AS yr, {aggregate} AS n",
        "$where": WINDOW + extra_where,
        "$group": "date_extract_y(crash_date)",
        "$order": "yr",
        "$limit": "50",
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
        print(f"fetch failed for {aggregate}: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc

    out: dict[int, int] = {}
    for row in rows:
        # Socrata returns every numeric as a string; absent keys are omitted
        # entirely rather than nulled. Both are handled explicitly -- never
        # coerced to zero (CLAUDE.md FR-11).
        if "yr" not in row or "n" not in row or row["n"] is None:
            continue
        out[int(float(row["yr"]))] = int(float(row["n"]))
    return out


def main() -> int:
    as_json = "--json" in sys.argv
    if not os.environ.get("SOCRATA_APP_TOKEN"):
        print(
            "note: SOCRATA_APP_TOKEN unset — querying anonymously (rate-limited)\n",
            file=sys.stderr,
        )

    results: dict[str, dict[str, object]] = {}
    drifted = 0
    missing = 0

    for name, (aggregate, extra) in SERIES.items():
        live = fetch(aggregate, extra)
        pinned = PINNED[name]
        rows = []
        for year in YEARS:
            want = pinned[year]
            got = live.get(year)
            if got is None:
                status, missing = "ABSENT", missing + 1
            elif got == want:
                status = "ok"
            else:
                status, drifted = "DRIFT", drifted + 1
            rows.append(
                {
                    "year": year,
                    "pinned": want,
                    "live": got,
                    "delta": None if got is None else got - want,
                    "status": status,
                }
            )
        results[name] = {"rows": rows}

    if as_json:
        print(
            json.dumps(
                {
                    "results": results,
                    "drifted": drifted,
                    "absent": missing,
                },
                indent=2,
            )
        )
    else:
        for name, payload in results.items():
            print(f"\n{name}")
            print(f"  {'year':<6}{'pinned':>10}{'live':>10}{'delta':>10}  status")
            for row in payload["rows"]:  # type: ignore[index]
                live = "—" if row["live"] is None else f"{row['live']:,}"
                delta = "" if row["delta"] is None else f"{row['delta']:+,}"
                flag = "" if row["status"] == "ok" else f"  <-- {row['status']}"
                print(
                    f"  {row['year']:<6}{row['pinned']:>10,}{live:>10}{delta:>10}"
                    f"  {row['status']}{flag}"
                )

        print()
        if missing:
            print(
                f"{missing} figure(s) ABSENT from the live response. This is the "
                "fail-loud case (FR-11) — do not treat an absent aggregate as zero."
            )
        if drifted:
            print(
                f"{drifted} figure(s) drifted from the pinned table. Expected for a "
                "preliminary feed; if 2025 moved materially, switch headline deltas "
                "to 2018-19 vs 2024-25 two-year averages and re-pin Appendix A."
            )
        if not drifted and not missing:
            print("All figures match the pinned table (PRD Appendix A).")

    return 1 if (drifted or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
