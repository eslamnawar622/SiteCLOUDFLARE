import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

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

// نفس حسابات Cloudinary المستخدمة في فيديو الهيرو
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
    const body = await req.json();
    const {
      publicId,
      accountId,
      videoUrl,
      frameSecond,
      folder,
      fileExt,
    } = body as {
      publicId: string;
      accountId: string;
      videoUrl: string;
      frameSecond: number;
      folder: string;
      fileExt: string;
    };

    if (!publicId || !videoUrl) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
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

    // 1️⃣ تقريب الثانية لرقم عشري واحد بس (يمنع مشاكل floating point)
    const safeFrameSecond = Math.max(0, Math.round((frameSecond || 0) * 10) / 10);

    // 2️⃣ بناء رابط الـ Poster من اللحظة اللي اخترتها بالظبط
    const posterUrl = videoUrl
      .replace("/upload/", `/upload/so_${safeFrameSecond}/`)
      .replace(/\.[^/.]+$/, ".jpg");

    // 3️⃣ تحميل الفيديو نفسه من Cloudinary (عشان ننقله لـ R2)
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      const errText = await videoResponse.text().catch(() => "");
      throw new Error(
        `فشل تحميل الفيديو من Cloudinary (status: ${videoResponse.status}) ${errText}`.trim()
      );
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // 4️⃣ تحميل صورة الـ Poster من اللحظة المختارة
    const posterResponse = await fetch(posterUrl);
    if (!posterResponse.ok) {
      const errText = await posterResponse.text().catch(() => "");
      throw new Error(
        `فشل تحميل صورة الغلاف (status: ${posterResponse.status}, url: ${posterUrl}) ${errText}`.trim()
      );
    }
    const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());

    // 5️⃣ رفع الفيديو على R2
    const videoKey = `${folder}/${Date.now()}_video.${fileExt || "mp4"}`;
    const videoUpload = new Upload({
      client: r2,
      params: {
        Bucket: BUCKET,
        Key: videoKey,
        Body: videoBuffer,
        ContentType: `video/${fileExt || "mp4"}`,
      },
    });
    await videoUpload.done();

    // 6️⃣ رفع صورة الـ Poster على R2
    const posterKey = `${folder}/posters/${Date.now()}_poster.jpg`;
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: posterKey,
      Body: posterBuffer,
      ContentType: "image/jpeg",
    }));

    // 7️⃣ حذف الفيديو من Cloudinary (نظف وراك)
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    // 8️⃣ URLs النهائية على R2
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
    const message = error instanceof Error ? error.message : "Finalize failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}