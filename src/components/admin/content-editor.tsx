"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, EyeOff, Save } from "lucide-react";
import toast from "react-hot-toast";

type Field = { key: string; label: string; placeholder: string; textarea?: boolean; optional?: boolean };

interface Props {
  endpoint: string;
  rows: Record<string, unknown>[];
  fields: Field[];
  /** Shown when nothing exists yet — this is where the design's invented
   *  content used to sit, so say so. */
  emptyHint: string;
  addLabel: string;
}

export function ContentEditor({ endpoint, rows, fields, emptyHint, addLabel }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function call(method: string, body: Record<string, unknown>) {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "That didn't work");
      return false;
    }
    router.refresh();
    return true;
  }

  async function create() {
    const missing = fields.filter((f) => !f.optional && !draft[f.key]?.trim());
    if (missing.length) {
      toast.error(`${missing[0].label} is required`);
      return;
    }
    setBusy("new");
    const ok = await call("POST", { ...draft, is_published: false, sort_order: rows.length });
    setBusy(null);
    if (ok) {
      setDraft({});
      setAdding(false);
      toast.success("Added — publish it when you're ready");
    }
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && !adding && (
        <p className="rounded-[18px] border border-page-fg/[0.12] bg-page-fg/[0.04] p-4 text-[13px] leading-relaxed text-page-fg/60">
          {emptyHint}
        </p>
      )}

      {rows.map((row) => {
        const id = row.id as string;
        const published = Boolean(row.is_published);
        return (
          <div key={id} className="rounded-[18px] border border-page-fg/[0.09] bg-page p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                {fields.map((f) => (
                  <p key={f.key} className="truncate text-[13.5px] text-page-fg/75">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-page-fg/40">
                      {f.label}:{" "}
                    </span>
                    {String(row[f.key] ?? "—")}
                  </p>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={busy === id}
                  onClick={async () => {
                    setBusy(id);
                    await call("PATCH", { id, is_published: !published });
                    setBusy(null);
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-bold transition-colors disabled:opacity-50 ${
                    published
                      ? "border-transparent bg-page-fg text-page"
                      : "border-page-fg/[0.16] text-page-fg/70 hover:bg-page-fg/[0.08]"
                  }`}
                >
                  {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {published ? "Live" : "Hidden"}
                </button>
                <button
                  type="button"
                  disabled={busy === id}
                  onClick={async () => {
                    setBusy(id);
                    await call("DELETE", { id });
                    setBusy(null);
                  }}
                  aria-label="Delete"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-danger/30 text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {adding ? (
        <div className="space-y-3 rounded-[18px] border border-page-fg/[0.12] bg-page p-4">
          {fields.map((f) =>
            f.textarea ? (
              <textarea
                key={f.key}
                rows={3}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full resize-none rounded-[12px] border border-page-fg/[0.14] bg-page-fg/[0.05] px-3.5 py-2.5 text-sm text-page-fg placeholder:text-page-fg/35 focus:border-page-fg/40 focus:outline-none"
              />
            ) : (
              <input
                key={f.key}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-[12px] border border-page-fg/[0.14] bg-page-fg/[0.05] px-3.5 py-2.5 text-sm text-page-fg placeholder:text-page-fg/35 focus:border-page-fg/40 focus:outline-none"
              />
            )
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={create}
              disabled={busy === "new"}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-page-fg px-4 text-[13px] font-bold text-page transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft({});
              }}
              className="inline-flex h-10 items-center rounded-[12px] border border-page-fg/[0.16] px-4 text-[13px] font-medium text-page-fg/70 transition-colors hover:bg-page-fg/[0.08]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-page-fg/[0.16] px-4 text-[13px] font-bold text-page-fg/75 transition-colors hover:bg-page-fg/[0.08]"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}
