import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import type { PaymentStatus, OrderStatus } from "@/types";

const VALID_STATUSES = new Set(["SUCCESSFUL", "FAILED", "PENDING"]);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "momo-confirm", limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  // AUTH: Require authenticated user
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status, financialTransactionId } = await request.json();

  if (!orderId || typeof orderId !== "string" || !status || typeof status !== "string") {
    return NextResponse.json(
      { error: "orderId and status are required" },
      { status: 400 }
    );
  }

  // Validate status is one of the expected values
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

  // AUTH: Verify the user owns this order (admins can confirm for anyone)
  if (user.role !== "admin" && order.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.payment_status === "successful") {
    return NextResponse.json({ message: "Already paid" });
  }

  // Verify the order has a momo_reference_id (proves payment was initiated)
  if (!order.momo_reference_id) {
    return NextResponse.json({ error: "No payment initiated for this order" }, { status: 400 });
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
      momo_transaction_id:
        typeof financialTransactionId === "string" ? financialTransactionId : null,
    })
    .eq("id", order.id);

  return NextResponse.json({ success: true, paymentStatus });
}
