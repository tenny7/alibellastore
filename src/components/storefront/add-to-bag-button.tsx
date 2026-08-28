"use client";

import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";
import type { Product } from "@/types";

/** The Landing design's outlined "Add to bag +" control. Fills with the accent
 *  on hover, matching the index grid. */
export function AddToBagButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.status === "out_of_stock";

  function add() {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] ?? "",
    });
    toast.success(`${product.name} added to your bag`);
  }

  if (outOfStock) {
    return (
      <span className="mt-auto cursor-not-allowed rounded-full border border-page-fg/25 px-3.5 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-page-fg/40">
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      className="mt-auto cursor-pointer rounded-full border border-page-fg bg-transparent px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-page-fg transition-colors hover:border-accent-text hover:bg-accent-text hover:text-cream"
    >
      Add to bag +
    </button>
  );
}
