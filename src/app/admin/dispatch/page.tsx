import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { Package, Truck, CheckCircle2, CreditCard } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

export const metadata = { title: "Dispatch board" };

// Fulfilment lanes, in the order work moves through them.
const LANES: { status: OrderStatus; title: string; hint: string; icon: typeof Package }[] = [
  { status: "paid", title: "Paid", hint: "Awaiting packing", icon: CreditCard },
  { status: "processing", title: "Packing", hint: "Being prepared", icon: Package },
  { status: "shipped", title: "Out for delivery", hint: "With a rider", icon: Truck },
  { status: "delivered", title: "Delivered", hint: "Completed", icon: CheckCircle2 },
];

export default async function AdminDispatchPage() {
  const [, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, shipping_address, total, status, created_at")
    .in("status", ["paid", "processing", "shipped", "delivered"])
    .order("created_at", { ascending: true });

  const orders = (data ?? []) as Pick<
    Order,
    "id" | "order_number" | "customer_name" | "customer_phone" | "shipping_address" | "total" | "status" | "created_at"
  >[];

  const byLane = (s: OrderStatus) => orders.filter((o) => o.status === s);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-page-fg">Dispatch board</h1>
        <p className="mt-1.5 text-sm text-page-fg/50">
          Paid orders moving through fulfilment. Oldest first — clear the left-hand lanes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {LANES.map((lane) => {
          const items = byLane(lane.status);
          return (
            <section
              key={lane.status}
              className="flex flex-col rounded-[20px] border border-page-fg/[0.09] bg-page"
            >
              <header className="flex items-center gap-2.5 border-b border-page-fg/[0.09] px-4 py-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-page-fg/[0.08] text-page-fg/70">
                  <lane.icon className="h-[15px] w-[15px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold text-page-fg">{lane.title}</div>
                  <div className="text-[11px] text-page-fg/40">{lane.hint}</div>
                </div>
                <span className="rounded-md bg-page-fg/[0.08] px-2 py-1 font-mono text-[11.5px] font-medium text-page-fg/70">
                  {items.length}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-2 p-3">
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-page-fg/30">Nothing here</p>
                )}
                {items.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="rounded-[14px] border border-page-fg/[0.08] bg-page-fg/[0.03] p-3 transition-colors hover:border-page-fg/20 hover:bg-page-fg/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12.5px] font-medium text-page-fg">{o.order_number}</span>
                      <span className="font-mono text-[12.5px] text-page-fg/70">
                        {formatCurrency(Number(o.total), settings.currency_code)}
                      </span>
                    </div>
                    <div className="mt-2 truncate text-[13px] font-medium text-page-fg">{o.customer_name}</div>
                    <div className="mt-0.5 truncate font-mono text-[11.5px] text-page-fg/45">{o.customer_phone}</div>
                    <div className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-page-fg/40">
                      {o.shipping_address}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-page-fg/40">
        Rider assignment isn&apos;t shown: there is no rider or courier table in the schema yet.
      </p>
    </div>
  );
}
