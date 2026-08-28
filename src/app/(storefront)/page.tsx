import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency, usableDescription } from "@/lib/utils";
import { AddToBagButton } from "@/components/storefront/add-to-bag-button";
import type { Product, Category, Testimonial, StoreMetric, Discount } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const [settings, cats, prods, quotes, figures, promo] = await Promise.all([
    getSiteSettings(),
    supabase.from("categories").select("*").is("parent_id", null).order("name").limit(5),
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("testimonials").select("*").eq("is_published", true).order("sort_order"),
    supabase.from("store_metrics").select("*").eq("is_published", true).order("sort_order"),
    // The design's "−20% evening window" tile. Driven by a real live discount
    // rather than a hardcoded promise.
    supabase
      .from("discounts")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .gte("expires_at", nowIso)
      .order("value", { ascending: false })
      .limit(1),
  ]);

  const categories = (cats.data ?? []) as Category[];
  const products = (prods.data ?? []) as Product[];
  const testimonial = ((quotes.data ?? []) as Testimonial[])[0] ?? null;
  const metrics = (figures.data ?? []) as StoreMetric[];
  const deal = ((promo.data ?? []) as Discount[])[0] ?? null;

  const cur = settings.currency_code;
  const freeOver = settings.free_delivery_threshold;
  const shots = products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 2) as string[];

  // Ticker: policy statements and real payment methods only.
  const ticker = [
    freeOver ? `Free delivery over ${formatCurrency(Number(freeOver), cur)}` : "Delivery across Rwanda",
    "MoMo · Cash on delivery",
    "Dispatched from Kigali",
    "7-day returns",
  ];

  const promises = [
    { tag: "Anywhere", title: "Across Rwanda", body: "Rider in Kigali, courier upcountry." },
    { tag: "Payment", title: "MoMo or cash", body: "Pay on delivery if you'd rather see it first." },
    { tag: "Returns", title: "7 days, no story", body: "Changed your mind? Send it back." },
    { tag: "Sourcing", title: "Checked by hand", body: "Nothing listed we wouldn't buy ourselves." },
  ];

  const steps = [
    {
      n: "01",
      title: "Fill one basket across shelves",
      body: "A phone, a dress and two kilos of coffee travel together. One order, one delivery fee.",
      meta: freeOver ? `Free over ${formatCurrency(Number(freeOver), cur)}` : "One delivery fee",
    },
    {
      n: "02",
      title: "Pay the way you already pay",
      body: "MTN Mobile Money at checkout, or cash to the rider at your gate. No card needed.",
      meta: "MoMo · Cash on delivery",
    },
    {
      n: "03",
      title: "Follow it from your account",
      body: "Your order moves through packing and dispatch, and every order carries its own message thread if you need us.",
      meta: "Message us on the order",
    },
  ];

  const dealLabel = deal
    ? deal.type === "percentage"
      ? `−${Number(deal.value)}%`
      : `−${formatCurrency(Number(deal.value), cur)}`
    : null;

  return (
    <div className="bg-page text-page-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section id="top" className="relative border-b border-hairline px-4 pb-7 pt-9 md:px-11 md:pb-14 md:pt-[92px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--page-fg) 7%, transparent) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(110% 80% at 24% 12%, #000 34%, transparent 76%)",
            WebkitMaskImage: "radial-gradient(110% 80% at 24% 12%, #000 34%, transparent 76%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[14%] right-[-8%] h-[44vw] w-[44vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 45% 45%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 64%)",
          }}
        />

        <div className="relative grid items-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] md:gap-14">
          <div className="dc-rise" style={{ animation: "rise .75s cubic-bezier(.2,.8,.2,1) both" }}>
            {/* Badge appears only with something real behind it. */}
            {(settings.founded_year || metrics[0]) && (
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-page-fg/20 px-3.5 py-[7px] font-mono text-[10px] uppercase tracking-[0.16em] text-page-fg/70">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {[
                  settings.founded_year ? `Est. ${settings.founded_year}` : null,
                  metrics[0] ? `${metrics[0].value} ${metrics[0].label.toLowerCase()}` : null,
                ]
                  .filter(Boolean)
                  .join(" — ")}
              </div>
            )}

            <h1 className="m-0 font-display text-[clamp(44px,8.2vw,132px)] font-extrabold leading-[0.86] tracking-[-0.05em]">
              <span className="block">Everything</span>
              <span
                className="block text-transparent"
                style={{ WebkitTextStroke: "1.6px color-mix(in oklab, var(--page-fg) 70%, transparent)" }}
              >
                good, in
              </span>
              <span className="block">
                one{" "}
                <span className="font-serif font-light italic tracking-[-0.01em] text-accent">shop.</span>
              </span>
            </h1>

            <p className="my-6 max-w-[40ch] text-[clamp(16px,1.4vw,20px)] leading-[1.6] text-page-fg/[0.68]">
              {usableDescription(settings.store_description) ??
                "Clothing, electronics, gadgets and the food you actually miss — one basket, one delivery, anywhere in Rwanda."}
            </p>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="#index"
                className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-[15px] font-mono text-[11px] uppercase tracking-[0.14em] text-accent-fg transition-colors hover:bg-page-fg hover:text-page"
              >
                Shop the index →
              </Link>
              <Link
                href="#how"
                className="inline-flex items-center rounded-full border border-page-fg/[0.26] px-6 py-[15px] font-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-page-fg"
              >
                How delivery works
              </Link>
            </div>
          </div>

          {/* Collage: two real product shots, a live-deal tile, spinning badge */}
          <div
            className="dc-rise relative grid min-h-[clamp(320px,40vw,520px)] grid-cols-2 gap-3"
            style={{ animation: "rise .95s cubic-bezier(.2,.8,.2,1) both .1s" }}
          >
            <Well src={shots[0]} className="row-span-2" />
            <Well src={shots[1]} />
            <div
              className="flex flex-col justify-between gap-3.5 rounded-2xl border border-page-fg/[0.14] p-[18px]"
              style={{
                background:
                  "linear-gradient(150deg, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%)",
              }}
            >
              {deal && dealLabel ? (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-page-fg/70">
                    {deal.code ? `Code ${deal.code}` : "Live offer"}
                  </div>
                  <div>
                    <div className="font-display text-[clamp(24px,2.8vw,40px)] font-extrabold leading-none tracking-[-0.03em]">
                      {dealLabel}
                    </div>
                    <div className="mt-1.5 text-[15px] text-page-fg/70">
                      {deal.min_cart_value
                        ? `on orders over ${formatCurrency(Number(deal.min_cart_value), cur)}`
                        : "on your order at checkout"}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-page-fg/70">
                    Delivery
                  </div>
                  <div>
                    <div className="font-display text-[clamp(20px,2.2vw,32px)] font-extrabold leading-none tracking-[-0.03em]">
                      {freeOver ? formatCurrency(Number(freeOver), cur) : "Nationwide"}
                    </div>
                    <div className="mt-1.5 text-[15px] text-page-fg/70">
                      {freeOver ? "spend this much, delivery is on us" : "we deliver across Rwanda"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="absolute left-1/2 top-1/2 z-[3] grid h-[clamp(86px,9vw,112px)] w-[clamp(86px,9vw,112px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-page-fg/[0.18] bg-page text-center">
              <div
                aria-hidden
                className="dc-spin absolute inset-[6px] rounded-full border border-dashed border-page-fg/[0.22]"
                style={{ animation: "spin 26s linear infinite" }}
              />
              <div className="font-mono text-[8.5px] uppercase leading-[1.7] tracking-[0.14em]">
                Dispatched
                <br />
                from
                <br />
                <span className="text-accent">Kigali</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ticker ───────────────────────────────────────────── */}
      <div className="overflow-hidden whitespace-nowrap border-b border-hairline bg-page-fg/[0.03] py-3">
        <div
          className="dc-marquee inline-flex gap-[38px] pr-[38px] font-mono text-[11px] uppercase tracking-[0.14em] text-page-fg/60"
          style={{ animation: "marquee 36s linear infinite" }}
        >
          {[0, 1].map((dup) =>
            ticker.map((t) => (
              <span key={`${dup}-${t}`} className="inline-flex items-center gap-[38px]">
                {t}
                <span className="text-accent">✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ─── Promises ─────────────────────────────────────────── */}
      <section
        data-reveal="1"
        className="grid border-b border-hairline [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]"
      >
        {promises.map((p) => (
          <div key={p.tag} className="border-l border-hairline px-4 py-6 md:px-8">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              {p.tag}
            </div>
            <div className="mb-1.5 font-display text-[clamp(15px,1.3vw,18px)] font-semibold tracking-[-0.02em]">
              {p.title}
            </div>
            <div className="text-[15px] leading-[1.5] text-page-fg/60">{p.body}</div>
          </div>
        ))}
      </section>

      {/* ─── The index ────────────────────────────────────────── */}
      <section id="index" data-reveal="1" className="px-4 py-10 md:px-11 md:py-[88px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-page-fg/[0.55]">
              02 — The index
            </div>
            <h2 className="m-0 font-display text-[clamp(30px,4.4vw,66px)] font-extrabold leading-[0.94] tracking-[-0.04em]">
              Pick a shelf.{" "}
              <span className="font-serif font-light italic text-page-fg/[0.55]">
                The shop follows.
              </span>
            </h2>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap gap-2">
          <Link
            href="/products"
            className="rounded-full border border-accent bg-accent px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-fg"
          >
            Everything
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="rounded-full border border-page-fg/[0.24] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(224px,1fr))]">
          {products.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-3 transition-colors hover:border-page-fg/30"
            >
              <Link
                href={`/products/${item.id}`}
                className="relative block aspect-square overflow-hidden rounded-[10px] bg-well"
              >
                {item.images?.[0] && (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 100vw, 25vw"
                  />
                )}
                {item.category && (
                  <span className="pointer-events-none absolute left-2 top-2 rounded border border-page-fg/[0.18] bg-page/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-page-fg">
                    {item.category.name}
                  </span>
                )}
              </Link>
              <div className="flex items-baseline justify-between gap-2.5">
                <h3 className="m-0 font-display text-[16px] font-semibold tracking-[-0.02em]">
                  <Link href={`/products/${item.id}`}>{item.name}</Link>
                </h3>
                <span className="whitespace-nowrap font-mono text-[12px] text-accent">
                  {formatCurrency(Number(item.price), cur)}
                </span>
              </div>
              {item.description && (
                <p className="m-0 line-clamp-2 text-[15px] leading-[1.5] text-page-fg/60">
                  {item.description}
                </p>
              )}
              <div className="mt-auto flex gap-2">
                <AddToBagButton product={item} />
                <Link
                  href={`/products/${item.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-page-fg/[0.24] px-3.5 font-mono text-[10px] text-page-fg/70 transition-colors hover:border-page-fg hover:text-page-fg"
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section
        id="how"
        data-reveal="1"
        className="border-t border-hairline px-4 py-10 md:px-11 md:py-[88px]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--accent) 6%, transparent), transparent 55%)",
        }}
      >
        <h2 className="m-0 mb-7 font-display text-[clamp(28px,4vw,58px)] font-extrabold leading-[0.96] tracking-[-0.04em]">
          Order today.{" "}
          <span className="font-serif font-light italic text-accent">Unbox soon.</span>
        </h2>
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {steps.map((st) => (
            <div key={st.n} className="rounded-2xl border border-card-border bg-card p-[22px]">
              <div
                className="font-display text-[38px] font-extrabold leading-none tracking-[-0.04em] text-transparent"
                style={{ WebkitTextStroke: "1.2px var(--accent)" }}
              >
                {st.n}
              </div>
              <h3 className="mb-2 mt-3.5 font-display text-[19px] font-semibold tracking-[-0.02em]">
                {st.title}
              </h3>
              <p className="m-0 mb-3.5 text-[15px] leading-[1.6] text-page-fg/[0.62]">{st.body}</p>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-page-fg/[0.5]">
                {st.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Story — only with real content behind it ──────────── */}
      {(testimonial || metrics.length > 0) && (
        <section
          id="story"
          data-reveal="1"
          className="grid items-center gap-6 border-t border-hairline px-4 py-10 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] md:gap-14 md:px-11 md:py-[88px]"
        >
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-page-fg/[0.55]">
              04 — Why people stay
            </div>
            {testimonial ? (
              <>
                <blockquote className="m-0 text-[clamp(24px,3.2vw,48px)] font-light leading-[1.14] tracking-[-0.02em]">
                  &ldquo;{testimonial.body}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-page-fg/[0.6]">
                  <span className="h-px w-[30px] bg-accent" />
                  {[testimonial.author_name, testimonial.author_location, testimonial.context]
                    .filter(Boolean)
                    .join(" — ")}
                </div>
              </>
            ) : (
              <blockquote className="m-0 text-[clamp(24px,3.2vw,48px)] font-light leading-[1.14] tracking-[-0.02em]">
                A charger and a kilo of coffee in the same basket, one delivery.{" "}
                <span className="italic text-accent">That&apos;s the whole idea.</span>
              </blockquote>
            )}

            {metrics.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 md:mt-12 md:gap-x-11">
                {metrics.map((k) => (
                  <div key={k.id}>
                    <div className="font-display text-[clamp(26px,3vw,46px)] font-extrabold leading-none tracking-[-0.04em]">
                      {k.value}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-page-fg/[0.55]">
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-page-fg/[0.14] bg-well">
            {shots[0] && (
              <Image src={shots[0]} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 40vw" />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Well({ src, className = "" }: { src?: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-page-fg/[0.14] bg-well ${className}`}
    >
      {src && <Image src={src} alt="" fill className="object-cover" sizes="30vw" />}
    </div>
  );
}
