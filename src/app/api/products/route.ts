import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { createProductSchema } from "@/lib/validators/product";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { sanitizeSearch } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? String(PRODUCTS_PER_PAGE));
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("name", `%${sanitizeSearch(search)}%`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: products, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .insert(parsed.data)
    .select("*, category:categories(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
