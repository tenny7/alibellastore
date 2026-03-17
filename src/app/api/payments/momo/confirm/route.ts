import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import type { PaymentStatus, OrderStatus } from "@/types";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "momo-confirm", limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { orderId, status, financialTransactionId } = await request.json();

  if (!orderId || !status) {
    return NextResponse.json(
      { error: "orderId and status are required" },
      { status: 400 }
    );
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
    return NextResponse.json({ message: "Already paid" });
  }

  let paymentStatus: PaymentStatus = "pending";
  let orderStatus: OrderStatus = order.status;

  if (status === "SUCCESSFUL") {
    paymentStatus = "successful";
    orderStatus = "paid";
  } else if (status === "FAILED") {
    paymentStatus = "failed";
  }

  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
      momo_transaction_id: financialTransactionId || null,
    })
    .eq("id", order.id);

  return NextResponse.json({ success: true, paymentStatus });
}
