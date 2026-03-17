import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const storeName = settings.store_name;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">1. Information We Collect</h2>
          <p>We collect the following information when you use our platform:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Name, email address, and phone number when you create an account</li>
            <li>Shipping address when you place an order</li>
            <li>Payment information processed securely through MTN MoMo</li>
            <li>Order history and product preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">2. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and status updates via email</li>
            <li>Provide customer support</li>
            <li>Improve our products and services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with trusted third parties
            necessary to operate our service:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>MTN Mobile Money for payment processing</li>
            <li>Delivery partners for order fulfillment</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information. Payment
            processing is handled entirely by MTN MoMo&apos;s secure platform — we never store your
            MoMo PIN or financial credentials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">5. Cookies</h2>
          <p>
            We use essential cookies to maintain your shopping session and authentication. We do not
            use third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us via WhatsApp
            {settings.whatsapp_number ? ` at +${settings.whatsapp_number}` : ""}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. We will notify you of significant changes
            through our platform or via email. Continued use of {storeName} after changes constitutes
            acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
