import cdPopulations from "./fixtures/cd-populations.json";

export interface TDIResult {
  region: string;
  tdi: number;
  deaths: number;
  injuries: number;
  population: number;
}

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

export async function fetchTDILeaderboard(): Promise<TDIResult[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set(
    "$select",
    "borough, sum(number_of_persons_injured) as injuries, sum(number_of_persons_killed) as deaths",
  );
  url.searchParams.set(
    "$where",
    "crash_date >= '2018-01-01T00:00:00' AND crash_date <= '2025-12-31T23:59:59' AND borough IS NOT NULL",
  );
  url.searchParams.set("$group", "borough");

  const headers: Record<string, string> = {};
  if (process.env.SOCRATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SOCRATA_APP_TOKEN;
  }

  // Convert + to %20 so decodeURIComponent results in spaces (for test match)
  const fetchUrl = url.toString().replace(/\+/g, "%20");
  const response = await fetch(fetchUrl, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Socrata responded ${response.status}`);
  }

  const data = await response.json();

  const results: TDIResult[] = [];

  for (const row of data) {
    const borough = row.borough as keyof typeof cdPopulations;
    const injuries = Number(row.injuries);
    const deaths = Number(row.deaths);

    // Sum population for borough
    const cds = cdPopulations[borough];
    if (!cds) continue; // Skip if we don't have population data for this borough

    const population = Object.values(cds).reduce((acc, val) => acc + val, 0);

    const tdi = ((deaths * 10 + injuries) / population) * 10000;

    results.push({
      region: borough,
      tdi,
      deaths,
      injuries,
      population,
    });
  }

  // Sort descending by TDI
  results.sort((a, b) => b.tdi - a.tdi);

  return results;
}
