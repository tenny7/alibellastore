import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { UpdateOrderStatus } from "./update-status";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [supabase, settings] = await Promise.all([
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(name, images, price)), customer:users(name, email, phone)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            Order {order.order_number}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items — main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop items table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {order.order_items?.map((item: { id: string; quantity: number; unit_price: number; product: { name: string } }) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unit_price), settings.currency_code)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(item.unit_price) * item.quantity, settings.currency_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile items cards */}
              <div className="sm:hidden space-y-3">
                {order.order_items?.map((item: { id: string; quantity: number; unit_price: number; product: { name: string } }) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} x {formatCurrency(Number(item.unit_price), settings.currency_code)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B] ml-4">
                      {formatCurrency(Number(item.unit_price) * item.quantity, settings.currency_code)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal), settings.currency_code)}</span>
                </div>
                {Number(order.delivery_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span>{formatCurrency(Number(order.delivery_fee), settings.currency_code)}</span>
                  </div>
                )}
                {Number(order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(Number(order.tax_amount), settings.currency_code)}</span>
                  </div>
                )}
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(order.discount_amount), settings.currency_code)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total), settings.currency_code)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{order.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd>{order.customer_phone}</dd>
                </div>
                {(order.customer as { email?: string })?.email && (
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd>{(order.customer as { email: string }).email}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.shipping_address}</p>
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd><PaymentStatusBadge status={order.payment_status} /></dd>
                </div>
                {order.momo_reference_id && (
                  <div>
                    <dt className="text-gray-500">MoMo Reference</dt>
                    <dd className="font-mono text-xs break-all">{order.momo_reference_id}</dd>
                  </div>
                )}
                {order.momo_transaction_id && (
                  <div>
                    <dt className="text-gray-500">Transaction ID</dt>
                    <dd className="font-mono text-xs break-all">{order.momo_transaction_id}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
