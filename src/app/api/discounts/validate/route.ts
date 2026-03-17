import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const { code, subtotal } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Discount code is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: discount } = await supabase
    .from("discounts")
    .select("*")
    .eq("code", code.trim())
    .eq("is_active", true)
    .single();

  if (!discount) {
    return NextResponse.json({ error: "Invalid discount code" }, { status: 404 });
  }

  const now = new Date();
  if (now < new Date(discount.starts_at)) {
    return NextResponse.json({ error: "This discount is not yet active" }, { status: 400 });
  }
  if (now > new Date(discount.expires_at)) {
    return NextResponse.json({ error: "This discount has expired" }, { status: 400 });
  }
  if (discount.max_usage !== null && discount.usage_count >= discount.max_usage) {
    return NextResponse.json({ error: "This discount has reached its usage limit" }, { status: 400 });
  }
  if (discount.min_cart_value !== null && subtotal < Number(discount.min_cart_value)) {
    return NextResponse.json(
      { error: `Minimum cart value of ${Number(discount.min_cart_value).toLocaleString()} required` },
      { status: 400 }
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (discount.type === "percentage") {
    discountAmount = (subtotal || 0) * (Number(discount.value) / 100);
    if (discount.max_discount_cap) {
      discountAmount = Math.min(discountAmount, Number(discount.max_discount_cap));
    }
  } else if (discount.type === "fixed" || discount.type === "coupon") {
    discountAmount = Number(discount.value);
  }

  return NextResponse.json({
    valid: true,
    code: discount.code,
    type: discount.type,
    value: Number(discount.value),
    discountAmount: Math.round(discountAmount),
  });
}
