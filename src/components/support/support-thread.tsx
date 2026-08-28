"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { SupportMessage, SupportSenderRole } from "@/types";

interface Props {
  orderId: string;
  orderNumber: string;
  /** Which side is viewing — changes alignment, labels and empty copy. */
  viewerRole: SupportSenderRole;
}

export function SupportThread({ orderId, orderNumber, viewerRole }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (markRead: boolean) => {
      try {
        const res = await fetch(`/api/support/messages?orderId=${orderId}`);
        const data = await res.json();
        if (data.unavailable) {
          setUnavailable(true);
          return;
        }
        setMessages(data.messages ?? []);
        if (markRead) {
          fetch("/api/support/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          }).catch(() => {});
        }
      } catch {
        /* leave the thread empty; the send path surfaces real errors */
      } finally {
        setLoading(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    const res = await fetch("/api/support/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, body }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      toast.error(data.error || "Could not send the message");
      return;
    }
    setDraft("");
    setMessages((m) => [...m, data.message as SupportMessage]);
  }

  if (unavailable) {
    return (
      <div className="flex items-start gap-3 rounded-[18px] border border-surface-border bg-surface-fg/[0.04] p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-surface-muted" />
        <p className="text-[13px] leading-relaxed text-surface-muted">
          Messaging isn&apos;t available yet — the support tables haven&apos;t been created on this
          database.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-surface-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-surface-border px-5 py-4">
        <MessageSquare className="h-4 w-4 text-surface-muted" />
        <h2 className="font-display text-base font-bold tracking-[-0.02em] text-surface-fg">
          {viewerRole === "admin" ? `Conversation · ${orderNumber}` : "Message us about this order"}
        </h2>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-5">
        {loading && <p className="text-sm text-surface-muted">Loading…</p>}

        {!loading && messages.length === 0 && (
          <p className="py-4 text-center text-[13.5px] leading-relaxed text-surface-muted">
            {viewerRole === "admin"
              ? "No messages on this order yet."
              : "Something wrong with your order, or a question about delivery? Send us a message and we'll reply here."}
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_role === viewerRole;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[16px] px-4 py-2.5 ${
                  mine
                    ? "bg-page-fg text-page"
                    : "border border-surface-border bg-surface-fg/[0.05] text-surface-fg"
                }`}
              >
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{m.body}</p>
                <p className={`mt-1.5 text-[11px] ${mine ? "opacity-60" : "text-surface-muted"}`}>
                  {m.sender_role === "admin" ? "Store" : "Customer"} ·{" "}
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-surface-border p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
          rows={2}
          maxLength={5000}
          placeholder={viewerRole === "admin" ? "Reply to the customer…" : "Write your message…"}
          className="flex-1 resize-none rounded-[14px] border border-surface-border bg-surface-input px-3.5 py-2.5 text-sm text-surface-fg placeholder:text-surface-muted focus:border-surface-fg focus:outline-none"
        />
        <Button type="submit" loading={sending} disabled={!draft.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
