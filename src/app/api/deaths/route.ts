// Black-box HTTP contract for FR-1's deaths-per-year data. Maps the
// DeathsResult union onto HTTP per SPEC.md's table: ok/empty -> 200,
// error/upstream -> 502, error/contract -> 422. GET only.

import { fetchDeathsPerYear } from "../../../lib/deaths";

export async function GET() {
  const result = await fetchDeathsPerYear();

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
