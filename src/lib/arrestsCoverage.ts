import { fetchArrestsQuery, BASE_URL as ARRESTS_BASE_URL } from "./arrestsSocrata";
import { ARRESTS_OFFENSE_WHERE } from "./arrests";
import { fetchYearlyMetric } from "./socrata";

export type YearlyCoverageRow = {
  year: number;
  total: number;
  populated: number;
  coverageRatePercent: number;
};

export type DatasetCoverageMetrics = {
  yearly: YearlyCoverageRow[];
  totalWindow: number;
  populatedWindow: number;
  windowUnpopulatedSharePercent: number;
};

export type CoverageResult =
  | {
      status: "ok";
      collisions: DatasetCoverageMetrics;
      arrests: DatasetCoverageMetrics;
    }
  | {
      status: "partial";
      collisions?: DatasetCoverageMetrics;
      arrests?: DatasetCoverageMetrics;
      reason: string;
    }
  | {
      status: "error";
      kind: "upstream" | "contract";
      reason: string;
    };

function deriveDatasetMetrics(
  totalRows: { year: number; total: number }[],
  populatedRows: { year: number; populated: number }[],
): DatasetCoverageMetrics {
  const populatedMap = new Map<number, number>();
  for (const r of populatedRows) {
    populatedMap.set(r.year, r.populated);
  }

  const yearly: YearlyCoverageRow[] = [];
  let totalWindow = 0;
  let populatedWindow = 0;

  for (const r of totalRows) {
    const year = r.year;
    const total = r.total;
    const populated = populatedMap.get(year) ?? 0;
    const coverageRatePercent = total > 0 ? (populated / total) * 100 : 0;

    yearly.push({
      year,
      total,
      populated,
      coverageRatePercent,
    });

    totalWindow += total;
    populatedWindow += populated;
  }

  const windowUnpopulatedSharePercent =
    totalWindow > 0
      ? ((totalWindow - populatedWindow) / totalWindow) * 100
      : 0;

  return {
    yearly,
    totalWindow,
    populatedWindow,
    windowUnpopulatedSharePercent,
  };
}

export async function fetchCoverageData(): Promise<CoverageResult> {
  const collisionsTotalPromise = fetchYearlyMetric("count(*)", "total");
  const collisionsPopulatedPromise = fetchYearlyMetric(
    "count(*)",
    "populated",
    "borough IS NOT NULL AND borough != ''",
  );

  const arrestsTotalUrl = new URL(ARRESTS_BASE_URL);
  arrestsTotalUrl.searchParams.set(
    "$select",
    "date_extract_y(arrest_date) AS year, count(*) AS total",
  );
  arrestsTotalUrl.searchParams.set("$where", ARRESTS_OFFENSE_WHERE);
  arrestsTotalUrl.searchParams.set("$group", "date_extract_y(arrest_date)");
  arrestsTotalUrl.searchParams.set("$order", "year");

  const arrestsTotalSoql = [
    "$select=date_extract_y(arrest_date) AS year, count(*) AS total",
    `$where=${ARRESTS_OFFENSE_WHERE}`,
    "$group=date_extract_y(arrest_date)",
    "$order=year",
  ].join("\n");

  const arrestsTotalPromise = fetchArrestsQuery(
    arrestsTotalSoql,
    arrestsTotalUrl,
    "total",
  );

  const arrestsPopulatedWhere = `${ARRESTS_OFFENSE_WHERE} AND arrest_boro IN ('B', 'K', 'M', 'Q', 'S')`;
  const arrestsPopulatedUrl = new URL(ARRESTS_BASE_URL);
  arrestsPopulatedUrl.searchParams.set(
    "$select",
    "date_extract_y(arrest_date) AS year, count(*) AS populated",
  );
  arrestsPopulatedUrl.searchParams.set("$where", arrestsPopulatedWhere);
  arrestsPopulatedUrl.searchParams.set(
    "$group",
    "date_extract_y(arrest_date)",
  );
  arrestsPopulatedUrl.searchParams.set("$order", "year");

  const arrestsPopulatedSoql = [
    "$select=date_extract_y(arrest_date) AS year, count(*) AS populated",
    `$where=${arrestsPopulatedWhere}`,
    "$group=date_extract_y(arrest_date)",
    "$order=year",
  ].join("\n");

  const arrestsPopulatedPromise = fetchArrestsQuery(
    arrestsPopulatedSoql,
    arrestsPopulatedUrl,
    "populated",
  );

  const [
    collisionsTotalRes,
    collisionsPopulatedRes,
    arrestsTotalRes,
    arrestsPopulatedRes,
  ] = await Promise.all([
    collisionsTotalPromise,
    collisionsPopulatedPromise,
    arrestsTotalPromise,
    arrestsPopulatedPromise,
  ]);

  let collisionsMetrics: DatasetCoverageMetrics | undefined;
  let collisionsError:
    | { kind: "upstream" | "contract"; reason: string }
    | undefined;

  if (
    collisionsTotalRes.status === "ok" &&
    collisionsPopulatedRes.status === "ok"
  ) {
    collisionsMetrics = deriveDatasetMetrics(
      collisionsTotalRes.rows,
      collisionsPopulatedRes.rows,
    );
  } else {
    const failed =
      collisionsTotalRes.status !== "ok"
        ? collisionsTotalRes
        : collisionsPopulatedRes;
    let kind: "upstream" | "contract" = "upstream";
    if (
      (collisionsTotalRes.status === "error" &&
        collisionsTotalRes.kind === "contract") ||
      (collisionsPopulatedRes.status === "error" &&
        collisionsPopulatedRes.kind === "contract")
    ) {
      kind = "contract";
    }
    const reason =
      failed.status === "error"
        ? failed.reason
        : "Collisions query returned no rows";
    collisionsError = { kind, reason };
  }

  let arrestsMetrics: DatasetCoverageMetrics | undefined;
  let arrestsError:
    | { kind: "upstream" | "contract"; reason: string }
    | undefined;

  if (
    arrestsTotalRes.status === "ok" &&
    arrestsPopulatedRes.status === "ok"
  ) {
    arrestsMetrics = deriveDatasetMetrics(
      arrestsTotalRes.rows,
      arrestsPopulatedRes.rows,
    );
  } else {
    const failed =
      arrestsTotalRes.status !== "ok"
        ? arrestsTotalRes
        : arrestsPopulatedRes;
    let kind: "upstream" | "contract" = "upstream";
    if (
      (arrestsTotalRes.status === "error" &&
        arrestsTotalRes.kind === "contract") ||
      (arrestsPopulatedRes.status === "error" &&
        arrestsPopulatedRes.kind === "contract")
    ) {
      kind = "contract";
    }
    const reason =
      failed.status === "error"
        ? failed.reason
        : "Arrests query returned no rows";
    arrestsError = { kind, reason };
  }

  if (collisionsMetrics && arrestsMetrics) {
    return {
      status: "ok",
      collisions: collisionsMetrics,
      arrests: arrestsMetrics,
    };
  }

  if (collisionsMetrics && !arrestsMetrics) {
    return {
      status: "partial",
      collisions: collisionsMetrics,
      reason: arrestsError?.reason ?? "Failed to fetch arrests coverage data",
    };
  }

  if (!collisionsMetrics && arrestsMetrics) {
    return {
      status: "partial",
      arrests: arrestsMetrics,
      reason:
        collisionsError?.reason ?? "Failed to fetch collisions coverage data",
    };
  }

  const combinedKind: "upstream" | "contract" =
    collisionsError?.kind === "contract" || arrestsError?.kind === "contract"
      ? "contract"
      : "upstream";

  const combinedReason = [collisionsError?.reason, arrestsError?.reason]
    .filter(Boolean)
    .join("; ");

  return {
    status: "error",
    kind: combinedKind,
    reason:
      combinedReason || "Failed to fetch coverage data for both datasets",
  };
}
