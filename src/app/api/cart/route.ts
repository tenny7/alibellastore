import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/cart — retrieve DB cart for authenticated user
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ items: [] });

  const supabase = await createClient();

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", user.id);

  const items = (cartItems ?? []).map((item) => ({
    productId: item.product_id,
    name: item.product?.name ?? "",
    price: Number(item.product?.price ?? 0),
    image: item.product?.images?.[0] ?? "",
    quantity: item.quantity,
  }));

  return NextResponse.json({ items });
}

// POST /api/cart — sync localStorage cart to DB on login
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await request.json();
  const supabase = createAdminClient();

  for (const item of items) {
    await supabase.from("cart_items").upsert(
      {
        user_id: user.id,
        product_id: item.productId,
        quantity: item.quantity,
      },
      { onConflict: "user_id,product_id" }
    );
  }

  return NextResponse.json({ success: true });
}
