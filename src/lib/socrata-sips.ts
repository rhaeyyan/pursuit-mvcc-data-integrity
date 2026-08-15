export interface SIPObject {
  id: string;
  name: string;
  borough: string;
  latitude: number;
  longitude: number;
  completionDate: string;
}

interface SocrataGeometry {
  type?: string;
  coordinates?: unknown[];
}

interface SocrataItem {
  project_id?: string;
  project_name?: string;
  borough?: string;
  the_geom?: SocrataGeometry;
  project_completion_date?: string;
}

function extractCoordinates(geom?: SocrataGeometry): [number, number] {
  if (
    !geom ||
    !geom.coordinates ||
    !Array.isArray(geom.coordinates) ||
    geom.coordinates.length === 0
  ) {
    return [0, 0];
  }
  if (geom.type === "MultiLineString") {
    const firstLine = geom.coordinates[0];
    if (Array.isArray(firstLine) && firstLine.length > 0) {
      return [Number(firstLine[0][0]), Number(firstLine[0][1])];
    }
  } else if (geom.type === "MultiPoint") {
    const firstPoint = geom.coordinates[0];
    if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
      return [Number(firstPoint[0]), Number(firstPoint[1])];
    }
  }
  return [0, 0];
}

export async function fetchDynamicSIPs(): Promise<SIPObject[]> {
  const [corridorsRes, intersectionsRes] = await Promise.all([
    fetch("https://data.cityofnewyork.us/resource/if4c-w48d.json"),
    fetch("https://data.cityofnewyork.us/resource/shr7-eqdc.json"),
  ]);

  const corridorsRaw = corridorsRes.ok ? await corridorsRes.json() : [];
  const intersectionsRaw = intersectionsRes.ok
    ? await intersectionsRes.json()
    : [];

  const mapItem = (item: SocrataItem): SIPObject => {
    const coords = extractCoordinates(item.the_geom);
    return {
      id: item.project_id || crypto.randomUUID(),
      name: item.project_name || "Unknown",
      borough: item.borough || "N/A",
      longitude: coords[0],
      latitude: coords[1],
      completionDate: item.project_completion_date || "",
    };
  };

  const corridors = Array.isArray(corridorsRaw)
    ? corridorsRaw.map(mapItem)
    : [];
  const intersections = Array.isArray(intersectionsRaw)
    ? intersectionsRaw.map(mapItem)
    : [];

  return [...corridors, ...intersections];
}
