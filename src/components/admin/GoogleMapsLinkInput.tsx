"use client";

import { useState } from "react";

function extractLatLng(url: string): { lat: number; lng: number } | null {
  // بنجرب كل الصيغ المعروفة لروابط جوجل ماب، الأدق الأول
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // إحداثيات الدبوس بالظبط (روابط "مكان")
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // مركز الكاميرا في اللينك
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // روابط ?q=lat,lng
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

interface GoogleMapsLinkInputProps {
  onExtract: (lat: number, lng: number) => void;
}

export default function GoogleMapsLinkInput({ onExtract }: GoogleMapsLinkInputProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleExtract() {
    const trimmed = link.trim();
    if (!trimmed) return;

    setLoading(true);
    setStatus("idle");
    try {
      let coords = extractLatLng(trimmed);

      if (!coords) {
        // لينك مختصر — نطلب من السيرفر يفكه
        const res = await fetch("/api/resolve-map-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await res.json();
        if (data.finalUrl) {
          coords = extractLatLng(data.finalUrl);
        }
      }

      if (coords) {
        onExtract(coords.lat, coords.lng);
        setStatus("ok");
        setLink("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5 p-3 bg-primary-lighter/30 border border-primary/20 rounded-lg">
      <label className="block text-text-secondary text-xs font-medium">
        📍 الصق لينك جوجل ماب هنا وهحدد الموقع تلقائي (بدل ما تدخل الأرقام يدوي)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://maps.app.goo.gl/... أو أي لينك من جوجل ماب"
          dir="ltr"
          className="flex-1 px-3 py-2 rounded-lg bg-surface text-text-primary border border-border text-sm"
        />
        <button
          type="button"
          onClick={handleExtract}
          disabled={loading || !link.trim()}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
        >
          {loading ? "جاري التحديد..." : "حدد الموقع"}
        </button>
      </div>
      {status === "ok" && (
        <p className="text-primary text-xs">✅ تم تحديد الموقع من اللينك</p>
      )}
      {status === "error" && (
        <p className="text-error text-xs">
          ⚠️ مقدرتش أطلّع الإحداثيات من اللينك ده. جرب تفتح الموقع في جوجل ماب،
          تدوس ضغطة طويلة على المكان بالظبط لحد ما يظهر الدبوس الأحمر، وبعدين
          «مشاركة» ← «نسخ الرابط»
        </p>
      )}
    </div>
  );
}