"use client";

import dynamic from "next/dynamic";
import type { DangerIndexRow } from "@/lib/dangerIndexFetcher";
import "leaflet/dist/leaflet.css";

// Dynamic import with ssr: false to prevent Next.js hydration and window-is-not-defined errors
const DynamicMapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <MapSkeleton /> },
);
const DynamicTileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const DynamicCircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false },
);
const DynamicPopup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false },
);

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">
      <span className="text-slate-500 font-medium">Loading Map...</span>
    </div>
  );
}

interface DangerMapProps {
  data: DangerIndexRow[];
}

export default function DangerMap({ data }: DangerMapProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div
      role="region"
      aria-label="New York City Danger Index Interactive Map"
      className="w-full h-[600px] rounded-xl overflow-hidden shadow-sm border border-slate-200 relative z-0"
    >
      <DynamicMapContainer
        center={[40.7128, -74.006]}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <DynamicTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {data.map((row, index) => {
          const radius = 3 + (row.total / maxTotal) * 12;

          return (
            <DynamicCircleMarker
              key={`${row.latitude}-${row.longitude}-${index}`}
              center={[row.latitude, row.longitude]}
              radius={radius}
              pathOptions={{
                color: "#e11d48",
                fillColor: "#f43f5e",
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <DynamicPopup>
                <div className="font-sans text-sm p-1">
                  <p className="font-semibold text-slate-900 mb-1">
                    Intersection Data
                  </p>
                  <p className="text-slate-600 mb-0">
                    Total Collisions:{" "}
                    <span className="font-bold text-rose-600">{row.total}</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Lat: {row.latitude.toFixed(4)} <br />
                    Lng: {row.longitude.toFixed(4)}
                  </p>
                </div>
              </DynamicPopup>
            </DynamicCircleMarker>
          );
        })}
      </DynamicMapContainer>
    </div>
  );
}
