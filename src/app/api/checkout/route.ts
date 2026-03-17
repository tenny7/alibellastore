import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators/checkout";
import { generateOrderNumber } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendOrderConfirmation } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "checkout", limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to checkout" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerName, customerPhone, shippingAddress, notes, discountCode } = parsed.data;
  const { items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Validate products exist and are active, get current prices
  const productIds = items.map((i: { productId: string }) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("status", "active");

  if (!products || products.length !== productIds.length) {
    return NextResponse.json(
      { error: "Some products are no longer available" },
      { status: 400 }
    );
  }

  // Calculate totals using server-side prices (never trust client)
  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number }) => {
    const product = products.find((p) => p.id === item.productId)!;
    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;
    return {
      product_id: product.id,
      quantity: item.quantity,
      unit_price: Number(product.price),
    };
  });

  // Handle discount if code provided
  let discountAmount = 0;
  let discountId: string | null = null;

  if (discountCode) {
    const { data: discount } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", discountCode)
      .eq("is_active", true)
      .single();

    if (
      discount &&
      new Date() >= new Date(discount.starts_at) &&
      new Date() <= new Date(discount.expires_at) &&
      (discount.max_usage === null || discount.usage_count < discount.max_usage) &&
      (discount.min_cart_value === null || subtotal >= Number(discount.min_cart_value))
    ) {
      if (discount.type === "percentage") {
        discountAmount = subtotal * (Number(discount.value) / 100);
        if (discount.max_discount_cap) {
          discountAmount = Math.min(discountAmount, Number(discount.max_discount_cap));
        }
      } else if (discount.type === "fixed" || discount.type === "coupon") {
        discountAmount = Number(discount.value);
      }
      discountId = discount.id;
    }
  }

  // Calculate delivery fee and tax from site settings
  const settings = await getSiteSettings();

  let deliveryFee = Number(settings.delivery_fee) || 0;
  if (
    settings.free_delivery_threshold != null &&
    Number(settings.free_delivery_threshold) > 0 &&
    subtotal >= Number(settings.free_delivery_threshold)
  ) {
    deliveryFee = 0;
  }

  const taxAmount = Math.round(subtotal * (Number(settings.tax_percentage) / 100));

  const total = subtotal + deliveryFee + taxAmount - discountAmount;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: user.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      notes: notes || null,
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: deliveryFee,
      tax_amount: taxAmount,
      total,
      discount_id: discountId,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Create order items
  const orderItemsWithOrderId = orderItems.map((item: { product_id: string; quantity: number; unit_price: number }) => ({
    ...item,
    order_id: order.id,
  }));

  await supabase.from("order_items").insert(orderItemsWithOrderId);

  // Increment discount usage if applied
  if (discountId) {
    const { data: discount } = await supabase
      .from("discounts")
      .select("usage_count")
      .eq("id", discountId)
      .single();

    if (discount) {
      await supabase
        .from("discounts")
        .update({ usage_count: discount.usage_count + 1 })
        .eq("id", discountId);
    }
  }

  // Notify that order is awaiting payment (final notification sent after payment)
  createNotification({
    userId: user.id,
    title: "Order Awaiting Payment",
    message: `Your order ${order.order_number} for ${formatCurrency(total, settings.currency_code)} has been created. Please complete payment.`,
    type: "order",
    link: `/orders/${order.id}`,
  }).catch((err) => console.error("[Notification] Failed:", err));

  // Send email only if user has a real email (not phone.local placeholder)
  const hasRealEmail = user.email && !user.email.endsWith("@phone.local");
  if (hasRealEmail) {
    sendOrderConfirmation({
      to: user.email!,
      customerName,
      orderNumber: order.order_number,
      items: orderItems.map((item: { product_id: string; quantity: number; unit_price: number }) => {
        const product = products.find((p) => p.id === item.product_id)!;
        return { name: product.name, quantity: item.quantity, unit_price: item.unit_price };
      }),
      subtotal,
      discountAmount,
      deliveryFee,
      taxAmount,
      total,
      shippingAddress,
      currencyCode: settings.currency_code,
    }).catch((err) => console.error("[Email] Order confirmation failed:", err));
  }

  return NextResponse.json(order, { status: 201 });
}
