import { NextRequest, NextResponse } from "next/server";
import { deleteFromR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "مفيش key" }, { status: 400 });
    }

    const success = await deleteFromR2(key);

    return NextResponse.json({ success });
  } catch (error) {
    console.error("❌ خطأ في حذف الملف:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}