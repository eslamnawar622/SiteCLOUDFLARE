import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string; // مثال: "عروض/العروض-الحالية"

    if (!file) {
      return NextResponse.json({ error: "مفيش ملف" }, { status: 400 });
    }

    // ✅ نطبع تفاصيل الملف اللي جالنا عشان نتأكد إنه مش فاضي
    console.log("📦 اسم الملف:", file.name);
    console.log("📦 حجم الملف:", file.size, "بايت");
    console.log("📦 نوع الملف:", file.type);

    // نحول الملف لـ Buffer عشان نقدر نرفعه
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("📦 حجم الـ Buffer بعد التحويل:", buffer.length, "بايت");

    // اسم فريد للملف (تاريخ + اسم أصلي) عشان مايحصلش تعارض بين ملفين بنفس الاسم
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${timestamp}-${safeFileName}`;

    console.log("📦 الـ key اللي هيتخزن بيه:", key);

    const url = await uploadToR2(buffer, key, file.type);

    // ✅ نطبع اللينك النهائي في التيرمنال
    console.log("✅ تم الرفع بنجاح، اللينك هو:", url);

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("❌ خطأ في رفع الملف:", error);
    return NextResponse.json({ error: "فشل الرفع" }, { status: 500 });
  }
}