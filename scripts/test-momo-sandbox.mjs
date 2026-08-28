/**
 * MTN MoMo Collection — sandbox smoke test / UAT evidence generator.
 *
 * Exercises the endpoints a collections-only store uses and prints the HTTP
 * responses in the shape MTN's "STANDARD OPEN API UAT TESTS" spreadsheet
 * wants (see docs/mtn-momo-integration-playbook.md §6).
 *
 *   node scripts/test-momo-sandbox.mjs                 # full run
 *   node scripts/test-momo-sandbox.mjs --print-creds   # also echo API user/key
 *   node scripts/test-momo-sandbox.mjs --msisdn=46733123451
 *
 * Reads MOMO_* from .env.local. Never prints the subscription key.
 */
import { readFileSync } from "fs"
import { randomUUID } from "crypto"

const flags = {}
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/)
  if (m) flags[m[1]] = m[2] ?? true
}

const env = {}
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i > -1) env[t.slice(0, i)] = t.slice(i + 1)
  }
} catch {
  console.error("Could not read .env.local — run this from the project root.")
  process.exit(1)
}
const cfg = (k, d) => process.env[k] ?? env[k] ?? d

const ENVIRONMENT = cfg("MOMO_ENVIRONMENT", "sandbox")
const API_URL = (cfg("MOMO_COLLECTION_API_URL", "https://sandbox.momodeveloper.mtn.com/collection")).replace(/\/+$/, "")
const HOST_ROOT = API_URL.replace(/\/collection$/, "")
const PRIMARY = cfg("MOMO_COLLECTION_PRIMARY_KEY")
const CURRENCY = ENVIRONMENT === "production" ? cfg("MOMO_CURRENCY", "RWF") : "EUR"

if (!PRIMARY) {
  console.error("MOMO_COLLECTION_PRIMARY_KEY is not set. Run scripts/momo-setup.mjs first.")
  process.exit(1)
}

// Sandbox payers, verified. See playbook §5.
const PAYERS = {
  success: "56733123453",
  rejected: "46733123451",
}

const rows = []
const record = (step, scenario, status, note) => {
  rows.push({ step, scenario, status, note })
  const ok = status >= 200 && status < 300
  console.log(`  ${ok ? "✓" : "✗"} ${scenario.padEnd(34)} ${status} ${note}`)
}

async function call(method, url, { headers, body } = {}) {
  const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(30000) })
  const text = await res.text()
  let json = {}
  try { json = text ? JSON.parse(text) : {} } catch { json = { _raw: text } }
  return { status: res.status, json, text }
}

console.log(`MTN MoMo sandbox test — ${ENVIRONMENT}`)
console.log(`Host: ${API_URL}\n`)

// 1–2. Provisioning (host root, not /collection)
let apiUser = cfg("MOMO_COLLECTION_API_USER")
let apiKey = cfg("MOMO_COLLECTION_API_KEY")

if (!apiUser || !apiKey || flags.reprovision) {
  apiUser = randomUUID()
  const cb = (() => { try { return new URL(cfg("MOMO_CALLBACK_URL", "")).hostname || "example.com" } catch { return "example.com" } })()
  const r1 = await call("POST", `${HOST_ROOT}/v1_0/apiuser`, {
    headers: { "X-Reference-Id": apiUser, "Ocp-Apim-Subscription-Key": PRIMARY, "Content-Type": "application/json" },
    body: JSON.stringify({ providerCallbackHost: cb }),
  })
  record(1, "Create API user", r1.status, r1.status === 201 ? "Created" : r1.text.slice(0, 90))
  if (r1.status !== 201) process.exit(1)

  const r2 = await call("POST", `${HOST_ROOT}/v1_0/apiuser/${apiUser}/apikey`, {
    headers: { "Ocp-Apim-Subscription-Key": PRIMARY },
  })
  record(2, "Create API key", r2.status, r2.status === 201 ? "Created" : r2.text.slice(0, 90))
  apiKey = r2.json.apiKey
} else {
  record(1, "Create API user", 201, "reusing provisioned user")
  record(2, "Create API key", 201, "reusing provisioned key")
}

// 2b. Verify the API user resolves.
const rv = await call("GET", `${HOST_ROOT}/v1_0/apiuser/${apiUser}`, {
  headers: { "Ocp-Apim-Subscription-Key": PRIMARY },
})
record("2b", "Get API user", rv.status, rv.status === 200 ? `host=${rv.json.providerCallbackHost ?? "?"}` : rv.text.slice(0, 60))

// 3. Token
const basic = Buffer.from(`${apiUser}:${apiKey}`).toString("base64")
const rt = await call("POST", `${API_URL}/token/`, {
  headers: { Authorization: `Basic ${basic}`, "Ocp-Apim-Subscription-Key": PRIMARY },
})
record(3, "Create access token", rt.status, rt.status === 200 ? `expires_in=${rt.json.expires_in}` : rt.text.slice(0, 90))
if (rt.status !== 200) process.exit(1)
const token = rt.json.access_token

async function payTest(label, msisdn, step) {
  const ref = randomUUID()
  const rp = await call("POST", `${API_URL}/v1_0/requesttopay`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": ref,
      "X-Target-Environment": ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": PRIMARY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: "100", currency: CURRENCY, externalId: `UAT-${ref.slice(0, 8)}`,
      payer: { partyIdType: "MSISDN", partyId: msisdn },
      payerMessage: "UAT test", payeeNote: "UAT test",
    }),
  })
  record(step, `Request to pay (${label})`, rp.status, rp.status === 202 ? "Accepted" : rp.text.slice(0, 90))
  if (rp.status !== 202) return
  let st
  for (let i = 0; i < 6; i++) {
    st = await call("GET", `${API_URL}/v1_0/requesttopay/${ref}`, {
      headers: { Authorization: `Bearer ${token}`, "X-Target-Environment": ENVIRONMENT, "Ocp-Apim-Subscription-Key": PRIMARY },
    })
    if (st.json.status !== "PENDING") break
    await new Promise((r) => setTimeout(r, 2000))
  }
  const reason = typeof st.json.reason === "string" ? st.json.reason : st.json.reason?.code
  record(`${step}b`, `Status (${label})`, st.status, `${st.json.status}${reason ? " / " + reason : ""}`)
}

const only = flags.msisdn
if (only) {
  await payTest("custom", String(only), 4)
} else {
  await payTest("success", PAYERS.success, 4)
  await payTest("rejected", PAYERS.rejected, 5)
}

console.log("\nUAT summary (playbook §6):")
for (const r of rows) console.log(`  row ${String(r.step).padEnd(3)} ${r.scenario.padEnd(34)} ${r.status}  ${r.note}`)
console.log("\n  rows 6–7  Account status / balance      N/A  not used by a collections-only store")
console.log("  rows 8+   Disbursement / Remittance     N/A  out of scope\n")

if (flags["print-creds"]) {
  console.log("MOMO_COLLECTION_API_USER=" + apiUser)
  console.log("MOMO_COLLECTION_API_KEY=" + apiKey)
  console.log("(subscription key intentionally not printed)")
}
