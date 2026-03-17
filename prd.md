# Product Requirements Document — MoMo Commerce

**An ecommerce platform powered by MTN Mobile Money and WhatsApp**

Version 1.0 | February 24, 2026 | Draft

---

## 1. Project Overview

MoMo Commerce is a modern ecommerce platform designed for markets where mobile money is the primary payment method. Built on Next.js, it integrates MTN Mobile Money (MoMo) for seamless payments and WhatsApp Business API for real-time customer communication. The platform enables merchants to list products with photos, manage orders, create discounts, and engage customers through familiar channels.

| Field | Value |
|---|---|
| **Project Name** | MoMo Commerce |
| **Version** | 1.0 |
| **Date** | February 24, 2026 |
| **Status** | Draft |
| **Framework** | Next.js (App Router) |
| **Payment Gateway** | MTN Mobile Money (MoMo) |
| **Communication** | WhatsApp Business API |

---

## 2. Goals and Objectives

### 2.1 Business Goals

- Enable frictionless ecommerce for mobile money users in Sub-Saharan Africa
- Reduce checkout abandonment by offering familiar payment (MoMo) and communication (WhatsApp) channels
- Provide merchants with a modern, intuitive admin experience for managing their store
- Support discount and promotional campaigns to drive customer acquisition and retention

### 2.2 Success Metrics

- Checkout conversion rate above 60% (industry average for mobile money markets)
- Average order completion time under 90 seconds from cart to payment confirmation
- WhatsApp message delivery rate above 95% for order notifications
- Admin task completion time under 30 seconds for common operations (add product, create discount)

---

## 3. User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Shopper** | End-user browsing and purchasing products | Browse, add to cart, checkout, view orders, chat via WhatsApp |
| **Admin** | Store owner / operator managing the platform | Full CRUD on products, orders, discounts, analytics dashboard |

---

## 4. Feature Priority Matrix

Features are ranked P0 (must-have for launch), P1 (important, included in MVP if feasible), and P2 (post-launch enhancements).

| Priority | Feature | Phase |
|---|---|---|
| **P0** | Product catalog with photo uploads (max 2 per item) | MVP |
| **P0** | Shopping cart and checkout flow | MVP |
| **P0** | MTN MoMo payment integration | MVP |
| **P0** | Order management (admin) | MVP |
| **P0** | WhatsApp order notifications | MVP |
| **P1** | Discount and coupon system | MVP |
| **P1** | Admin dashboard with analytics | MVP |
| **P1** | Customer order history and tracking | MVP |
| **P2** | Product search and filtering | v1.1 |
| **P2** | Inventory management with low-stock alerts | v1.1 |
| **P2** | Customer reviews and ratings | v1.2 |
| **P2** | Multi-language support (EN / FR) | v1.2 |

---

## 5. Functional Requirements

### 5.1 Product Catalog

- Each product has: name, description, price (in local currency), category, and up to 2 photos
- Photos are uploaded via drag-and-drop or file picker; accepted formats are JPEG, PNG, and WebP with a max size of 5 MB per image
- Images are automatically resized and optimized (WebP conversion, thumbnail generation) on upload
- Products can be marked as active, draft, or out-of-stock
- Category management: create, edit, and nest categories up to 2 levels deep
- Product listing page supports pagination (20 items per page), search by name, and filtering by category and price range

### 5.2 Shopping Cart and Checkout

- Cart persists across sessions using local storage (guest) or database (authenticated user)
- Cart displays item thumbnails, quantities, unit prices, subtotal, applied discounts, and grand total
- Quantity can be adjusted inline; items can be removed individually or cart can be cleared
- Checkout collects: customer name, phone number (required for MoMo), delivery address, and optional notes
- Checkout validates that all items are still in stock before initiating payment

### 5.3 MTN MoMo Payment Integration

- Integrate via the MTN MoMo Collections API (sandbox for development, production keys for launch)
- Payment flow: customer enters phone number, receives a USSD prompt on their device, approves the payment, and the system receives a callback confirming success or failure
- Support payment status polling as a fallback if the callback is delayed (poll every 5 seconds for up to 60 seconds)
- Handle payment states: pending, successful, failed, timed-out, and cancelled
- Generate unique transaction references for each order; store all payment metadata for reconciliation
- Display clear payment status to the customer in real time (loading, success, or failure with retry option)

### 5.4 WhatsApp Communication

- Integrate with WhatsApp Business API (Meta Cloud API) using pre-approved message templates
- Automated notifications: order confirmation (with order summary), payment receipt, shipping update, and delivery confirmation
- Admin can send custom messages to individual customers from the order detail page
- Customer can initiate a WhatsApp conversation via a click-to-chat link on the storefront
- Message delivery status tracking: sent, delivered, read (where available)

### 5.5 Discount and Coupon System

The platform supports four types of discounts, all managed from the admin panel:

| Discount Type | Description | Configuration |
|---|---|---|
| **Percentage** | Reduce price by a fixed percentage (e.g. 10% off) | Percentage value, max discount cap (optional), applicable products/categories |
| **Fixed Amount** | Reduce price by a flat monetary amount | Discount value in local currency, minimum cart value (optional) |
| **Coupon Code** | Customer enters a code at checkout to activate discount | Unique code, usage limit (per-user and global), expiry date |
| **Flash Sale** | Time-limited discount applied automatically to selected items | Start/end datetime, applicable products, countdown display |

- Discounts can be scoped to: all products, specific categories, or individual products
- Multiple discounts can stack unless explicitly configured as non-stackable
- Admin can view discount usage analytics: redemption count, total revenue impact, and top products

### 5.6 Admin Dashboard

The admin backend features a clean, modern flat design. The color scheme uses solid, non-gradient colors throughout for a professional and consistent look.

- Dashboard home displays: total revenue (today, this week, this month), number of orders, top-selling products, and recent activity feed
- Sidebar navigation with sections: Dashboard, Products, Orders, Customers, Discounts, WhatsApp, and Settings
- Product management: full CRUD with inline photo upload, bulk actions (activate, deactivate, delete)
- Order management: list with status filters, order detail view with timeline, ability to update status and trigger WhatsApp notifications
- Responsive layout that works on tablets (admin may operate from mobile devices)
- Design system uses flat solid colors (e.g. slate-800 for headers, blue-600 for primary actions, emerald-500 for success states) with no gradients anywhere in the UI

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Storefront pages load in under 2 seconds on a 3G connection (target Lighthouse performance score of 90+)
- Admin dashboard initial load under 3 seconds; subsequent navigations under 500 ms (client-side routing)
- Image optimization pipeline ensures product photos are served in WebP format at appropriate sizes

### 6.2 Security

- All traffic served over HTTPS; HSTS headers enabled
- MoMo API credentials stored in environment variables, never committed to version control
- MoMo callback endpoint validates request signatures to prevent spoofing
- Admin routes protected by role-based authentication; session tokens are HTTP-only cookies
- Input validation and sanitization on all API endpoints; parameterized database queries via Prisma
- Rate limiting on checkout and payment endpoints (max 10 requests per minute per IP)

### 6.3 Scalability

- Stateless API design allows horizontal scaling behind a load balancer
- Image storage on CDN (Cloudinary or S3 + CloudFront) ensures media delivery scales independently
- Database connection pooling via Prisma; prepared for read replicas if needed

### 6.4 Accessibility

- WCAG 2.1 Level AA compliance for the storefront
- Keyboard-navigable checkout flow; screen reader-friendly form labels and error messages
- Color contrast ratios meet 4.5:1 minimum for all text

---

## 7. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router), Tailwind CSS | SSR/SSG for SEO, fast page loads, modern DX |
| **Backend / API** | Next.js API Routes + Server Actions | Co-located API, simplified deployment |
| **Database** | Supabase | |
| **File Storage** | supabase |  |
| **Payments** | MTN MoMo API (Collections) https://ericssondeveloperapi.developer.azure-api.net/API-collections#api=collection&operation=CreatePayments | Primary mobile money provider in target markets |
| **Communication** | WhatsApp Business API (via Meta Cloud API) | Order confirmations, shipping updates, customer support |
| **Auth** | NextAuth.js (Auth.js v5) | Flexible provider support, session management |
| **Hosting** | Vercel or self-hosted (Docker) | Optimized for Next.js, edge functions, easy CI/CD |
| **State Mgmt** | Zustand (cart) + React Query (server) | Lightweight, performant, minimal boilerplate |

---

## 8. API Endpoints (Core)

The following are the primary API routes. All routes are prefixed with the application base URL.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| **GET** | /api/products | List products (paginated, filterable) | Public |
| **GET** | /api/products/:id | Get product details | Public |
| **POST** | /api/products | Create product (with photo upload) | Admin |
| **PUT** | /api/products/:id | Update product | Admin |
| **DELETE** | /api/products/:id | Delete product | Admin |
| **POST** | /api/cart | Add item to cart | User |
| **POST** | /api/checkout | Initiate checkout + MoMo payment | User |
| **POST** | /api/payments/momo/callback | MoMo payment webhook | System |
| **GET** | /api/orders | List orders | User/Admin |
| **POST** | /api/discounts | Create discount/coupon | Admin |
| **POST** | /api/whatsapp/send | Send WhatsApp notification | System |

---

## 9. Data Model (Key Entities)

### 9.1 Product

- `id` — UUID, primary key
- `name` — string, required, max 200 chars
- `description` — text, optional
- `price` — decimal, required, in local currency
- `categoryId` — FK to Category
- `images` — array of up to 2 image URLs
- `status` — enum: active, draft, out_of_stock
- `createdAt`, `updatedAt` — timestamps

### 9.2 Order

- `id` — UUID, primary key
- `customerId` — FK to User
- `items` — JSON array of product ID, quantity, unit price
- `subtotal`, `discountAmount`, `total` — decimals
- `status` — enum: pending, paid, processing, shipped, delivered, cancelled
- `momoTransactionId` — string, from MoMo API
- `paymentStatus` — enum: pending, successful, failed, timed_out
- `shippingAddress`, `customerPhone`, `notes` — strings
- `createdAt`, `updatedAt` — timestamps

### 9.3 Discount

- `id` — UUID, primary key
- `type` — enum: percentage, fixed, coupon, flash_sale
- `value` — decimal, percentage or fixed amount
- `code` — string, nullable, unique for coupon type
- `maxUsage` — integer, nullable; `usageCount` — integer
- `minCartValue` — decimal, nullable
- `maxDiscountCap` — decimal, nullable, for percentage type
- `applicableTo` — enum: all, category, product; `targetIds` — UUID array
- `startsAt`, `expiresAt` — timestamps
- `isActive` — boolean

---

## 10. MTN MoMo Payment Flow

1. Customer completes checkout form and taps "Pay with MoMo"
2. Server creates a payment request via MoMo Collections API (`requestToPay`) with the customer's phone number and order total
3. MoMo sends a USSD push notification to the customer's phone
4. Customer approves the payment on their device by entering their MoMo PIN
5. MoMo sends a callback to our webhook endpoint with the payment result
6. Server validates the callback signature, updates the order status, and stores the transaction reference
7. Customer sees a real-time status update on the checkout page (via polling or server-sent events)
8. A WhatsApp confirmation message is automatically sent to the customer with the order summary and payment receipt

If the callback is not received within 60 seconds, the server polls the MoMo API for the transaction status. If the payment fails or times out, the customer is shown an error with options to retry or use a different number.

---

## 11. Admin Panel Design Guidelines

The admin interface follows a modern flat design language. All visual elements use solid, non-gradient colors for a clean and professional appearance.

### 11.1 Color Palette

- **Primary:** `#1A73E8` (solid blue) — buttons, links, and active states
- **Background:** `#F8FAFC` (light gray) — main content area
- **Sidebar:** `#1E293B` (dark slate) — with white text
- **Success:** `#16A34A` (solid green) — confirmations and positive metrics
- **Warning:** `#D97706` (solid amber) — alerts and pending states
- **Danger:** `#DC2626` (solid red) — destructive actions and errors
- **Text:** `#1E293B` (primary), `#64748B` (secondary), `#94A3B8` (muted)

### 11.2 Layout Principles

- Fixed sidebar (240px) with collapsible option on smaller screens
- Content area with a max-width of 1280px, centered with comfortable padding
- Cards with subtle border (1px solid `#E2E8F0`), rounded corners (8px), and white background
- Consistent spacing using an 8px grid system
- Tables use alternating row backgrounds (`#F8FAFC` / white) for readability
- No shadows heavier than `shadow-sm`; no gradients on any element

---

## 12. Project Milestones

| Phase | Deliverables | Duration | Status |
|---|---|---|---|
| **Week 1–2** | Project setup, DB schema, auth, product CRUD | 2 weeks | Planned |
| **Week 3–4** | Shopping cart, checkout flow, MoMo integration | 2 weeks | Planned |
| **Week 5–6** | Admin dashboard, discount system, order management | 2 weeks | Planned |
| **Week 7** | WhatsApp integration, notifications | 1 week | Planned |
| **Week 8** | Testing, bug fixes, performance optimization | 1 week | Planned |
| **Week 9** | UAT, staging deployment, final QA | 1 week | Planned |
| **Week 10** | Production deployment and launch | 1 week | Planned |

---

## 13. Risks and Mitigations

### 13.1 MoMo API Reliability

MoMo API may experience downtime or delayed callbacks. Mitigation: implement polling fallback, queue failed payments for retry, and display clear status messaging to customers.

### 13.2 WhatsApp Template Approval

Meta may take time to approve message templates or reject templates that don't meet guidelines. Mitigation: submit templates early in the development cycle; prepare fallback SMS notifications via a provider like Twilio.

### 13.3 Image Upload Abuse

Users or admins could upload inappropriate or oversized images. Mitigation: enforce file size limits (5 MB), validate file types server-side, and apply automatic compression. The 2-photo limit per product naturally constrains storage usage.

### 13.4 Mobile Network Latency

Target users may be on slow or intermittent mobile networks. Mitigation: optimize for low-bandwidth with SSR, lazy-loaded images, minimal JS bundle, and offline-tolerant cart (local storage).

---

## 14. Out of Scope (v1.0)

- Multi-vendor or marketplace functionality (single-store model only)
- Credit/debit card or bank transfer payments (MoMo only for MVP)
- Native mobile applications (responsive web only)
- Advanced analytics or BI dashboard integration
- Automated email marketing or CRM features
- AI-powered product recommendations