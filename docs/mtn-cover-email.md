# Cover email to MTN — draft

> Fill the bracketed fields and attach the documents listed before sending.

**To:** [MTN onboarding contact]
**Subject:** Alibella Stores — MoMo Collections onboarding (UAT complete)

---

Dear [Name],

Thank you for the onboarding details for MTN Mobile Money.

Alibella Stores is an online retailer based in Kigali (https://alibellastore.com).
We are requesting **Collections only** — our customers pay us at checkout. We do
not disburse or remit funds, so the Disbursement and Remittance products are not
applicable to us.

We have completed sandbox testing against https://momodeveloper.mtn.com. The
standard UAT scenarios for Collections all pass:

- Create API user — 201 Created
- Create API key — 201 Created
- Create access token — 200 OK
- Request to Pay — 202 Accepted
- Request to Pay status — 200 OK (SUCCESSFUL)

We have also exercised the failure path and confirmed we handle it correctly
(payer 46733123451 returns FAILED / APPROVAL_REJECTED, which we surface to the
customer and record for support).

**Attached**
1. Completed UAT form
2. Business description and customer user journey

**To follow**
3. NCSA Data Protection licence — [status]
4. RDB certificate — [status]

**Two things we would appreciate your confirmation on**

1. That the Collections-only commercials apply to us — 2.36% VAT-inclusive on
   collected payments, with the 120 RWF disbursement fee not applicable given we
   are not requesting Disbursement.
2. That UAT rows 6 and 7 (Account Status and Account Balance) are not required
   for a collections-only integration. They are not used by our checkout, and
   returned `NOT_ALLOWED_TARGET_ENVIRONMENT` / `RESOURCE_NOT_FOUND` on our
   sandbox subscription.

We would also be grateful for the **production collection host** and the correct
**`X-Target-Environment` value** for MTN Rwanda, so we can complete our
production configuration.

Kind regards,

[Name]
[Title], Alibella Stores
[Phone] · [Email]
