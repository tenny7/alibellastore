# Alibella Stores — Business Description & Customer User Journey

Prepared for MTN Rwanda as part of the MoMo Collections onboarding.

> **Before sending:** the fields marked **[TO CONFIRM]** are business facts that
> must come from the owner. They are deliberately left blank rather than
> estimated — MTN's onboarding is a compliance process and invented figures
> would be a problem. Everything else is drawn from the running application.

---

## 1. Business description

**Trading name:** Alibella Stores
**Website:** https://alibellastore.com
**Contact:** +250 782 389 979 (also WhatsApp support)
**Location:** Kigali, Rwanda
**RDB registration number:** **[TO CONFIRM]**
**TIN:** **[TO CONFIRM]**
**NCSA Data Protection licence:** **[TO CONFIRM — register at https://dpo.gov.rw/]**

Alibella Stores is an online retailer serving customers in Kigali and, by
courier, the rest of Rwanda. The catalogue covers five categories: Electronics,
Clothing, Home & Living, Food & Drinks, and Gadgets.

Customers browse the storefront, add items to a basket, and check out. Payment
is collected up front by MTN Mobile Money, or on delivery in cash where the
customer prefers. The business does not disburse or remit funds — **the
requested integration is Collections only.**

**Commercial terms acknowledged:** Collections at 2.36% VAT-inclusive, deducted
per collected payment. The 120 RWF disbursement fee is not applicable, as no
disbursement product is requested.

**Order volumes:** **[TO CONFIRM]**
**Average basket value:** **[TO CONFIRM]**

---

## 2. Customer user journey

### 2.1 Browse and select
The customer opens https://alibellastore.com, browses by category or search,
and adds items to their basket. Prices are shown in RWF. Delivery is 2,500 RWF,
free on baskets over 45,000 RWF. Tax is applied at 3%.

### 2.2 Checkout — details
The customer signs in (or creates an account) and provides their full name,
phone number, and delivery address. The basket total, delivery fee, any
discount, and tax are itemised before they commit.

### 2.3 Checkout — review
The customer reviews the order summary and delivery details, and places the
order. An order record is created with status `pending` and payment status
`pending`. No money has moved at this point.

### 2.4 Payment — MTN Mobile Money
The customer confirms the MSISDN to charge. The application calls
Request-to-Pay; MTN sends an approval prompt to the customer's handset. The
customer approves it by entering their MoMo PIN on their own device — **the
merchant never sees or handles the PIN.**

The application polls the transaction status until MTN returns a final result:

- **SUCCESSFUL** — the order moves to `paid`, the customer sees a confirmation
  screen and receives a notification, and the order enters fulfilment.
- **FAILED** — the order is marked failed and the MTN reason (for example
  `APPROVAL_REJECTED`) is stored so support can explain what happened. The
  customer can retry or switch to cash on delivery.
- **PENDING** — the customer is told the prompt is still awaiting approval.

### 2.5 Payment — cash on delivery (alternative)
If the customer prefers not to pay by MoMo, they may choose cash on delivery.
The order is accepted and enters fulfilment with payment still outstanding;
payment is collected in cash when the goods arrive.

### 2.6 Fulfilment and delivery
Paid orders appear on the dispatch board and move through packing, out for
delivery, and delivered. The customer can track the order from their account
and contact support over WhatsApp at any point.

### 2.7 Returns
Returns are accepted per the published return policy at
https://alibellastore.com/return-policy. Refunds are handled **[TO CONFIRM —
describe the refund mechanism, since no disbursement product is requested]**.

---

## 3. Data handling

Alibella Stores stores the customer's name, phone number, delivery address, and
order history. Card details are never collected, and MoMo PINs never reach the
merchant — authorisation happens entirely on the customer's handset via MTN.
MSISDNs are transmitted to MTN solely to raise the Request-to-Pay.

Traffic is served over HTTPS. The application sets HSTS, a Content Security
Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict
referrer policy. Administrative functions are behind authentication and a role
check.

Data protection registration with NCSA: **[TO CONFIRM]**
