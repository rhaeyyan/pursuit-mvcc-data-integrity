import { fetchYearlyMetric, type YearlyMetricResult } from "./socrata";

const EXTRA_WHERE_REPAIRED =
  "(number_of_persons_injured > 0 OR number_of_persons_killed > 0)";

export async function fetchLocalRawSeries(
  zip: string,
): Promise<YearlyMetricResult<"collisions">> {
  return fetchYearlyMetric(
    "count(collision_id)",
    "collisions",
    `zip_code = '${zip}'`,
  );
}

export async function fetchLocalRepairedSeries(
  zip: string,
): Promise<YearlyMetricResult<"collisions">> {
  return fetchYearlyMetric(
    "count(collision_id)",
    "collisions",
    `${EXTRA_WHERE_REPAIRED} AND zip_code = '${zip}'`,
  );
}
