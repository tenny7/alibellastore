import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ContentEditor } from "@/components/admin/content-editor";
import { Info } from "lucide-react";

export const metadata = { title: "Storefront content" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [, supabase] = await Promise.all([requireAdmin(), Promise.resolve(createAdminClient())]);

  const [t, m] = await Promise.all([
    supabase.from("testimonials").select("*").order("sort_order"),
    supabase.from("store_metrics").select("*").order("sort_order"),
  ]);

  const unavailable = Boolean(t.error || m.error);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-cream">
          Storefront content
        </h1>
        <p className="mt-1.5 max-w-[620px] text-sm leading-relaxed text-cream/50">
          Customer quotes and headline figures shown on the landing page. Nothing here is invented:
          each section is hidden on the storefront until you publish a row.
        </p>
      </div>

      {unavailable ? (
        <div className="flex gap-3 rounded-[18px] border border-cream/[0.12] bg-cream/[0.04] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cream/60" />
          <p className="text-[13px] leading-relaxed text-cream/60">
            These tables don&apos;t exist yet. Apply{" "}
            <code className="rounded bg-cream/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-cream/80">
              supabase/migrations/20260828_testimonials_and_metrics.sql
            </code>{" "}
            to create them.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-1.5 font-display text-lg font-bold tracking-[-0.02em] text-cream">
              Testimonials
            </h2>
            <p className="mb-4 text-[13px] text-cream/45">
              Real quotes only — attributing words to a customer who didn&apos;t say them is the one
              thing worth being strict about here.
            </p>
            <ContentEditor
              endpoint="/api/admin/testimonials"
              rows={t.data ?? []}
              addLabel="Add a testimonial"
              emptyHint="No testimonials yet, so the storefront's quote section is hidden. Add a real customer quote to turn it on."
              fields={[
                { key: "body", label: "Quote", placeholder: "What the customer said…", textarea: true },
                { key: "author_name", label: "Name", placeholder: "e.g. Aline M." },
                { key: "author_location", label: "Location", placeholder: "e.g. Kacyiru", optional: true },
                { key: "context", label: "Context", placeholder: "e.g. 3rd order this month", optional: true },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-lg font-bold tracking-[-0.02em] text-cream">
              Headline figures
            </h2>
            <p className="mb-4 text-[13px] text-cream/45">
              Values are free text, because the real ones look like &ldquo;4h 12m&rdquo; and
              &ldquo;1.8%&rdquo;. Only publish figures you can defend.
            </p>
            <ContentEditor
              endpoint="/api/admin/metrics"
              rows={m.data ?? []}
              addLabel="Add a figure"
              emptyHint="No figures yet, so the storefront's stats row is hidden. Add one to turn it on."
              fields={[
                { key: "value", label: "Value", placeholder: "e.g. 4h 12m" },
                { key: "label", label: "Label", placeholder: "e.g. Median Kigali delivery" },
              ]}
            />
          </section>
        </div>
      )}
    </div>
  );
}
