"use client";

import { useState, useEffect } from "react";

interface SiteSettingsClient {
  storeName: string;
  currencyCode: string;
  loading: boolean;
}

let settingsCache: SiteSettingsClient | null = null;

export function useSiteSettings(): SiteSettingsClient {
  const [data, setData] = useState<SiteSettingsClient>(
    settingsCache ?? { storeName: "MoMo Commerce", currencyCode: "RWF", loading: true }
  );

  useEffect(() => {
    if (settingsCache) return;

    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings) => {
        const result: SiteSettingsClient = {
          storeName: settings.store_name || "MoMo Commerce",
          currencyCode: settings.currency_code || "RWF",
          loading: false,
        };
        settingsCache = result;
        setData(result);
      })
      .catch(() => setData((prev) => ({ ...prev, loading: false })));
  }, []);

  return data;
}

export function useStoreName(): string {
  const { storeName } = useSiteSettings();
  return storeName;
}
