import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { ProductCard } from "@/components/storefront/product-card";
import {
  ArrowRight,
  Smartphone,
  Truck,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import type { Product, Category } from "@/types";

export default async function HomePage() {
  const supabase = createAdminClient();

  const [settings, { data: categories }, { data: bestSellers }] =
    await Promise.all([
      getSiteSettings(),
      supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name")
        .limit(3),
      supabase
        .from("products")
        .select("*, category:categories(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const cats = (categories ?? []) as Category[];

  // Fetch a product image for each featured category
  const categoryImages: Record<string, string | null> = {};
  await Promise.all(
    cats.map(async (cat) => {
      const { data } = await supabase
        .from("products")
        .select("images")
        .eq("category_id", cat.id)
        .eq("status", "active")
        .limit(1)
        .single();
      categoryImages[cat.id] = data?.images?.[0] ?? null;
    })
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              {settings.hero_title || (
                <>Elevate Your{" "}<span className="text-[#FFCB05]">Lifestyle</span></>
              )}
            </h1>
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg">
              {settings.hero_subtitle || "Discover quality products and pay securely with MTN Mobile Money. Fast delivery across Rwanda."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Shop Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-white/10 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Smartphone, title: "Pay with MoMo", desc: "Secure MTN Mobile Money payments" },
              { icon: Truck, title: "Fast Delivery", desc: "Delivered to your doorstep" },
              { icon: ShieldCheck, title: "Quality Guaranteed", desc: "Verified products you can trust" },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      {cats.length > 0 && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#1E293B]">Featured Collections</h2>
              <Link href="/products" className="text-sm text-primary hover:underline font-medium hidden sm:block">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cats.map((cat) => {
                const img = categoryImages[cat.id];
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-100"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-hover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                      <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                        Shop now &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#1E293B]">Best Sellers</h2>
              <Link href="/products" className="text-sm text-primary hover:underline font-medium">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {(bestSellers as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl px-6 py-10 md:px-12 md:py-14 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Need Help? We&apos;re Here for You
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Have questions about products or your order? Chat with us on WhatsApp for quick support.
            </p>
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1ebe57] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
