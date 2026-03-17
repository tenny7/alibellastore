import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductCard } from "@/components/storefront/product-card";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Accordion } from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";
import { ArrowRight, Truck } from "lucide-react";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, images")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!product) return { title: "Product Not Found" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    title: product.name,
    description: product.description || `Buy ${product.name} at our store`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name}`,
      url: `${appUrl}/products/${id}`,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `Buy ${product.name}`,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!product) notFound();

  // Fetch related products from same category
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("status", "active")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4);

  const settings = await getSiteSettings();

  // Build dynamic delivery message
  const deliveryFee = Number(settings.delivery_fee) || 0;
  const freeThreshold = settings.free_delivery_threshold != null ? Number(settings.free_delivery_threshold) : null;
  let deliveryMessage: string;
  if (deliveryFee === 0) {
    deliveryMessage = "Free delivery on all orders within Kigali.";
  } else if (freeThreshold && freeThreshold > 0) {
    deliveryMessage = `Delivery fee: ${formatCurrency(deliveryFee, settings.currency_code)}. Free delivery on orders above ${formatCurrency(freeThreshold, settings.currency_code)}.`;
  } else {
    deliveryMessage = `Delivery fee: ${formatCurrency(deliveryFee, settings.currency_code)}.`;
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(product.category
      ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }]
      : []),
    { label: product.name },
  ];

  const accordionItems = [
    {
      title: "Details & Care",
      content: (
        <div className="space-y-2">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p>High-quality product carefully selected for our store.</p>
          )}
          <p>Handle with care. Store in a cool, dry place.</p>
        </div>
      ),
    },
    {
      title: "Shipping & Returns",
      content: (
        <div className="space-y-2">
          <p>{deliveryMessage}</p>
          <p>Delivery to other cities within 2-5 business days.</p>
          <p>Returns accepted within 7 days of delivery for unused items in original packaging.</p>
        </div>
      ),
    },
  ];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images ?? [],
    url: `${appUrl}/products/${id}`,
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: settings.currency_code,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={breadcrumbItems} />

      {/* Product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <ProductImageGallery
          images={product.images ?? []}
          productName={product.name}
        />

        {/* Details */}
        <div>
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="inline-block text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md mb-3 hover:bg-primary/20 transition-colors"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-3">
            {product.name}
          </h1>

          <p className="text-2xl font-bold text-[#1E293B] mb-6">
            {formatCurrency(Number(product.price), settings.currency_code)}
          </p>

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>
          )}

          <div className="mb-6">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              image={product.images?.[0] ?? ""}
            />
          </div>

          {/* Delivery info banner */}
          <div className="flex items-start gap-3 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] p-3.5 mb-6">
            <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-[#1E293B]">
              {deliveryFee === 0 ? (
                <p className="font-medium text-[#16A34A]">Free delivery on all orders</p>
              ) : (
                <>
                  <p>
                    <span className="font-medium">Delivery: {formatCurrency(deliveryFee, settings.currency_code)}</span>
                    {freeThreshold && freeThreshold > 0 && (
                      <span className="text-[#16A34A] font-medium"> &middot; Free above {formatCurrency(freeThreshold, settings.currency_code)}</span>
                    )}
                  </p>
                </>
              )}
              <p className="text-gray-500 text-xs mt-0.5">Kigali: 1-2 days &middot; Other cities: 2-5 days</p>
            </div>
          </div>

          {/* Accordion */}
          <Accordion items={accordionItems} />
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1E293B]">You May Also Like</h2>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
              >
                View Collection
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(relatedProducts as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
