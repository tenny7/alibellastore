import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { sendOrderStatusUpdate } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(*, product:products(*)), customer:users(name, email, phone)")
    .eq("id", id);

  // Non-admin can only see their own orders
  if (user.role !== "admin") {
    query = query.eq("customer_id", user.id);
  }

  const { data: order, error } = await query.single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send status update notification + email if status changed
  if (body.status && data) {
    const statusLabels: Record<string, string> = {
      paid: "Payment Confirmed",
      processing: "Being Processed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    const label = statusLabels[body.status] || body.status;

    // Always create in-app notification
    createNotification({
      userId: data.customer_id,
      title: `Order ${label}`,
      message: `Your order ${data.order_number} is now ${label.toLowerCase()}.`,
      type: "order",
      link: `/orders/${data.id}`,
    }).catch((err) => console.error("[Notification] Failed:", err));

    // Send email only to users with real email
    const { data: customer } = await supabase
      .from("users")
      .select("email")
      .eq("id", data.customer_id)
      .single();

    const hasRealEmail = customer?.email && !customer.email.endsWith("@phone.local");
    if (hasRealEmail) {
      sendOrderStatusUpdate({
        to: customer.email,
        customerName: data.customer_name,
        orderNumber: data.order_number,
        status: body.status,
      }).catch((err) => console.error("[Email] Status update failed:", err));
    }
  }

  return NextResponse.json(data);
}
