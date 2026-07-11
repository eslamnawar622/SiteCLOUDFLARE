"use client";

import { useRef, useState, useCallback } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  labelFontSize?: number;
  opacity?: number;
  className?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "",
  afterLabel = "",
  labelFontSize = 14,
  opacity = 100,
  className = "",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.min(100, Math.max(0, pct));
    setPosition(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updatePosition(e.clientX);
  };
  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  if (!beforeImage || !afterImage) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none touch-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* منطقة الصور — الشفافية بتأثر عليها بس */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]" style={{ opacity: opacity / 100 }}>
        {/* صورة "بعد" — القاعدة الكاملة */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${afterImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* صورة "قبل" — مقصوصة من الشمال لحد نقطة السلايدر */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${beforeImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        {/* اللابلز — تظهر بس لو مكتوب فيها حاجة */}
        {beforeLabel && (
          <span
            className="absolute top-4 left-4 bg-black/70 text-white font-semibold px-3 py-1.5 rounded-full pointer-events-none z-10 shadow-md"
            style={{ fontSize: `${labelFontSize}px` }}
          >
            {beforeLabel}
          </span>
        )}
        {afterLabel && (
          <span
            className="absolute top-4 right-4 bg-black/70 text-white font-semibold px-3 py-1.5 rounded-full pointer-events-none z-10 shadow-md"
            style={{ fontSize: `${labelFontSize}px` }}
          >
            {afterLabel}
          </span>
        )}

        {/* خط الفصل الرأسي — نفس شفافية الصور */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />
      </div>

      {/* المقبض — بره تأثير الشفافية، وطالع فوق حدود الصورة عشان يفضل واضح دايمًا */}
      <div
        className="absolute cursor-ew-resize"
        style={{
          left: `${position}%`,
          top: "-20px",
          transform: "translateX(-50%)",
          zIndex: 40,
        }}
      >
        <div className="w-11 h-11 rounded-full bg-white shadow-[0_4px_18px_rgba(0,0,0,0.4)] border-2 border-primary flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a62d6" strokeWidth="2.5">
            <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}