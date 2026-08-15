import { fetchDynamicSIPs } from "./socrata-sips";

export interface SIPObject {
  id: string;
  name: string;
  borough: string;
  latitude: number;
  longitude: number;
  completionDate: string;
}

export interface SIPStats {
  sip: SIPObject;
  before: {
    collisions: number;
    casualties: number;
  };
  after: {
    collisions: number;
    casualties: number;
  };
  change: {
    collisionsPct: number;
    casualtiesPct: number;
  };
}

const BASE_URL = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

function computeDateWindows(completionDate: string) {
  const [yearStr, monthStr, dayStr] = completionDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const beforeStart = new Date(Date.UTC(year - 1, month - 1, day));
  const beforeEnd = new Date(Date.UTC(year, month - 1, day - 1));

  const afterStart = new Date(Date.UTC(year, month - 1, day + 1));
  const afterEnd = new Date(Date.UTC(year + 1, month - 1, day));

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    beforeStart: formatDate(beforeStart),
    beforeEnd: formatDate(beforeEnd),
    afterStart: formatDate(afterStart),
    afterEnd: formatDate(afterEnd),
  };
}

async function fetchStats(whereClause: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set(
    "$select",
    "count(*) as collisions, sum(number_of_persons_injured) as injuries, sum(number_of_persons_killed) as deaths",
  );
  url.searchParams.set("$where", whereClause);

  const headers: Record<string, string> = {};

  const fetchUrl = url.toString().replace(/\+/g, "%20");
  const response = await fetch(fetchUrl, { headers });

  if (!response.ok) {
    throw new Error(`Socrata responded ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    return { collisions: 0, casualties: 0 };
  }

  const row = data[0];
  const collisions = Number(row.collisions) || 0;
  const injuries = Number(row.injuries) || 0;
  const deaths = Number(row.deaths) || 0;

  return { collisions, casualties: injuries + deaths };
}

export async function fetchSIPAwardStats(
  sipId: string,
  radius: number = 200,
): Promise<SIPStats> {
  const sips = await fetchDynamicSIPs();
  const sip = sips.find((s) => s.id === sipId);
  if (!sip) {
    throw new Error(`SIP with id ${sipId} not found`);
  }

  const { beforeStart, beforeEnd, afterStart, afterEnd } = computeDateWindows(
    sip.completionDate,
  );

  const beforeWhere = `within_circle(location, ${sip.latitude}, ${sip.longitude}, ${radius}) AND crash_date between '${beforeStart}T00:00:00' and '${beforeEnd}T23:59:59'`;
  const afterWhere = `within_circle(location, ${sip.latitude}, ${sip.longitude}, ${radius}) AND crash_date between '${afterStart}T00:00:00' and '${afterEnd}T23:59:59'`;

  const [before, after] = await Promise.all([
    fetchStats(beforeWhere),
    fetchStats(afterWhere),
  ]);

  const calcPct = (b: number, a: number) => {
    if (b === 0) return 0;
    return ((a - b) / b) * 100;
  };

  return {
    sip,
    before,
    after,
    change: {
      collisionsPct: calcPct(before.collisions, after.collisions),
      casualtiesPct: calcPct(before.casualties, after.casualties),
    },
  };
}
