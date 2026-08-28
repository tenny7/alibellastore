import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";

export const metadata = { title: "Payment settings" };

type State = "ok" | "warn" | "bad";

function Row({ label, value, state, note }: { label: string; value: string; state: State; note?: string }) {
  const Icon = state === "ok" ? CheckCircle2 : state === "warn" ? AlertTriangle : XCircle;
  const tone =
    state === "ok" ? "text-page-fg" : state === "warn" ? "text-page-fg/70" : "text-danger";
  return (
    <div className="flex items-start gap-3 border-b border-page-fg/[0.07] px-5 py-4 last:border-0">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-page-fg">{label}</div>
        {note && <div className="mt-1 text-[12.5px] leading-relaxed text-page-fg/45">{note}</div>}
      </div>
      <div className="shrink-0 font-mono text-[12.5px] text-page-fg/70">{value}</div>
    </div>
  );
}

export default async function PaymentSettingsPage() {
  const [, settings, supabase] = await Promise.all([
    requireAdmin(),
    getSiteSettings(),
    Promise.resolve(createAdminClient()),
  ]);

  const env = process.env.MOMO_ENVIRONMENT || "sandbox";
  const isProd = env === "production";
  const mock = process.env.MOMO_MOCK === "true";
  const apiUrl = process.env.MOMO_COLLECTION_API_URL || "(unset)";
  const callback = process.env.MOMO_CALLBACK_URL || "(unset)";

  // Presence only — secrets are never rendered.
  const has = (v?: string) => Boolean(v && v.trim() && !/^your-|^</i.test(v));
  const hasPrimary = has(process.env.MOMO_COLLECTION_PRIMARY_KEY);
  const hasUser = has(process.env.MOMO_COLLECTION_API_USER);
  const hasKey = has(process.env.MOMO_COLLECTION_API_KEY);
  const webhookSecret = process.env.MOMO_WEBHOOK_SECRET;
  const weakSecret = !has(webhookSecret) || webhookSecret === "change-me";

  // Has the payment_method column been migrated in?
  const { error: methodErr } = await supabase.from("orders").select("payment_method").limit(1);
  const { error: reasonErr } = await supabase.from("orders").select("momo_reason").limit(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-page-fg">
          Payment settings
        </h1>
        <p className="mt-1.5 text-sm text-page-fg/50">
          Read-only view of the MoMo configuration this deployment is running with. Values live in
          environment variables; secrets are never shown here.
        </p>
      </div>

      <div className="mb-5 rounded-[20px] border border-page-fg/[0.09] bg-page">
        <div className="border-b border-page-fg/[0.09] px-5 py-4">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-page-fg">
            MTN Mobile Money
          </h2>
        </div>
        <Row
          label="Environment"
          value={env}
          state={isProd ? "ok" : "warn"}
          note={isProd ? "Live payments." : "Sandbox — no real money moves. Currency is forced to EUR."}
        />
        <Row
          label="Mock mode"
          value={mock ? "on" : "off"}
          state={mock ? "bad" : "ok"}
          note={mock ? "Checkout auto-succeeds without contacting MTN. Never enable in production." : undefined}
        />
        <Row label="Collection base URL" value={apiUrl.replace(/^https?:\/\//, "")} state={apiUrl === "(unset)" ? "bad" : "ok"} />
        <Row label="Subscription key" value={hasPrimary ? "set" : "missing"} state={hasPrimary ? "ok" : "bad"} />
        <Row
          label="API user / key"
          value={hasUser && hasKey ? "set" : "missing"}
          state={hasUser && hasKey ? "ok" : "bad"}
          note={hasUser && hasKey ? undefined : "Run `node scripts/momo-setup.mjs` to provision."}
        />
        <Row
          label="Callback URL"
          value={callback === "(unset)" ? "unset" : callback.replace(/^https?:\/\//, "")}
          state={isProd ? (callback === "(unset)" ? "bad" : "ok") : "warn"}
          note={
            isProd
              ? "Its host must match the API user's providerCallbackHost."
              : "Not sent in sandbox — a mismatched host returns INVALID_CALLBACK_URL_HOST. Confirmation uses polling."
          }
        />
        <Row
          label="Webhook secret"
          value={weakSecret ? "not set" : "set"}
          state={weakSecret ? (isProd ? "bad" : "warn") : "ok"}
          note={weakSecret ? "Still the placeholder. Set MOMO_WEBHOOK_SECRET before going live." : undefined}
        />
        <Row
          label="Store currency"
          value={settings.currency_code}
          state="ok"
          note={isProd ? undefined : "Sandbox substitutes EUR automatically."}
        />
      </div>

      <div className="mb-5 rounded-[20px] border border-page-fg/[0.09] bg-page">
        <div className="border-b border-page-fg/[0.09] px-5 py-4">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-page-fg">
            Database migrations
          </h2>
        </div>
        <Row
          label="orders.payment_method"
          value={methodErr ? "missing" : "present"}
          state={methodErr ? "warn" : "ok"}
          note={methodErr ? "Cash-on-delivery orders can't be distinguished from unpaid MoMo ones. Apply supabase/migrations/20260825_payment_method_and_momo_reason.sql." : undefined}
        />
        <Row
          label="orders.momo_reason"
          value={reasonErr ? "missing" : "present"}
          state={reasonErr ? "warn" : "ok"}
          note={reasonErr ? "MTN failure reasons aren't being stored, so support can't see why a payment failed." : undefined}
        />
      </div>

      <div className="rounded-[20px] border border-page-fg/[0.09] bg-page p-5">
        <h2 className="mb-3 font-display text-lg font-bold tracking-[-0.02em] text-page-fg">
          Going to production
        </h2>
        <ul className="space-y-2 text-[13.5px] leading-relaxed text-page-fg/60">
          <li>· Set <code className="font-mono text-page-fg/80">MOMO_ENVIRONMENT=production</code> and turn mock mode off.</li>
          <li>· Provision a production API user with <code className="font-mono text-page-fg/80">providerCallbackHost=alibellastore.com</code>.</li>
          <li>· Confirm the production collection host and target-environment value with MTN.</li>
          <li>· Set a real <code className="font-mono text-page-fg/80">MOMO_WEBHOOK_SECRET</code>.</li>
        </ul>
        <p className="mt-4 text-[13px] text-page-fg/45">
          Full checklist in <code className="font-mono">docs/mtn-momo-integration-playbook.md</code> §8.
        </p>
        <Link
          href="/admin/settings"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-page-fg transition-colors hover:text-page-fg"
        >
          Back to settings <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
