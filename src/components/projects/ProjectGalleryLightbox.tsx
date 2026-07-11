"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import ImageMagnifier from "./ImageMagnifier";

interface ProjectGalleryLightboxProps {
  mainImage: string;
  gallery: string[];
  title: string;
  badgeText?: string | null;
  magnifierSize?: number;
  magnifierZoom?: number;
}

export default function ProjectGalleryLightbox({
  mainImage,
  gallery,
  title,
  badgeText,
  magnifierSize = 170,
  magnifierZoom = 2,
}: ProjectGalleryLightboxProps) {
  // بناء قائمة موحدة: الصورة الرئيسية الأول، وباقي صور الجاليري من غيرها لو مكررة
  const images = [mainImage, ...gallery.filter((url) => url !== mainImage)];

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // التحكم بالكيبورد
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, goNext, goPrev, closeLightbox]);

  return (
    <>
      {/* الصورة الرئيسية */}
      <div className="relative mb-6">
        <ImageMagnifier
          src={mainImage}
          alt={title}
          className="w-full aspect-[16/9] rounded-2xl"
          sizes="100vw"
          priority
          zoom={magnifierZoom}
          lensSize={magnifierSize}
          onClick={() => openLightbox(0)}
        />
        {badgeText && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
            {badgeText}
          </div>
        )}
      </div>

      {/* جاليري الصور الفرعية */}
      {images.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            صور المشروع
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.slice(1).map((url, index) => (
              <ImageMagnifier
                key={index}
                src={url}
                alt={`${title} - صورة ${index + 2}`}
                className="aspect-[4/3] rounded-xl border border-border hover:opacity-90 transition-opacity"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                zoom={magnifierZoom}
                lensSize={magnifierSize}
                onClick={() => openLightbox(index + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* اللايت بوكس */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="إغلاق"
          >
            <X size={28} />
          </button>

          <div className="absolute top-4 left-4 text-white/80 text-sm bg-white/10 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute right-4 md:right-8 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="الصورة السابقة"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div
            className="relative w-[90vw] h-[80vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex]}
              alt={`${title} - صورة ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute left-4 md:left-8 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="الصورة التالية"
            >
              <ChevronLeft size={32} />
            </button>
          )}
        </div>
      )}
    </>
  );
}