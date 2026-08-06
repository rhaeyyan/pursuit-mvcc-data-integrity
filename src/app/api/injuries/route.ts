// Black-box HTTP contract for FR-2's injuries-per-year data. Maps the
// InjuriesResult union onto HTTP per SPEC.md's table: ok/empty -> 200,
// error/upstream -> 502, error/contract -> 422. GET only. Identical
// union-to-HTTP mapping as src/app/api/deaths/route.ts.

import { fetchInjuriesPerYear } from "../../../lib/injuries";

export async function GET() {
  const result = await fetchInjuriesPerYear();

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
