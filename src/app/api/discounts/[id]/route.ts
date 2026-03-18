import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

// Only allow updating these fields
const ALLOWED_FIELDS = new Set([
  "code",
  "type",
  "value",
  "min_order_amount",
  "max_uses",
  "starts_at",
  "expires_at",
  "is_active",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();

  // Whitelist: only allow known fields
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = body[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("discounts")
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const supabase = createAdminClient();

  const { error } = await supabase.from("discounts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
