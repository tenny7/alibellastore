import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { User } from "@/types";

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();

  // Use getSession() instead of getUser() to avoid a duplicate network call.
  // The middleware already validates the token via auth.getUser() on every
  // request, so the JWT in cookies is guaranteed to be fresh here.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  // Use admin client to bypass RLS for role check
  const admin = createAdminClient();
  const { data: dbUser, error: dbError } = await admin
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (dbError) {
    console.error("[auth] users query error:", dbError.message, "for user:", session.user.id);
    return null;
  }

  return dbUser;
}

export async function requireAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    redirect("/login?error=unauthorized");
  }
  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
