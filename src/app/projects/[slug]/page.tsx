import { getProjectBySlug } from "@/lib/firestore/projects";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = 'edge';  // ✅ صح

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  console.log("PROJECT DATA:", project);

  if (!project) {
    notFound();
  }

  // كل صور المشروع: الصورة الرئيسية + صور المعرض
  const allImages = [project.mainImage, ...project.gallery].filter(Boolean);

  return (
    <main className="bg-white">
      {/* صورة الغلاف */}
      <div className="relative w-full h-[60vh]">
        <Image
          src={project.mainImage}
          alt={project.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 right-8 text-white text-right">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            {project.title}
          </h1>
          <p className="text-lg opacity-90">
            {project.location} · {project.year}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* رجوع لكل المشاريع */}
        <Link
          href="/projects"
          className="text-amber-700 font-medium hover:text-amber-800 transition-colors"
        >
          ← الرجوع لكل المشاريع
        </Link>

        {/* الوصف الكامل */}
        <div className="mt-8 mb-12">
          <h2 className="text-2xl font-semibold text-stone-900 mb-4">
            عن المشروع
          </h2>
          <p className="text-stone-600 leading-relaxed text-lg">
            {project.description}
          </p>
        </div>

        {/* تفاصيل سريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 bg-stone-50 rounded-2xl p-6">
          <div>
            <span className="block text-sm text-stone-500 mb-1">الموقع</span>
            <span className="text-lg font-medium text-stone-900">
              {project.location}
            </span>
          </div>
          <div>
            <span className="block text-sm text-stone-500 mb-1">النوع</span>
            <span className="text-lg font-medium text-stone-900">
              {project.type}
            </span>
          </div>
          <div>
            <span className="block text-sm text-stone-500 mb-1">سنة التنفيذ</span>
            <span className="text-lg font-medium text-stone-900">
              {project.year}
            </span>
          </div>
        </div>

        {/* معرض الصور */}
        {allImages.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 mb-6">
              صور المشروع
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] w-full rounded-xl overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`${project.title} - صورة ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* زرار طلب استشارة */}
        <div className="mt-16 text-center bg-stone-900 rounded-2xl p-10">
          <h3 className="text-2xl font-semibold text-white mb-3">
            عجبك المشروع؟
          </h3>
          <p className="text-stone-300 mb-6">
            احجز استشارة مجانية وخلينا نناقش مشروعك
          </p>
          <Link
            href="/#consultation"
            className="inline-block bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            احجز استشارة مجانية
          </Link>
        </div>
      </div>
    </main>
  );
}