import { getFeaturedProducts } from "@/lib/firestore/products";
import { getSettings } from "@/lib/firestore/settings";
import Link from "next/link";
import ProductsGrid from "@/components/home/ProductsGrid";

export default async function ProductsPreview() {
  const settings = await getSettings();

  // ✅ لو الأدمن طفّي السكشن، منعرضش حاجة خالص
  if (settings?.showProductsSection === false) {
    return null;
  }

  const products = await getFeaturedProducts();

  const label = settings?.productsSectionLabel || "تشكيلتنا المميزة";
  const title = settings?.productsSectionTitle || "منتجاتنا";
  const labelSize = settings?.productsSectionLabelSize || 14;
  const titleSize = settings?.productsSectionTitleSize || 32;

  // ✅ الحماية الأساسية
  if (!products || products.length === 0) {
    return (
      <section className="bg-surface py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-primary font-semibold mb-3 tracking-wide"
              style={{ fontSize: labelSize }}
            >
              {label}
            </p>
            <span
              className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
              style={{ fontSize: titleSize }}
            >
              {title}
            </span>
          </div>
          <div className="text-center py-12 text-text-muted">
            لا توجد منتجات لعرضها حالياً
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <p
            className="text-primary font-semibold mb-3 tracking-wide"
            style={{ fontSize: labelSize }}
          >
            {label}
          </p>
          <span
            className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
            style={{ fontSize: titleSize }}
          >
            {title}
          </span>
        </div>

        <div className="flex justify-end mb-10">
          <Link
            href="/products"
            className="text-primary font-medium hover:text-primary-dark transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>

        <ProductsGrid products={products} />
      </div>
    </section>
  );
}