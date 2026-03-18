import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendPaymentConfirmation } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";
import type { PaymentStatus, OrderStatus } from "@/types";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "momo-callback", limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  // Webhook secret verification — REQUIRED in production
  const webhookSecret = process.env.MOMO_WEBHOOK_SECRET;
  const isSandbox = process.env.MOMO_ENVIRONMENT !== "production";

  if (webhookSecret) {
    const providedSecret = request.headers.get("x-webhook-secret");
    if (providedSecret !== webhookSecret) {
      console.error("[MoMo callback] Invalid webhook secret");
      return NextResponse.json({ received: true }, { status: 403 });
    }
  } else if (!isSandbox) {
    // In production, webhook secret MUST be set
    console.error("[MoMo callback] MOMO_WEBHOOK_SECRET not configured in production!");
    return NextResponse.json({ received: true }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 400 });
  }

  const externalId = typeof body.externalId === "string" ? body.externalId : null;
  const status = typeof body.status === "string" ? body.status : null;
  const financialTransactionId =
    typeof body.financialTransactionId === "string" ? body.financialTransactionId : null;

  if (!externalId || !status) {
    console.error("[MoMo callback] Missing externalId or status");
    return NextResponse.json({ received: true }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify the order exists AND has a momo_reference_id (proves we initiated this payment)
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", externalId)
    .not("momo_reference_id", "is", null)
    .single();

  if (!order) {
    console.error(`[MoMo callback] Order not found or no reference for externalId: ${externalId}`);
    return NextResponse.json({ received: true });
  }

  // Don't allow downgrading a successful payment
  if (order.payment_status === "successful") {
    return NextResponse.json({ received: true });
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
      momo_transaction_id: financialTransactionId,
    })
    .eq("id", order.id);

  // Send payment result notification
  const settings = await getSiteSettings();
  if (paymentStatus === "successful") {
    createNotification({
      userId: order.customer_id,
      title: "Payment Confirmed",
      message: `Payment of ${formatCurrency(Number(order.total), settings.currency_code)} for order ${order.order_number} was successful.`,
      type: "order",
      link: `/orders/${order.id}`,
    }).catch((err) => console.error("[Notification] Failed:", err));
  } else if (paymentStatus === "failed") {
    createNotification({
      userId: order.customer_id,
      title: "Payment Failed",
      message: `Payment for order ${order.order_number} failed. Please try again.`,
      type: "order",
      link: `/orders/${order.id}`,
    }).catch((err) => console.error("[Notification] Failed:", err));
  }

  // Send payment confirmation email when successful
  if (paymentStatus === "successful") {
    sendPaymentConfirmation({
      to: order.customer_phone,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      amount: Number(order.total),
      transactionId: financialTransactionId || "N/A",
      currencyCode: settings.currency_code,
    }).catch((err) => console.error("[Email] Payment confirmation failed:", err));

    // Also try to send to the user's email address
    const { data: customer } = await supabase
      .from("users")
      .select("email")
      .eq("id", order.customer_id)
      .single();

    if (customer?.email && !customer.email.endsWith("@phone.local")) {
      sendPaymentConfirmation({
        to: customer.email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        amount: Number(order.total),
        transactionId: financialTransactionId || "N/A",
        currencyCode: settings.currency_code,
      }).catch((err) => console.error("[Email] Payment confirmation failed:", err));
    }
  }

  return NextResponse.json({ received: true });
}
