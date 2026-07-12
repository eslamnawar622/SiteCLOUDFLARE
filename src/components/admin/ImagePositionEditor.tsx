"use client";

import { useRef, useState, useCallback } from "react";

interface ImagePositionEditorProps {
  src: string;
  /** نسبة العرض للارتفاع بتاعة الكارت الحقيقي (مثال: 4/3 = 1.333) */
  aspectRatio: number;
  x: number; // 0-100
  y: number; // 0-100
  zoom: number; // 1-3
  onChange: (pos: { x: number; y: number; zoom: number }) => void;
}

export default function ImagePositionEditor({
  src,
  aspectRatio,
  x,
  y,
  zoom,
  onChange,
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const clamp = (val: number) => Math.max(0, Math.min(100, val));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !lastPos.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    // بنعكس الاتجاه: سحب لليمين يعني إظهار جزء أكتر من شمال الصورة
    const deltaXPercent = (dx / rect.width) * 100 * -1;
    const deltaYPercent = (dy / rect.height) * 100 * -1;

    onChange({
      x: clamp(x + deltaXPercent),
      y: clamp(y + deltaYPercent),
      zoom,
    });

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    lastPos.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      onChange({ x, y, zoom: newZoom });
    },
    [x, y, onChange]
  );

  const handleReset = () => {
    onChange({ x: 50, y: 50, zoom: 1 });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">
          اسحب الصورة لتحريكها، واستخدم السلايدر للتكبير
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-red-500 hover:underline"
        >
          إعادة ضبط
        </button>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-full overflow-hidden rounded-xl border border-border bg-surface-raised touch-none select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="معاينة موضع الصورة"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `${x}% ${y}%`,
          }}
        />

        {/* شبكة إرشادية خفيفة تساعد على المحاذاة */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/60" />
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-text-secondary">
            تكبير (Zoom)
          </label>
          <span className="text-xs text-text-muted">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}