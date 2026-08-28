"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useSiteSettings } from "@/lib/hooks/use-site-settings";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const { currencyCode } = useSiteSettings();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-surface-muted mb-4" />
        <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-2">
          Your cart is empty
        </h1>
        <p className="text-surface-muted mb-6">
          Add some products to get started.
        </p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-6">Your bag</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-[20px] border border-surface-border bg-surface p-4"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-hover shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-surface-muted text-xs">
                    N/A
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-surface-fg truncate">
                  {item.name}
                </h3>
                <p className="text-sm text-surface-muted mt-1">
                  {formatCurrency(item.price, currencyCode)} each
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="rounded border border-surface-border p-1 hover:bg-surface-hover"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="rounded border border-surface-border p-1 hover:bg-surface-hover"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-surface-fg">
                      {formatCurrency(item.price * item.quantity, currencyCode)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-surface-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-surface-muted hover:text-danger transition-colors"
          >
            Clear cart
          </button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-[20px] border border-surface-border bg-surface p-6 sticky top-24">
            <h2 className="font-display tracking-[-0.02em] text-lg font-bold text-surface-fg mb-4">
              Order Summary
            </h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-surface-muted">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span className="font-medium">{formatCurrency(getTotal(), currencyCode)}</span>
              </div>
            </div>
            <div className="border-t border-surface-border pt-4 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-surface-fg">Total</span>
                <span className="text-xl font-bold text-surface-fg">
                  {formatCurrency(getTotal(), currencyCode)}
                </span>
              </div>
            </div>
            <Link href="/checkout">
              <Button size="lg" className="w-full">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
