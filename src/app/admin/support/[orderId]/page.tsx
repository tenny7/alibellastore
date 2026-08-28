import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { SupportThread } from "@/components/support/support-thread";
import { SupportBlockToggle } from "@/components/admin/support-block-toggle";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { ChevronLeft } from "lucide-react";
import type { Order, User } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function AdminSupportThreadPage({ params }: Props) {
  const { orderId } = await params;
  const [, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data: order } = await supabase
    .from("orders")
    .select("*, customer:users(id, name, email, phone, support_blocked)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const o = order as Order & { customer?: User };
  const customer = o.customer;

  return (
    <div>
      <Link
        href="/admin/support"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-page-fg/55 transition-colors hover:text-page-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        All conversations
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-[-0.03em] text-page-fg">
            {o.customer_name}
          </h1>
          <p className="mt-1.5 font-mono text-[13px] text-page-fg/50">
            {o.customer_phone} · order{" "}
            <Link href={`/admin/orders/${o.id}`} className="text-page-fg underline">
              {o.order_number}
            </Link>{" "}
            · {formatCurrency(Number(o.total), settings.currency_code)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusBadge status={o.status} />
            <PaymentStatusBadge status={o.payment_status} />
          </div>
        </div>
        {customer?.id && (
          <SupportBlockToggle userId={customer.id} blocked={Boolean(customer.support_blocked)} />
        )}
      </div>

      <SupportThread orderId={o.id} orderNumber={o.order_number} viewerRole="admin" />
    </div>
  );
}
