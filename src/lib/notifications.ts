import { createAdminClient } from "@/lib/supabase/admin";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  type = "order",
  link,
}: CreateNotificationParams) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error("[notifications] Failed to create:", error.message);
  }
}
