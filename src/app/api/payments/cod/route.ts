import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/** Cash on Delivery: accept the order without a gateway.
 *  The order moves to `processing` so it enters the dispatch board, while
 *  payment_status stays `pending` until someone marks it paid on delivery. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "cod-confirm", limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (user.role !== "admin" && order.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.payment_status === "successful") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  // payment_method may not exist yet if the migration hasn't been applied.
  // Fall back so checkout keeps working rather than 500-ing on a missing column.
  let { error } = await supabase
    .from("orders")
    .update({ status: "processing", payment_method: "cod" })
    .eq("id", order.id);

  if (error) {
    console.warn("[COD] payment_method update failed, retrying without it:", error.message);
    ({ error } = await supabase
      .from("orders")
      .update({ status: "processing" })
      .eq("id", order.id));
  }

  if (error) {
    console.error("[COD] failed to confirm order:", error.message);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.order_number });
}
