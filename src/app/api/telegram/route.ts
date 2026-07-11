import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function POST(req: NextRequest) {
  try {
    const { offerTitle, customerPhone, source } = await req.json();

    const text = source === "whatsapp" 
      ? `💬 عميل تواصل عبر الواتساب\n\n📌 العرض: ${offerTitle}\n📱 رقم العميل: ${customerPhone}\n\n⏰ ${new Date().toLocaleString("ar-EG")}`
      : `🔔 عرض جديد!\n\n📌 العرض: ${offerTitle}\n📱 رقم العميل: ${customerPhone}\n\n⏰ ${new Date().toLocaleString("ar-EG")}`;

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!res.ok) throw new Error("فشل الإرسال");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "فشل إرسال الرسالة" },
      { status: 500 }
    );
  }
}