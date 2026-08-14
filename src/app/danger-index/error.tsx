"use client";

import { useEffect } from "react";

export default function DangerIndexError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Danger Index Error:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl max-w-2xl mx-auto shadow-sm border border-red-100">
        <h2 className="text-2xl font-bold mb-4">Unable to Load Map Data</h2>
        <p className="mb-6">
          There was a problem fetching the collision data from Socrata. The service might be temporarily unavailable or rate-limited.
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
