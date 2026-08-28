import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

/** Admin kill switch for abusive senders. A blocked customer keeps read access
 *  to their threads but cannot send; enforced in /api/support/messages. */
export async function POST(request: NextRequest) {
  await requireAdmin();

  const { userId, blocked } = await request.json();
  if (!userId || typeof userId !== "string" || typeof blocked !== "boolean") {
    return NextResponse.json({ error: "userId and blocked are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({
      support_blocked: blocked,
      support_blocked_at: blocked ? new Date().toISOString() : null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[Support] block toggle failed:", error.message);
    return NextResponse.json({ error: "Could not update the account" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, blocked });
}
