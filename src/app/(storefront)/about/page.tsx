import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  Phone,
  Truck,
  RotateCcw,
  Wallet,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency, usableDescription } from "@/lib/utils";
import type { Category } from "@/types";

export const revalidate = 300;

export const metadata = {
  title: "About",
  description: "Who we are, what we carry, and what you can count on.",
};

export default async function AboutPage() {
  const supabase = createAdminClient();
  const [settings, { data: cats }, { data: shots }] = await Promise.all([
    getSiteSettings(),
    supabase.from("categories").select("*").is("parent_id", null).order("name"),
    supabase
      .from("products")
      .select("images")
      .eq("status", "active")
      .not("images", "is", null)
      .limit(4),
  ]);

  const categories = (cats ?? []) as Category[];
  const images = (shots ?? []).map((r) => r.images?.[0]).filter(Boolean) as string[];
  const description = usableDescription(settings.store_description);
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number}`;
  const freeOver = settings.free_delivery_threshold;
  const cur = settings.currency_code;

  const commitments = [
    {
      icon: Truck,
      title: "Delivered anywhere in Rwanda",
      body: freeOver
        ? `Kigali same-day where we can. Delivery is ${formatCurrency(
            Number(settings.delivery_fee),
            cur
          )}, free on orders over ${formatCurrency(Number(freeOver), cur)}.`
        : `Kigali same-day where we can, nationwide by courier. Delivery is ${formatCurrency(
            Number(settings.delivery_fee),
            cur
          )}.`,
    },
    {
      icon: RotateCcw,
      title: "Seven days to change your mind",
      body: "If something isn't right, send it back within seven days of delivery. Our full terms are in the return policy.",
    },
    {
      icon: Wallet,
      title: "Pay how it suits you",
      body: "Mobile money at checkout, or cash when your order arrives. No card required, either way.",
    },
    {
      icon: Headphones,
      title: "A real person, on your order",
      body: "Every order has its own message thread. Ask a question there and it reaches us directly — no ticket numbers.",
    },
  ];

  return (
    <div className="bg-page text-page-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-page text-page-fg">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-52 h-[640px] w-[640px] rounded-full blur-[90px]"
          style={{
            background: "radial-gradient(circle at 40% 40%, rgba(244,241,233,.08), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-32">
          <p className="mb-7 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
            About us
          </p>
          <h1 className="max-w-[820px] font-display text-[clamp(40px,6vw,80px)] font-bold leading-[0.95] tracking-[-0.045em] text-balance">
            A short catalogue,
            <br />
            <span className="font-normal italic text-page-fg/55">chosen carefully.</span>
          </h1>
          <p className="mt-8 max-w-[540px] text-[17.5px] leading-[1.65] text-page-fg/60">
            {description ??
              `${settings.store_name} is an online shop based in Kigali. We carry a deliberately small range — clothing, electronics, home goods and everyday essentials — and deliver it anywhere in Rwanda.`}
          </p>
        </div>
      </section>

      {/* ─── What we carry ────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-20">
            <div>
              <p className="mb-4 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
                What we carry
              </p>
              <h2 className="mb-6 font-display text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.06] tracking-[-0.035em]">
                Five departments, one checkout
              </h2>
              <p className="mb-9 max-w-[420px] text-[16px] leading-[1.7] text-page-fg/60">
                We would rather carry fewer things and know them well. Each department is restocked
                as we find pieces worth putting our name to.
              </p>
              <ul className="divide-y divide-page-fg/10 border-y border-page-fg/10">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="group flex items-center justify-between py-4 transition-colors"
                    >
                      <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-page-fg">
                        {cat.name}
                      </span>
                      <ArrowRight className="h-[18px] w-[18px] text-page-fg/35 transition-all group-hover:translate-x-1 group-hover:text-page-fg" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Real product imagery, offset */}
            <div className="grid grid-cols-2 gap-4 self-start">
              {images.slice(0, 4).map((src, i) => (
                <div
                  key={src}
                  className={`relative overflow-hidden rounded-[24px] bg-well ${
                    i % 2 === 0 ? "aspect-[4/5]" : "aspect-[4/5] md:translate-y-8"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Commitments ──────────────────────────────────────── */}
      <section className="border-t border-page-fg/10">
        <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <p className="mb-4 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
            What you can count on
          </p>
          <h2 className="mb-14 max-w-[560px] font-display text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.06] tracking-[-0.035em]">
            The parts that are easy to get wrong
          </h2>

          <div className="grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {commitments.map((c) => (
              <div key={c.title} className="flex gap-5">
                <c.icon
                  className="mt-1 h-[22px] w-[22px] shrink-0 text-page-fg/40"
                  strokeWidth={1.7}
                />
                <div>
                  <h3 className="mb-2 font-display text-[19px] font-bold tracking-[-0.02em] text-page-fg">
                    {c.title}
                  </h3>
                  <p className="max-w-[380px] text-[15px] leading-[1.7] text-page-fg/60">{c.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap gap-x-7 gap-y-2 border-t border-page-fg/10 pt-7 text-[13.5px]">
            {[
              { href: "/return-policy", label: "Return policy" },
              { href: "/terms", label: "Terms of service" },
              { href: "/privacy", label: "Privacy" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-page-fg/55 underline decoration-page-fg/25 underline-offset-4 transition-colors hover:text-page-fg"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact ──────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[36px] bg-page px-8 py-20 text-page-fg md:px-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-5 font-display text-[11.5px] font-medium uppercase tracking-[0.22em] text-page-fg/45">
                Get in touch
              </p>
              <h2 className="mb-5 font-display text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.08] tracking-[-0.035em]">
                Questions before
                <br />
                you buy?
              </h2>
              <p className="max-w-[400px] text-[16.5px] leading-[1.65] text-page-fg/60">
                Message us on WhatsApp or call — we answer during business hours. If you already have
                an order, use the thread on that order and we&apos;ll pick it up there.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-[56px] items-center justify-center gap-3 rounded-full bg-page-fg px-8 text-[15px] font-bold text-page transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:+${settings.contact_phone}`}
                className="inline-flex h-[56px] items-center justify-center gap-3 rounded-full border border-page-fg/25 px-8 text-[15px] font-medium text-page-fg transition-colors hover:bg-page-fg/[0.07]"
              >
                <Phone className="h-[17px] w-[17px]" />
                +{settings.contact_phone}
              </a>
              <Link
                href="/products"
                className="group mt-2 inline-flex items-center gap-2 text-sm font-medium text-page-fg/60 transition-colors hover:text-page-fg md:justify-end"
              >
                Browse the shop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
