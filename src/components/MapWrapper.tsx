"use client";

import dynamic from "next/dynamic";

// نطلع الـ dynamic component بره (static declaration)
const Map = dynamic(() => import("@/components/Map"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen w-full bg-surface">
      <div className="text-center">
        <p className="text-4xl mb-3 animate-bounce">🗺️</p>
        <p className="text-lg text-text-secondary">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
  ssr: false,
});

export default function MapWrapper() {
  return <Map />;
}