import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartHydration } from "@/components/storefront/cart-hydration";
import { getSiteSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/types";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const [settings, { data: categories }] = await Promise.all([
    getSiteSettings(),
    supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name"),
  ]);

  const cats = (categories ?? []) as Category[];

  return (
    <div className="flex flex-col min-h-screen">
      <CartHydration />
      <Header storeName={settings.store_name} categories={cats} />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={settings.store_name}
        storeDescription={settings.store_description}
        whatsappNumber={settings.whatsapp_number}
        instagramUrl={settings.instagram_url}
        facebookUrl={settings.facebook_url}
        twitterUrl={settings.twitter_url}
        categories={cats}
      />
    </div>
  );
}
