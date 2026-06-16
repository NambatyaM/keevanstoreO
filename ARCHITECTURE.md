# 🏗️ Keevan Store — Complete Tech Stack Architecture

**Version:** 0.2.0  
**Status:** Production-Ready with Enhancements  
**Last Updated:** 2026-06-16

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Creator/Buyer)                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────┐      ┌────▼───┐      ┌─────▼────┐
    │ Browser│      │  Mobile│      │ Desktop  │
    │ (React)│      │ (Expo) │      │  (Tauri?)│
    └───┬────┘      └────┬───┘      └─────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    (HTTPS/TLS)
                         │
        ┌────────────────▼────────────────┐
        │   Next.js 15.3.4 (Frontend)     │
        │   - App Router (Vercel)         │
        │   - React 19 with Hooks         │
        │   - Server Components           │
        │   - Middleware Authentication   │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────────────┐
        │      Next.js API Routes (Backend)       │
        │      - Node.js Serverless Runtime       │
        │      - 22 Route Handlers                │
        │      - Rate Limiting (In-Process)       │
        │      - Request Validation (Zod)         │
        │      - Auth Middleware                  │
        └────────┬───────────────┬────────────────┘
                 │               │
        ┌────────▼───┐     ┌─────▼────────────┐
        │ Supabase   │     │ Pesapal Payment  │
        │ PostgreSQL │     │ Mobile Money API │
        │ (Auth+DB)  │     │ (TN/UG Mobile)   │
        └───────────┘     └──────────────────┘
        
        ┌──────────────────┐
        │  Cloudflare R2   │
        │  File Storage    │
        │  (S3-compatible) │
        └──────────────────┘
```

---

# 🎨 FRONTEND STACK

## **Framework & Runtime**
| Component | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.3.4 | Server-side rendering, API routes, App Router |
| **React** | 19.0.0 | UI component library, Hooks |
| **TypeScript** | 5.x | Type safety & IDE support |
| **Bun** | (Runtime) | Package manager & JS runtime (faster than Node) |

## **Styling & UI**

### **CSS Framework**
- **Tailwind CSS** v4 (with `@tailwindcss/postcss`)
- **CSS Variables** for theming (dark mode support)
- **Custom Design System** in `globals.css`

### **Component Library**
- **Shadcn/UI** (headless Radix UI components)
  - Buttons, Forms, Dialogs, Cards, Tables, etc.
  - ~25+ Radix UI packages installed
  - Fully customizable, accessible

### **Animation Library**
- **Framer Motion** v12.23.2
  - Smooth page transitions
  - Micro-interactions
  - Dashboard animations

### **Icon Library**
- **Lucide React** v0.525.0
  - 500+ SVG icons
  - Tree-shakeable
  - Used throughout UI

## **State Management**

### **Local State**
- **React Hooks** (useState, useReducer, useContext)
- **React Hook Form** v7.60.0
  - Form state management
  - Validation integration with Zod
  - Performance optimized (lazy render)

### **Global State** (To be implemented)
- **Zustand** v5.0.6 (installed but not used yet)
  - Lightweight alternative to Redux
  - Planned for: auth state, user session, cart

### **Server State** (Missing - Critical)
- **TanStack Query** (NOT installed - needs implementation)
  - Data fetching & caching
  - Automatic refetching
  - Dehydration/Hydration for SSR

## **Data Validation**
- **Zod** v4.0.2
  - Schema-based validation
  - Type inference (`z.infer<typeof schema>`)
  - Used in all API routes + forms

## **Date & Time**
- **date-fns** v4.1.0
  - Date formatting & manipulation
  - Timezone support
  - Small bundle size

## **Charts & Analytics**
- **Recharts** v2.15.4
  - React-based charting
  - Dashboard metrics visualization
  - Sales/revenue graphs

## **Utilities**
- **clsx** v2.1.1 - className merging
- **tailwind-merge** v3.3.1 - Tailwind conflict resolution
- **class-variance-authority** v0.7.1 - Component variants
- **uuid** v11.1.0 - Unique ID generation
- **qrcode** v1.5.4 - QR code generation (event tickets)
- **sharp** v0.34.3 - Image optimization

## **UI Feedback**
- **Sonner** v2.0.6 - Toast notifications
- **React Day Picker** v9.8.0 - Date picker component
- **Embla Carousel** v8.6.0 - Carousel/slider
- **Input OTP** v1.4.2 - OTP input field

## **Other**
- **next-themes** v0.4.6 - Dark mode theme provider
- **React Resizable Panels** v3.0.3 - Draggable panels
- **Vaul** v1.1.2 - Drawer component

---

# 🛢️ DATABASE STACK

## **Database Engine**
- **PostgreSQL** (via Supabase)
- **Hosted on:** Supabase Cloud (AWS-backed)
- **Region:** (User selectable at signup)
- **Backups:** Automatic daily + point-in-time recovery

## **ORM & Query Builder**
- **Prisma** v6.11.1
  - Object-Relational Mapping
  - Type-safe database queries
  - Schema-driven development
  - Automatic migrations

## **Database Schema (11 Models)**

```
┌─ Creator (Sellers)
├─ Product (Digital/Event)
├─ Order (Purchases)
├─ OrderItem → Order (many-to-one)
├─ Event (Event metadata)
├─ Ticket (Event tickets with QR)
├─ DownloadSession (Digital product DL links)
├─ PageView (Analytics)
├─ Donation (Tips/Support)
├─ Withdrawal (Payout requests)
├─ ContactMessage (Contact form)
└─ PlatformConfig (Singleton settings)
```

### **Core Models**

#### **Creator** (User/Seller Profile)
```sql
- id (UUID)
- email (UNIQUE)
- username (UNIQUE)
- displayName
- bio
- photoUrl (Supabase Storage)
- bannerUrl (Supabase Storage)
- socialLinks (JSON)
- donationsEnabled (Boolean)
- balance (Amount in UGX)
- totalEarnings
- totalSales
- isVerified (Admin badge)
- isAdmin (Platform admin)
- createdAt / updatedAt
```

#### **Product** (Digital/Event)
```sql
- id (UUID)
- creatorId (FK → Creator, CASCADE)
- title
- slug (URL-friendly)
- description
- price (Minor units: UGX 1000 = 0.27 USD)
- currency (e.g., "UGX")
- type: "digital" | "event"
- status: "active" | "inactive"
- thumbnailUrl (R2)
- fileUrl (R2 for digital products)
- fileName / fileSize

# Event-specific
- venue
- eventDate
- capacity
- ticketsSold (Running count)

- views (Analytics)
- salesCount
- createdAt / updatedAt

UNIQUE CONSTRAINT: (creatorId, slug)
```

#### **Order** (Purchase Transaction)
```sql
- id (UUID)
- creatorId (FK → Creator, CASCADE)
- productId (Nullable for donations)
- buyerEmail
- buyerName
- amount (Total charged)
- platformFee (10% default)
- creatorEarning (90%)
- currency
- status: "pending" | "completed" | "failed" | "refunded"
- paymentMethod: "mtn_momo" | "airtel_money" | "bank_transfer" | "card"
- pesapalOrderTrackingId (Pesapal reference)
- pesapalTransactionId (Pesapal confirmation)
- downloadToken (For digital products)
- createdAt / updatedAt
```

#### **Ticket** (Event Attendee)
```sql
- id (UUID)
- orderId (FK → Order, CASCADE)
- eventId (FK → Event, CASCADE)
- buyerEmail
- buyerName
- qrCodeData (Base64-encoded QR)
- checkedIn (Boolean)
- checkedInAt (Timestamp)
```

#### **DownloadSession** (Digital Product Access)
```sql
- id (UUID)
- orderId (FK → Order, CASCADE)
- productId (FK → Product, CASCADE)
- downloadToken (UNIQUE)
- expiresAt (24 hours from purchase)
- downloadCount (0-5 attempts)
- maxDownloads (5 default)
- lastDownloadedAt
```

#### **PlatformConfig** (Singleton Settings)
```sql
- id: "singleton" (Fixed)
- ipnId (Pesapal IPN registration ID - cached to avoid re-registration on deploys)
- ipnUrl (Webhook URL for Pesapal)
- feePercent (Platform fee override, NULL = use constant)
- updatedAt
```

## **Row Level Security (RLS)**
- **Enabled on all tables** via Supabase
- Creators can only access their own data
- Public access for store browsing
- Admins have full access via service role

## **Indexes**
- `products.creatorId` - For creator product lookups
- `orders.creatorId` - For creator order history
- `orders.buyerEmail` - For duplicate checkout detection
- `orders.status` - For filtering pending/completed orders
- `tickets.orderId` - For event check-in

## **Migrations**
- Prisma `prisma/migrations/` directory
- `db:push` for schema sync
- Version controlled in Git

---

# ⚙️ BACKEND STACK

## **Runtime & Framework**

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js / Bun** | Latest | JavaScript runtime |
| **Next.js API Routes** | 15.3.4 | Serverless API endpoints |
| **Vercel** | - | Deployment platform |

## **API Routes (22 Endpoints)**

### **Authentication**
```
POST   /api/auth/signup          → Create creator account + profile
POST   /api/auth/login           → Authenticate with email/password
POST   /api/auth/logout          → Clear session
```

### **Products**
```
GET    /api/products             → List creator's products
POST   /api/products             → Create new product
GET    /api/products/[id]        → Get product details
PUT    /api/products/[id]        → Update product
DELETE /api/products/[id]        → Delete product
```

### **Store & Creator**
```
GET    /api/store                → Get creator store data (public)
PUT    /api/store                → Update creator profile
GET    /api/store/[username]     → Get store by username (public)
```

### **Checkout & Payments**
```
POST   /api/checkout             → Initiate checkout (rate-limited)
GET    /api/orders               → Get creator's orders
GET    /api/orders/[id]          → Get order details
```

### **Pesapal Webhooks**
```
POST   /api/pesapal/callback     → Pesapal payment redirect
POST   /api/pesapal/ipn          → Pesapal IPN webhook (payment notifications)
```

### **Downloads**
```
GET    /api/download/[token]     → Generate presigned R2 URL
POST   /api/uploads              → Upload product file (multipart)
```

### **Analytics**
```
GET    /api/analytics            → Get creator dashboard stats
POST   /api/page-views           → Track store/product view
```

### **Events & Tickets**
```
GET    /api/tickets              → List event tickets
POST   /api/tickets              → Check-in attendee (QR scan)
```

### **Donations**
```
POST   /api/donations            → Create donation
```

### **Withdrawals**
```
POST   /api/withdrawals          → Request creator payout
GET    /api/withdrawals          → Get withdrawal history
```

### **Admin**
```
GET    /api/admin/creators       → List all creators
PUT    /api/admin/creators       → Activate/verify creators
GET    /api/admin/withdrawals    → Withdrawal approval queue
PUT    /api/admin/withdrawals    → Approve/reject payout
```

### **Other**
```
POST   /api/contact              → Contact form submission
```

## **Middleware & Auth**

### **Next.js Middleware** (`src/lib/supabase/middleware.ts`)
- Intercepts every request
- Refreshes Supabase session tokens
- Redirects unauthenticated users
- Protects `/dashboard` routes

### **Auth Helpers** (`src/lib/auth-helpers.ts`)
- `verifyAuth()` - Check if user is logged in
- `verifyAdmin()` - Check if user is admin
- Works in both **mock mode** (development) and **real mode** (production)

### **Mock Mode** (Development)
- Uses fake `keevan-auth` cookie
- Stores hardcoded test users
- Allows testing without Supabase

## **Request Validation**
- **Zod schemas** in `src/lib/validations.ts`
- Schemas shared between frontend + backend
- `safeParse()` prevents crashes on invalid input

## **Rate Limiting** (`src/lib/rate-limit.ts`)

### **Current Implementation**
- **Algorithm:** Sliding window (fixed window variant)
- **Storage:** In-process `Map` on `globalThis`
- **Cleanup:** 5-minute interval to remove expired entries
- **Limitations:** 
  - ⚠️ Does NOT work reliably on Vercel (each function instance has separate memory)
  - Works within single instance for short bursts

### **Rate Limit Rules**
```
- Checkout:      10 attempts per 60 seconds per IP
- General:       100 requests per minute per IP
```

### **To Be Implemented: Redis-backed**
- Use **@upstash/ratelimit** for cross-instance sync
- Redis backend ensures consistency on serverless

## **Error Handling**
- Try-catch wrapping all async operations
- Returns structured JSON responses
- Includes error logging via `console.error()`
- Global error boundary in `src/app/error.tsx`

---

# 🔐 AUTHENTICATION & SECURITY STACK

## **Authentication Provider**
- **Supabase Auth** (not next-auth)
  - Email/password authentication
  - Session management via JWT + secure cookies
  - Built-in MFA support (future)
  - Passwordless options (magic links)

## **Session Management**

### **Server-Side**
- Supabase `createServerClient()` handles cookies automatically
- Sessions expire & refresh via middleware
- `SUPABASE_SERVICE_ROLE_KEY` for admin operations (RLS bypass)

### **Client-Side**
- `createBrowserClient()` reads session from cookies
- React components check `supabase.auth.getSession()`

## **Security Headers** (`next.config.ts`)

```
X-DNS-Prefetch-Control: on
X-Content-Type-Options: nosniff         ← Prevents MIME sniffing
X-Frame-Options: SAMEORIGIN             ← Prevents clickjacking
X-XSS-Protection: 1; mode=block         ← Legacy XSS protection
Referrer-Policy: strict-origin-when-cross-origin ← Privacy
Permissions-Policy: camera=(), microphone=(), geolocation=() ← Disable sensors
```

## **HTTPS/TLS**
- Enforced by Vercel
- HSTS headers (via Vercel)
- All data encrypted in transit

## **Data Protection**

### **In Database**
- **Passwords:** Hashed via Supabase Auth (Argon2 or bcrypt)
- **Sensitive fields:** Encrypted (Supabase pgcrypto)
- **Row Level Security:** All tables protected

### **File Storage**
- **Private files:** R2 presigned URLs (15-min expiry for previews)
- **Downloads:** 24-hour expiry, single-use tokens
- **No public bucket access** for user files

## **Token Security**

### **JWT Tokens** (from Supabase)
- Short-lived access token (~1 hour)
- Refresh token (30 days) stored in secure, HttpOnly cookie
- Automatic refresh in middleware

### **Download Tokens** (Digital Products)
- Random UUIDs stored in `orders.download_token`
- Single-use per session
- Expire after 24 hours or X downloads

## **CSRF Protection**
- Vercel handles CSRF cookies automatically
- POST endpoints validate request method

## **XSS Prevention**
- React's built-in XSS escaping
- Content Security Policy (via Vercel defaults)
- Sanitize user input with Zod before storage

## **SQL Injection Prevention**
- Prisma uses parameterized queries
- No raw SQL (except migrations)

## **Environment Variables**

### **Public (Exposed to Browser)**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_PESAPAL_MODE
```

### **Private (Server-Only)**
```
SUPABASE_SERVICE_ROLE_KEY       ← Admin database access
PESAPAL_CONSUMER_KEY             ← Payment API credentials
PESAPAL_CONSUMER_SECRET
PESAPAL_API_URL
PESAPAL_IPN_URL
R2_ACCOUNT_ID                    ← File storage credentials
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
DATABASE_URL                     ← PostgreSQL (via Supabase)
```

---

# 💳 PAYMENT STACK

## **Payment Provider**
- **Pesapal** (Mobile Money Gateway)
  - Supports: MTN Mobile Money, Airtel Money, Bank Transfers, Cards
  - Region: Uganda, Kenya, Tanzania (primary focus: Uganda)
  - API: RESTful with OAuth 2.0

## **Payment Flow**

```
1. Buyer adds product to cart → Checkout
2. Frontend POST /api/checkout with product + buyer info
3. Backend:
   - Rate limit check (10/min/IP)
   - Zod validation
   - Create pending order in DB
   - Register Pesapal IPN webhook
   - Submit order to Pesapal API
4. Pesapal returns redirect_url
5. Frontend redirects buyer to Pesapal payment page
6. Buyer pays via mobile money
7. Pesapal → POST /api/pesapal/ipn (webhook)
8. Backend updates order.status = "completed"
9. Create DownloadSession (digital) or Ticket (event)
10. Send confirmation email (future)
```

## **Token Caching** (`src/lib/pesapal.ts`)

### **Problem Solved**
- Multiple concurrent checkouts → Multiple token requests
- Pesapal rate limits token requests
- Solution: **Cache on `globalThis` singleton**

### **Implementation**
```typescript
// Global in-memory cache
__pesapalAuthToken        ← Current token
__pesapalAuthTokenExpiry  ← Expiration time
__pesapalAuthInFlight     ← Promise for in-flight request

// If token valid → return cached
// If token expired → wait for any in-flight request
// If no in-flight → send new token request
// All concurrent requests share same Promise
```

## **IPN Registration** (Webhook)

### **Problem**
- Pesapal requires webhook registration on each deployment
- Could lead to duplicate registrations

### **Solution**
- Cache IPN ID in `PlatformConfig.ipnId`
- On startup: check if already registered
- Skip re-registration if ID exists

## **Webhook Handlers**

### **POST /api/pesapal/callback**
- Called after buyer completes/cancels payment
- Redirects to order status page
- Uses `OrderTrackingId` parameter

### **POST /api/pesapal/ipn**
- Receives payment confirmation from Pesapal
- Updates order.status = "completed"
- Creates download session or tickets
- Idempotent (safe to call multiple times)

## **Pesapal API Endpoints Used**
```
POST   /Auth/RequestToken                → Get auth token
POST   /Transactions/SubmitOrder          → Create payment order
GET    /Transactions/GetTransactionStatus → Check payment status
POST   /URLSetup/RegisterIPN              → Register webhook
```

## **Payment Methods Supported**
- MTN Mobile Money (Uganda)
- Airtel Money (Uganda/Tanzania/Kenya)
- Bank Transfer (Coming soon)
- Card Payment (Coming soon)

## **Fee Structure**
- **Platform Fee:** 10% of transaction (configurable via `PlatformConfig.feePercent`)
- **Creator Earning:** 90% after Pesapal fees
- **Pesapal Fees:** Varies by payment method

---

# 📦 FILE STORAGE STACK

## **Storage Provider**
- **Cloudflare R2** (S3-compatible object storage)
- Cost: $0.015/GB/month (cheaper than AWS S3)
- Global CDN included
- No egress fees

## **Files Stored**

### **Product Files**
- Digital product downloads (PDFs, ZIP, EXE, etc.)
- Bucket: `products`
- Path: `/creators/{creatorId}/products/{productId}/{filename}`
- Private: Presigned URLs required

### **Thumbnails**
- Product preview images
- Bucket: `thumbnails`
- Public or private (depending on product visibility)

### **Creator Profiles**
- Avatar photos, banner images
- Bucket: `profiles`
- Path: `/creators/{creatorId}/{photoType}`

## **Upload Flow**

```
1. Creator selects file → POST /api/uploads
2. Backend validates:
   - File size (<100MB limit)
   - MIME type (whitelist)
   - User authentication
3. Backend uploads to R2:
   - Save to `/products/{creatorId}/{productId}/...`
   - Set Content-Type header
   - Return public/presigned URL
4. URL saved in Product.fileUrl
```

## **Download Flow**

```
1. Buyer has valid DownloadSession
2. Frontend GET /api/download/{downloadToken}
3. Backend validates:
   - Token exists & not expired
   - Download count < max (5)
   - Buyer is order creator
4. Backend calls R2:
   - Generate presigned URL (15-min expiry)
   - Increment downloadCount
   - Update lastDownloadedAt
5. Frontend redirects to presigned URL
6. Browser downloads file directly from R2
```

## **R2 Configuration**

### **SDK Used**
- AWS SDK v3 (@aws-sdk/client-s3)
- S3 Request Presigner (@aws-sdk/s3-request-presigner)

### **Presigned URL Expiry**
```
- Download links (buyers): 24 hours (generous for email access)
- Preview links (CMS): 15 minutes (security)
```

### **Security**
- R2 bucket is **PRIVATE** (requires signed URLs)
- No public read access
- Signed URLs include object key + expiration
- Cannot be guessed (cryptographically signed)

---

# 📊 ANALYTICS STACK

## **Data Collected**

### **Page Views**
```sql
POST /api/page-views
{
  creatorId: string,
  viewType: "store" | "product",
  productId?: string,
  referrer?: string
}
```

### **Sales Analytics**
- Total sales count
- Revenue per day/week/month
- Top products
- Recent orders
- Conversion rate (views → orders)

### **Creator Metrics**
- Total earnings
- Total withdrawals
- Active products count
- Average order value

## **Visualization** (`src/app/(dashboard)/analytics/page.tsx`)
- **Recharts** for line/bar charts
- Real-time dashboard
- Sales trends over time
- Revenue by product

## **Storage**
- Raw data in PostgreSQL
- Aggregated on-the-fly (no separate analytics DB)
- Paginated API responses

---

# 🧪 TESTING STACK

## **Test Framework**
- **Vitest** v2.1.0 (Vite-native, faster than Jest)
- **React Testing Library** v16.3.2 (component testing)
- **JSDOM** v29.1.1 (DOM simulation)

## **Test Files**
```
src/__tests__/lib/
├── auth-security.test.ts        ← Auth flow validation
├── checkout-validation.test.ts   ← Payment flow tests
├── rate-limit.test.ts            ← Rate limiting
├── product-validation.test.ts    ← Product CRUD
├── revenue-split.test.ts         ← Fee calculations
├── store-security.test.ts        ← Store access control
├── withdrawals-flows.test.ts     ← Payout logic
└── ... (12 total test files)
```

## **Run Tests**
```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode
```

---

# 🛠️ DEVELOPMENT STACK

## **Code Quality**
- **ESLint** v9 (with Next.js config)
- **TypeScript** v5 with strict mode
- **Prettier** (implicitly via ESLint)

## **Scripts**
```bash
npm run dev                  # Start dev server (port 3000)
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Run ESLint
npm run test               # Run tests with Vitest
npm run db:push            # Sync Prisma schema to DB
```

## **Package Manager**
- **Bun** (faster than npm, used for hot-reload in development)
- Falls back to npm for CI/CD

---

# 🚀 DEPLOYMENT STACK

## **Hosting**
- **Vercel** (Next.js optimized)
  - Global CDN
  - Serverless functions (API routes)
  - Automatic HTTPS
  - Automatic deployments from Git

## **Database Hosting**
- **Supabase** (PostgreSQL + Auth as a Service)
  - Hosted on AWS
  - Automatic backups
  - Auto-scaling connections

## **File Storage**
- **Cloudflare R2** (S3-compatible)
  - Global distribution
  - Zero egress fees

## **Domain**
- DNS via Vercel (or custom)
- Production: `keevanstore.in` (or custom domain)

---

# 📋 Data Flow Examples

## **1. Creator Signup**

```
Frontend Form (email, password, username, displayName)
           ↓
POST /api/auth/signup (Zod validation)
           ↓
Supabase Auth.signUp() → Creates user
           ↓
Create Creator profile in DB (service role)
           ↓
Session cookie set
           ↓
Redirect to /dashboard
```

## **2. Digital Product Purchase**

```
Buyer selects product → POST /api/checkout
           ↓
Rate limit check (10/min/IP)
           ↓
Zod validation (buyerEmail, buyerName, productId)
           ↓
Create pending Order in DB
           ↓
Get Pesapal auth token (cached, dedup)
           ↓
Register IPN webhook (cached, skip if exists)
           ↓
POST Pesapal /SubmitOrder
           ↓
Pesapal returns redirect_url
           ↓
Frontend redirects buyer to Pesapal payment page
           ↓
Buyer pays via mobile money
           ↓
Pesapal → POST /api/pesapal/ipn (webhook)
           ↓
Update order.status = "completed"
           ↓
Create DownloadSession (24h expiry, 5 downloads)
           ↓
Buyer receives download link via email (future)
           ↓
Buyer clicks link → GET /api/download/{token}
           ↓
Generate R2 presigned URL (15 min)
           ↓
Browser downloads file from R2
```

## **3. Event Ticket Purchase**

```
Similar to digital product, but:
           ↓
Create Ticket record (per attendee)
           ↓
Generate QR code (base64) → stored in Ticket.qrCodeData
           ↓
Creator checks in attendee:
POST /api/tickets with QR scan
           ↓
Update Ticket.checkedIn = true, checkedInAt = now
```

---

# 🔗 External Integrations

| Service | Purpose | Endpoints | Status |
|---------|---------|-----------|--------|
| **Supabase** | Auth + DB | REST API | ✅ Configured |
| **Pesapal** | Payments | OAuth 2.0 + Webhooks | ✅ Configured |
| **Cloudflare R2** | File Storage | S3-compatible API | ✅ Configured |
| **Vercel** | Hosting | Git integration | ✅ Deployed |

---

# 📈 Performance Considerations

## **Frontend Optimization**
- **Code splitting** via Next.js dynamic imports
- **Image optimization** via Next.js Image component
- **CSS-in-JS** minimized via Tailwind purging
- **Lazy loading** for routes and components

## **Backend Optimization**
- **Connection pooling** via Supabase
- **Presigned URLs** reduce egress data
- **Rate limiting** prevents abuse
- **In-memory cache** for Pesapal tokens

## **Database Optimization**
- **Indexes** on frequently queried fields
- **Lazy loading** relations (Prisma select)
- **Pagination** for large datasets

---

# 🎯 Future Enhancements

1. **TanStack Query** - Implement for client-side caching
2. **Redis Rate Limiting** - Upstash for serverless consistency
3. **Email Notifications** - SendGrid/Resend integration
4. **SMS Alerts** - Twilio for order updates
5. **Analytics Dashboard** - Business intelligence
6. **Subscription Products** - Recurring payments
7. **Affiliate System** - Creator partnerships
8. **Multi-Currency** - USD, EUR, GBP support
9. **Mobile App** - React Native / Expo
10. **Admin Dashboard** - Creator management, fraud detection

---

**Generated:** 2026-06-16  
**Next Review:** 2026-09-16
