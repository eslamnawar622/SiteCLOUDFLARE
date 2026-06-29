"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapWrapper() {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/Map"), {
        loading: () => (
          <div className="flex items-center justify-center h-screen w-full bg-gray-50">
            <div className="text-center">
              <p className="text-4xl mb-3 animate-bounce">🗺️</p>
              <p className="text-lg text-gray-600">جاري تحميل الخريطة...</p>
            </div>
          </div>
        ),
        ssr: false,
      }),
    []
  );

  return <Map />;
}