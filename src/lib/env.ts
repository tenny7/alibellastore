/**
 * Validates required environment variables at import time.
 * Import this module early (e.g. in layout or instrumentation) to fail fast.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const momoEnv = process.env.MOMO_ENVIRONMENT || "sandbox";

// MoMo keys required when not in mock mode
const requiredForPayments: string[] = ["MOMO_COLLECTION_PRIMARY_KEY"];

// Production requires API user + key from Partner Portal (sandbox auto-provisions)
if (momoEnv === "production") {
  requiredForPayments.push("MOMO_API_USER", "MOMO_API_KEY");
}

const missing: string[] = [];

for (const key of required) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

// Only require MoMo keys when not in mock mode
if (process.env.MOMO_MOCK !== "true") {
  for (const key of requiredForPayments) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
}

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCheck your .env.local file.`
  );
}

// Export validated env for type-safe access
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  MOMO_MOCK: process.env.MOMO_MOCK === "true",
  MOMO_ENVIRONMENT: momoEnv as "sandbox" | "production",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;
