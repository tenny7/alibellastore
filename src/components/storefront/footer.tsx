import Link from "next/link";
import { Instagram, Facebook, Twitter, ShoppingBag, MessageCircle } from "lucide-react";
import { FooterAccountLinks } from "./footer-account-links";
import type { Category } from "@/types";

interface FooterProps {
  storeName?: string;
  storeDescription?: string;
  whatsappNumber?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  categories?: Category[];
}

export function Footer({
  storeName = "MoMo Commerce",
  storeDescription,
  whatsappNumber,
  instagramUrl,
  facebookUrl,
  twitterUrl,
  categories = [],
}: FooterProps) {
  const hasSocials = instagramUrl || facebookUrl || twitterUrl;

  return (
    <footer className="mt-auto rounded-t-[40px] bg-ink text-cream">
      {/* Main footer grid */}
      <div className="mx-auto max-w-[1320px] px-6 pb-11 pt-14 md:px-10">
        <div className="grid grid-cols-1 gap-10 border-b border-cream/[0.12] pb-11 sm:grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-cream">
                <ShoppingBag className="h-[17px] w-[17px] text-ink" strokeWidth={2.2} />
              </span>
              <span className="font-display text-lg font-bold tracking-[-0.02em] text-cream">
                {storeName}
              </span>
            </Link>
            <p className="max-w-[280px] font-display text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-cream">
              Get the drop before it sells out.
            </p>
            <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-cream/60">
              {storeDescription || "Your trusted online store. Quality products with secure MoMo payments."}
            </p>
            {hasSocials && (
              <div className="mt-6 flex items-center gap-2.5">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream/[0.14] text-cream/70 transition-colors hover:bg-cream/[0.08] hover:text-cream">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream/[0.14] text-cream/70 transition-colors hover:bg-cream/[0.08] hover:text-cream">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream/[0.14] text-cream/70 transition-colors hover:bg-cream/[0.08] hover:text-cream">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-cream/40">Shop</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
                  All Products
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-[14.5px] text-cream/70 transition-colors hover:text-cream"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-cream/40">Support</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
                  About Us
                </Link>
              </li>
              {whatsappNumber && (
                <li>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[14.5px] text-cream/70 transition-colors hover:text-cream"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Support
                  </a>
                </li>
              )}
              <li>
                <Link href="/orders" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Account — auth-aware */}
          <div>
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-cream/40">Account</h3>
            <FooterAccountLinks />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-4 py-6 text-[13px] text-cream/45 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {storeName} · Kigali, Rwanda
          </p>
          <div className="flex items-center gap-[18px]">
            <Link href="/privacy" className="transition-colors hover:text-cream">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-cream">Terms</Link>
            <span className="flex items-center gap-1.5">
              Pay with
              <span className="rounded-md bg-cream px-2 py-0.5 text-[11px] font-bold text-ink">MoMo</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
