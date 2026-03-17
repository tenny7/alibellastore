import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const status = searchParams.get("status");

  let query = supabase
    .from("orders")
    .select("*, order_items(*, product:products(name, images)), customer:users(name, email)", { count: "exact" });

  // Admin sees all orders, shoppers see only their own
  if (user.role !== "admin") {
    query = query.eq("customer_id", user.id);
  }

  if (status) query = query.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: orders, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
