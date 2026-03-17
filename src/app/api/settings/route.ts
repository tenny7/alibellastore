import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings, invalidateSettingsCache } from "@/lib/settings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const {
    store_name,
    store_description,
    contact_phone,
    whatsapp_number,
    instagram_url,
    facebook_url,
    twitter_url,
    delivery_fee,
    free_delivery_threshold,
    tax_percentage,
    currency_code,
    primary_color,
  } = body;

  if (!store_name || store_name.trim().length === 0) {
    return NextResponse.json(
      { error: "Store name is required" },
      { status: 400 }
    );
  }

  if (!contact_phone || contact_phone.trim().length === 0) {
    return NextResponse.json(
      { error: "Contact phone is required" },
      { status: 400 }
    );
  }

  if (delivery_fee !== undefined && (isNaN(Number(delivery_fee)) || Number(delivery_fee) < 0)) {
    return NextResponse.json({ error: "Delivery fee must be 0 or greater" }, { status: 400 });
  }

  if (tax_percentage !== undefined && (isNaN(Number(tax_percentage)) || Number(tax_percentage) < 0 || Number(tax_percentage) > 100)) {
    return NextResponse.json({ error: "Tax percentage must be between 0 and 100" }, { status: 400 });
  }

  if (free_delivery_threshold !== undefined && free_delivery_threshold !== null && (isNaN(Number(free_delivery_threshold)) || Number(free_delivery_threshold) < 0)) {
    return NextResponse.json({ error: "Free delivery threshold must be 0 or greater" }, { status: 400 });
  }

  if (primary_color && !/^#[0-9A-Fa-f]{6}$/.test(primary_color)) {
    return NextResponse.json({ error: "Invalid color format. Use #RRGGBB" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Settings row not found. Run the database migration first." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      store_name: store_name.trim(),
      store_description: (store_description || "").trim(),
      contact_phone: contact_phone.trim(),
      whatsapp_number: (whatsapp_number || contact_phone).trim(),
      instagram_url: instagram_url?.trim() || null,
      facebook_url: facebook_url?.trim() || null,
      twitter_url: twitter_url?.trim() || null,
      delivery_fee: Number(delivery_fee) || 0,
      free_delivery_threshold: free_delivery_threshold != null ? Number(free_delivery_threshold) : null,
      tax_percentage: Number(tax_percentage) || 0,
      currency_code: (currency_code || "RWF").trim().toUpperCase(),
      primary_color: primary_color || "#1A73E8",
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateSettingsCache();

  return NextResponse.json(data);
}
