"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <PackageSearch className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium mb-1">No products found</p>
        <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search terms.</p>
        <Link
          href="/products"
          className="text-sm text-primary hover:underline font-medium"
        >
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <div className={className ?? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
