import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTransactionStatus } from "@/lib/momo/client";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import type { PaymentStatus, OrderStatus } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ referenceId: string }> }
) {
  const limited = rateLimit(_request, { key: "momo-status", limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  const { referenceId } = await params;

  try {
    const tx = await getTransactionStatus(referenceId);

    // Update order if we have a final status
    if (tx.status === "SUCCESSFUL" || tx.status === "FAILED") {
      const supabase = createAdminClient();

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("momo_reference_id", referenceId)
        .single();

      if (order && order.payment_status !== "successful") {
        let paymentStatus: PaymentStatus = "pending";
        let orderStatus: OrderStatus = order.status;

        if (tx.status === "SUCCESSFUL") {
          paymentStatus = "successful";
          orderStatus = "paid";
        } else {
          paymentStatus = "failed";
        }

        await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            status: orderStatus,
            momo_transaction_id: tx.financialTransactionId || null,
          })
          .eq("id", order.id);

        // Send payment result notification
        const settings = await getSiteSettings();
        if (tx.status === "SUCCESSFUL") {
          createNotification({
            userId: order.customer_id,
            title: "Payment Confirmed",
            message: `Payment of ${formatCurrency(Number(order.total), settings.currency_code)} for order ${order.order_number} was successful.`,
            type: "order",
            link: `/orders/${order.id}`,
          }).catch((err) => console.error("[Notification] Failed:", err));
        } else {
          createNotification({
            userId: order.customer_id,
            title: "Payment Failed",
            message: `Payment for order ${order.order_number} failed. Please try again.`,
            type: "order",
            link: `/orders/${order.id}`,
          }).catch((err) => console.error("[Notification] Failed:", err));
        }
      }
    }

    return NextResponse.json({
      status: tx.status,
      financialTransactionId: tx.financialTransactionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[MoMo] getTransactionStatus error:", message);
    return NextResponse.json(
      { error: "Failed to check payment status", details: message },
      { status: 500 }
    );
  }
}
