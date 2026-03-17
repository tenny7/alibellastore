import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Package, ShoppingCart, DollarSign, Clock, Plus, FolderTree, Tag, Settings } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { QuickActionButton } from "@/components/admin/quick-action-button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { formatCurrency } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminDashboard() {
  const [user, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const [
    { count: totalProducts },
    { count: totalOrders },
    { data: revenueData },
    { count: pendingOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total").eq("payment_status", "successful"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("*, customer:users(name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatsCard title="Products" value={String(totalProducts ?? 0)} icon={Package} color="blue" />
        <StatsCard title="Orders" value={String(totalOrders ?? 0)} icon={ShoppingCart} color="green" />
        <StatsCard title="Revenue" value={formatCurrency(totalRevenue, settings.currency_code)} icon={DollarSign} color="amber" />
        <StatsCard title="Pending" value={String(pendingOrders ?? 0)} icon={Clock} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionButton href="/admin/products/new" icon={Plus} label="Add Product" description="Create a new listing" />
          <QuickActionButton href="/admin/categories" icon={FolderTree} label="Categories" description="Manage categories" />
          <QuickActionButton href="/admin/discounts" icon={Tag} label="Discounts" description="Create promotions" />
          <QuickActionButton href="/admin/settings" icon={Settings} label="Settings" description="Store configuration" />
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white">
        <div className="px-4 lg:px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E293B]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline font-medium">
            View all
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
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
                  </tr>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>{(order.customer as { name: string })?.name ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(Number(order.total), settings.currency_code)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#E2E8F0]">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-[#1E293B]">
                      {order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {(order.customer as { name: string })?.name ?? "—"}
                    </span>
                    <span className="font-medium">{formatCurrency(Number(order.total), settings.currency_code)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
