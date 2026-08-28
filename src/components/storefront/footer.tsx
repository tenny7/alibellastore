import Link from "next/link";
import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";
import { FooterAccountLinks } from "./footer-account-links";
import { NewsletterForm } from "./newsletter-form";
import type { Category } from "@/types";

interface FooterProps {
  storeName?: string;
  storeDescription?: string;
  whatsappNumber?: string;
  contactPhone?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  categories?: Category[];
}

export function Footer({
  storeName = "Alibella Stores",
  whatsappNumber,
  contactPhone,
  instagramUrl,
  facebookUrl,
  twitterUrl,
  categories = [],
}: FooterProps) {
  const hasSocials = instagramUrl || facebookUrl || twitterUrl;
  const phone = contactPhone || whatsappNumber;

  return (
    <footer className="mt-auto bg-page px-5 pb-7 pt-10 text-page-fg md:px-14 md:pt-[72px]">
      <div className="grid items-end gap-6 border-b border-page-fg/[0.18] pb-9 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-14">
        <div>
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-page-fg/50">
            One email a week. Restocks and price drops only.
          </div>
          <NewsletterForm />
          {hasSocials && (
            <div className="mt-6 flex items-center gap-2.5">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-page-fg/20 text-page-fg/70 transition-colors hover:border-accent hover:text-accent-text-text"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-page-fg/20 text-page-fg/70 transition-colors hover:border-accent hover:text-accent-text-text"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-page-fg/20 text-page-fg/70 transition-colors hover:border-accent hover:text-accent-text-text"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5 font-mono text-[11px] uppercase tracking-[0.1em] sm:grid-cols-3">
          <div className="grid content-start gap-2.5">
            <Link href="/products" className="transition-colors hover:text-accent-text-text">
              All products
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="text-page-fg/70 transition-colors hover:text-accent-text-text"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="grid content-start gap-2.5">
            <Link href="/about" className="text-page-fg/70 transition-colors hover:text-accent-text-text">
              About
            </Link>
            <Link
              href="/return-policy"
              className="text-page-fg/70 transition-colors hover:text-accent-text-text"
            >
              Returns
            </Link>
            <Link href="/orders" className="text-page-fg/70 transition-colors hover:text-accent-text-text">
              Track order
            </Link>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-page-fg/70 transition-colors hover:text-accent-text-text"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </a>
            )}
            {phone && (
              <a
                href={`tel:+${phone}`}
                className="text-page-fg/70 transition-colors hover:text-accent-text-text"
              >
                +{phone}
              </a>
            )}
          </div>
          <div className="grid content-start gap-2.5">
            <FooterAccountLinks />
          </div>
        </div>
      </div>

      {/* Wordmark, as drawn */}
      <div className="my-5 font-display text-[clamp(56px,15vw,240px)] font-extrabold uppercase leading-[0.84] tracking-[-0.055em]">
        {storeName.split(" ")[0]}
        <span className="text-accent">.</span>
      </div>

      <div className="flex flex-wrap justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-page-fg/55">
        <span>
          &copy; {new Date().getFullYear()} {storeName} — Kigali, Rwanda
        </span>
        <span className="flex gap-4">
          <Link href="/privacy" className="transition-colors hover:text-accent-text-text">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-accent-text-text">
            Terms
          </Link>
          <span>Made in Rwanda</span>
        </span>
      </div>
    </footer>
  );
}
