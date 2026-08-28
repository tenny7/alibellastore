import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency, usableDescription } from "@/lib/utils";
import { AddToBagButton } from "@/components/storefront/add-to-bag-button";
import type { Product, Category, Testimonial, StoreMetric } from "@/types";

export const revalidate = 60;

// Districts we name in the roll. Statements of reach, not metrics.
const CITIES = ["Kigali", "Musanze", "Huye", "Rubavu", "Nyagatare"];

export default async function HomePage() {
  const supabase = createAdminClient();

  const [settings, cats, prods, quotes, figures] = await Promise.all([
    getSiteSettings(),
    supabase.from("categories").select("*").is("parent_id", null).order("name").limit(5),
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
    // Both tables are optional: the sections hide until rows are published.
    supabase.from("testimonials").select("*").eq("is_published", true).order("sort_order"),
    supabase.from("store_metrics").select("*").eq("is_published", true).order("sort_order"),
  ]);

  const categories = (cats.data ?? []) as Category[];
  const products = (prods.data ?? []) as Product[];
  const testimonial = ((quotes.data ?? []) as Testimonial[])[0] ?? null;
  const metrics = (figures.data ?? []) as StoreMetric[];

  const cur = settings.currency_code;
  const freeOver = settings.free_delivery_threshold;
  const heroShots = products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 3) as string[];

  const promises = [
    { tag: "Anywhere", title: "Across Rwanda", body: "Rider in Kigali, courier upcountry." },
    { tag: "Payment", title: "MoMo or cash", body: "Pay on delivery if you'd rather see it first." },
    { tag: "Returns", title: "7 days", body: "Changed your mind? Send it back." },
    { tag: "Sourcing", title: "Checked by hand", body: "Nothing listed we wouldn't buy ourselves." },
  ];

  const steps = [
    {
      n: "01",
      title: "Fill the basket across shelves",
      body: "One order can hold a phone, a dress and a bag of coffee. We pack it together and you pay one delivery fee.",
      meta: freeOver
        ? `Delivery ${formatCurrency(Number(settings.delivery_fee), cur)} — free over ${formatCurrency(Number(freeOver), cur)}`
        : `Delivery ${formatCurrency(Number(settings.delivery_fee), cur)}`,
    },
    {
      n: "02",
      title: "Pay the way you already pay",
      body: "MTN Mobile Money at checkout, or cash to the rider at your gate. No card needed either way.",
      meta: "MoMo · Cash on delivery",
    },
    {
      n: "03",
      title: "We pack it and bring it",
      body: "Your order moves through packing and dispatch, and you can follow it from your account at any point.",
      meta: "Track it from your orders page",
    },
  ];

  return (
    <div className="overflow-x-hidden bg-page text-page-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section id="top" className="relative px-5 pt-10 md:px-14 md:pt-[92px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(color-mix(in oklab, var(--page-fg) 16%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, #000, transparent 78%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 78%)",
          }}
        />

        <div className="relative grid items-end gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-14">
          <div className="dc-rise" style={{ animation: "rise .7s cubic-bezier(.2,.8,.2,1) both" }}>
            {/* Badge only appears with something real to say. */}
            {(settings.founded_year || metrics[0]) && (
              <div className="mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-page-fg/55">
                <span
                  className="dc-blink h-[7px] w-[7px] rounded-full bg-accent"
                  style={{ animation: "blink 2.4s ease-in-out infinite" }}
                />
                <span>
                  {[
                    settings.founded_year ? `Est. ${settings.founded_year}` : null,
                    metrics[0] ? `${metrics[0].value} ${metrics[0].label.toLowerCase()}` : null,
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                </span>
              </div>
            )}

            <h1 className="m-0 font-display text-[clamp(52px,9.6vw,168px)] font-extrabold leading-[0.82] tracking-[-0.05em] text-balance">
              <span className="block">Everything</span>
              <span
                className="block text-transparent"
                style={{ WebkitTextStroke: "2px var(--page-fg)" }}
              >
                good, in
              </span>
              <span className="block">
                one{" "}
                <span className="font-serif font-light italic tracking-[-0.01em] text-accent">
                  shop.
                </span>
              </span>
            </h1>

            <div className="mt-6 flex flex-wrap items-end gap-5 pb-7 md:mt-10 md:gap-13 md:pb-14">
              <p className="m-0 max-w-[34ch] text-[clamp(17px,1.5vw,21px)] leading-[1.5] text-page-fg/72">
                {usableDescription(settings.store_description) ??
                  "Clothing, electronics, gadgets and the food you actually miss — sourced in Kigali, carried to your door anywhere in Rwanda."}
              </p>
              <div className="flex gap-2.5">
                <Link
                  href="#index"
                  className="inline-flex items-center gap-3 rounded-full bg-accent-text px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-cream transition-colors hover:bg-ink"
                >
                  Shop the index <span>→</span>
                </Link>
                <Link
                  href="#how"
                  className="inline-flex items-center rounded-full border border-page-fg/30 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-page-fg hover:bg-page-fg/[0.06]"
                >
                  How delivery works
                </Link>
              </div>
            </div>
          </div>

          {/* Collage */}
          <div
            className="dc-rise relative h-[clamp(340px,42vw,560px)]"
            style={{ animation: "rise .9s cubic-bezier(.2,.8,.2,1) both .12s" }}
          >
            <Plate
              src={heroShots[0]}
              className="bottom-[6%] left-0 h-[62%] w-[58%] -rotate-[5deg]"
              shadow="18px 22px 0 color-mix(in oklab, var(--page-fg) 10%, transparent)"
            />
            <Plate
              src={heroShots[1]}
              className="right-[4%] top-0 h-[58%] w-[54%] rotate-[3.5deg]"
              shadow="-14px 20px 0 var(--dc-accent)"
            />
            <Plate src={heroShots[2]} className="bottom-[4%] right-0 aspect-square w-[30%]" dark />
            <div className="absolute left-[46%] top-[2%] z-[3] grid h-[clamp(96px,11vw,132px)] w-[clamp(96px,11vw,132px)] place-items-center rounded-full bg-ink text-center text-cream shadow-[0_10px_30px_rgba(20,17,14,.25)]">
              <div
                aria-hidden
                className="dc-spin absolute inset-[6px] rounded-full border border-dashed border-cream/35"
                style={{ animation: "spin 22s linear infinite" }}
              />
              <div className="font-mono text-[9px] uppercase leading-[1.6] tracking-[0.16em]">
                Dispatched
                <br />
                from
                <br />
                <span className="text-accent-text">Kigali</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Promises ─────────────────────────────────────────── */}
      <section className="border-y border-page-fg/[0.16] bg-sand">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <div key={p.tag} className="border-l border-page-fg/[0.14] px-4 py-6 md:px-8">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-text-text">
                {p.tag}
              </div>
              <div className="mb-1 font-display text-[clamp(15px,1.3vw,18px)] font-semibold tracking-[-0.02em]">
                {p.title}
              </div>
              <div className="text-[14px] leading-[1.45] text-page-fg/62">{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── The Index ────────────────────────────────────────── */}
      <section id="index" className="px-5 py-12 md:px-14 md:py-24">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-page-fg/50">
              02 — The Index
            </div>
            <h2 className="m-0 font-display text-[clamp(34px,4.6vw,74px)] font-extrabold leading-[0.92] tracking-[-0.04em]">
              Pick a shelf.
              <br />
              <span className="font-serif font-light italic text-page-fg/48">
                The shop follows.
              </span>
            </h2>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap gap-2">
          <Link
            href="/products"
            className="rounded-full border border-page-fg bg-page-fg px-[18px] py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-page"
          >
            Everything
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="rounded-full border border-page-fg px-[18px] py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-page-fg hover:text-page"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Hairline grid, as drawn */}
        <div className="grid gap-px border border-page-fg/[0.16] bg-page-fg/[0.16] [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
          {products.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 bg-paper p-3.5 pb-[18px] transition-colors hover:bg-paper-raised"
            >
              <Link href={`/products/${item.id}`} className="relative block aspect-[4/5] bg-mist">
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
                  <div className="pointer-events-none absolute left-2 top-2 bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-cream">
                    {item.category.name}
                  </div>
                )}
              </Link>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 font-display text-[17px] font-semibold leading-[1.2] tracking-[-0.02em]">
                  <Link href={`/products/${item.id}`}>{item.name}</Link>
                </h3>
                <div className="whitespace-nowrap font-mono text-[12px]">
                  {formatCurrency(Number(item.price), cur)}
                </div>
              </div>
              {item.description && (
                <p className="m-0 line-clamp-2 text-[14px] leading-[1.45] text-page-fg/60">
                  {item.description}
                </p>
              )}
              <AddToBagButton product={item} />
            </article>
          ))}
        </div>
      </section>

      {/* ─── City roll ────────────────────────────────────────── */}
      <div className="overflow-hidden whitespace-nowrap border-t border-page-fg/[0.16] bg-ink py-[18px] text-cream">
        <div
          className="dc-marquee inline-flex gap-10 pr-10 font-display text-[clamp(30px,5vw,76px)] font-extrabold tracking-[-0.04em]"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          {[0, 1].map((dup) =>
            CITIES.map((city, i) => (
              <span
                key={`${dup}-${city}`}
                className={i === 2 ? "text-accent" : i % 2 === 1 ? "text-transparent" : undefined}
                style={
                  i % 2 === 1 && i !== 2
                    ? { WebkitTextStroke: "1.5px rgba(244,241,232,.55)" }
                    : undefined
                }
              >
                {city}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section
        id="how"
        className="grid items-start gap-7 px-5 py-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[72px] md:px-14 md:py-24"
      >
        <div className="md:sticky md:top-24">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-page-fg/50">
            03 — How it works
          </div>
          <h2 className="m-0 mb-4 font-display text-[clamp(32px,4vw,62px)] font-extrabold leading-[0.94] tracking-[-0.04em]">
            Order today.
            <br />
            Unbox soon.
          </h2>
          <p className="m-0 max-w-[38ch] text-[17px] leading-[1.55] text-page-fg/70">
            No app, no account gymnastics. Pick, pay the way you already pay, and a rider takes it
            from there.
          </p>
        </div>
        <div className="flex flex-col">
          {steps.map((st) => (
            <div
              key={st.n}
              className="grid grid-cols-[56px_1fr] gap-4 border-t border-page-fg/[0.18] py-7 md:grid-cols-[88px_1fr] md:gap-8"
            >
              <div
                className="font-display text-[52px] font-extrabold leading-none tracking-[-0.05em] text-transparent"
                style={{ WebkitTextStroke: "1.5px var(--page-fg)" }}
              >
                {st.n}
              </div>
              <div>
                <h3 className="m-0 mb-2 font-display text-[clamp(20px,2vw,27px)] font-semibold tracking-[-0.03em]">
                  {st.title}
                </h3>
                <p className="m-0 mb-2.5 max-w-[52ch] text-[16px] leading-[1.55] text-page-fg/68">
                  {st.body}
                </p>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-text-text">
                  {st.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Story — only with real content behind it ──────────── */}
      {(testimonial || metrics.length > 0) && (
        <section
          id="story"
          className="bg-ink px-5 py-14 text-cream md:px-14 md:py-[110px]"
        >
          <div className="grid items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] md:gap-[72px]">
            <div>
              <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/50">
                04 — Why people stay
              </div>

              {testimonial ? (
                <>
                  <blockquote className="m-0 font-serif text-[clamp(26px,3.4vw,52px)] font-light leading-[1.12] tracking-[-0.02em]">
                    &ldquo;{testimonial.body}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/68">
                    <span className="h-px w-[34px] bg-accent" />
                    <span>
                      {[testimonial.author_name, testimonial.author_location, testimonial.context]
                        .filter(Boolean)
                        .join(" — ")}
                    </span>
                  </div>
                </>
              ) : (
                <blockquote className="m-0 font-serif text-[clamp(26px,3.4vw,52px)] font-light leading-[1.12] tracking-[-0.02em]">
                  One basket for the phone charger, the dress and the coffee.{" "}
                  <span className="italic text-accent-text">That&apos;s the whole idea.</span>
                </blockquote>
              )}

              {metrics.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-start gap-x-10 gap-y-6 md:mt-14 md:gap-x-14">
                  {metrics.map((k) => (
                    <div key={k.id}>
                      <div className="font-display text-[clamp(30px,3.6vw,54px)] font-extrabold leading-none tracking-[-0.04em]">
                        {k.value}
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/55">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative aspect-[4/5] border border-cream/20 p-2.5">
              <div className="relative h-full w-full bg-ink-raised">
                {heroShots[0] && (
                  <Image
                    src={heroShots[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 35vw"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Plate({
  src,
  className,
  shadow,
  dark = false,
}: {
  src?: string;
  className: string;
  shadow?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`absolute border border-page-fg/[0.18] p-2.5 ${
        dark ? "bg-ink" : "bg-paper-raised"
      } ${className}`}
      style={shadow ? { boxShadow: shadow } : undefined}
    >
      <div className="relative h-full w-full bg-mist">
        {src && <Image src={src} alt="" fill className="object-cover" sizes="30vw" />}
      </div>
    </div>
  );
}
