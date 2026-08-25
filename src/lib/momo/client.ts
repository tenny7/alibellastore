import type { MoMoTransactionStatus } from "./types";

// ─── Environment Config ─────────────────────────────────
// Configured by momo-integration-kit/momo-setup.mjs. Env contract:
//   MOMO_COLLECTION_API_URL    base URL ending at /collection (client appends
//                              /token/ and /v1_0/...). NOT ".../collection/v1_0".
//   MOMO_COLLECTION_PRIMARY_KEY  Ocp-Apim-Subscription-Key from momodeveloper.mtn.com
//   MOMO_COLLECTION_API_USER   provisioned API user (uuid)
//   MOMO_COLLECTION_API_KEY    provisioned API key
//   MOMO_ENVIRONMENT           "sandbox" | "production"
//   MOMO_CURRENCY              real store currency (RWF); sandbox overrides to EUR
//   MOMO_MOCK=true             simulate locally, no network calls

const momoEnv = process.env.MOMO_ENVIRONMENT || "sandbox";
const isProduction = momoEnv === "production";

// Sandbox host root, used only for on-demand API-user provisioning when
// MOMO_COLLECTION_API_USER/KEY are absent. Derived from the collection base URL.
const API_URL = (
  process.env.MOMO_COLLECTION_API_URL ||
  "https://sandbox.momodeveloper.mtn.com/collection"
).replace(/\/+$/, "");
const HOST_ROOT = API_URL.replace(/\/collection$/, "");

// X-Target-Environment. NOTE: MTN Rwanda production expects "mtnrwanda", not
// "production" — confirm the exact value with MTN before going live (playbook §8).
const TARGET_ENVIRONMENT = isProduction ? "mtnrwanda" : "sandbox";

// The MTN sandbox only accepts EUR for requesttopay; production sends the real
// currency. Verified: sandbox rejects RWF with INVALID_CURRENCY.
const SANDBOX_CURRENCY = process.env.MOMO_SANDBOX_CURRENCY || "EUR";

// Mock mode: simulates MoMo payment locally when MOMO_MOCK=true
const isMockMode = process.env.MOMO_MOCK === "true";

// In-memory store for mock transactions
const mockTransactions = new Map<
  string,
  { status: "PENDING" | "SUCCESSFUL" | "FAILED"; createdAt: number }
>();

let cachedApiKey: string | null = null;
let cachedApiUser: string | null = null;
let cachedToken: string | null = null;
let tokenExpiry = 0;

function getSubscriptionKey(): string {
  const key = process.env.MOMO_COLLECTION_PRIMARY_KEY;
  if (!key) throw new Error("MOMO_COLLECTION_PRIMARY_KEY is not set");
  return key;
}

/** A callback URL is only usable if its host is publicly reachable. MTN validates
 *  X-Callback-Url against the API user's provisioned providerCallbackHost, so a
 *  mismatch returns 500 INVALID_CALLBACK_URL_HOST. */
function isPublicCallbackUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host !== "" && host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

/** Provision a fresh sandbox API user + key at the HOST ROOT (not /collection). */
async function provisionSandboxCredentials(): Promise<{ user: string; key: string }> {
  const user = crypto.randomUUID();
  const callbackHost = isPublicCallbackUrl(process.env.MOMO_CALLBACK_URL)
    ? new URL(process.env.MOMO_CALLBACK_URL as string).hostname
    : "example.com";

  const userRes = await fetch(`${HOST_ROOT}/v1_0/apiuser`, {
    method: "POST",
    headers: {
      "X-Reference-Id": user,
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({ providerCallbackHost: callbackHost }),
  });
  if (!userRes.ok) {
    throw new Error(
      `Failed to provision sandbox API user: ${userRes.status} ${await userRes.text()}`
    );
  }

  const keyRes = await fetch(`${HOST_ROOT}/v1_0/apiuser/${user}/apikey`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
      "Cache-Control": "no-cache",
    },
  });
  if (!keyRes.ok) {
    throw new Error(`Failed to create sandbox API key: ${keyRes.status} ${await keyRes.text()}`);
  }

  const { apiKey } = await keyRes.json();
  console.log(
    `[MoMo] Auto-provisioned sandbox API user ${user}. ` +
      `Persist it as MOMO_COLLECTION_API_USER/MOMO_COLLECTION_API_KEY to reuse across restarts.`
  );
  return { user, key: apiKey };
}

/** Resolve API user + key: env-configured (preferred), else provision in sandbox. */
async function getCredentials(): Promise<{ user: string; key: string }> {
  if (cachedApiUser && cachedApiKey) return { user: cachedApiUser, key: cachedApiKey };

  const envUser = process.env.MOMO_COLLECTION_API_USER;
  const envKey = process.env.MOMO_COLLECTION_API_KEY;
  if (envUser && envKey) {
    cachedApiUser = envUser;
    cachedApiKey = envKey;
    return { user: envUser, key: envKey };
  }

  if (isProduction) {
    throw new Error(
      "MOMO_COLLECTION_API_USER and MOMO_COLLECTION_API_KEY are required in production"
    );
  }

  const provisioned = await provisionSandboxCredentials();
  cachedApiUser = provisioned.user;
  cachedApiKey = provisioned.key;
  return provisioned;
}

/** Get an OAuth access token (cached until near-expiry). */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const { user, key } = await getCredentials();
  const credentials = Buffer.from(`${user}:${key}`).toString("base64");

  const res = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    cachedApiKey = null;
    cachedApiUser = null;
    throw new Error(`Failed to get access token: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

/** Initiate a request-to-pay. Returns the referenceId (UUID). */
export async function requestToPay(params: {
  amount: number;
  currency: string;
  externalId: string;
  payerPhone: string;
  payerMessage?: string;
  payeeNote?: string;
}): Promise<string> {
  const referenceId = crypto.randomUUID();

  if (isMockMode) {
    console.log(`[MoMo Mock] requestToPay: ${referenceId}`, params);
    mockTransactions.set(referenceId, { status: "PENDING", createdAt: Date.now() });
    return referenceId;
  }

  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Reference-Id": referenceId,
    "X-Target-Environment": TARGET_ENVIRONMENT,
    "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
    "Content-Type": "application/json",
  };

  // Only send the async callback in production, with a public host matching the
  // API user's provisioned providerCallbackHost. Sandbox relies on polling —
  // sending it there returns 500 INVALID_CALLBACK_URL_HOST.
  if (isProduction && isPublicCallbackUrl(process.env.MOMO_CALLBACK_URL)) {
    headers["X-Callback-Url"] = process.env.MOMO_CALLBACK_URL as string;
  }

  const res = await fetch(`${API_URL}/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: String(params.amount),
      currency: isProduction ? params.currency : SANDBOX_CURRENCY,
      externalId: params.externalId,
      payer: {
        partyIdType: "MSISDN",
        partyId: params.payerPhone.replace(/^\+/, ""),
      },
      payerMessage: params.payerMessage || "Payment for order",
      payeeNote: params.payeeNote || "MoMo Commerce payment",
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`requestToPay failed: ${res.status} ${await res.text()}`);
  }

  return referenceId;
}

/** Check the status of a request-to-pay transaction. */
export async function getTransactionStatus(
  referenceId: string
): Promise<MoMoTransactionStatus> {
  if (isMockMode) {
    const tx = mockTransactions.get(referenceId);
    if (!tx) {
      return { status: "FAILED", reason: { code: "NOT_FOUND", message: "Transaction not found" } };
    }

    // Auto-succeed after 10 seconds
    if (tx.status === "PENDING" && Date.now() - tx.createdAt > 10000) {
      tx.status = "SUCCESSFUL";
      mockTransactions.set(referenceId, tx);
    }

    return {
      status: tx.status,
      financialTransactionId:
        tx.status === "SUCCESSFUL" ? `mock-txn-${referenceId.slice(0, 8)}` : undefined,
    };
  }

  const token = await getAccessToken();

  const res = await fetch(`${API_URL}/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": TARGET_ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`getTransactionStatus failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
