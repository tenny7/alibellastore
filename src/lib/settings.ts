import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  id: "",
  store_name: "MoMo Commerce",
  store_description: "Ecommerce powered by MTN Mobile Money",
  hero_title: null,
  hero_subtitle: null,
  contact_phone: "250780000000",
  whatsapp_number: "250780000000",
  instagram_url: null,
  facebook_url: null,
  twitter_url: null,
  delivery_fee: 0,
  free_delivery_threshold: null,
  tax_percentage: 0,
  currency_code: "RWF",
  primary_color: "#1A73E8",
  updated_at: new Date().toISOString(),
};

let cachedSettings: SiteSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();

  if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      console.error("[settings] Failed to fetch:", error?.message);
      return cachedSettings ?? DEFAULT_SETTINGS;
    }

    cachedSettings = data as SiteSettings;
    cacheTimestamp = now;
    return cachedSettings;
  } catch (err) {
    console.error("[settings] Unexpected error:", err);
    return cachedSettings ?? DEFAULT_SETTINGS;
  }
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
