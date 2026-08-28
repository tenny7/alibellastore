"use client";

import { useState } from "react";
import toast from "react-hot-toast";

/** Footer email capture. Posts to /api/newsletter, which writes to
 *  newsletter_subscribers server-side. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "footer" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Could not sign you up just now");
      return;
    }
    setDone(true);
    setEmail("");
  }

  if (done) {
    return (
      <p className="border-b border-page-fg pb-2.5 font-serif text-[clamp(18px,2vw,26px)] text-page-fg">
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex max-w-[480px] items-center gap-3 border-b border-page-fg pb-2.5"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.rw"
        aria-label="Email address"
        className="flex-1 border-none bg-transparent font-serif text-[clamp(18px,2vw,26px)] text-page-fg outline-none placeholder:text-page-fg/35"
      />
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 cursor-pointer border-none bg-transparent font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
      >
        {busy ? "…" : "Join →"}
      </button>
    </form>
  );
}
