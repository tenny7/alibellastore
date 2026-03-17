import Link from "next/link";
import { MessageCircle, ShoppingBag, CreditCard, Truck } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1E293B] mb-4">
        About {settings.store_name}
      </h1>
      <p className="text-gray-600 text-lg mb-10 max-w-2xl">
        {settings.store_description || "Your trusted online store in Rwanda. We bring you quality products with simple, secure payments through MTN Mobile Money."}
      </p>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#1E293B] mb-6">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShoppingBag,
              title: "Browse & Add to Cart",
              desc: "Explore our catalog and add the products you love to your cart.",
            },
            {
              icon: CreditCard,
              title: "Pay with MoMo",
              desc: "Checkout securely using your MTN Mobile Money account.",
            },
            {
              icon: Truck,
              title: "We Deliver",
              desc: "Your order is processed and delivered to your address.",
            },
            {
              icon: MessageCircle,
              title: "Stay in Touch",
              desc: "Reach us on WhatsApp for questions or order updates.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-lg border border-[#E2E8F0] bg-white p-5"
            >
              <step.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-[#1E293B] mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-8">
        <h2 className="text-xl font-semibold text-[#1E293B] mb-4">
          Contact Us
        </h2>
        <p className="text-gray-600 mb-6">
          Have a question about a product or your order? We&apos;re happy to
          help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-white font-medium hover:bg-[#1ebe57] transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-6 py-3 text-[#1E293B] font-medium hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}
