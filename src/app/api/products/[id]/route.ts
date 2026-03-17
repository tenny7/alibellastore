import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validators/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .select("*, category:categories(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  // Fetch product to get image paths before deletion
  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Try to delete — may fail if product has order history (FK constraint)
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    // FK violation (order_items references this product) — archive instead
    if (error.code === "23503") {
      await supabase.from("products").update({ status: "draft" }).eq("id", id);
      return NextResponse.json({ success: true, archived: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean up images from Supabase Storage
  if (product.images && product.images.length > 0) {
    const storagePaths = product.images
      .map((url: string) => {
        // Extract path after the bucket name: .../product-images/products/uuid.ext
        const match = url.match(/product-images\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      await supabase.storage.from("product-images").remove(storagePaths);
    }
  }

  return NextResponse.json({ success: true });
}
