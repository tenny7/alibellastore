# ShopWithAlicey — Setup & Deployment Guide

Deploy this e-commerce app for any business. No code changes needed — everything is configured through environment variables and the admin settings panel.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) MTN MoMo API credentials for real payments
- (Optional) Gmail account for order notification emails

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Note down these values from **Settings → API**:
   - `Project URL` (e.g. `https://abcxyz.supabase.co`)
   - `anon / public` key
   - `service_role / secret` key

---

## Step 2: Run the Database Schema

1. Open **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase/schema.sql` and run it

This creates all tables, enums, triggers, indexes, RLS policies, and seed categories.

3. Then run this to create the site settings table:

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'My Store',
  store_description TEXT DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  delivery_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  free_delivery_threshold DECIMAL(12, 2),
  tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'RWF',
  primary_color TEXT NOT NULL DEFAULT '#1A73E8',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default row (the app expects exactly one row)
INSERT INTO site_settings (store_name, contact_phone) VALUES ('My Store', '+250780000000');
```

4. Create a Supabase Storage bucket for product images:

```
Supabase Dashboard → Storage → New Bucket
  Name: product-images
  Public: Yes (so images are accessible on the storefront)
```

---

## Step 3: Register the First Admin User

This is the most important step when launching for a new business.

### 3a. Create an account

1. Start the app (locally or deployed)
2. Go to `/signup` and create an account with the business owner's email and password
3. This creates a regular `shopper` account

### 3b. Promote to admin

1. Go to **Supabase Dashboard → SQL Editor**
2. Run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'owner@example.com';
```

Replace `owner@example.com` with the actual email used in step 3a.

3. Now log in at `/login` — you'll be redirected to the `/admin` dashboard

> **Note:** There is no self-service admin registration. All future admins must also be promoted via this SQL command. This is a security feature — only someone with database access can grant admin privileges.

---

## Step 4: Configure Environment Variables

Copy `.env.local.example` (or create `.env.local`) with these values:

```env
# ============================================================
# Supabase
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================================
# App
# ============================================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ============================================================
# Email (SMTP) — for order confirmation emails
# ============================================================
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-gmail-app-password
# EMAIL_FROM=noreply@yourdomain.com      (optional, defaults to EMAIL_USER)
# EMAIL_FROM_NAME=MyStore                (optional)
# SMTP_HOST=smtp.gmail.com               (optional, defaults to Gmail)
# SMTP_PORT=587                           (optional)

# ============================================================
# MTN MoMo Payments
# ============================================================
#
# MOMO_ENVIRONMENT — "sandbox" or "production"
# MOMO_MOCK — "true" to skip MoMo and simulate payments locally
#
# ── Local development (no MoMo credentials needed) ──
MOMO_ENVIRONMENT=sandbox
MOMO_MOCK=true
MOMO_COLLECTION_PRIMARY_KEY=your-collection-primary-key
MOMO_API_USER=your-api-user-uuid
MOMO_CALLBACK_URL=http://localhost:3000/api/payments/momo/callback
NEXT_PUBLIC_MOMO_CURRENCY=RWF
#
# ── Production (real payments) ──
# MOMO_ENVIRONMENT=production
# MOMO_MOCK=false
# MOMO_COLLECTION_PRIMARY_KEY=<from MTN Partner Portal>
# MOMO_API_USER=<from MTN Partner Portal>
# MOMO_API_KEY=<from MTN Partner Portal>
# MOMO_CALLBACK_URL=https://yourdomain.com/api/payments/momo/callback
# NEXT_PUBLIC_MOMO_CURRENCY=RWF
```

### Gmail App Password

If using Gmail for emails:

1. Enable 2-Factor Authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

---

## Step 5: Install & Run

```bash
npm install
npm run dev        # Local development
npm run build      # Production build
npm start          # Start production server
```

---

## Step 6: Configure Store Settings (Admin Panel)

Once logged in as admin, go to `/admin/settings` to configure:

| Setting | Description |
|---------|-------------|
| **Store Name** | Your business name (shown in header, emails, etc.) |
| **Store Description** | Tagline shown below the store name |
| **Currency** | RWF, USD, EUR, KES, UGX, TZS, GBP, NGN, or ZAR |
| **Brand Color** | Primary color for buttons, links, and accents |
| **Contact Phone** | Displayed on the storefront |
| **WhatsApp Number** | For WhatsApp order support button |
| **Social Media URLs** | Instagram, Facebook, Twitter/X (optional) |
| **Delivery Fee** | Flat delivery fee per order |
| **Free Delivery Threshold** | Waive delivery above this amount (optional) |
| **Tax / VAT %** | Applied to subtotals |

All changes take effect immediately across the entire app.

---

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from Step 4 in the Vercel project settings
4. Deploy

Make sure `NEXT_PUBLIC_APP_URL` matches your Vercel domain (e.g. `https://mystore.vercel.app`).

---

## Deploying for a Different Business

To launch the same app for a new business, you only need to:

1. Create a **new Supabase project** (separate database per business)
2. Run the schema SQL (Step 2)
3. Register & promote the first admin (Step 3)
4. Set the new environment variables (Step 4)
5. Deploy and configure the store from the admin panel (Step 6)

No code changes required. The currency, brand color, store name, and all business details are fully configurable from the admin settings.

---

## Quick Reference: Adding More Admins

```sql
-- Promote an existing user to admin
UPDATE users SET role = 'admin' WHERE email = 'newadmin@example.com';

-- Demote back to shopper
UPDATE users SET role = 'shopper' WHERE email = 'former-admin@example.com';
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Settings row not found" error | Run the `INSERT INTO site_settings` SQL from Step 2 |
| Admin login redirects back to login | Check that the user's `role` is `'admin'` in the `users` table |
| Images not loading | Ensure the `product-images` storage bucket exists and is set to **public** |
| Emails not sending | Verify `EMAIL_USER` and `EMAIL_PASS` are correct; check Gmail app password setup |
| MoMo payments failing | In development, set `MOMO_MOCK=true`; in production, verify MTN credentials |
