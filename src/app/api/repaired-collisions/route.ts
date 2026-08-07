// Black-box HTTP contract for FR-12's repaired-collisions-per-year data.
// Maps the RepairedCollisionsResult union onto HTTP per SPEC.md's table:
// ok/empty -> 200, error/upstream -> 502, error/contract -> 422. GET only.
// Identical union-to-HTTP mapping as src/app/api/deaths/route.ts,
// src/app/api/injuries/route.ts, and src/app/api/collisions/route.ts.

import { fetchRepairedCollisionsPerYear } from "../../../lib/repairedCollisions";

export async function GET() {
  const result = await fetchRepairedCollisionsPerYear();

  switch (result.status) {
    case "ok":
      return Response.json(
        { status: result.status, soql: result.soql, rows: result.rows },
        { status: 200 },
      );
    case "empty":
      return Response.json(
        { status: result.status, soql: result.soql },
        { status: 200 },
      );
    case "error":
      return Response.json(
        {
          status: result.status,
          soql: result.soql,
          kind: result.kind,
          reason: result.reason,
        },
        { status: result.kind === "upstream" ? 502 : 422 },
      );
  }
}
