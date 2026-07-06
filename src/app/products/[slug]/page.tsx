import { getProductBySlug } from "@/lib/firestore/products";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = 'edge';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allImages = [product.mainImage, ...product.gallery].filter(Boolean);

  return (
    <main className="bg-white">
      {/* صورة الغلاف */}
      <div className="relative w-full h-[60vh]">
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 right-8 text-white text-right">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            {product.name}
          </h1>
          <p className="text-lg opacity-90">{product.category}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* رجوع لكل المنتجات */}
        <Link
          href="/products"
          className="text-amber-700 font-medium hover:text-amber-800 transition-colors"
        >
          ← الرجوع لكل المنتجات
        </Link>

        {/* السعر */}
        <div className="mt-6 mb-8">
          <span className="text-3xl font-bold text-amber-700">
            {product.price.toLocaleString("ar-SA")} ر.س
          </span>
        </div>

        {/* الوصف الكامل */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-stone-900 mb-4">
            عن المنتج
          </h2>
          <p className="text-stone-600 leading-relaxed text-lg">
            {product.description}
          </p>
        </div>

        {/* معرض صور */}
        {allImages.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 mb-6">
              صور المنتج
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] w-full rounded-xl overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`${product.name} - صورة ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* زرار طلب استشارة */}
        <div className="mt-16 text-center bg-stone-900 rounded-2xl p-10">
          <h3 className="text-2xl font-semibold text-white mb-3">
            عجبك المنتج؟
          </h3>
          <p className="text-stone-300 mb-6">
            احجز استشارة مجانية وخلينا نساعدك تختار الأنسب لمساحتك
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