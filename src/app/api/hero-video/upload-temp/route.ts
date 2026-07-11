import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  duration?: number;
  [key: string]: unknown;
}

// حسابات Cloudinary المتاحة
const CLOUDINARY_ACCOUNTS = {
  account1: {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_HERO_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_HERO_API_KEY!,
    api_secret: process.env.CLOUDINARY_HERO_API_SECRET!,
  },
  account2: {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_HERO_MOBILE_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_HERO_MOBILE_API_KEY!,
    api_secret: process.env.CLOUDINARY_HERO_MOBILE_API_SECRET!,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const accountId = (formData.get("accountId") as string) || "account1";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const account = CLOUDINARY_ACCOUNTS[accountId as keyof typeof CLOUDINARY_ACCOUNTS];
    if (!account) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 });
    }

    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع مؤقت — من غير حذف بعد كده
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "temp_hero",
        },
        (error, res) => {
          if (error || !res) reject(error || new Error("Upload failed"));
          else resolve(res as CloudinaryUploadResult);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      videoUrl: result.secure_url,
      publicId: result.public_id,
      duration: result.duration || 0,
      accountId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}