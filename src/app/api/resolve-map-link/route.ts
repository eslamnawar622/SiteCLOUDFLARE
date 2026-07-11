import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "لينك غير صالح" }, { status: 400 });
    }

    // لينكات جوجل ماب المختصرة (زي maps.app.goo.gl) بتعمل redirect للينك الكامل.
    // بنتبع الـ redirect من السيرفر (مفيش مشكلة CORS هنا) ونرجع الرابط النهائي.
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    response.body?.cancel();

    return NextResponse.json({ finalUrl: response.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل فك الرابط" }, { status: 500 });
  }
}