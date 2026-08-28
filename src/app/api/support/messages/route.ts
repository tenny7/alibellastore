import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

const MAX_BODY = 5000;

/** Both sides of an order's support thread. Customers may only touch their own
 *  order; admins may touch any. */
async function authorise(orderId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, total")
    .eq("id", orderId)
    .single();

  if (!order) return { error: NextResponse.json({ error: "Order not found" }, { status: 404 }) };

  const isAdmin = user.role === "admin";
  if (!isAdmin && order.customer_id !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, order, isAdmin, supabase };
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const ctx = await authorise(orderId);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from("support_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    // The table only exists once the migration is applied.
    console.error("[Support] list failed:", error.message);
    return NextResponse.json({ messages: [], unavailable: true });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "support-send", limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { orderId, body } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: `Message must be under ${MAX_BODY} characters` }, { status: 400 });
  }

  const ctx = await authorise(orderId);
  if (ctx.error) return ctx.error;
  const { user, order, isAdmin, supabase } = ctx;

  // Admins are never blocked; a blocked customer can read but not send.
  if (!isAdmin) {
    const { data: me } = await supabase
      .from("users")
      .select("support_blocked")
      .eq("id", user.id)
      .single();
    if (me?.support_blocked) {
      return NextResponse.json(
        { error: "Messaging is disabled on your account. Please contact us by phone." },
        { status: 403 }
      );
    }
  }

  const { data: message, error } = await supabase
    .from("support_messages")
    .insert({
      order_id: orderId,
      sender_id: user.id,
      sender_role: isAdmin ? "admin" : "customer",
      body: text,
    })
    .select()
    .single();

  if (error) {
    console.error("[Support] send failed:", error.message);
    return NextResponse.json({ error: "Could not send the message" }, { status: 500 });
  }

  // Tell the customer when an admin replies. (Admins see threads in /admin/support.)
  if (isAdmin) {
    createNotification({
      userId: order.customer_id,
      title: "Reply from support",
      message: `We've replied about order ${order.order_number}.`,
      type: "order",
      link: `/orders/${order.id}`,
    }).catch((err) => console.error("[Notification] Failed:", err));
  }

  return NextResponse.json({ message }, { status: 201 });
}
