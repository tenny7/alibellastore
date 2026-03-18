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
    <footer className="border-t border-[#E2E8F0] bg-[#1E293B] text-gray-300 mt-auto">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-white">{storeName}</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              {storeDescription || "Your trusted online store. Quality products with secure MoMo payments."}
            </p>
            {hasSocials && (
              <div className="flex items-center gap-3 mt-4">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className="text-sm text-gray-400 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              {whatsappNumber && (
                <li>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Support
                  </a>
                </li>
              )}
              <li>
                <Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Account — auth-aware */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h3>
            <FooterAccountLinks />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <div className="flex items-center gap-1">
              Powered by
              <span className="font-semibold text-[#FFCB05] bg-white/10 px-2 py-0.5 rounded text-xs ml-1">
                {storeName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
