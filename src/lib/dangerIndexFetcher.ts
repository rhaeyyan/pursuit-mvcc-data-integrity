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
    $select: "latitude, longitude, COUNT(*) AS total",
    $where:
      "latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0",
    $group: "latitude, longitude",
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
