// ============================================
// ☁️ Cloudinary Upload & Delete
// ============================================

/**
 * دالة عامة لرفع صورة لأي حساب Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("فشل رفع الصورة");
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * دالة مخصصة لرفع لوجو عميل
 */
export async function uploadClientLogo(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLIENTS_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_CLIENTS_UPLOAD_PRESET!;

  return uploadToCloudinary(file, cloudName, uploadPreset);
}

// ✅ خريطة الحسابات المعروفة — أضفنا "hero-mobile"
export type CloudinaryAccount = "clients" | "hero" | "hero-mobile";

/**
 * ✅ دالة حذف صورة/فيديو من Cloudinary
 */
export async function deleteFromCloudinary(
  imageUrl: string,
  account: CloudinaryAccount = "clients",
  resourceType: "image" | "video" = "image"
): Promise<boolean> {
  try {
    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      console.warn("رابط Cloudinary غير صالح");
      return false;
    }

    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join("/");

    const segments = pathAfterUpload.split("/").filter(
      (segment) => !segment.includes(",")
    );

    if (segments[0] && /^v\d+$/.test(segments[0])) {
      segments.shift();
    }

    const withoutVersion = segments.join("/");
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");

    console.log("🗑️ جاري حذف:", publicId, "| حساب:", account);

    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, account, resourceType }),
    });

    const data = await response.json();
    console.log("✅ نتيجة الحذف:", data);

    return data.success === true;
  } catch (error) {
    console.error("❌ خطأ في حذف الصورة:", error);
    return false;
  }
}

// ✅ نوع بسيط يحدد الجهاز
export type HeroTarget = "desktop" | "mobile";

/**
 * ✅ دالة رفع فيديو الهيرو — دلوقتي بتاخد target وتختار الأكونت المناسب
 */
export async function uploadHeroVideo(
  file: File,
  target: HeroTarget = "desktop"
): Promise<{ url: string; bytes: number }> {
  const cloudName =
    target === "mobile"
      ? process.env.NEXT_PUBLIC_CLOUDINARY_HERO_MOBILE_CLOUD_NAME!
      : process.env.NEXT_PUBLIC_CLOUDINARY_HERO_CLOUD_NAME!;

  const uploadPreset =
    target === "mobile"
      ? process.env.NEXT_PUBLIC_CLOUDINARY_HERO_MOBILE_UPLOAD_PRESET!
      : process.env.NEXT_PUBLIC_CLOUDINARY_HERO_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("فشل رفع الفيديو");
  }

  const data = await response.json();

  const optimizedUrl = data.secure_url.replace(
    "/upload/",
    "/upload/q_auto,f_auto/"
  );

  return { url: optimizedUrl, bytes: data.bytes };
}

export function getPosterFromFrame(videoUrl: string, frameSecond: number): string {
  if (!videoUrl || !videoUrl.includes("res.cloudinary.com")) return "";

  const withFrame = videoUrl.replace(
    "/upload/",
    `/upload/so_${frameSecond},q_auto,f_auto/`
  );

  return withFrame.replace(/\.[^/.]+$/, ".jpg");
}