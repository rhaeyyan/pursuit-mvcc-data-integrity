import { fetchDangerIndex } from "@/lib/dangerIndexFetcher";
import DangerMap from "@/components/DangerMap";

export const metadata = {
  title: "Danger Index Map | MVC Data Integrity",
  description: "Heatmap of the most dangerous intersections in NYC based on collision volume.",
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
          Visualizing the most dangerous intersections across New York City based on total collision volume. This heatmap aggregates crash data to pinpoint high-risk locations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8 relative z-0">
        <DangerMap data={data} />
      </div>
      
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Methodology</h3>
        <p className="text-sm text-slate-600">
          This map visualizes collision densities by grouping incident reports by exact coordinates. Results are limited to the top 1000 locations by total collision count to optimize performance and adhere to Socrata payload size limits. Data points with missing coordinates are excluded.
        </p>
      </div>
    </main>
  );
}
