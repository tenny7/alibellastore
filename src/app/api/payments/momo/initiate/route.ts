import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { requestToPay } from "@/lib/momo/client";
import { getSiteSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "momo-initiate", limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  // AUTH: Require authenticated user
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // AUTH: Verify the user owns this order (admins can initiate for anyone)
  if (user.role !== "admin" && order.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.payment_status === "successful") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  try {
    const settings = await getSiteSettings();
    const referenceId = await requestToPay({
      amount: order.total,
      currency: process.env.NEXT_PUBLIC_MOMO_CURRENCY || "RWF",
      externalId: order.order_number,
      payerPhone: order.customer_phone,
      payerMessage: `Payment for order ${order.order_number}`,
      payeeNote: `${settings.store_name} order ${order.order_number}`,
    });

    // Store the reference ID on the order
    await supabase
      .from("orders")
      .update({ momo_reference_id: referenceId })
      .eq("id", order.id);

    return NextResponse.json({ referenceId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[MoMo] requestToPay error:", message);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
