import { fetchDangerIndex } from "@/lib/dangerIndexFetcher";
import DangerMap from "@/components/DangerMap";

export const metadata = {
  title: "Danger Index Map | MVC Data Integrity",
  description:
    "Heatmap of the most dangerous intersections in NYC based on collision volume.",
};

export default async function DangerIndexPage() {
  const data = await fetchDangerIndex();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
          Danger Index Map
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Visualizing the most dangerous intersections across New York City
          based on total collision volume. This heatmap aggregates crash data to
          pinpoint high-risk locations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8 relative z-0">
        <DangerMap data={data} />
      </div>

      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">
          Methodology
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          This map visualizes collision densities by grouping incident reports
          by exact coordinates. Results are limited to the top 1000 locations by
          total collision count to optimize performance and adhere to Socrata
          payload size limits. Data points with missing coordinates are
          excluded.
        </p>

        <details className="group">
          <summary className="cursor-pointer font-medium text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-md inline-block">
            View Raw Intersection Data (Tabular Fallback)
          </summary>
          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-slate-900"
                  >
                    Rank
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-slate-900"
                  >
                    Total Collisions
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-slate-900"
                  >
                    Latitude
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-slate-900"
                  >
                    Longitude
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row, idx) => (
                  <tr key={`table-${row.latitude}-${row.longitude}-${idx}`}>
                    <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-rose-600">
                      {row.total}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.latitude.toFixed(5)}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.longitude.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </main>
  );
}
