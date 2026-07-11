import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, serviceType, details, preferredDay, preferredTime } =
      await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف مطلوبين" },
        { status: 400 }
      );
    }

    const message = `📩 طلب استشارة جديد

👤 الاسم: ${name}
📱 الهاتف: ${phone}
🛠️ نوع الخدمة: ${serviceType}
${preferredDay || preferredTime ? `🕒 الوقت المفضل: ${preferredDay || "أي يوم"} ${preferredTime ? `- ${preferredTime}` : ""}` : ""}
${details ? `📝 تفاصيل: ${details}` : ""}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error("Telegram API error");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending to Telegram:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإرسال" },
      { status: 500 }
    );
  }
}