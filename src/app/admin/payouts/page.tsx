import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Banknote, Percent, TrendingUp, AlertTriangle } from "lucide-react";
import type { Order } from "@/types";

export const metadata = { title: "MoMo payouts" };

// MTN Collections commercials, per the integration playbook §1:
// 2.36% VAT-inclusive is deducted from every collected payment.
const MOMO_FEE_RATE = 0.0236;

export default async function AdminPayoutsPage() {
  const [, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status, momo_transaction_id, created_at")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Pick<
    Order,
    "id" | "order_number" | "total" | "payment_status" | "momo_transaction_id" | "created_at"
  >[];

  const collected = all.filter((o) => o.payment_status === "successful");
  const failed = all.filter((o) => o.payment_status === "failed" || o.payment_status === "timed_out");

  const gross = collected.reduce((s, o) => s + Number(o.total), 0);
  const fees = gross * MOMO_FEE_RATE;
  const net = gross - fees;

  const cur = settings.currency_code;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-cream">MoMo payouts</h1>
        <p className="mt-1.5 text-sm text-cream/50">
          Collected via MTN Mobile Money, net of the {(MOMO_FEE_RATE * 100).toFixed(2)}% VAT-inclusive
          collections fee.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatsCard title="Gross collected" value={formatCurrency(gross, cur)} icon={Banknote} color="green" trend={`${collected.length} paid orders`} />
        <StatsCard title="MTN fee" value={formatCurrency(fees, cur)} icon={Percent} color="amber" trend={`${(MOMO_FEE_RATE * 100).toFixed(2)}% incl. VAT`} />
        <StatsCard title="Net to you" value={formatCurrency(net, cur)} icon={TrendingUp} trend="estimate before settlement" />
        <StatsCard title="Failed / timed out" value={String(failed.length)} icon={AlertTriangle} color="purple" />
      </div>

      <div className="rounded-[20px] border border-cream/[0.09] bg-ink">
        <div className="border-b border-cream/[0.09] px-4 py-4 lg:px-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-cream">Collected payments</h2>
        </div>

        {collected.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Order</TableHead>
                  <TableHead>MoMo txn</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Date</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {collected.map((o) => {
                  const g = Number(o.total);
                  const f = g * MOMO_FEE_RATE;
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <a href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-medium text-lilac hover:text-cream">
                          {o.order_number}
                        </a>
                      </TableCell>
                      <TableCell className="font-mono text-[13px] text-cream/60">
                        {o.momo_transaction_id ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(g, cur)}</TableCell>
                      <TableCell className="font-mono text-cream/50">−{formatCurrency(f, cur)}</TableCell>
                      <TableCell className="font-mono font-medium text-cream">{formatCurrency(g - f, cur)}</TableCell>
                      <TableCell className="font-mono text-xs text-cream/45">
                        {new Date(o.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-cream/45">No collected payments yet.</div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-cream/40">
        Net figures are an estimate computed from MTN&apos;s published {(MOMO_FEE_RATE * 100).toFixed(2)}%
        collections rate. Reconcile against your MTN settlement statement before drawing down — this page
        does not read MTN&apos;s ledger.
      </p>
    </div>
  );
}
