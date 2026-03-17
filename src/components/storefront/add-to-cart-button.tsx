"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, Zap } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
}

export function AddToCartButton({ productId, name, price, image }: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({ productId, name, price, image }, quantity);
    toast.success(`${name} added to cart`);
    setQuantity(1);
  }

  function handleBuyNow() {
    addItem({ productId, name, price, image }, quantity);
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</label>
        <div className="inline-flex items-center rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2.5 text-gray-500 hover:text-[#1E293B] hover:bg-gray-50 transition-colors rounded-l-lg"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium text-[#1E293B] border-x border-[#E2E8F0] py-2.5">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2.5 text-gray-500 hover:text-[#1E293B] hover:bg-gray-50 transition-colors rounded-r-lg"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add to Bag & Buy Now buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3.5 rounded-lg hover:bg-primary/5 transition-colors text-sm"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to Bag
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          <Zap className="h-5 w-5" />
          Buy Now
        </button>
      </div>
    </div>
  );
}
