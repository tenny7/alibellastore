import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";
import type { OrderStatus, PaymentStatus } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

const ORDER_STEPS: {
  key: OrderStatus;
  label: string;
  icon: typeof Clock;
}[] = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

function getStepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

const PAYMENT_LABELS: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  successful: { label: "Paid", color: "text-[#16A34A]" },
  pending: { label: "Pending", color: "text-[#D97706]" },
  failed: { label: "Failed", color: "text-[#DC2626]" },
  timed_out: { label: "Timed Out", color: "text-[#DC2626]" },
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(id, name, images, price))")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const currentStep = getStepIndex(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";
  const paymentInfo =
    PAYMENT_LABELS[order.payment_status as PaymentStatus] || PAYMENT_LABELS.pending;

  const settings = await getSiteSettings();
  const whatsappMsg = encodeURIComponent(
    `Hi, I have a question about my order ${order.order_number}`
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Order {order.order_number}
          </h1>
          <p className="text-sm text-gray-500">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-RW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`text-sm font-medium ${paymentInfo.color}`}>
          Payment: {paymentInfo.label}
        </span>
      </div>

      {/* Status Timeline */}
      {isCancelled ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center mb-6">
          <XCircle className="h-10 w-10 mx-auto text-[#DC2626] mb-2" />
          <p className="font-medium text-[#DC2626]">Order Cancelled</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 mb-6">
          <h2 className="font-semibold text-[#1E293B] mb-4">Order Status</h2>
          <div className="flex items-center justify-between relative px-4">
            {/* Progress line — runs between first and last icon centers */}
            <div className="absolute top-4 h-0.5 bg-gray-200" style={{ left: "10%", right: "10%" }} />
            <div
              className="absolute top-4 h-0.5 bg-primary transition-all"
              style={{
                left: "10%",
                width: `${currentStep > 0 ? (currentStep / (ORDER_STEPS.length - 1)) * 80 : 0}%`,
              }}
            />

            {ORDER_STEPS.map((step, i) => {
              const isActive = i <= currentStep;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.key}
                  className="relative flex flex-col items-center z-10"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isActive ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 mb-6">
        <h2 className="font-semibold text-[#1E293B] mb-4">Items</h2>
        <div className="space-y-4">
          {order.order_items?.map(
            (item: {
              id: string;
              quantity: number;
              unit_price: number;
              product: { id: string; name: string; images: string[] };
            }) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-[#E2E8F0]">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product?.id}`}
                    className="text-sm font-medium text-[#1E293B] hover:text-primary truncate block"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(Number(item.unit_price), settings.currency_code)} x {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-[#1E293B]">
                  {formatCurrency(Number(item.unit_price) * item.quantity, settings.currency_code)}
                </span>
              </div>
            )
          )}
        </div>

        <div className="border-t border-[#E2E8F0] mt-4 pt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal), settings.currency_code)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-[#16A34A]">
              <span>Discount</span>
              <span>-{formatCurrency(Number(order.discount_amount), settings.currency_code)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total), settings.currency_code)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 mb-6">
        <h2 className="font-semibold text-[#1E293B] mb-3">Delivery Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Name</dt>
            <dd>{order.customer_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Phone</dt>
            <dd>{order.customer_phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Address</dt>
            <dd className="text-right max-w-[200px]">
              {order.shipping_address}
            </dd>
          </div>
          {order.notes && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-right max-w-[200px]">{order.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Payment info */}
      {order.momo_transaction_id && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 mb-6">
          <h2 className="font-semibold text-[#1E293B] mb-3">Payment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Method</dt>
              <dd>MTN Mobile Money</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Transaction ID</dt>
              <dd className="font-mono text-xs">
                {order.momo_transaction_id}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* WhatsApp contact */}
      <div className="text-center">
        <a
          href={`https://wa.me/${settings.whatsapp_number}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1ebe57] transition-colors text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          Need help? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
