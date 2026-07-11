"use client";

import { useState, useRef } from "react";

interface ImageCropperModalProps {
  file: File;
  aspectWidth: number; // نسبة العرض (مثال: 220)
  aspectHeight: number; // نسبة الطول (مثال: 220)
  outputSize?: number; // أكبر بعد في الصورة الناتجة بالبكسل (افتراضي 600)
  onConfirm: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

const FRAME_MAX = 300; // حجم إطار العرض على الشاشة (CSS px)

export default function ImageCropperModal({
  file,
  aspectWidth,
  aspectHeight,
  outputSize = 600,
  onConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  // ✅ useState بـ lazy initializer بدل ref — الدالة بتتنفذ مرة واحدة بس
  // وقت أول render (مش effect، ومش قراءة ref.current وقت الـ render)
  const [objectUrl] = useState(() => URL.createObjectURL(file));

  // revokedRef ده بيتقرأ بس جوه event handlers (مش جوه الـ render نفسه)، فمسموح
  const revokedRef = useRef(false);

  function revokeUrl() {
    if (!revokedRef.current) {
      URL.revokeObjectURL(objectUrl);
      revokedRef.current = true;
    }
  }

  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1); // 1 = أصغر مقاس بيغطي الإطار بالكامل
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const ratio = aspectWidth / aspectHeight;
  const frameW = ratio >= 1 ? FRAME_MAX : FRAME_MAX * ratio;
  const frameH = ratio >= 1 ? FRAME_MAX / ratio : FRAME_MAX;

  // أصغر سكيل ممكن بحيث الصورة تغطي الإطار بالكامل من غير فراغات
  const baseScale =
    naturalSize.w > 0
      ? Math.max(frameW / naturalSize.w, frameH / naturalSize.h)
      : 1;

  const scale = baseScale * zoom;
  const dispW = naturalSize.w * scale;
  const dispH = naturalSize.h * scale;

  // دالة تقييد بسيطة — بتاخد أبعاد الصورة المعروضة كـ parameters
  // بدل ما تعتمد على state، عشان تشتغل صح جوه أي event handler فورًا
  function clampFor(x: number, y: number, dw: number, dh: number) {
    const minX = frameW - dw;
    const minY = frameH - dh;
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }

  // ✅ أول ما الصورة تحمل (event handler، مش effect)
  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImgLoaded(true);
    setPos({ x: 0, y: 0 }); // البداية دايمًا صالحة لأن أصغر زوم بيغطي الإطار بالكامل
  }

  // ✅ الزوم بيتغيّر وبنقيّد الـ pos فورًا في نفس الـ handler
  function handleZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value);
    const newScale = baseScale * newZoom;
    const newDispW = naturalSize.w * newScale;
    const newDispH = naturalSize.h * newScale;

    setZoom(newZoom);
    setPos((prev) => clampFor(prev.x, prev.y, newDispW, newDispH));
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(
      clampFor(
        dragRef.current.startPosX + dx,
        dragRef.current.startPosY + dy,
        dispW,
        dispH
      )
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || naturalSize.w === 0) return;

    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    const sWidth = frameW / scale;
    const sHeight = frameH / scale;

    const outW = ratio >= 1 ? outputSize : Math.round(outputSize * ratio);
    const outH = ratio >= 1 ? Math.round(outputSize / ratio) : outputSize;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outW, outH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(blob, URL.createObjectURL(blob));
        revokeUrl(); // ✅ خلصنا من الصورة الخام، نلغي رابطها
      },
      "image/jpeg",
      0.92
    );
  }

  function handleCancel() {
    revokeUrl();
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface-raised rounded-xl p-5 max-w-sm w-full space-y-4">
        <h3 className="text-text-primary font-semibold text-center">
          🖼️ اضبط الصورة داخل الإطار
        </h3>

        <div
          className="relative mx-auto overflow-hidden bg-surface border-2 border-primary/40 rounded-xl touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: frameW, height: frameH }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={objectUrl}
            alt="اقتصاص الصورة"
            onLoad={handleImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: dispW || undefined,
              height: dispH || undefined,
              maxWidth: "none",
            }}
          />
        </div>

        {/* الزوم */}
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-xs">🔍−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            className="flex-1 accent-primary"
          />
          <span className="text-text-muted text-xs">+🔍</span>
        </div>

        <p className="text-text-muted text-[11px] text-center">
          اسحب الصورة بالماوس أو بإصبعك عشان تحركها، والشريط للتكبير والتصغير
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imgLoaded}
            className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            ✅ تأكيد القص
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-full text-sm border border-border text-text-secondary hover:bg-surface transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}