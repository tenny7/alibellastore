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
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-page-fg">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-page-fg/50">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatsCard title="Products" value={String(totalProducts ?? 0)} icon={Package} color="neutral" />
        <StatsCard title="Orders" value={String(totalOrders ?? 0)} icon={ShoppingCart} color="neutral" />
        <StatsCard title="Revenue" value={formatCurrency(totalRevenue, settings.currency_code)} icon={DollarSign} color="neutral" />
        <StatsCard title="Pending" value={String(pendingOrders ?? 0)} icon={Clock} color="neutral" />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-page-fg/45">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionButton href="/admin/products/new" icon={Plus} label="Add Product" description="Create a new listing" />
          <QuickActionButton href="/admin/categories" icon={FolderTree} label="Categories" description="Manage categories" />
          <QuickActionButton href="/admin/discounts" icon={Tag} label="Discounts" description="Create promotions" />
          <QuickActionButton href="/admin/settings" icon={Settings} label="Settings" description="Store configuration" />
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-[20px] border border-page-fg/[0.09] bg-page">
        <div className="flex items-center justify-between border-b border-page-fg/[0.09] px-4 py-4 lg:px-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-page-fg">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-page-fg transition-colors hover:text-page-fg">
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
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] font-medium text-page-fg transition-colors hover:text-page-fg">
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
                      <TableCell className="font-mono text-xs text-page-fg/45">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-page-fg/[0.07] lg:hidden">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block px-4 py-3.5 transition-colors hover:bg-page-fg/[0.04]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[13px] font-medium text-page-fg">
                      {order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-page-fg/50">
                      {(order.customer as { name: string })?.name ?? "—"}
                    </span>
                    <span className="font-medium">{formatCurrency(Number(order.total), settings.currency_code)}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-page-fg/40">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center text-page-fg/45">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
