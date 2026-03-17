import Link from "next/link";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const status = params.status;
  const limit = 20;

  const [supabase, settings] = await Promise.all([
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  // Get counts per status for the pills
  const { data: allOrders } = await supabase
    .from("orders")
    .select("status");

  const statusCounts: Record<string, number> = {};
  allOrders?.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const totalCount = allOrders?.length ?? 0;

  let query = supabase
    .from("orders")
    .select("*, customer:users(name, email)", { count: "exact" });

  if (status) query = query.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: orders, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / limit);

  const statusFilters = [
    { value: "", label: "All", count: totalCount },
    { value: "pending", label: "Pending", count: statusCounts.pending ?? 0 },
    { value: "paid", label: "Paid", count: statusCounts.paid ?? 0 },
    { value: "processing", label: "Processing", count: statusCounts.processing ?? 0 },
    { value: "shipped", label: "Shipped", count: statusCounts.shipped ?? 0 },
    { value: "delivered", label: "Delivered", count: statusCounts.delivered ?? 0 },
    { value: "cancelled", label: "Cancelled", count: statusCounts.cancelled ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Orders</h1>

      {/* Status filter pills — scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all ${
              (status ?? "") === f.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-[#E2E8F0] hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${
              (status ?? "") === f.value ? "text-white/70" : "text-gray-400"
            }`}>
              {f.count}
            </span>
          </Link>
        ))}
      </div>

      {orders && orders.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono text-xs">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(order.total), settings.currency_code)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.payment_status} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block rounded-lg border border-[#E2E8F0] bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-medium text-[#1E293B]">
                    {order.order_number}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {formatCurrency(Number(order.total), settings.currency_code)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={order.payment_status} />
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/admin/orders"
          />
        </>
      ) : (
        <div className="text-center py-12 rounded-lg border border-[#E2E8F0] bg-white">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No orders found</p>
          <p className="text-sm text-gray-400">
            {status ? "Try selecting a different status filter." : "Orders will appear here once customers place them."}
          </p>
        </div>
      )}
    </div>
  );
}
