# 🎨 Keevan Store — Quick Reference & Data Flows

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 USER INTERFACE                               │
│  Browser (React 19) / Mobile (Future Expo) / Desktop (Future Tauri)         │
└──────────────────────────────────────────────────────────────────────────────┘
                                        │
                        (HTTPS/TLS - Encrypted)
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
      ┌─────▼──────┐           ┌────────▼────────┐         ┌──────▼────────┐
      │  Next.js   │           │  API Routes     │         │  Supabase     │
      │ (Frontend) │◄─────────►│  (Backend)      │◄───────►│  (PostgreSQL) │
      │  App Router│           │  22 Endpoints   │         │  + Auth       │
      └────────────┘           └────────┬────────┘         └───────────────┘
            │                           │
            │                           │
            │           ┌───────────────┼───────────────┐
            │           │               │               │
      ┌─────▼──────┐ ┌──▼───────┐  ┌──▼──────┐  ┌─────▼──────┐
      │  Tailwind  │ │ Zod      │  │ Pesapal │  │ Cloudflare │
      │  CSS 4     │ │Validation│  │ Payment │  │    R2      │
      └────────────┘ └──────────┘  │  API    │  │ (S3-compat)│
                                   └─────────┘  └────────────┘
            │                           │               │
            └───────────────────────────┼───────────────┘
                                        │
                                 [Vercel Deployment]
```

---

## Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Stack                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  React 19 (Core)                                            │
│    └─ React Hooks (useState, useContext, etc.)             │
│         ├─ React Hook Form (Form State)                    │
│         │   └─ Zod Validation                              │
│         │                                                   │
│         ├─ Zustand (Global State - Not yet used)           │
│         │                                                   │
│         ├─ TanStack Query (To be added)                    │
│         │   └─ Auto-refetch, dehydration                   │
│         │                                                   │
│         └─ Context API (Theme, Auth)                       │
│              └─ next-themes (Dark Mode)                    │
│                                                              │
│  Styling                                                    │
│    └─ Tailwind CSS v4                                      │
│         └─ Shadcn/UI (Radix + Tailwind)                    │
│              └─ 25+ Radix UI components                    │
│                                                              │
│  Utilities                                                  │
│    ├─ Framer Motion (Animations)                           │
│    ├─ Lucide Icons                                         │
│    ├─ date-fns (Date handling)                             │
│    ├─ Recharts (Data visualization)                        │
│    ├─ clsx & tailwind-merge (className utilities)         │
│    └─ uuid (ID generation)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTH FLOW DIAGRAM                           │
└─────────────────────────────────────────────────────────────┘

1. SIGNUP
   ┌─────────────────────┐
   │ Frontend Form       │
   │ (email, pwd, etc.)  │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ POST /api/auth/signup
   │ (Zod Validation)    │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Supabase Auth       │
   │ .signUp()           │
   │ (Password hashed)   │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Create Creator      │
   │ Profile in DB       │
   │ (Service Role)      │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Session Cookie Set  │
   │ (HttpOnly, Secure)  │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Redirect to         │
   │ /dashboard          │
   └─────────────────────┘

2. LOGIN
   ┌─────────────────────┐
   │ POST /api/auth/login
   │ (Zod Validation)    │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Supabase Auth       │
   │ .signInWithPassword │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ Session Cookie Set  │
   └──────────┬──────────┘
              │
              v
   ┌─────────────────────┐
   │ JWT Tokens:         │
   │ - Access (1h)       │
   │ - Refresh (30d)     │
   └─────────────────────┘

3. PROTECTED ROUTE ACCESS
   ┌─────────────────────────────┐
   │ Request to /dashboard       │
   └──────────┬──────────────────┘
              │
              v
   ┌─────────────────────────────┐
   │ Next.js Middleware          │
   │ (middleware.ts)             │
   │ - Read session cookie       │
   │ - Refresh if needed         │
   └──────────┬──────────────────┘
              │
       ┌──────┴──────┐
       │             │
    ┌──▼──┐       ┌──▼──┐
    │Valid│       │Invalid│
    └──┬──┘       └──┬───┘
       │             │
       v             v
    Continue     Redirect to
    Request      /login
```

---

## Payment Processing Flow (Pesapal Integration)

```
┌─────────────────────────────────────────────────────────────┐
│             PAYMENT FLOW - CHECKOUT TO COMPLETION            │
└─────────────────────────────────────────────────────────────┘

1. CHECKOUT INITIATION
   ┌───────────────────────────────────────┐
   │ Buyer clicks "Buy Now"                │
   │ - Product ID                          │
   │ - Buyer Email                         │
   │ - Buyer Name                          │
   │ - Payment Method                      │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ POST /api/checkout                    │
   │ (Rate limited: 10/min/IP)            │
   │ (Zod schema validation)               │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Check for Duplicate Order             │
   │ (Idempotency check: last 60 sec)      │
   │ If exists → return existing order ID  │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Create PENDING Order in DB            │
   │ - order.status = "pending"            │
   │ - amount, platformFee, creatorEarning │
   └──────────┬────────────────────────────┘
              │
              v

2. PESAPAL API COMMUNICATION
   ┌───────────────────────────────────────┐
   │ Get Pesapal Auth Token                │
   │ - Check cache (globalThis)            │
   │ - If expired → request new token      │
   │ - If in-flight → wait for existing    │
   │ (Prevents thundering herd)            │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Register IPN Webhook (if not exists)  │
   │ - Cache IPN ID in PlatformConfig      │
   │ - Skip re-registration on re-deploy   │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ POST Pesapal /Transactions/SubmitOrder│
   │ - Order ID, Amount, Currency          │
   │ - Buyer details, Billing address      │
   │ - Callback URL (for redirect)         │
   │ - IPN ID (for webhook)                │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Pesapal returns:                      │
   │ - order_tracking_id                   │
   │ - redirect_url                        │
   │ - merchant_reference                  │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Update Order with Pesapal Tracking ID │
   └──────────┬────────────────────────────┘
              │
              v

3. PAYMENT BY BUYER
   ┌───────────────────────────────────────┐
   │ Frontend redirects buyer to           │
   │ Pesapal payment page                  │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Buyer selects payment method:         │
   │ ✓ MTN Mobile Money                    │
   │ ✓ Airtel Money                        │
   │ ✓ Bank Transfer                       │
   │ ✓ Card Payment                        │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Buyer completes payment               │
   │ (or clicks Cancel)                    │
   └──────────┬────────────────────────────┘
              │
              v

4. PESAPAL CALLBACKS (Dual notification)
   
   A) CALLBACK (User redirect)
   ┌───────────────────────────────────────┐
   │ Pesapal redirects buyer to:           │
   │ GET /api/pesapal/callback             │
   │ ?OrderTrackingId={id}&...             │
   │ (May not be called if buyer closes)   │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Frontend shows:                       │
   │ "Payment Processing..."               │
   │ (Checks order status until completed) │
   └──────────┬────────────────────────────┘
   
   B) IPN WEBHOOK (Reliable notification)
   ┌───────────────────────────────────────┐
   │ Pesapal → POST /api/pesapal/ipn       │
   │ (Server-to-server, guaranteed)        │
   │ - Includes transaction details        │
   │ - Cannot fail (if fires, it's real)   │
   └──────────┬────────────────────────────┘
              │
              v

5. ORDER COMPLETION
   ┌───────────────────────────────────────┐
   │ Backend receives IPN webhook          │
   │ - Validates Pesapal signature         │
   │ - Validates order amount/currency     │
   │ - Idempotent (safe to call multiple)  │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Update Order:                         │
   │ - status = "completed"                │
   │ - pesapalTransactionId = "..."        │
   │ - updatedAt = now()                   │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Post-Purchase Actions:                │
   │                                       │
   │ If Digital Product:                   │
   │   - Create DownloadSession            │
   │   - 24h expiry, 5 downloads           │
   │   - Buyer gets download link          │
   │                                       │
   │ If Event Ticket:                      │
   │   - Create Ticket record              │
   │   - Generate QR code                  │
   │   - Email ticket to buyer             │
   │                                       │
   │ Update Creator:                       │
   │   - balance += creatorEarning         │
   │   - totalEarnings += creatorEarning   │
   │   - totalSales += 1                   │
   │                                       │
   │ Update Product:                       │
   │   - views += 1                        │
   │   - salesCount += 1                   │
   │   - ticketsSold += 1 (if event)       │
   └──────────┬────────────────────────────┘
              │
              v
   ┌───────────────────────────────────────┐
   │ Send Confirmation Email (future)      │
   │ - Order confirmation                  │
   │ - Download link or ticket             │
   │ - Thank you message                   │
   └───────────────────────────────────────┘
```

---

## Digital Product Download Flow

```
┌─────────────────────────────────────────────────────────────┐
│        DIGITAL DOWNLOAD - CUSTOMER PERSPECTIVE              │
└─────────────────────────────────────────────────────────────┘

1. AFTER PURCHASE
   ┌────────────────────────────────┐
   │ Order.status = "completed"     │
   │ DownloadSession created:       │
   │ - downloadToken: UUID          │
   │ - expiresAt: now + 24h         │
   │ - downloadCount: 0 / 5         │
   │ - maxDownloads: 5              │
   └────────┬───────────────────────┘
            │
            v
   ┌────────────────────────────────┐
   │ Customer receives:             │
   │ - Confirmation email           │
   │ - Download link                │
   │   (contains downloadToken)     │
   └────────┬───────────────────────┘
            │
            v

2. FIRST DOWNLOAD (within 24h)
   ┌────────────────────────────────┐
   │ Customer clicks download link  │
   │ GET /api/download/{token}      │
   └────────┬───────────────────────┘
            │
            v
   ┌────────────────────────────────┐
   │ Backend validates:             │
   │ - Token exists                 │
   │ - Not expired (< 24h)          │
   │ - Downloads < 5               │
   │ - Token not tampered           │
   └────────┬───────────────────────┘
            │
       ┌────┴────┐
       │          │
    ┌──▼──┐   ┌──▼──┐
    │Valid│   │Invalid
    └──┬──┘   └──────┐
       │             │
       v             v
   Generate      Return 404
   Presigned     or 403
   URL (15m)     (Forbidden)
       │
       v
   ┌────────────────────────────────┐
   │ Update DownloadSession:        │
   │ - downloadCount++              │
   │ - lastDownloadedAt = now       │
   └────────┬───────────────────────┘
            │
            v
   ┌────────────────────────────────┐
   │ Return presigned R2 URL        │
   │ (Valid for 15 minutes only)    │
   └────────┬───────────────────────┘
            │
            v
   ┌────────────────────────────────┐
   │ Browser redirects to R2        │
   │ File downloads to customer     │
   └────────────────────────────────┘

3. SECOND+ DOWNLOADS
   ┌────────────────────────────────┐
   │ Same flow as first download    │
   │ (Repeat up to 5 times)         │
   │ Each generates new presigned   │
   │ URL (old ones auto-expire)     │
   └────────┬───────────────────────┘
            │
            v

4. AFTER 24 HOURS (expired)
   ┌────────────────────────────────┐
   │ Link still works BUT:          │
   │ - URL is invalid (expired)     │
   │ - Backend returns 403          │
   │ - Customer must re-purchase    │
   │ (or contact support)           │
   └────────────────────────────────┘
```

---

## Rate Limiting Implementation

```
┌─────────────────────────────────────────────────────────────┐
│           RATE LIMITING - CURRENT IMPLEMENTATION             │
└─────────────────────────────────────────────────────────────┘

STORAGE LOCATION: globalThis (In-memory, per function instance)

┌─────────────────────────────────────────────────────────────┐
│ globalThis.__keevanRateLimitStore (Map<string, Entry>)     │
├─────────────────────────────────────────────────────────────┤
│ Key: "checkout:1.2.3.4"  (endpoint:ip)                     │
│ Value: {                                                    │
│   count: 3,              (requests seen in window)          │
│   resetTime: 1687300060  (unix ms when window expires)      │
│ }                                                            │
│                                                              │
│ Example entries:                                            │
│ - "checkout:203.0.113.5"    → {count: 8, resetTime: ...}  │
│ - "checkout:198.51.100.1"   → {count: 2, resetTime: ...}  │
│ - "login:192.0.2.10"        → {count: 5, resetTime: ...}  │
└─────────────────────────────────────────────────────────────┘

ALGORITHM: Fixed Window (sliding window variant)

REQUEST CHECK:
1. Client IP extracted from headers (x-real-ip or x-forwarded-for)
2. Key = "{endpoint}:{ip}"
3. Current time (Date.now()) vs stored resetTime

   If no entry or expired:
   ├─ Create new entry
   ├─ count = 1
   ├─ resetTime = now + windowMs (60 * 1000 = 60 sec)
   └─ ALLOW request

   If entry exists and not expired:
   ├─ If count >= limit (10):
   │  └─ DENY request (429 Too Many Requests)
   │
   └─ If count < limit:
      ├─ count++
      ├─ ALLOW request
      └─ Return remaining count in headers

CLEANUP: Every 5 minutes
- Iterate all entries in store
- Delete expired entries
- Prevents memory leak

LIMITATIONS:
├─ ❌ NOT serverless-safe (Vercel has multiple instances)
│   Different instances = separate memory
│   User hitting instance A, then B → bypasses limit
│
├─ ✅ Works within single instance for short bursts
│   Vercel routes same IP to warm instance
│
├─ ✅ Works great for development
│   Single Node.js process = one memory space
│
└─ 🔄 FUTURE: Replace with Redis (@upstash/ratelimit)
   Shared across all function instances
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                  DATABASE SCHEMA (Prisma)                    │
│                    PostgreSQL (Supabase)                     │
└──────────────────────────────────────────────────────────────┘

                         Creator
                            ▲
                ┌───────────┬┴┬───────────┐
                │           │ │           │
         ┌──────┴──┐  ┌─────┴─┴───┐  ┌──┴────┐
         │ Product │  │   Order    │  │Donation
         │         │  │            │  │
         └────┬────┘  └────────────┘  └────────┘
              │
              │ (1:many)
              │
              ├─► Event
              │
              └─► DownloadSession
                        │
                        ├─► (FK: orderId)
                        │
                        └─► Ticket ◄──┐
                              │       │
                              │   Event
                              │       │
                              └───────┘

Order ◄─────► DownloadSession  (FK cascade)
Order ◄─────► Ticket            (FK cascade)
Product ◄────► DownloadSession  (FK cascade)
Product ◄────► Event            (FK cascade)
Creator ◄─────► PageView        (FK cascade)
Creator ◄─────► Withdrawal      (FK cascade)

ISOLATION:
- Creators can only view their own data (RLS)
- Store (products) visible to all (public)
- Orders/Tickets visible only to creator + buyer email
- Admin access via service role key
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT PIPELINE                          │
└──────────────────────────────────────────────────────────────┘

Git Push to main
        │
        v
GitHub Webhook
        │
        v
Vercel CI/CD
├─ npm run lint
├─ npm run build
├─ npm run test
└─ Generate next/types
        │
   ┌────┴────┐
   │          │
Pass      Fail
│          │
v          v
Deploy   Notify
        (Slack)
│
v
Vercel Deployment
├─ Copy artifact to CDN
├─ Start serverless functions
├─ Set environment variables
├─ Activate new version
└─ Notify team
│
v
Next.js runs on Vercel
├─ App Router rendered
├─ API routes ready
├─ Middleware active
└─ Health checks
│
v
Database Migration (if needed)
├─ Prisma schema changed?
├─ Run pending migrations
├─ Update types
└─ Ready for API calls
│
v
Live (keevanstore.in)
├─ Global CDN active
├─ Caching headers set
├─ HTTPS enforced
└─ Uptime monitoring
```

---

## Technology Decision Matrix

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| **Framework** | Next.js 15 | Remix, Nuxt | SSR, API routes, Vercel optimization |
| **UI Library** | React 19 | Vue 3, Svelte | Ecosystem, job market, largest community |
| **Styling** | Tailwind v4 | CSS Modules, styled-components | Utility-first, fast, low bundle size |
| **Components** | Shadcn/UI | Material-UI, Chakra | Customizable, headless, accessible |
| **Auth** | Supabase | next-auth, Auth0 | DB + Auth in one, PostgreSQL, RLS support |
| **Database** | PostgreSQL | MongoDB, DynamoDB | Relational, RLS, JSON support, mature |
| **ORM** | Prisma | TypeORM, Sequelize | Type-safe, migrations, code generation |
| **Payments** | Pesapal | Stripe, PayPal | Mobile money, Africa-focused, no KYC for merchants |
| **File Storage** | Cloudflare R2 | AWS S3, GCS | No egress fees, cheaper, S3-compatible |
| **Hosting** | Vercel | Netlify, Railway | Next.js native, serverless, edge functions, global CDN |
| **Validation** | Zod | Joi, Yup | TypeScript-first, automatic type inference |
| **Testing** | Vitest | Jest, Cypress | Fast, Vite-native, great DX |
| **Rate Limiting** | In-memory (Dev) | Redis, Upstash | Upstash planned for production |

---

**Generated:** 2026-06-16 | **Architecture v0.2.0**
