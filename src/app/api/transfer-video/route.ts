import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Cloudinary result interface
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  [key: string]: unknown;
}

// R2 config
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

// حسابات Cloudinary المتاحة
const CLOUDINARY_ACCOUNTS = {
  account1: {
    name: "Cloudinary 1 (لابتوب)",
    cloud_name: process.env.CLOUDINARY_HERO_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_HERO_API_KEY!,
    api_secret: process.env.CLOUDINARY_HERO_API_SECRET!,
  },
  account2: {
    name: "Cloudinary 2 (موبايل)",
    cloud_name: process.env.CLOUDINARY_HERO_MOBILE_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_HERO_MOBILE_API_KEY!,
    api_secret: process.env.CLOUDINARY_HERO_MOBILE_API_SECRET!,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "hero-videos";
    const accountId = (formData.get("accountId") as string) || "account1"; // ← اختيار الحساب

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const account = CLOUDINARY_ACCOUNTS[accountId as keyof typeof CLOUDINARY_ACCOUNTS];
    
    if (!account) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 });
    }

    // Cloudinary config
    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
    });

    // 1️⃣ رفع الفيديو على Cloudinary مؤقتاً
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "temp_hero",
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve(result as CloudinaryUploadResult);
        }
      ).end(buffer);
    });

    const videoUrl = cloudinaryResult.secure_url;
    const publicId = cloudinaryResult.public_id;

    // 2️⃣ توليد Poster URL من Cloudinary
    const posterUrl = videoUrl
      .replace("/upload/", "/upload/so_0/")
      .replace(/\.[^/.]+$/, ".jpg");

    // 3️⃣ تحميل الـ Poster
    const posterResponse = await fetch(posterUrl);
    const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());

    // 4️⃣ رفع الفيديو على R2
    const videoKey = `${folder}/${Date.now()}_${file.name}`;
    const videoUpload = new Upload({
      client: r2,
      params: {
        Bucket: BUCKET,
        Key: videoKey,
        Body: buffer,
        ContentType: file.type,
      },
    });
    await videoUpload.done();

    // 5️⃣ رفع الـ Poster على R2
    const posterKey = `${folder}/posters/${Date.now()}_poster.jpg`;
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: posterKey,
      Body: posterBuffer,
      ContentType: "image/jpeg",
    }));

    // 6️⃣ حذف الفيديو من Cloudinary (نظف وراك)
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    // 7️⃣ URLs النهائية
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    const finalVideoUrl = `${r2PublicUrl}/${videoKey}`;
    const finalPosterUrl = `${r2PublicUrl}/${posterKey}`;

    return NextResponse.json({
      url: finalVideoUrl,
      posterUrl: finalPosterUrl,
      key: videoKey,
      posterKey: posterKey,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}