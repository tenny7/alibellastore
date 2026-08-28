import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { MessageSquare, Info } from "lucide-react";
import type { SupportMessage, Order } from "@/types";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const [, supabase] = await Promise.all([requireAdmin(), Promise.resolve(createAdminClient())]);

  const { data: msgs, error } = await supabase
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <Header />
        <div className="flex gap-3 rounded-[18px] border border-page-fg/[0.12] bg-page-fg/[0.04] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-page-fg/60" />
          <p className="text-[13px] leading-relaxed text-page-fg/60">
            Messaging isn&apos;t available yet. Apply{" "}
            <code className="rounded bg-page-fg/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-page-fg/80">
              supabase/migrations/20260828_support_messages.sql
            </code>{" "}
            to create the support tables.
          </p>
        </div>
      </div>
    );
  }

  const messages = (msgs ?? []) as SupportMessage[];

  // Newest message per order, plus how many customer messages are unread.
  const threads = new Map<string, { last: SupportMessage; unread: number }>();
  for (const m of messages) {
    const t = threads.get(m.order_id);
    if (!t) threads.set(m.order_id, { last: m, unread: 0 });
    const entry = threads.get(m.order_id)!;
    if (m.sender_role === "customer" && !m.read_at) entry.unread += 1;
  }

  const orderIds = [...threads.keys()];
  const { data: orderRows } = orderIds.length
    ? await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone")
        .in("id", orderIds)
    : { data: [] };

  const orders = new Map(
    ((orderRows ?? []) as Pick<Order, "id" | "order_number" | "customer_name" | "customer_phone">[]).map(
      (o) => [o.id, o]
    )
  );

  const sorted = [...threads.entries()].sort(
    (a, b) => +new Date(b[1].last.created_at) - +new Date(a[1].last.created_at)
  );

  return (
    <div>
      <Header />

      {sorted.length === 0 ? (
        <p className="rounded-[20px] border border-page-fg/[0.09] bg-page px-6 py-12 text-center text-page-fg/45">
          No customer messages yet.
        </p>
      ) : (
        <div className="divide-y divide-page-fg/[0.07] overflow-hidden rounded-[20px] border border-page-fg/[0.09] bg-page">
          {sorted.map(([orderId, { last, unread }]) => {
            const order = orders.get(orderId);
            return (
              <Link
                key={orderId}
                href={`/admin/support/${orderId}`}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-page-fg/[0.04]"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-page-fg/40" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[13px] font-medium text-page-fg">
                      {order?.order_number ?? "—"}
                    </span>
                    <span className="truncate text-[13px] text-page-fg/60">
                      {order?.customer_name ?? ""}
                    </span>
                    {unread > 0 && (
                      <span className="rounded-full bg-page-fg px-2 py-0.5 font-mono text-[11px] font-bold text-page">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[13px] text-page-fg/50">
                    {last.sender_role === "admin" ? "You: " : ""}
                    {last.body}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11.5px] text-page-fg/35">
                  {new Date(last.created_at).toLocaleDateString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-page-fg">Support</h1>
      <p className="mt-1.5 text-sm text-page-fg/50">
        Customer messages, grouped by order. Newest first.
      </p>
    </div>
  );
}
