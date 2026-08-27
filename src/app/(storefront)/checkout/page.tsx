"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Check, ChevronLeft, Lock, Pencil, X, Tag, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { MoMoPaymentButton } from "@/components/storefront/momo-payment-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Step = "info" | "review" | "payment";

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: "info", label: "Shipping", number: 1 },
  { key: "review", label: "Review", number: 2 },
  { key: "payment", label: "Payment", number: 3 },
];

function stepIndex(step: Step) {
  return STEPS.findIndex((s) => s.key === step);
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  // Fee settings from admin
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [currencyCode, setCurrencyCode] = useState("RWF");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata;
      if (meta?.name) setCustomerName(meta.name);
      if (meta?.phone || user.phone) setCustomerPhone(meta?.phone || user.phone || "");
      if (meta?.address) setShippingAddress(meta.address);
    });

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setDeliveryFee(Number(data.delivery_fee) || 0);
        setFreeDeliveryThreshold(data.free_delivery_threshold != null ? Number(data.free_delivery_threshold) : null);
        setTaxPercentage(Number(data.tax_percentage) || 0);
        if (data.currency_code) setCurrencyCode(data.currency_code);
      });
  }, []);

  if (items.length === 0 && !orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-2">Cart is empty</h1>
        <p className="text-surface-muted mb-6">Add products before checking out.</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  function validateInfo() {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.customerName = "Name is required";
    if (!customerPhone.match(/^\+?[0-9]{9,15}$/))
      newErrors.customerPhone = "Valid phone number required";
    if (!shippingAddress.trim() || shippingAddress.length < 5)
      newErrors.shippingAddress = "Address is required (min 5 chars)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleApplyDiscount() {
    const code = discountCode.trim();
    if (!code) return;
    setApplyingDiscount(true);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid discount code");
      } else {
        setAppliedDiscount(data);
        setDiscountCode("");
        toast.success(`Discount "${data.code}" applied!`);
      }
    } catch {
      toast.error("Failed to validate discount code");
    }
    setApplyingDiscount(false);
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
  }

  function handleContinueToReview() {
    if (validateInfo()) setStep("review");
  }

  async function handleCashOnDelivery() {
    if (!orderId) return;
    setCodLoading(true);
    try {
      const res = await fetch("/api/payments/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not confirm the order");
        return;
      }
      clearCart();
      router.push(`/checkout/confirmation?orderId=${orderId}&method=cod`);
    } catch {
      toast.error("Could not confirm the order");
    } finally {
      setCodLoading(false);
    }
  }

  async function handleCreateOrder() {
    setLoading(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        shippingAddress,
        notes: notes || undefined,
        discountCode: appliedDiscount?.code || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Checkout failed");
      setLoading(false);
      return;
    }

    setOrderId(data.id);
    setOrderNumber(data.order_number);
    setOrderTotal(Number(data.total));
    setStep("payment");
    setLoading(false);
  }

  function handlePaymentSuccess() {
    clearCart();
    router.push(`/checkout/confirmation?orderId=${orderId}`);
  }

  const subtotal = getTotal();
  const effectiveDeliveryFee =
    freeDeliveryThreshold != null && freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold
      ? 0
      : deliveryFee;
  const taxAmount = Math.round(subtotal * (taxPercentage / 100));
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const estimatedTotal = subtotal + effectiveDeliveryFee + taxAmount - discountAmount;

  const currentStepIdx = stepIndex(step);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-surface-muted hover:text-surface-fg mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to cart
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Order Summary — left on desktop, bottom on mobile */}
        <div className="order-2 lg:order-1 lg:col-span-5">
          <div className="lg:sticky lg:top-24 rounded-[22px] border border-surface-border bg-surface p-6">
            <h2 className="font-display tracking-[-0.02em] font-bold text-surface-fg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-hover shrink-0 border border-surface-border">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-fg truncate">{item.name}</p>
                    <p className="text-xs text-surface-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-surface-fg">
                    {formatCurrency(item.price * item.quantity, currencyCode)}
                  </p>
                </div>
              ))}
            </div>

            {/* Discount code */}
            {step !== "payment" && (
              <div className="mb-4">
                {!appliedDiscount ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                      placeholder="Discount Code"
                      className="flex-1 rounded-lg border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-surface-fg/20 focus:border-surface-fg"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount || !discountCode.trim()}
                      className="px-4 py-2 text-sm font-medium border border-surface-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-[12px] border border-cream/20 bg-surface-fg/10 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-surface-fg" />
                      <span className="text-sm font-medium text-surface-fg">
                        {appliedDiscount.code}
                      </span>
                      <span className="text-xs text-surface-fg/70">
                        ({appliedDiscount.type === "percentage"
                          ? `${appliedDiscount.value}% off`
                          : `${formatCurrency(appliedDiscount.value, currencyCode)} off`})
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="p-1 rounded-full hover:bg-surface-fg/10 transition-colors"
                      title="Remove discount"
                    >
                      <X className="h-4 w-4 text-surface-fg" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-surface-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-surface-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currencyCode)}</span>
              </div>
              {appliedDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-surface-fg">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount, currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-surface-muted">
                <span>Delivery</span>
                {effectiveDeliveryFee > 0 ? (
                  <span>{formatCurrency(effectiveDeliveryFee, currencyCode)}</span>
                ) : (
                  <span className="text-surface-fg">Free</span>
                )}
              </div>
              {freeDeliveryThreshold != null && freeDeliveryThreshold > 0 && effectiveDeliveryFee > 0 && (
                <p className="text-xs text-surface-muted">
                  Free delivery on orders above {formatCurrency(freeDeliveryThreshold, currencyCode)}
                </p>
              )}
              {taxPercentage > 0 && (
                <div className="flex justify-between text-sm text-surface-muted">
                  <span>Tax ({taxPercentage}%)</span>
                  <span>{formatCurrency(taxAmount, currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-surface-fg pt-2 border-t border-surface-border">
                <span>Total</span>
                <span>{formatCurrency(orderTotal ?? estimatedTotal, currencyCode)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout form — right on desktop, top on mobile */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-2">Checkout</h1>

          {/* Progress bar */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((s, i) => {
              const isCompleted = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        isCompleted
                          ? "bg-page-fg text-page"
                          : isCurrent
                            ? "bg-ink text-cream"
                            : "bg-surface-hover text-surface-muted"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : s.number}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        isCurrent ? "text-surface-fg" : "text-surface-muted"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-16 sm:w-24 h-0.5 mx-2 sm:mx-3",
                        i < currentStepIdx ? "bg-page-fg" : "bg-surface-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Shipping Info */}
          {step === "info" && (
            <div className="space-y-4 rounded-[22px] border border-surface-border bg-surface p-6">
              <h2 className="font-display tracking-[-0.02em] font-bold text-surface-fg">Where should it go?</h2>
              <Input
                id="name"
                label="Full Name"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={errors.customerName}
              />
              <Input
                id="phone"
                label="Phone Number (for MoMo payment)"
                placeholder="+250780000000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                error={errors.customerPhone}
              />
              <Textarea
                id="address"
                label="Delivery Address"
                placeholder="Enter your full delivery address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                error={errors.shippingAddress}
              />
              <Textarea
                id="notes"
                label="Order Notes (optional)"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button onClick={handleContinueToReview} className="w-full" size="lg">
                Continue to Review
              </Button>
            </div>
          )}

          {/* Step 2: Review */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Shipping summary */}
              <div className="rounded-[22px] border border-surface-border bg-surface p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-fg text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="font-display tracking-[-0.02em] font-bold text-surface-fg">Where should it go?</h2>
                  </div>
                  <button
                    onClick={() => setStep("info")}
                    className="text-sm text-surface-fg hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                <dl className="space-y-1 text-sm text-surface-muted pl-8">
                  <dd>{customerName}</dd>
                  <dd>{customerPhone}</dd>
                  <dd>{shippingAddress}</dd>
                  {notes && <dd className="text-surface-muted italic">{notes}</dd>}
                </dl>
              </div>

              {/* Confirm */}
              <div className="rounded-xl border border-surface-fg bg-surface p-6">
                <h2 className="font-display tracking-[-0.02em] font-bold text-surface-fg mb-4">Confirm &amp; pay</h2>
                <p className="text-sm text-surface-muted mb-4">
                  You&apos;ll pay via MTN Mobile Money after placing the order.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleCreateOrder} loading={loading} className="flex-1" size="lg">
                    Place Order & Pay
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && orderId && (
            <div className="rounded-[22px] border border-surface-border bg-surface p-6">
              <h2 className="font-display tracking-[-0.02em] font-bold text-surface-fg mb-4 text-center">
                Complete Your Payment
              </h2>
              <MoMoPaymentButton
                orderId={orderId}
                orderNumber={orderNumber}
                amount={orderTotal ?? estimatedTotal}
                onSuccess={handlePaymentSuccess}
                currencyCode={currencyCode}
              />
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-surface-muted">
                <Lock className="h-3 w-3" />
                Encrypted and secure payment processing
              </div>

              {/* Cash on Delivery fallback */}
              <div className="mt-6 border-t border-surface-border pt-5">
                <p className="mb-3 text-center text-sm text-surface-muted">
                  Can&apos;t pay with MoMo right now?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  loading={codLoading}
                  onClick={handleCashOnDelivery}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Pay cash on delivery
                </Button>
                <p className="mt-2.5 text-center text-xs text-surface-muted">
                  We&apos;ll pack your order now and collect payment when it arrives.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
