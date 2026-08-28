import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const TABLE = "store_metrics";
const FIELDS = ["label", "value", "is_published", "sort_order"] as const;

/** Keeps only the columns this table owns, so a stray key can't reach the DB. */
function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS) if (f in body) out[f] = body[f];
  return out;
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const payload = pick(await request.json());
  const { data, error } = await createAdminClient().from(TABLE).insert(payload).select().single();
  if (error) {
    console.error(`[${TABLE}] create failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ row: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const id = body?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .update(pick(body))
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error(`[${TABLE}] update failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ row: data });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const { id } = await request.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const { error } = await createAdminClient().from(TABLE).delete().eq("id", id);
  if (error) {
    console.error(`[${TABLE}] delete failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
