"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Phone, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/admin/skeleton-loader";

import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [currencyCode, setCurrencyCode] = useState("RWF");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setStoreName(data.store_name || "");
        setStoreDescription(data.store_description || "");
        setHeroTitle(data.hero_title || "");
        setHeroSubtitle(data.hero_subtitle || "");
        setContactPhone(data.contact_phone || "");
        setWhatsappNumber(data.whatsapp_number || "");
        setInstagramUrl(data.instagram_url || "");
        setFacebookUrl(data.facebook_url || "");
        setTwitterUrl(data.twitter_url || "");
        setDeliveryFee(data.delivery_fee ? String(data.delivery_fee) : "");
        setFreeDeliveryThreshold(data.free_delivery_threshold ? String(data.free_delivery_threshold) : "");
        setTaxPercentage(data.tax_percentage ? String(data.tax_percentage) : "");
        setCurrencyCode(data.currency_code || "RWF");
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Contact phone is required");
      return;
    }
    setSaving(true);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name: storeName,
        store_description: storeDescription,
        hero_title: heroTitle || null,
        hero_subtitle: heroSubtitle || null,
        contact_phone: contactPhone,
        whatsapp_number: whatsappNumber || contactPhone,
        instagram_url: instagramUrl || null,
        facebook_url: facebookUrl || null,
        twitter_url: twitterUrl || null,
        delivery_fee: deliveryFee ? Number(deliveryFee) : 0,
        free_delivery_threshold: freeDeliveryThreshold ? Number(freeDeliveryThreshold) : null,
        tax_percentage: taxPercentage ? Number(taxPercentage) : 0,
        currency_code: currencyCode,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to save");
    } else {
      // Refresh server components so layout picks up new settings
      router.refresh();
      toast.success("Settings saved");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-6">Store Settings</h1>
        <div className="max-w-3xl space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[20px] border border-surface-border bg-surface p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-6">Store Settings</h1>

      <div className="max-w-3xl space-y-6">
        {/* Branding */}
        <div className="rounded-lg border border-surface-border border-t-[3px] border-t-cream/25 bg-surface p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-surface-fg" />
            <h2 className="font-display tracking-[-0.02em] text-base font-bold text-surface-fg">Branding</h2>
          </div>
          <div className="space-y-4">
            <Input
              id="storeName"
              label="Store Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My Store"
            />
            <Textarea
              id="storeDescription"
              label="Store Description / Tagline"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="A short description of your store"
            />
            <Input
              id="heroTitle"
              label="Homepage Hero Title"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder={heroTitle || "Elevate Your Lifestyle"}
            />
            <Textarea
              id="heroSubtitle"
              label="Homepage Hero Subtitle"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder={heroSubtitle || "Discover quality products powered by secure mobile payments. Shop with confidence across Rwanda."}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currencyCode" className="block text-sm font-medium text-surface-fg mb-1.5">
                  Currency
                </label>
                <select
                  id="currencyCode"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full rounded-[20px] border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-surface-fg focus:ring-1 focus:ring-surface-fg outline-none transition-colors"
                >
                  <option value="RWF">RWF — Rwandan Franc</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="KES">KES — Kenyan Shilling</option>
                  <option value="UGX">UGX — Ugandan Shilling</option>
                  <option value="TZS">TZS — Tanzanian Shilling</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="ZAR">ZAR — South African Rand</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-surface-border border-t-[3px] border-t-cream/25 bg-surface p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-surface-fg" />
            <h2 className="font-display tracking-[-0.02em] text-base font-bold text-surface-fg">Contact</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="contactPhone"
              label="Contact Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+250780000000"
            />
            <Input
              id="whatsappNumber"
              label="WhatsApp Number"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Same as contact phone if blank"
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="rounded-lg border border-surface-border border-t-[3px] border-t-cream/25 bg-surface p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-surface-muted" />
            <h2 className="font-display tracking-[-0.02em] text-base font-bold text-surface-fg">Social Media</h2>
            <span className="text-xs text-surface-muted ml-1">(optional)</span>
          </div>
          <div className="space-y-4">
            <Input
              id="instagramUrl"
              label="Instagram URL"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourstore"
            />
            <Input
              id="facebookUrl"
              label="Facebook URL"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/yourstore"
            />
            <Input
              id="twitterUrl"
              label="Twitter/X URL"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/yourstore"
            />
          </div>
        </div>

        {/* Delivery & Tax */}
        <div className="rounded-lg border border-surface-border border-t-[3px] border-t-cream/25 bg-surface p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-surface-muted" />
            <h2 className="font-display tracking-[-0.02em] text-base font-bold text-surface-fg">Delivery & Tax</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="deliveryFee"
                label={`Delivery Fee (${currencyCode})`}
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0"
              />
              <Input
                id="freeDeliveryThreshold"
                label={`Free Delivery Above (${currencyCode})`}
                type="number"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                placeholder="Leave blank for no threshold"
              />
            </div>
            <Input
              id="taxPercentage"
              label="Tax / VAT (%)"
              type="number"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              placeholder="0"
            />
            {(deliveryFee || freeDeliveryThreshold || taxPercentage) && (
              <div className="rounded-md bg-surface-fg/[0.06] border border-surface-border p-3 text-sm text-surface-fg">
                <p className="font-medium mb-1">Preview</p>
                <ul className="space-y-0.5 text-xs">
                  {deliveryFee && Number(deliveryFee) > 0 && (
                    <li>Delivery fee: {currencyCode} {Number(deliveryFee).toLocaleString()}</li>
                  )}
                  {freeDeliveryThreshold && Number(freeDeliveryThreshold) > 0 && (
                    <li>Free delivery on orders above {currencyCode} {Number(freeDeliveryThreshold).toLocaleString()}</li>
                  )}
                  {taxPercentage && Number(taxPercentage) > 0 && (
                    <li>Tax/VAT: {taxPercentage}% applied to subtotal</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2 pb-4">
          <Button
            onClick={handleSave}
            loading={saving}
            className="w-full"
            size="lg"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
