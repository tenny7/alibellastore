import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();

  const supabase = createAdminClient();

  // Auto-deactivate expired discounts that are still marked active
  await supabase
    .from("discounts")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("discounts")
    .insert({
      type: body.type,
      value: body.value,
      code: body.code || null,
      max_usage: body.max_usage || null,
      min_cart_value: body.min_cart_value || null,
      max_discount_cap: body.max_discount_cap || null,
      starts_at: body.starts_at,
      expires_at: body.expires_at,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
