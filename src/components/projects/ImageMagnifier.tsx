"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageMagnifierProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  zoom?: number; // نسبة التكبير جوه العدسة (2 = 200%)
  lensSize?: number; // قطر العدسة بالبكسل
  onClick?: () => void;
}

export default function ImageMagnifier({
  src,
  alt,
  className = "",
  imgClassName = "object-cover",
  sizes,
  priority,
  zoom = 2,
  lensSize = 170,
  onClick,
}: ImageMagnifierProps) {
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgSize, setBgSize] = useState({ w: 0, h: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // نخلي العدسة ماتخرجش برة حدود الصورة
    const lensX = Math.max(0, Math.min(x, rect.width));
    const lensY = Math.max(0, Math.min(y, rect.height));
    setLensPos({ x: lensX, y: lensY });

    // حجم الخلفية = حجم الصورة الأصلي × نسبة الزوم (بالبكسل مش بالنسبة)
    const bgWidth = rect.width * zoom;
    const bgHeight = rect.height * zoom;
    setBgSize({ w: bgWidth, h: bgHeight });

    // موقع الخلفية بحيث النقطة اللي تحت الماوس تفضل في نص العدسة بالظبط
    const bgX = -(x * zoom - lensSize / 2);
    const bgY = -(y * zoom - lensSize / 2);
    setBgPos({ x: bgX, y: bgY });
  };

  return (
    <div
      ref={containerRef}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onMouseEnter={() => setShowLens(true)}
      onMouseLeave={() => setShowLens(false)}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden select-none ${onClick ? "cursor-zoom-in" : ""} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={imgClassName}
        sizes={sizes}
        priority={priority}
        draggable={false}
      />

      {/* العدسة المكبرة - شغالة على الشاشات الكبيرة بس (فيها ماوس) */}
      {showLens && (
        <div
          className="hidden md:block absolute rounded-full border-[3px] border-white shadow-[0_4px_20px_rgba(0,0,0,0.35)] pointer-events-none z-10 ring-1 ring-black/10"
          style={{
            width: lensSize,
            height: lensSize,
            left: lensPos.x - lensSize / 2,
            top: lensPos.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${bgSize.w}px ${bgSize.h}px`,
            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}