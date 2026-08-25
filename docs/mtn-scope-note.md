# Alibella Stores — MoMo Integration Scope Note

**Requested product: Collections only.**

| Product | Requested | Rationale |
|---|---|---|
| **Collection** (Request-to-Pay) | **Yes** | Customers pay the store at checkout. |
| Disbursement | No | The store never pays money out programmatically. |
| Remittance | No | Not a remittance business. |

## What this means for onboarding

- **Commercials:** Collections at 2.36% VAT-inclusive applies. The flat
  120 RWF disbursement fee does **not** apply, as no disbursement product is
  requested.
- **UAT:** Rows 1–5 of the standard UAT sheet are completed and passing (see
  `momo-uat-results.md`). Rows 6–7 (account status, account balance) are not
  used by a collections-only checkout. Rows 8+ (disbursement, remittance) are
  out of scope.
- **Refunds:** handled outside the MoMo API, since no disbursement product is
  requested.

## Environments

| | Sandbox | Production |
|---|---|---|
| Portal | momodeveloper.mtn.com (global) | momodeveloper.mtn.co.rw (Rwanda) |
| Host | `sandbox.momodeveloper.mtn.com` | to be confirmed with MTN |
| `X-Target-Environment` | `sandbox` | to be confirmed (`mtnrwanda`?) |
| Currency | EUR (sandbox constraint) | RWF |
| Confirmation | status polling | polling + callback |

Two items need MTN's confirmation before go-live: **the production collection
host**, and **the exact `X-Target-Environment` value** for MTN Rwanda. The
application reads the host from configuration, so only the value needs
supplying.

## Callback

Production callback URL: `https://alibellastore.com/api/payments/momo/callback`
The sandbox API user is already provisioned with
`providerCallbackHost = alibellastore.com`, so the host matches. The callback
header is deliberately withheld outside production, because a mismatched host
returns `500 INVALID_CALLBACK_URL_HOST`.
