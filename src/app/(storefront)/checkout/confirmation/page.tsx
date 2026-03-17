import { createAdminClient } from "@/lib/supabase/admin";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";
import type { PaymentStatus } from "@/types";

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">No order found.</p>
        <Link href="/">
          <Button className="mt-4">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const [supabase, settings] = await Promise.all([
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(name, images))")
    .eq("id", orderId)
    .single();

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Order not found.</p>
        <Link href="/">
          <Button className="mt-4">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const statusConfig: Record<
    PaymentStatus,
    { icon: typeof CheckCircle; color: string; bg: string; label: string }
  > = {
    successful: {
      icon: CheckCircle,
      color: "text-[#16A34A]",
      bg: "bg-green-50 border-green-200",
      label: "Payment Confirmed",
    },
    pending: {
      icon: Clock,
      color: "text-[#D97706]",
      bg: "bg-yellow-50 border-yellow-200",
      label: "Payment Pending",
    },
    failed: {
      icon: XCircle,
      color: "text-[#DC2626]",
      bg: "bg-red-50 border-red-200",
      label: "Payment Failed",
    },
    timed_out: {
      icon: XCircle,
      color: "text-[#DC2626]",
      bg: "bg-red-50 border-red-200",
      label: "Payment Timed Out",
    },
  };

  const config = statusConfig[order.payment_status as PaymentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Status banner */}
      <div className={`rounded-lg border p-8 text-center mb-6 ${config.bg}`}>
        <StatusIcon className={`h-16 w-16 mx-auto ${config.color}`} />
        <h1 className={`text-2xl font-bold mt-4 ${config.color}`}>
          {config.label}
        </h1>
        <p className="text-gray-600 mt-2">
          Order <span className="font-mono font-bold">{order.order_number}</span>
        </p>
      </div>

      {/* Order details */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 mb-6">
        <h2 className="font-semibold text-[#1E293B] mb-4">Order Details</h2>

        <div className="space-y-3 mb-4">
          {order.order_items?.map((item: { id: string; quantity: number; unit_price: number; product: { name: string } }) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product?.name} x {item.quantity}
              </span>
              <span className="font-medium">
                {formatCurrency(Number(item.unit_price) * item.quantity, settings.currency_code)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E2E8F0] pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal), settings.currency_code)}</span>
          </div>
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span>{formatCurrency(Number(order.delivery_fee), settings.currency_code)}</span>
            </div>
          )}
          {Number(order.tax_amount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>{formatCurrency(Number(order.tax_amount), settings.currency_code)}</span>
            </div>
          )}
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
            <dd className="text-right max-w-[200px]">{order.shipping_address}</dd>
          </div>
        </dl>
      </div>

      <div className="text-center">
        <Link href="/">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
