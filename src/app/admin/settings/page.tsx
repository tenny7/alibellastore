"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Phone, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/admin/skeleton-loader";
import { darkenHex } from "@/lib/utils";
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
  const [primaryColor, setPrimaryColor] = useState("#1A73E8");

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
        setPrimaryColor(data.primary_color || "#1A73E8");
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
        primary_color: primaryColor,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to save");
    } else {
      // Apply brand color immediately via CSS variables
      const root = document.documentElement;
      root.style.setProperty("--brand-primary", primaryColor);
      root.style.setProperty("--brand-primary-hover", darkenHex(primaryColor, 15));
      // Refresh server components so layout picks up new settings
      router.refresh();
      toast.success("Settings saved");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Store Settings</h1>
        <div className="max-w-3xl space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-6">
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
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Store Settings</h1>

      <div className="max-w-3xl space-y-6">
        {/* Branding */}
        <div className="rounded-lg border border-[#E2E8F0] border-t-[3px] border-t-primary bg-white p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-[#1E293B]">Branding</h2>
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
                <label htmlFor="currencyCode" className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Currency
                </label>
                <select
                  id="currencyCode"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
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
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Brand Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-[42px] w-[42px] rounded-lg border border-[#E2E8F0] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setPrimaryColor(v);
                    }}
                    maxLength={7}
                    className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    placeholder="#1A73E8"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="h-6 w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-xs text-gray-500">Preview — buttons and links will use this color</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-[#E2E8F0] border-t-[3px] border-t-[#16A34A] bg-white p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-[#16A34A]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Contact</h2>
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
        <div className="rounded-lg border border-[#E2E8F0] border-t-[3px] border-t-purple-500 bg-white p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-purple-500" />
            <h2 className="text-base font-semibold text-[#1E293B]">Social Media</h2>
            <span className="text-xs text-gray-400 ml-1">(optional)</span>
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
        <div className="rounded-lg border border-[#E2E8F0] border-t-[3px] border-t-[#D97706] bg-white p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-[#D97706]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Delivery & Tax</h2>
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
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
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
