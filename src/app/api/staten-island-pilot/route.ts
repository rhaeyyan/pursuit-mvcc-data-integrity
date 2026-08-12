// Black-box HTTP contract for the Staten Island pilot panel (SPEC.md —
// "Staten Island pilot panel — data half only"). Maps the SIPilotResult
// union onto HTTP exactly like src/app/api/deaths/route.ts: ok/empty -> 200,
// error/upstream -> 502, error/contract -> 422. GET only.

import { fetchStatenIslandPilot } from "../../../lib/statenIslandPilot";

export async function GET() {
  const result = await fetchStatenIslandPilot();

  switch (result.status) {
    case "ok":
      return Response.json(
        {
          status: result.status,
          soql: result.soql,
          rows: result.rows,
          stats: result.stats,
        },
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
