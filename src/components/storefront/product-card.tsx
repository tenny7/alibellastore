"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
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
    ? {
        className:
          "group flex cursor-not-allowed select-none flex-col gap-3 rounded-[22px] border border-card-border bg-card p-[13px] opacity-50 grayscale",
      }
    : {
        href: `/products/${product.id}` as const,
        className:
          "group flex flex-col gap-3 rounded-[22px] border border-card-border bg-card p-[13px] shadow-[0_1px_2px_rgba(16,14,27,.04)] transition-all hover:border-page-fg/[0.24] hover:shadow-[0_8px_22px_rgba(16,14,27,.09)]",
      };

  return (
    // @ts-expect-error — conditional wrapper element
    <Wrapper {...wrapperProps}>
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-field">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover ${isOutOfStock ? "" : "group-hover:scale-105"} transition-transform duration-300`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display text-xs uppercase tracking-[0.12em] text-page-fg/25">
            No image
          </div>
        )}
        {/* Category badge on image */}
        {product.category && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-surface/[0.92] px-2.5 py-[5px] font-display text-[10.5px] font-bold uppercase leading-none tracking-[0.08em] text-surface-fg">
            {product.category.name}
          </span>
        )}
        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-ink/80 px-3 py-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-cream">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-[3px]">
        {product.category && (
          <span className="font-display text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-page-fg/40">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.25] text-page-fg">
          {product.name}
        </h3>
      </div>
      <div className="flex items-end justify-between gap-2.5 px-[3px] pb-[3px]">
        <span
          className={`font-display text-[17px] font-bold leading-none ${
            isOutOfStock ? "text-page-fg/40" : "text-page-fg"
          }`}
        >
          {formatCurrency(Number(product.price), currencyCode)}
        </span>
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-[11px] bg-ink px-4 text-[13px] font-bold leading-none text-cream transition-opacity hover:opacity-85"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-[15px] w-[15px]" strokeWidth={2.6} />
            Add
          </button>
        )}
      </div>
    </Wrapper>
  );
}
