// ─── Environment Config ─────────────────────────────────
// MOMO_ENVIRONMENT: "sandbox" (default) | "production"
// Sandbox:    https://sandbox.momodeveloper.mtn.com  / target: sandbox  / currency: EUR
// Production: https://proxy.momoapi.mtn.co.rw        / target: mtnrwanda / currency: RWF

const momoEnv = process.env.MOMO_ENVIRONMENT || "sandbox";
const isProduction = momoEnv === "production";

const BASE_URL = isProduction
  ? "https://proxy.momoapi.mtn.co.rw"
  : "https://sandbox.momodeveloper.mtn.com";

const TARGET_ENVIRONMENT = isProduction ? "mtnrwanda" : "sandbox";

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

/** Get the API User ID. In production, must be set via MOMO_API_USER env var.
 *  In sandbox, auto-provisions a new user if not set or if the set one fails. */
async function getApiUserId(): Promise<string> {
  if (cachedApiUser) return cachedApiUser;

  if (isProduction) {
    const id = process.env.MOMO_API_USER;
    if (!id) throw new Error("MOMO_API_USER is required in production");
    cachedApiUser = id;
    return id;
  }

  // Try env var first
  const envUser = process.env.MOMO_API_USER;
  if (envUser) {
    cachedApiUser = envUser;
    return envUser;
  }

  // Sandbox: auto-provision a new API user
  const newUserId = crypto.randomUUID();
  const res = await fetch(`${BASE_URL}/v1_0/apiuser`, {
    method: "POST",
    headers: {
      "X-Reference-Id": newUserId,
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({ providerCallbackHost: "localhost" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to provision sandbox API user: ${res.status} ${text}`);
  }

  console.log(`[MoMo] Auto-provisioned sandbox API user: ${newUserId}`);
  cachedApiUser = newUserId;
  return newUserId;
}

/** Get the API key. In production this must be set via env var (from Partner Portal).
 *  In sandbox, it can be auto-generated via the provisioning API. */
async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  if (process.env.MOMO_API_KEY) {
    cachedApiKey = process.env.MOMO_API_KEY;
    return cachedApiKey;
  }

  // In production, API key must be provided — no auto-generation
  if (isProduction) {
    throw new Error("MOMO_API_KEY is required in production (get it from the MTN Partner Portal)");
  }

  const userId = await getApiUserId();

  // Sandbox: auto-generate API key via provisioning API
  const res = await fetch(
    `${BASE_URL}/v1_0/apiuser/${userId}/apikey`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
        "Cache-Control": "no-cache",
      },
    }
  );

  if (!res.ok) {
    // If API user is invalid, clear cache and try with a fresh user
    if (!isProduction && res.status === 404) {
      cachedApiUser = null;
      process.env.MOMO_API_USER = undefined;
      const freshUserId = await getApiUserId();
      const retryRes = await fetch(
        `${BASE_URL}/v1_0/apiuser/${freshUserId}/apikey`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!retryRes.ok) {
        const text = await retryRes.text();
        throw new Error(`Failed to get API key after re-provisioning: ${retryRes.status} ${text}`);
      }
      const data = await retryRes.json();
      cachedApiKey = data.apiKey;
      return cachedApiKey!;
    }

    const text = await res.text();
    throw new Error(`Failed to get API key: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedApiKey = data.apiKey;
  return cachedApiKey!;
}

/** Get an OAuth access token (cached until near-expiry). */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const apiKey = await getApiKey();
  const userId = await getApiUserId();
  const credentials = Buffer.from(`${userId}:${apiKey}`).toString(
    "base64"
  );

  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
    },
  });

  if (!res.ok) {
    cachedApiKey = null;
    const text = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${text}`);
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
    mockTransactions.set(referenceId, {
      status: "PENDING",
      createdAt: Date.now(),
    });
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

  // Include callback URL if configured (MTN sends a PUT when payment is final)
  const callbackUrl = process.env.MOMO_CALLBACK_URL;
  if (callbackUrl) {
    headers["X-Callback-Url"] = callbackUrl;
  }

  const res = await fetch(
    `${BASE_URL}/collection/v1_0/requesttopay`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: String(params.amount),
        currency: params.currency,
        externalId: params.externalId,
        payer: {
          partyIdType: "MSISDN",
          partyId: params.payerPhone.replace(/^\+/, ""),
        },
        payerMessage: params.payerMessage || "Payment for order",
        payeeNote: params.payeeNote || "MoMo Commerce payment",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`requestToPay failed: ${res.status} ${text}`);
  }

  return referenceId;
}

/** Check the status of a request-to-pay transaction. */
export async function getTransactionStatus(
  referenceId: string
): Promise<{
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  financialTransactionId?: string;
  reason?: { code: string; message: string };
}> {
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

  const res = await fetch(
    `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": TARGET_ENVIRONMENT,
        "Ocp-Apim-Subscription-Key": getSubscriptionKey(),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getTransactionStatus failed: ${res.status} ${text}`);
  }

  return res.json();
}
