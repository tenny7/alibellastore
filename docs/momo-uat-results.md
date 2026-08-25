# MTN MoMo Collection — Sandbox UAT Results

**Merchant:** Alibella Stores
**Scope:** Collections only (Request-to-Pay). No disbursement, no remittance.
**Environment:** `sandbox.momodeveloper.mtn.com`, `X-Target-Environment: sandbox`
**Currency:** EUR (sandbox constraint; production sends RWF)
**Reproduce with:** `node scripts/test-momo-sandbox.mjs`

All results below were produced by that script against the live MTN sandbox.

## Results

| Row | Scenario | Endpoint | API response | Result |
|-----|----------|----------|--------------|--------|
| 1 | Create API user | `POST /v1_0/apiuser` | `201 Created` | Pass |
| 2 | Create API key | `POST /v1_0/apiuser/{id}/apikey` | `201 Created` | Pass |
| 3 | Create access token | `POST /collection/token/` | `200 OK`, `expires_in=3600` | Pass |
| 4 | Request to pay | `POST /collection/v1_0/requesttopay` | `202 Accepted` | Pass |
| 5 | Request to pay status | `GET /collection/v1_0/requesttopay/{ref}` | `200 OK`, `SUCCESSFUL` | Pass |
| 6 | Account status check | — | N/A | Not Tested |
| 7 | Account balance check | — | N/A | Not Tested |
| 8–13 | Disbursement (all) | — | N/A | Not Tested |
| 14+ | Remittance (all) | — | N/A | Not Tested |

Rows 6–7 are not used by a collections-only checkout. Rows 8+ are out of scope.

## Supplementary checks

| Check | Endpoint | Response | Note |
|-------|----------|----------|------|
| Verify API user | `GET /v1_0/apiuser/{id}` | `200 OK` | `providerCallbackHost = alibellastore.com` |
| Failure path | `requesttopay` + status, payer `46733123451` | `202` then `200 FAILED` | reason `APPROVAL_REJECTED` |

## Test MSISDNs used

| Payer | Expected | Observed |
|-------|----------|----------|
| `56733123453` | SUCCESSFUL | `SUCCESSFUL`, financial transaction id returned |
| `46733123451` | FAILED / APPROVAL_REJECTED | `FAILED`, reason `APPROVAL_REJECTED` |

## Behaviours confirmed during testing

These were verified by deliberately sending the wrong thing, and each is
handled in `src/lib/momo/client.ts`:

1. **Callback host must match.** Sending `X-Callback-Url` with a host that
   differs from the API user's `providerCallbackHost` returns
   `500 INVALID_CALLBACK_URL_HOST`. The client therefore only sends the header
   in production, where the host matches; sandbox relies on polling.
2. **Sandbox accepts EUR only.** Sending `RWF` returns
   `500 INVALID_CURRENCY`. The client substitutes EUR in sandbox and sends the
   real currency in production.
3. **Provisioning is at the host root**, not under `/collection`.
4. **`reason` is returned as a string enum** (e.g. `APPROVAL_REJECTED`), not an
   object. Both shapes are accepted in `src/lib/momo/types.ts`.

## Outstanding

The production callback endpoint (`/api/payments/momo/callback`) has **not**
been exercised by a real MTN request. The sandbox cannot reach a local host and
the client deliberately withholds the callback header outside production, so
confirmation is proven via status polling only. The callback path should be
re-tested once a production subscription and public HTTPS host are in place.
