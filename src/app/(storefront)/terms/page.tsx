import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const storeName = settings.store_name;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Terms of Service</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using {storeName}, you accept and agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">2. Products and Pricing</h2>
          <p>
            All products listed on our platform are subject to availability. Prices are displayed in
            Rwandan Francs (RWF) and may change without prior notice. We reserve the right to modify
            or discontinue any product at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">3. Orders and Payment</h2>
          <p>
            When you place an order, you agree to provide accurate and complete information. Payment
            is processed via MTN Mobile Money (MoMo). Your order is confirmed only upon successful
            payment. We reserve the right to cancel orders if payment is not completed within a
            reasonable timeframe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">4. Shipping and Delivery</h2>
          <p>
            We offer free delivery within Kigali. Delivery to other cities within Rwanda takes 2-5
            business days. Delivery times are estimates and are not guaranteed. Risk of loss passes to
            you upon delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">5. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You
            agree to notify us immediately of any unauthorized use of your account. We reserve the
            right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">6. Intellectual Property</h2>
          <p>
            All content on this platform, including text, images, logos, and design, is the property
            of {storeName} and is protected by applicable intellectual property laws. You may not
            reproduce, distribute, or create derivative works without our written consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">7. Limitation of Liability</h2>
          <p>
            {storeName} shall not be liable for any indirect, incidental, or consequential damages
            arising from your use of the platform or purchase of products. Our total liability is
            limited to the amount paid for the specific product in question.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">8. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after changes
            constitutes acceptance of the new terms. We encourage you to review these terms
            periodically.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">9. Contact</h2>
          <p>
            For questions about these terms, please contact us via WhatsApp
            {settings.whatsapp_number ? ` at +${settings.whatsapp_number}` : ""} or through our
            website.
          </p>
        </section>
      </div>
    </div>
  );
}
