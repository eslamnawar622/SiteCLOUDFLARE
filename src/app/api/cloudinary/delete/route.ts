import { NextRequest, NextResponse } from "next/server";

async function generateSHA1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// بيانات كل حساب Cloudinary عندنا
const ACCOUNTS = {
  clients: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLIENTS_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_CLIENTS_API_KEY,
    apiSecret: process.env.CLOUDINARY_CLIENTS_API_SECRET,
  },
  hero: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_HERO_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_HERO_API_KEY,
    apiSecret: process.env.CLOUDINARY_HERO_API_SECRET,
  },
  // ✅ الحساب الجديد بتاع فيديو الموبايل
  "hero-mobile": {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_HERO_MOBILE_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_HERO_MOBILE_API_KEY,
    apiSecret: process.env.CLOUDINARY_HERO_MOBILE_API_SECRET,
  },
} as const;

type AccountName = keyof typeof ACCOUNTS;

export async function POST(req: NextRequest) {
  try {
    const { publicId, account, resourceType } = await req.json();

    console.log("📥 طلب حذف:", { publicId, account, resourceType });

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "مفيش public_id" },
        { status: 400 }
      );
    }

    const accountName: AccountName =
      account && account in ACCOUNTS ? account : "clients";
    const { cloudName, apiKey, apiSecret } = ACCOUNTS[accountName];

    if (!cloudName || !apiKey || !apiSecret) {
      console.error(`❌ بيانات الحساب "${accountName}" ناقصة في .env.local`);
      return NextResponse.json(
        { success: false, error: `بيانات حساب "${accountName}" غير مكتملة` },
        { status: 500 }
      );
    }

    console.log(`🔑 هنمسح من حساب: ${accountName} | Cloud: ${cloudName}`);

    const type = resourceType === "video" ? "video" : "image";

    const timestamp = Math.floor(Date.now() / 1000);
    const str = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSHA1(str);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${type}/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: publicId,
          api_key: apiKey,
          timestamp,
          signature,
        }),
      }
    );

    const data = await response.json();
    console.log("☁️ رد Cloudinary:", data);

    return NextResponse.json({ success: data.result === "ok", raw: data });
  } catch (error) {
    console.error("❌ خطأ:", error);
    return NextResponse.json(
      { success: false, error: "فشل" },
      { status: 500 }
    );
  }
}