import { getAllProducts } from "@/lib/firestore/products";
import Image from "next/image";
import Link from "next/link";





export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="bg-white min-h-screen py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-stone-900">
            كل المنتجات
          </h1>
          <p className="text-stone-500 mt-2">
            تصفح كل منتجاتنا من أثاث وديكور
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            لا توجد منتجات لعرضها حالياً
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-stone-700">
                    {product.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-2 mb-3">
                    {product.shortDescription}
                  </p>
                  <span className="text-amber-700 font-bold text-lg">
                    {product.price.toLocaleString("ar-SA")} ر.س
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}