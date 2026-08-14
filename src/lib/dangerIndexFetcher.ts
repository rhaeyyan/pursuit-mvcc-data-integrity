import { z } from "zod";

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

const DANGER_INDEX_SCHEMA = z.array(
  z.object({
    latitude: z.string().transform(Number),
    longitude: z.string().transform(Number),
    total: z.string().transform(Number),
  }),
);

export type DangerIndexRow = z.infer<typeof DANGER_INDEX_SCHEMA>[number];

export async function fetchDangerIndex(): Promise<DangerIndexRow[]> {
  const query = new URLSearchParams({
    $select: "latitude, longitude, COUNT(*) AS total",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0",
    $group: "latitude, longitude",
    $order: "total DESC",
    $limit: "1000",
  });

  const url = `${BASE_URL}?${query.toString()}`;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (process.env.SOCRATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SOCRATA_APP_TOKEN;
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
