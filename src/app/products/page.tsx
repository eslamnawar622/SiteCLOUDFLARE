import { getAllProducts } from "@/lib/firestore/products";
import ProductsGrid from "@/components/home/ProductsGrid";

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="bg-surface min-h-screen py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">
            كل المنتجات
          </h1>
          <p className="text-text-secondary mt-2">
            تصفح كل منتجاتنا من أثاث وديكور
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            لا توجد منتجات لعرضها حالياً
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </div>
    </main>
  );
}