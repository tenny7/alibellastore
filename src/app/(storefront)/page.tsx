import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { ProductCard } from "@/components/storefront/product-card";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import type { Product, Category } from "@/types";

// Reads live catalogue data, so it must not be frozen at build time.
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createAdminClient();

  const [settings, { data: categories }, { data: newArrivals }] = await Promise.all([
    getSiteSettings(),
    supabase.from("categories").select("*").is("parent_id", null).order("name").limit(5),
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const cats = (categories ?? []) as Category[];
  const products = (newArrivals ?? []) as Product[];

  // One cover image per category. Counts are deliberately not surfaced —
  // catalogue size is our business, not the shopper's.
  const { data: covers } = await supabase
    .from("products")
    .select("category_id, images")
    .eq("status", "active");

  const coverFor: Record<string, string | null> = {};
  for (const cat of cats) coverFor[cat.id] = null;
  for (const row of covers ?? []) {
    if (row.category_id in coverFor && !coverFor[row.category_id] && row.images?.[0]) {
      coverFor[row.category_id] = row.images[0];
    }
  }

  const heroImages = products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 2) as string[];
  const freeOver = settings.free_delivery_threshold;

  const assurances = [
    {
      icon: Truck,
      title: "Delivered across Rwanda",
      body: freeOver
        ? `Free on orders over ${formatCurrency(Number(freeOver), settings.currency_code)}`
        : "Same-day delivery in Kigali",
    },
    { icon: RotateCcw, title: "7-day returns", body: "Change your mind, send it back" },
    { icon: ShieldCheck, title: "Secure checkout", body: "Mobile money or cash on delivery" },
  ];

  return (
    <div className="bg-page text-page-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-48 h-[680px] w-[680px] rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(circle at 40% 40%, rgba(244,241,233,.09), transparent 65%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-6 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:px-10 md:py-32">
          <div>
            <p className="mb-7 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-cream/45">
              {settings.store_name} · Kigali
            </p>
            <h1 className="mb-7 font-display text-[clamp(46px,7vw,92px)] font-bold leading-[0.93] tracking-[-0.045em] text-balance">
              {settings.hero_title || (
                <>
                  Considered pieces,
                  <br />
                  <span className="font-normal italic text-cream/55">chosen well.</span>
                </>
              )}
            </h1>
            <p className="mb-10 max-w-[440px] text-[17px] leading-[1.65] text-cream/60">
              {settings.hero_subtitle ||
                "Clothing, electronics and home goods worth keeping — brought to your door anywhere in Rwanda."}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="group inline-flex h-[56px] items-center gap-3 rounded-full bg-cream px-8 text-[15px] font-bold text-ink transition-opacity hover:opacity-90"
              >
                Shop the collection
                <ArrowRight
                  className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.4}
                />
              </Link>
              <Link
                href="#collections"
                className="inline-flex h-[56px] items-center rounded-full border border-cream/25 px-8 text-[15px] font-medium text-cream transition-colors hover:bg-cream/[0.07]"
              >
                Browse collections
              </Link>
            </div>
          </div>

          {/* Editorial pair, not a busy grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] translate-y-6 overflow-hidden rounded-[28px] bg-ink-raised">
              {heroImages[0] && (
                <Image
                  src={heroImages[0]}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 30vw"
                />
              )}
            </div>
            <div className="relative aspect-[3/4] -translate-y-6 overflow-hidden rounded-[28px] bg-ink-raised">
              {heroImages[1] && (
                <Image
                  src={heroImages[1]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 30vw"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Assurances ───────────────────────────────────────── */}
      <section className="border-b border-page-fg/10 bg-page">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-6 py-12 md:grid-cols-3 md:px-10">
          {assurances.map((a) => (
            <div key={a.title} className="flex items-start gap-4">
              <a.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-page-fg/45" strokeWidth={1.8} />
              <div>
                <div className="text-[14.5px] font-bold text-page-fg">{a.title}</div>
                <div className="mt-1 text-[13.5px] text-page-fg/55">{a.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Collections ──────────────────────────────────────── */}
      {cats.length > 0 && (
        <section id="collections" className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-4 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
                Collections
              </p>
              <h2 className="font-display text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.035em]">
                Shop by category
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-sm font-medium text-page-fg/60 transition-colors hover:text-page-fg"
            >
              Browse all products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`group relative block overflow-hidden rounded-[28px] bg-field ${
                  i === 0 ? "sm:col-span-2 sm:aspect-[2/1]" : "aspect-[4/5]"
                }`}
              >
                {coverFor[cat.id] && (
                  <Image
                    src={coverFor[cat.id] as string}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes={i === 0 ? "(max-width:768px) 100vw, 66vw" : "(max-width:768px) 100vw, 33vw"}
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 p-7"
                  style={{
                    background: "linear-gradient(to top,rgba(16,14,27,.82),rgba(16,14,27,0))",
                  }}
                >
                  <div className="font-display text-[24px] font-bold tracking-[-0.025em] text-cream">
                    {cat.name}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-cream/70">
                    Shop now
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── New arrivals ─────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="border-t border-page-fg/10">
          <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-4 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
                  Just in
                </p>
                <h2 className="font-display text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.035em]">
                  New arrivals
                </h2>
              </div>
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-sm font-medium text-page-fg/60 transition-colors hover:text-page-fg"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencyCode={settings.currency_code}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Closing band ─────────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[36px] bg-ink px-8 py-20 text-center text-cream md:px-16 md:py-24">
          <p className="mb-6 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-cream/45">
            {settings.store_name}
          </p>
          <h2 className="mx-auto mb-6 max-w-[620px] font-display text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.08] tracking-[-0.035em]">
            Curated in Kigali.
            <br />
            Delivered across Rwanda.
          </h2>
          <p className="mx-auto mb-10 max-w-[440px] text-[16.5px] leading-[1.65] text-cream/60">
            {settings.store_description && settings.store_description !== "Ecommerce"
              ? settings.store_description
              : "A short, considered catalogue — restocked as we find pieces worth carrying."}
          </p>
          <Link
            href="/products"
            className="group inline-flex h-[56px] items-center gap-3 rounded-full bg-cream px-8 text-[15px] font-bold text-ink transition-opacity hover:opacity-90"
          >
            Start shopping
            <ArrowRight
              className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
