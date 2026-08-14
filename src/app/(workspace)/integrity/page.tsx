import { IntegrityAudit } from "@/components/IntegrityAudit";
import type { CoverageProp, SIPilotProp } from "@/components/IntegrityAudit";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

import { fetchArrestsPerYear } from "@/lib/arrests";
import { fetchCoverageData } from "@/lib/arrestsCoverage";
import { fetchCollisionsPerYear } from "@/lib/collisions";
import { fetchDeathsPerYear } from "@/lib/deaths";
import { fetchInjuriesPerYear } from "@/lib/injuries";
import { fetchRepairedCollisionsPerYear } from "@/lib/repairedCollisions";
import { fetchStatenIslandPilot } from "@/lib/statenIslandPilot";

export const metadata = {
  title: "Integrity Audit - MVCC Data",
};

function toCoverageProp(
  result: Awaited<ReturnType<typeof fetchCoverageData>>,
): CoverageProp {
  const collisions =
    result.status === "ok" || result.status === "partial"
      ? result.collisions
      : undefined;
  if (!collisions || collisions.yearly.length === 0) {
    return { status: "unavailable" };
  }
  return {
    status: "ok",
    yearly: collisions.yearly,
    windowUnpopulatedSharePercent: collisions.windowUnpopulatedSharePercent,
  };
}

function toSIPilotProp(
  result: Awaited<ReturnType<typeof fetchStatenIslandPilot>>,
): SIPilotProp {
  if (result.status !== "ok") {
    const reason =
      result.status === "empty" ? "no rows returned" : result.reason;
    return { status: "unavailable", reason };
  }

  const year2018Total = result.rows
    .filter((r) => r.month.startsWith("2018"))
    .reduce((sum, r) => sum + r.collisions, 0);
  const april2019 =
    result.rows.find((r) => r.month === "2019-04")?.collisions ?? null;

  return {
    status: "ok",
    avg2018Monthly: result.stats.avg2018Monthly,
    avgMayDec2019: result.stats.avgMayDec2019,
    year2018Total,
    april2019,
  };
}

export default async function IntegrityPage() {
  const [
    deathsResult,
    injuriesResult,
    collisionsResult,
    repairedResult,
    arrestsResult,
    coverageResult,
    siPilotResult,
  ] = await Promise.all([
    fetchDeathsPerYear(),
    fetchInjuriesPerYear(),
    fetchCollisionsPerYear(),
    fetchRepairedCollisionsPerYear(),
    fetchArrestsPerYear(),
    fetchCoverageData(),
    fetchStatenIslandPilot(),
  ]);

  return (
    <>
      <WorkspaceHeader
        dateline="Citywide · window 2018–2025 · live aggregate"
        caveat="Correlation language only · no causal claims"
        headline="What the record can and cannot support"
        standfirst="The reporting break, the tier it lives in, and the coverage that qualifies every borough figure — assembled so an analyst can hand it across a table."
      />
      <IntegrityAudit
        data={{
          deaths: deathsResult,
          injuries: injuriesResult,
          collisions: collisionsResult,
          repaired: repairedResult,
          arrests: arrestsResult,
        }}
        coverage={toCoverageProp(coverageResult)}
        siPilot={toSIPilotProp(siPilotResult)}
      />
    </>
  );
}
