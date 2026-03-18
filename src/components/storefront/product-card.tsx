"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  currencyCode?: string;
}

export function ProductCard({ product, currencyCode = "RWF" }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.status === "out_of_stock";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] ?? "",
    });
    toast.success(`${product.name} added to cart`);
  }

  const Wrapper = isOutOfStock ? "div" : Link;
  const wrapperProps = isOutOfStock
    ? { className: "group rounded-xl border border-[#E2E8F0] bg-white overflow-hidden opacity-50 grayscale cursor-not-allowed select-none" }
    : { href: `/products/${product.id}` as const, className: "group rounded-xl border border-[#E2E8F0] bg-white overflow-hidden hover:shadow-md transition-all" };

  return (
    // @ts-expect-error — conditional wrapper element
    <Wrapper {...wrapperProps}>
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover ${isOutOfStock ? "" : "group-hover:scale-105"} transition-transform duration-300`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
            No image
          </div>
        )}
        {/* Category badge on image */}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2 py-1 rounded-md">
            {product.category.name}
          </span>
        )}
        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
              Out of Stock
            </span>
          </div>
        )}
        {/* Cart button — hidden when out of stock */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2.5 right-2.5 rounded-lg bg-primary p-2.5 text-white shadow-lg hover:bg-primary-hover transition-all opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-medium text-[#1E293B] line-clamp-2 mb-1.5">
          {product.name}
        </h3>
        <p className={`text-base font-bold ${isOutOfStock ? "text-gray-400" : "text-[#1E293B]"}`}>
          {formatCurrency(Number(product.price), currencyCode)}
        </p>
      </div>
    </Wrapper>
  );
}
