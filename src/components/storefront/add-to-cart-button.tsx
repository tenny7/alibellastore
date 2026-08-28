"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  currencyCode?: string;
}

export function AddToCartButton({ productId, name, price, image, currencyCode = "RWF" }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({ productId, name, price, image }, quantity);
    toast.success(`${name} added to cart`);
    setQuantity(1);
  }


  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* v2 stepper: pill-outlined, ±44px targets */}
      <div className="flex items-center gap-1 rounded-full border border-page-fg/[0.24] p-1">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          aria-label="Decrease quantity"
          className="flex h-10 w-10 items-center justify-center rounded-full text-page-fg transition-colors hover:bg-page-fg/10"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-7 text-center font-mono text-sm">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          aria-label="Increase quantity"
          className="flex h-10 w-10 items-center justify-center rounded-full text-page-fg transition-colors hover:bg-page-fg/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex min-h-12 flex-1 basis-[200px] items-center justify-center gap-2 rounded-full bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-fg transition-colors hover:bg-page-fg hover:text-page"
      >
        Add to bag
        {typeof price === "number" && (
          <span aria-hidden>— {formatCurrency(price * quantity, currencyCode)}</span>
        )}
      </button>
    </div>
  );
}
