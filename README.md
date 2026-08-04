# Pursuit: MVCC Integrity

**Stop trusting the raw collision count. Start measuring actual road safety.**

New York City's open data portal shows a staggering 63% drop in motor vehicle collisions from 2018 to 2025. It looks like a massive win for Vision Zero. However, traffic deaths only fell by 1% in the same period. The "drop" is a data artifact caused by an NYPD policy change, not an improvement in safety. 

MVCC Integrity is a dashboard that pulls live collision data, exposes the reporting artifact, and applies a "casualty-filtered" repair to show the true trend in NYC road safety.

> The dataset: Motor Vehicle Collisions – Crashes (`h9gi-nx95`) and NYPD Arrests Data (`8h9b-rp9u`). The problem: The raw data contains a trap that silently fabricates a safety improvement if read at face value.

## The problem with the raw data

In 2018, NYPD recorded 231,564 collisions. By 2025, that number fell to 85,546. 
If a dashboard simply aggregates the row count, the city looks dramatically safer. 

The reality: In March 2019 (Staten Island pilot) and April 2020 (citywide), the NYPD ceased dispatching officers to property-damage-only collisions. Drivers now self-file with the state DMV, and those records never enter the city's open data feed. The 63% drop in collisions is entirely driven by this policy change. Injuries fell only 20%, and deaths barely moved (-1%). The implied lethality rate skyrocketed by 2.68× simply because the denominator collapsed.

## What this tool does

MVCC Integrity queries the live Socrata endpoints and correctly aggregates the data server-side to present an accurate picture of NYC road safety from 2018 to 2025.

1. **Fetches live data:** Uses server-side SoQL to aggregate millions of rows directly from the NYC Open Data portal without paginating or transferring raw data.
2. **Exposes the artifact:** Charts the raw collision count against injuries and deaths to visually reveal the divergence caused by the policy change.
3. **Repairs the series:** Applies a casualty filter to the dataset, stripping out the volatile property-damage-only tier to present a reliable safety trend.
4. **Tracks enforcement:** Correlates the safety data with traffic-enforcement arrests (e.g., impaired driving) to analyze the relationship between policing and traffic violence.

## How it avoids the data traps

The tool is built on a strict data contract to avoid silently corrupting the results:

- **Absent-key-as-zero prevention:** Socrata omits keys rather than returning null. The engine explicitly raises an error if deaths/injuries are absent, never coercing to zero to fabricate a safety improvement.
- **Server-side SoQL aggregation:** Bypasses Socrata's 1,000-row default limit by pushing `$select` and `$group` operations to the database. The response is 8 rows (one per year), not a truncated sample.
- **Dual-spelling offense matching:** Catches both `INTOXICATED & IMPAIRED DRIVING` and `INTOXICATED/IMPAIRED DRIVING` to ensure arrest data is fully represented.
- **Causal discipline:** The dashboard states the documented cause for the collision drop (NYPD dispatch policy) but makes no causal claims about enforcement vs. safety, treating arrests simply as co-moving data.

## The data behind it

The dashboard connects directly to two NYC Open Data endpoints:
- **Motor Vehicle Collisions – Crashes (`h9gi-nx95`):** The primary dataset for crashes, injuries, and deaths.
- **NYPD Arrests Data (Historic) (`8h9b-rp9u`):** Used to track traffic-enforcement arrests (severable P1).

The analysis window is strictly locked to **2018–2025** to avoid the 2026 reporting dropout and to provide a clean pre- and post-policy view.

## Technical Notes

### System Architecture & Execution Flow

```mermaid
flowchart TD
    %% Inputs 
    SocrataCrashes[\"NYC Open Data<br/>(h9gi-nx95)"]
    SocrataArrests[\"NYC Open Data<br/>(8h9b-rp9u)"]

    subgraph ServerSide ["Next.js App Router (Server-Side)"]
        direction TD
        SoQLQuery("SoQL Query Builder<br/>(Aggregates by Year)")
        DataRepair("Data Repair Engine<br/>(Casualty Filtering)")
        TrapCheck{"Data Integrity Check<br/>(Absent Key Validation)"}
        
        SocrataCrashes --> SoQLQuery
        SocrataArrests --> SoQLQuery
        
        SoQLQuery --> TrapCheck
        TrapCheck ==>|"PASS"| DataRepair
        TrapCheck -->|"FAIL"| ErrorState("Raise Error State<br/>(Prevent Silent 0)")
    end

    subgraph ClientSide ["React Frontend (Client-Side)"]
        direction TD
        DataRepair ==> RechartsRender(["Recharts DataViz<br/>(Trend Lines & Deltas)"])
        ErrorState -.-> ErrorBoundary(["Error Boundary Alert"])
    end

    %% Class Assignments
    class SocrataCrashes,SocrataArrests,RechartsRender,ErrorBoundary inputOutput;
    class SoQLQuery,DataRepair deterministic;
    class TrapCheck decision;

    %% Styling Definitions
    classDef deterministic fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef inputOutput fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
```

### Build order (walking skeleton)

1. **Scaffold Next.js App Router:** Set up the project structure.
2. **First SoQL Call:** Fetch one metric (deaths per year) from the live Socrata endpoint.
3. **Render Chart:** Display the single metric using Recharts.
4. **Expand & Repair:** Add injuries, collisions, and the casualty-filtered repair series.
5. **Add Arrests:** Integrate the severable P1 arrest data.

### Explicitly out of scope for V1

- A database (Supabase or otherwise) -- all data is fetched live from Socrata endpoints.
- Any demographic fields -- `perp_race`, `perp_sex`, and `age_group` are permanently excluded.
- Causal claims connecting enforcement to safety outcomes.

### Stack

- **Frontend / Backend:** Next.js App Router (React + TypeScript)
- **DataViz:** Recharts
- **Data Fetching:** Server-side SoQL (`$select`, `$where`, `$group`)
- **Linting:** Biome or project eslint/prettier (based on config generation)

### Status

**V1 Kickoff / Walking Skeleton Phase**

The data contract has been rigorously verified against live Socrata endpoints (as of August 2026), and we are currently standing up the walking skeleton to render the initial metric (deaths per year) from a live server-side SoQL call.
