"use client";

import { useState } from "react";
import Image from "next/image";
import { MapImage } from "@/types/map";

interface MapImagesManagerProps {
  images: MapImage[];
  onChange: (images: MapImage[]) => void;
  folder: string; // اسم المجلد في R2 (مثال: "الخريطة/المقر-الرئيسي")
  namePrefix: string; // بادئة اسم الملف
}

async function uploadFileToR2(
  file: File,
  folder: string,
  fileName: string
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("folder", folder);

  const response = await fetch("/api/r2/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("فشل رفع الملف");
  return response.json();
}

async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    const response = await fetch("/api/r2/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export default function MapImagesManager({
  images,
  onChange,
  folder,
  namePrefix,
}: MapImagesManagerProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${namePrefix.replace(/\s+/g, "_")}.jpg`;
      const uploaded = await uploadFileToR2(file, folder, fileName);
      onChange([...images, { url: uploaded.url, key: uploaded.key }]);
    } catch (error) {
      console.error(error);
      alert("فشل رفع الصورة، حاول تاني");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(img: MapImage) {
    if (!confirm("متأكد إنك عايز تمسح الصورة دي؟")) return;
    await deleteFileFromR2(img.key);
    onChange(images.filter((i) => i.key !== img.key));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div
            key={img.key}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group"
          >
            <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
            <button
              type="button"
              onClick={() => handleRemove(img)}
              className="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              🗑️ حذف
            </button>
          </div>
        ))}

        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-text-muted text-xs cursor-pointer hover:border-primary hover:text-primary transition-colors">
          {uploading ? "..." : "+ صورة"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}