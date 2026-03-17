import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*, children:categories!parent_id(*)")
    .is("parent_id", null)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const { name, parent_id } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const slug = slugify(name);

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), slug, parent_id: parent_id || null })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
