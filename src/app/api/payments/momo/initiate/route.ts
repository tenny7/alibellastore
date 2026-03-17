import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestToPay } from "@/lib/momo/client";
import { getSiteSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "momo-initiate", limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const { orderId } = await request.json();

  if (!orderId) {
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
      { error: "Failed to initiate payment", details: message },
      { status: 500 }
    );
  }
}
