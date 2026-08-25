import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Users, Repeat, Wallet } from "lucide-react";
import type { Order, User } from "@/types";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const [, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const [{ data: users }, { data: orders }] = await Promise.all([
    supabase.from("users").select("*").eq("role", "shopper").order("created_at", { ascending: false }),
    supabase.from("orders").select("customer_id, total, payment_status, created_at"),
  ]);

  const people = (users ?? []) as User[];
  const rows = (orders ?? []) as Pick<Order, "customer_id" | "total" | "payment_status" | "created_at">[];

  // Aggregate spend per customer from paid orders only.
  const agg = new Map<string, { orders: number; spent: number; last: string | null }>();
  for (const o of rows) {
    const cur = agg.get(o.customer_id) ?? { orders: 0, spent: 0, last: null };
    cur.orders += 1;
    if (o.payment_status === "successful") cur.spent += Number(o.total);
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    agg.set(o.customer_id, cur);
  }

  const enriched = people
    .map((p) => ({ person: p, ...(agg.get(p.id) ?? { orders: 0, spent: 0, last: null }) }))
    .sort((a, b) => b.spent - a.spent);

  const withOrders = enriched.filter((e) => e.orders > 0);
  const repeat = enriched.filter((e) => e.orders > 1).length;
  const totalSpent = enriched.reduce((s, e) => s + e.spent, 0);
  const avgBasket = withOrders.length ? totalSpent / withOrders.length : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-cream">Customers</h1>
        <p className="mt-1.5 text-sm text-cream/50">
          Everyone who has signed up, ranked by lifetime spend.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatsCard title="Customers" value={String(people.length)} icon={Users} />
        <StatsCard title="Have ordered" value={String(withOrders.length)} icon={Wallet} color="green" />
        <StatsCard title="Repeat buyers" value={String(repeat)} icon={Repeat} color="purple" />
        <StatsCard
          title="Avg. basket"
          value={formatCurrency(avgBasket, settings.currency_code)}
          icon={Wallet}
          color="amber"
          trend="paid orders only"
        />
      </div>

      <div className="rounded-[20px] border border-cream/[0.09] bg-ink">
        <div className="border-b border-cream/[0.09] px-4 py-4 lg:px-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-cream">All customers</h2>
        </div>

        {enriched.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Lifetime spend</TableHead>
                  <TableHead>Last order</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {enriched.map(({ person, orders: n, spent, last }) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <span className="font-medium text-cream">{person.name || "—"}</span>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] text-cream/60">
                      {person.phone || person.email || "—"}
                    </TableCell>
                    <TableCell className="font-mono">{n}</TableCell>
                    <TableCell className="font-medium text-cream">
                      {formatCurrency(spent, settings.currency_code)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-cream/45">
                      {last ? new Date(last).toLocaleDateString() : "never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-cream/45">
            No customers yet. <Link href="/admin/products" className="text-lilac hover:text-cream">Add products</Link> to get started.
          </div>
        )}
      </div>
    </div>
  );
}
