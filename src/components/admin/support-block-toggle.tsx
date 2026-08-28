"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

/** Blocked customers keep read access to their threads but cannot send.
 *  Enforced server-side in /api/support/messages. */
export function SupportBlockToggle({ userId, blocked }: { userId: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/admin/support/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, blocked: !blocked }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not update the account");
      return;
    }
    toast.success(blocked ? "Messaging re-enabled" : "Messaging blocked");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        blocked
          ? "inline-flex h-[38px] shrink-0 items-center gap-2 rounded-xl border border-cream/[0.14] px-4 text-[13px] font-bold text-cream/75 transition-colors hover:bg-cream/[0.08] disabled:opacity-50"
          : "inline-flex h-[38px] shrink-0 items-center gap-2 rounded-xl border border-danger/30 px-4 text-[13px] font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      }
    >
      {blocked ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      {blocked ? "Unblock messaging" : "Block messaging"}
    </button>
  );
}
