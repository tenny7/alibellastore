import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: "newsletter", limit: 5, windowSeconds: 300 });
  if (limited) return limited;

  const { email, source } = await request.json();
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .insert({ email: value, source: typeof source === "string" ? source : null });

  // A duplicate is a success from the visitor's point of view.
  if (error && !/duplicate key|unique constraint/i.test(error.message)) {
    console.error("[Newsletter] insert failed:", error.message);
    return NextResponse.json({ error: "Could not sign you up just now" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
