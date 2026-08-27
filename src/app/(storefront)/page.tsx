import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { ProductCard } from "@/components/storefront/product-card";
import { ArrowRight, Smartphone, Zap } from "lucide-react";
import type { Product, Category } from "@/types";

// Without this the page is prerendered once at build and never refreshes:
// new products, category counts and the stat row would all go stale.
// 60s keeps it near-static in latency while staying current.
export const revalidate = 60;

// Ticker copy — store policy statements, not metrics.
const TICKER = [
  "Free returns in 14 days",
  "MTN MoMo & Airtel Money",
  "Verified sellers only",
  "Same-day Kigali delivery",
  "Nationwide in 48h",
];

const MOMO_STEPS = [
  { n: "1", title: "Pick your items", body: "Add to cart, choose a delivery window." },
  { n: "2", title: "Approve on your phone", body: "A MoMo prompt lands in seconds." },
  { n: "3", title: "Accept the delivery", body: "Payment releases only after you say yes." },
];

export default async function HomePage() {
  const supabase = createAdminClient();

  const [
    settings,
    { data: categories },
    { data: bestSellers },
    { count: productCount },
    { count: deliveredCount },
  ] = await Promise.all([
    getSiteSettings(),
    supabase.from("categories").select("*").is("parent_id", null).order("name").limit(5),
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered"),
  ]);

  const cats = (categories ?? []) as Category[];
  const products = (bestSellers ?? []) as Product[];

  // Per-category cover image + item count. One query for every category
  // rather than two per category — this was 2N round trips.
  const { data: catRows } = await supabase
    .from("products")
    .select("category_id, images")
    .eq("status", "active");

  const catMeta: Record<string, { image: string | null; count: number }> = {};
  for (const cat of cats) catMeta[cat.id] = { image: null, count: 0 };
  for (const row of catRows ?? []) {
    const meta = catMeta[row.category_id];
    if (!meta) continue;
    meta.count += 1;
    if (!meta.image && row.images?.[0]) meta.image = row.images[0];
  }

  // Only real, non-zero figures are shown — no invented trust metrics.
  const stats = [
    deliveredCount ? { value: `${deliveredCount}`, label: "orders delivered" } : null,
    productCount ? { value: `${productCount}`, label: "products in stock" } : null,
    cats.length ? { value: `${cats.length}`, label: "collections" } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  const heroImages = products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 3) as string[];

  return (
    <div className="overflow-hidden bg-page text-page-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <div className="bg-ink text-cream">
        <section className="relative px-6 pt-16 md:px-10 md:pt-[88px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-40 h-[620px] w-[620px] rounded-full blur-[60px]"
            style={{
              background:
                "radial-gradient(circle at 35% 35%, rgba(244,241,233,.10), rgba(244,241,233,0) 62%)",
            }}
          />
          <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] md:gap-14">
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-cream/[0.12] bg-cream/[0.06] py-[7px] pl-2 pr-3.5 text-[12.5px] font-medium text-cream/80">
                <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-ink">
                  NEW
                </span>
                Kigali same-day delivery is live
              </div>

              <h1 className="mb-5 font-display text-[clamp(44px,6vw,86px)] font-bold leading-[0.94] tracking-[-0.04em] text-balance">
                {settings.hero_title || (
                  <>
                    Everything you want,
                    <br />
                    <span className="inline-block rounded-[0.14em] bg-cream px-[0.22em] pb-[0.06em] text-ink">
                      one tap
                    </span>{" "}
                    <span className="font-normal italic text-cream/60">away.</span>
                  </>
                )}
              </h1>

              <p className="mb-8 max-w-[470px] text-[17.5px] leading-[1.6] text-cream/[0.62]">
                {settings.hero_subtitle ||
                  "Clothing, electronics, gadgets and groceries — curated in Kigali, paid with MTN Mobile Money, at your door before dinner."}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-[54px] items-center gap-2.5 rounded-[14px] bg-cream px-6 text-[15px] font-bold text-ink transition-opacity hover:opacity-90"
                >
                  Shop the drop
                  <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
                </Link>
                <a
                  href="#momo"
                  className="inline-flex h-[54px] items-center rounded-[14px] border border-cream/20 px-6 text-[15px] font-medium text-cream transition-colors hover:bg-cream/[0.07]"
                >
                  How MoMo pay works
                </a>
              </div>

              {stats.length > 0 && (
                <div className="mt-11 flex flex-wrap gap-9 border-t border-cream/[0.1] pt-6">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <div className="font-display text-[26px] font-bold leading-none">{s.value}</div>
                      <div className="mt-1.5 text-[13px] leading-[1.4] text-cream/50">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bento image grid — real product imagery */}
            <div className="relative grid grid-cols-2 grid-rows-[200px_150px_130px] gap-3.5">
              <HeroTile className="col-start-1 row-span-2 row-start-1" src={heroImages[0]} alt="Featured product" priority />
              <HeroTile className="col-start-2 row-start-1" src={heroImages[1]} alt="Featured product" />
              <HeroTile className="col-start-2 row-span-2 row-start-2" src={heroImages[2]} alt="Featured product" />
              <div className="col-start-1 row-start-3 flex flex-col justify-between rounded-3xl bg-cream p-5">
                <Smartphone className="h-[22px] w-[22px] text-white" strokeWidth={2} />
                <div className="font-display text-[15px] font-bold leading-[1.3] text-white">
                  Checkout in
                  <br />3 taps with MoMo
                </div>
              </div>
            </div>
          </div>

          {/* Ticker */}
          <div className="mt-16 overflow-hidden border-t border-cream/[0.1] py-4">
            <div className="dc-ticker flex w-max" style={{ animation: "ticker 60s linear infinite" }}>
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  aria-hidden={dup === 1}
                  className="flex gap-11 whitespace-nowrap pr-11 font-display text-sm font-medium uppercase tracking-[0.14em] text-cream/[0.42]"
                >
                  {TICKER.map((t) => (
                    <span key={t} className="flex items-center gap-11">
                      {t}
                      <span className="text-cream/30">·</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ─── Collections ──────────────────────────────────────── */}
      {cats.length > 0 && (
        <section id="collections" className="bg-page px-6 pb-12 pt-16 md:px-10 md:pt-20">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="mb-3.5 font-display text-[12.5px] font-medium uppercase tracking-[0.18em] text-page-fg/45">
                  Collections
                </div>
                <h2 className="font-display text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.05] tracking-[-0.03em] text-page-fg">
                  Start somewhere
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-page-fg/60 transition-colors hover:text-page-fg"
              >
                Browse all {productCount ?? 0} products <span className="text-base">→</span>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              {/* Lead tile */}
              <CollectionTile cat={cats[0]} meta={catMeta[cats[0].id]} tall />

              <div className="grid grid-rows-2 gap-4">
                {cats[1] && <CollectionTile cat={cats[1]} meta={catMeta[cats[1].id]} />}
                <Link
                  href="/products"
                  className="flex flex-col justify-between rounded-[26px] bg-ink p-[22px] text-cream transition-colors hover:bg-ink-raised"
                >
                  <div className="font-display text-[11.5px] font-medium uppercase tracking-[0.16em] opacity-65">
                    Weekly deal
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em]">
                      Fresh drops
                      <br />
                      every week
                    </div>
                    <div className="mt-2.5 text-[13px] font-medium opacity-70">Browse now →</div>
                  </div>
                </Link>
              </div>

              <div className="grid grid-rows-2 gap-4">
                <Link
                  href="/products"
                  className="flex flex-col justify-between rounded-[26px] bg-ink p-[22px] text-cream transition-colors hover:bg-ink-raised"
                >
                  <Zap className="h-6 w-6" strokeWidth={2} />
                  <div>
                    <div className="font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em]">
                      All products
                    </div>
                    <div className="mt-2 text-[13px] opacity-60">
                      {productCount ?? 0} items · updated daily
                    </div>
                  </div>
                </Link>
                {cats[2] && <CollectionTile cat={cats[2]} meta={catMeta[cats[2].id]} />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Trending ─────────────────────────────────────────── */}
      {products.length > 0 && (
        <section id="shop" className="bg-page px-6 pb-20 pt-8 md:px-10 md:pb-[88px]">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-6">
              <h2 className="font-display text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">
                Trending now
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/products"
                  className="rounded-full border border-page-fg bg-page-fg px-[18px] py-2.5 text-[13.5px] font-medium leading-none text-cream"
                >
                  All
                </Link>
                {cats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="rounded-full border border-page-fg/[0.16] px-[18px] py-2.5 text-[13.5px] font-medium leading-none text-page-fg/[0.62] transition-colors hover:border-page-fg hover:text-page-fg"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* ─── MoMo ─────────────────────────────────────────────── */}
      <section id="momo" className="bg-page px-6 pb-20 md:px-10 md:pb-[88px]">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[34px] bg-ink px-8 py-14 md:px-13 md:py-15">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[70px] -top-[140px] h-[440px] w-[440px] rounded-full blur-[24px]"
            style={{
              background: "radial-gradient(circle, rgba(244,241,233,.09), transparent 66%)",
            }}
          />
          <div className="relative grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 font-display text-[12.5px] font-medium uppercase tracking-[0.18em] text-cream">
                Payments
              </div>
              <h2 className="mb-4.5 font-display text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.06] tracking-[-0.03em] text-cream">
                No card. No cash.
                <br />
                Just your phone.
              </h2>
              <p className="mb-7 max-w-[430px] text-[16.5px] leading-[1.6] text-cream/[0.66]">
                Confirm your order, approve the MoMo prompt, and we pack it. Money is held until you
                accept the delivery.
              </p>
              <Link
                href="/products"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-[14px] bg-cream px-6 text-[15px] font-bold text-ink transition-opacity hover:opacity-90"
              >
                Try a checkout →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {MOMO_STEPS.map((s) => (
                <div
                  key={s.n}
                  className="flex items-center gap-4 rounded-[18px] border border-cream/[0.13] bg-cream/[0.07] px-5 py-[18px]"
                >
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-cream font-display text-[15px] font-bold text-ink">
                    {s.n}
                  </div>
                  <div>
                    <div className="text-[15.5px] font-bold leading-[1.2] text-cream">{s.title}</div>
                    <div className="mt-1 text-[13.5px] leading-[1.4] text-cream/60">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroTile({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-ink-raised ${className}`}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          // The lead tile is the largest above-the-fold image, so it is the
          // LCP element — eager-load it instead of letting it lazy-load.
          priority={priority}
          className="object-cover"
          sizes="(max-width:768px) 50vw, 25vw"
        />
      )}
    </div>
  );
}

function CollectionTile({
  cat,
  meta,
  tall = false,
}: {
  cat: Category;
  meta?: { image: string | null; count: number };
  tall?: boolean;
}) {
  return (
    <Link
      href={`/products?category=${cat.slug}`}
      className={`group relative block overflow-hidden rounded-[26px] bg-field ${tall ? "h-[400px]" : ""}`}
    >
      {meta?.image && (
        <Image
          src={meta.image}
          alt={cat.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-6"
        style={{ background: "linear-gradient(to top,rgba(16,14,27,.9),rgba(16,14,27,0))" }}
      >
        <div
          className={`font-display font-bold tracking-[-0.02em] text-cream ${
            tall ? "text-[26px] leading-[1.1]" : "text-xl leading-[1.1]"
          }`}
        >
          {cat.name}
        </div>
        <div className="mt-1.5 text-[13px] text-cream/[0.66]">
          {meta?.count ?? 0} {meta?.count === 1 ? "item" : "items"}
        </div>
      </div>
    </Link>
  );
}
