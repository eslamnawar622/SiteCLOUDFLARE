import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/firestore/products";
import { getSettings } from "@/lib/firestore/settings";
import { getProductInquirySettings } from "@/lib/firestore/productInquiry";
import ProjectGalleryLightbox from "@/components/projects/ProjectGalleryLightbox";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings, inquirySettings] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
    getProductInquirySettings(),
  ]);

  if (!product) {
    notFound();
  }

  const whatsappMessage = inquirySettings.messageTemplate.replace(
    "{productName}",
    product.name
  );
  const whatsappUrl =
    "https://wa.me/" +
    inquirySettings.whatsappNumber +
    "?text=" +
    encodeURIComponent(whatsappMessage);

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition-colors mb-8"
        >
          ← الرجوع لكل المنتجات
        </Link>

        <ProjectGalleryLightbox
          mainImage={product.mainImage}
          gallery={product.gallery || []}
          title={product.name}
          badgeText={product.category}
          magnifierSize={settings?.magnifierSize}
          magnifierZoom={settings?.magnifierZoom}
        />

        <div className="mb-8 mt-6">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {product.name}
          </h1>
          <div className="flex items-center gap-4 text-text-muted mb-4">
            <span className="text-primary font-bold text-xl">
              {product.price.toLocaleString("ar-SA")} ر.س
            </span>
            {product.category && (
              <>
                <span className="w-1 h-1 rounded-full bg-border-custom" />
                <span>{product.category}</span>
              </>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed text-lg whitespace-pre-line">
            {product.description || product.shortDescription}
          </p>
        </div>

        <div className="mt-16 text-center bg-primary rounded-2xl p-10">
          <h3 className="text-2xl font-semibold text-white mb-3">
            عجبك المنتج؟
          </h3>
          <p className="text-white/80 mb-6">
            دوس على الزرار وابعتلنا استفسارك مباشرة عن المنتج ده
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white hover:bg-white/90 text-primary px-8 py-3 rounded-full font-medium transition-colors"
          >
            {inquirySettings.buttonText}
          </a>
        </div>
      </div>
    </div>
  );
}