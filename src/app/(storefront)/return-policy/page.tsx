import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Return Policy" };

export default async function ReturnPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Return Policy" }]} />

      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Return & Refund Policy</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">1. Return Window</h2>
          <p>
            You may return items within <strong>7 days</strong> of delivery. Items must be unused, in
            their original condition, and in the original packaging.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">2. Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Items that have been used, worn, or altered</li>
            <li>Items without original packaging or tags</li>
            <li>Perishable goods</li>
            <li>Personal hygiene products</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">3. How to Request a Return</h2>
          <p>To initiate a return:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>
              Contact us via WhatsApp
              {settings.whatsapp_number ? ` at +${settings.whatsapp_number}` : ""} with your order
              number
            </li>
            <li>Describe the reason for the return</li>
            <li>We will provide instructions for returning the item</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">4. Refund Process</h2>
          <p>
            Once we receive and inspect the returned item, we will process your refund via MTN Mobile
            Money within <strong>3-5 business days</strong>. The refund will be sent to the same MoMo
            number used for the original payment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">5. Damaged or Defective Items</h2>
          <p>
            If you receive a damaged or defective item, please contact us within{" "}
            <strong>48 hours</strong> of delivery with photos of the damage. We will arrange a
            replacement or full refund at no additional cost.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B] mt-8 mb-3">6. Exchanges</h2>
          <p>
            We currently do not offer direct exchanges. If you need a different item, please return
            the original and place a new order.
          </p>
        </section>
      </div>
    </div>
  );
}
