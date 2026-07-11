import {
  S3Client,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// ✅ إعداد الاتصال بـ Cloudflare R2 (متوافق مع بروتوكول S3)
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * ✅ رفع ملف (صورة أو فيديو) على R2
 * بيستخدم Multipart Upload (تقسيم الملف لأجزاء ورفعهم بالتوازي)
 * ده بيسرّع الرفع بشكل كبير خصوصًا للملفات الكبيرة زي الفيديوهات
 * @param file - الملف نفسه (Buffer)
 * @param key - المسار الكامل جوه الـ bucket (مثال: "عروض/العروض-الحالية/video.mp4")
 * @param contentType - نوع الملف (مثال: "video/mp4" أو "image/jpeg")
 * @returns الرابط العام للملف بعد الرفع
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    },
    // ✅ يقسم الملف لأجزاء 5 ميجا ويرفع 4 أجزاء في نفس الوقت (بالتوازي)
    partSize: 5 * 1024 * 1024,
    queueSize: 4,
  });

  await upload.done();

  // نرجع الرابط العام الكامل للملف
  return `${PUBLIC_URL}/${key}`;
}

/**
 * ✅ حذف ملف من R2
 * @param key - نفس المسار اللي اتحفظ بيه الملف وقت الرفع
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error("❌ خطأ في حذف الملف من R2:", error);
    return false;
  }
}

/**
 * ✅ دالة مساعدة: تستخرج الـ key من رابط عام كامل
 * مثال: تدخلها https://pub-xxx.r2.dev/عروض/فيديو.mp4
 * وترجعلك: عروض/فيديو.mp4
 */
export function getKeyFromUrl(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, "");
}