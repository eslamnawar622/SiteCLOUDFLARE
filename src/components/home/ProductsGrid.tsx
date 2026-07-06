"use client";

import Image from "next/image";
import Link from "next/link";
import FadeInWhenVisible from "@/components/shared/FadeInWhenVisible";
import type { Product } from "@/types/product";

export default function ProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <FadeInWhenVisible key={product.id} delay={index * 0.08}>
          <Link
            href={`/products/${product.slug}`}
            className="group block bg-surface-raised rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={product.mainImage}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute top-3 right-3 bg-surface-raised/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-text-secondary">
                {product.category}
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-3">
                {product.shortDescription}
              </p>
              <span className="text-primary font-bold text-lg">
                {product.price.toLocaleString("ar-SA")} ر.س
              </span>
            </div>
          </Link>
        </FadeInWhenVisible>
      ))}
    </div>
  );
}