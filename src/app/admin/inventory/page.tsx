import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { PackageX, PackageCheck, FileEdit, Info } from "lucide-react";
import type { Product } from "@/types";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  const [, supabase, settings] = await Promise.all([
    requireAdmin(),
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .order("updated_at", { ascending: false });

  const products = (data ?? []) as Product[];
  const outOfStock = products.filter((p) => p.status === "out_of_stock");
  const active = products.filter((p) => p.status === "active");
  const drafts = products.filter((p) => p.status === "draft");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-page-fg">Inventory</h1>
        <p className="mt-1.5 text-sm text-page-fg/50">
          Availability by listing status across {products.length} products.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatsCard title="Out of stock" value={String(outOfStock.length)} icon={PackageX} color="danger" trend="not purchasable right now" />
        <StatsCard title="Live" value={String(active.length)} icon={PackageCheck} color="neutral" trend="visible in the storefront" />
        <StatsCard title="Drafts" value={String(drafts.length)} icon={FileEdit} trend="hidden from shoppers" />
      </div>

      {/* Honest limitation notice — the design assumes fields this schema lacks. */}
      <div className="mb-8 flex gap-3 rounded-[18px] border border-page-fg/[0.12] bg-page-fg/[0.04] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-page-fg" />
        <p className="text-[13px] leading-relaxed text-page-fg/60">
          Reorder thresholds, cover-days and stock valuation aren&apos;t shown because products carry no
          on-hand quantity or cost price — only a status. Adding{" "}
          <code className="rounded bg-page-fg/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-page-fg/80">
            stock_quantity
          </code>{" "}
          and{" "}
          <code className="rounded bg-page-fg/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-page-fg/80">
            cost_price
          </code>{" "}
          to <code className="font-mono text-[12px] text-page-fg/80">products</code> would let this page
          match the design in full.
        </p>
      </div>

      {outOfStock.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-page-fg/45">
            Needs attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {outOfStock.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-3 rounded-[18px] border border-page-fg/[0.09] bg-page p-3 transition-colors hover:border-page-fg/20"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-page-fg/[0.06]">
                  {p.images?.[0] && (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-page-fg">{p.name}</div>
                  <div className="mt-0.5 truncate text-[12px] text-page-fg/45">
                    {p.category?.name ?? "Uncategorised"} ·{" "}
                    {formatCurrency(Number(p.price), settings.currency_code)}
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-surface-fg/40/15 px-2 py-1 font-mono text-[11px] font-medium text-page-fg/70">
                  0
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-page-fg/45">
          All products
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}/edit`}
              className="flex items-center gap-3 rounded-[18px] border border-page-fg/[0.09] bg-page p-3 transition-colors hover:border-page-fg/20"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-page-fg/[0.06]">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-page-fg">{p.name}</div>
                <div className="mt-0.5 truncate text-[12px] text-page-fg/45">
                  {formatCurrency(Number(p.price), settings.currency_code)}
                </div>
              </div>
              <StatusChip status={p.status} />
            </Link>
          ))}
        </div>
        {products.length === 0 && (
          <p className="rounded-[18px] border border-page-fg/[0.09] bg-page px-6 py-12 text-center text-page-fg/45">
            No products yet.
          </p>
        )}
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: Product["status"] }) {
  const map = {
    active: "bg-surface-fg/15 text-page-fg",
    out_of_stock: "bg-surface-fg/40/15 text-page-fg/70",
    draft: "bg-page-fg/[0.08] text-page-fg/60",
  } as const;
  const label = { active: "Live", out_of_stock: "Out", draft: "Draft" } as const;
  return (
    <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}
