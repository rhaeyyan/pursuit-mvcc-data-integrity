import { z } from "zod";
import { getSocrataAppToken } from "./socrata";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

const DANGER_INDEX_SCHEMA = z.array(
  z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    total: z.coerce.number(),
  }),
);

export type DangerIndexRow = z.infer<typeof DANGER_INDEX_SCHEMA>[number];

export async function fetchDangerIndex(): Promise<DangerIndexRow[]> {
  const query = new URLSearchParams({
    $select:
      "round(latitude, 5) AS latitude, round(longitude, 5) AS longitude, COUNT(*) AS total",
    $where:
      "crash_date >= '2018-01-01T00:00:00' AND crash_date < '2026-01-01T00:00:00' AND latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0",
    $group: "round(latitude, 5), round(longitude, 5)",
    $order: "total DESC",
    $limit: "1000",
  });

  const url = `${BASE_URL}?${query.toString()}`;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const token = getSocrataAppToken();
  if (token) {
    headers["X-App-Token"] = token;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Danger index fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return DANGER_INDEX_SCHEMA.parse(data);
}
