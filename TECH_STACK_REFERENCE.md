# ⚡ Keevan Store — Tech Stack Quick Reference

## 🎯 At a Glance

**Keevan Store** is a full-stack creator commerce platform enabling African creators to sell digital products, event tickets, and accept donations via mobile money.

- **Type:** SaaS Platform
- **Target Region:** Uganda, Kenya, Tanzania
- **Status:** Production Ready (v0.2.0)
- **Team Size:** 1-3 developers
- **Monthly Active Users:** TBD

---

## 📦 Core Technologies (By Layer)

### **Presentation Layer (Frontend)**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Next.js           15.3.4     React framework + API routes
React             19.0.0     UI library (Hooks)
TypeScript        5.x        Type safety
Tailwind CSS      4          Styling
Shadcn/UI         Latest     Component library
React Hook Form   7.60       Form management
Zod               4.0.2      Schema validation
Framer Motion     12.23      Animations
Recharts          2.15       Data visualization
```

### **Business Logic Layer (Backend)**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Next.js API       15.3.4     RESTful endpoints
Node.js/Bun       Latest     JavaScript runtime
Prisma            6.11.1     ORM + Migrations
Zod               4.0.2      Request validation
```

### **Data Layer (Database)**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
PostgreSQL        14+        Relational database
Supabase          Latest     Hosted PostgreSQL + Auth
Prisma            6.11.1     Query builder + types
```

### **Authentication & Security**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Supabase Auth     Latest     Email/password auth
Row Level Security v14+      Data access control
JWT Tokens        Standard   Session management
Zod               4.0.2      Input validation
```

### **Payments**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Pesapal           v3         Mobile Money gateway
MTN Mobile Money  -          Payment method
Airtel Money      -          Payment method
```

### **File Storage**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Cloudflare R2     Latest     S3-compatible storage
AWS SDK v3        3.x        S3 client library
```

### **Testing**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Vitest            2.1.0      Unit test framework
React Testing     16.3.2     Component testing
JSDOM             29.1       DOM simulation
```

### **Deployment**
```
Technology        Version    Purpose
──────────────────────────────────────────────────────
Vercel            Latest     Hosting + CDN
GitHub            Latest     Source control
```

---

## 🏗️ Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│ CLIENT LAYER                                        │
├─────────────────────────────────────────────────────┤
│ • React 19 components                               │
│ • Tailwind CSS styling                              │
│ • Form validation (React Hook Form + Zod)           │
│ • Client-side state (Hooks, Context)                │
└───────────────┬─────────────────────────────────────┘
                │
                │ HTTP/REST (HTTPS)
                │
┌───────────────▼─────────────────────────────────────┐
│ API LAYER (Next.js Route Handlers)                  │
├─────────────────────────────────────────────────────┤
│ • 22 REST endpoints                                 │
│ • Request validation (Zod)                          │
│ • Rate limiting                                     │
│ • Auth middleware                                   │
│ • Error handling                                    │
└───────────────┬─────────────────────────────────────┘
                │
         ┌──────┴──────┐
         │             │
┌────────▼────┐  ┌─────▼──────┐
│ Supabase    │  │ Pesapal    │
│ PostgreSQL  │  │ API        │
│ + Auth      │  │ (Payments) │
└─────────────┘  └────────────┘

         ┌─────────────┐
         │ Cloudflare  │
         │ R2 Storage  │
         └─────────────┘
```

---

## 🚀 API Endpoints Summary

### **Auth (3 endpoints)**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

### **Products (5 endpoints)**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/[id]` | Get details |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product |

### **Checkout & Orders (4 endpoints)**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/checkout` | Initiate payment |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/[id]` | Order details |
| GET | `/api/download/[token]` | Download file |

### **Payments (2 endpoints)**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/pesapal/callback` | Payment redirect |
| POST | `/api/pesapal/ipn` | Payment webhook |

### **Miscellaneous (8 endpoints)**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/store` | Creator store |
| PUT | `/api/store` | Update profile |
| POST | `/api/donations` | Create donation |
| POST | `/api/withdrawals` | Request payout |
| GET | `/api/analytics` | Dashboard stats |
| POST | `/api/page-views` | Track views |
| POST | `/api/contact` | Contact form |
| GET/POST | `/api/tickets` | Event tickets |

---

## 📊 Database Models (11 Total)

```
CORE TABLES:
├─ Creator          (Sellers - 1000s)
├─ Product          (Digital/Event - 10,000s)
├─ Order            (Purchases - 100,000s)
├─ OrderItem        (Line items)
├─ Ticket           (Event attendees)
├─ DownloadSession  (Digital downloads)
├─ Event            (Event metadata)
├─ Donation         (Tips/support)
├─ PageView         (Analytics)
├─ Withdrawal       (Payouts)
├─ ContactMessage   (Support)
└─ PlatformConfig   (Settings - singleton)
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Authentication** | Supabase JWT + HttpOnly cookies |
| **Authorization** | Row Level Security (RLS) on DB |
| **Passwords** | Argon2 hashing (Supabase default) |
| **HTTPS** | Mandatory (Vercel enforced) |
| **CORS** | Next.js same-origin by default |
| **Rate Limiting** | In-memory sliding window (10 req/min) |
| **Input Validation** | Zod schemas on all endpoints |
| **XSS Prevention** | React auto-escaping |
| **CSRF Protection** | Next.js middleware |
| **File Security** | Presigned R2 URLs (15m expiry) |
| **Admin Access** | Service role key (require verification) |

---

## 💾 Environment Variables

### **Public (Browser-accessible)**
```
NEXT_PUBLIC_SUPABASE_URL            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY       # Public auth key
NEXT_PUBLIC_APP_URL                 # App domain
NEXT_PUBLIC_PESAPAL_MODE            # "sandbox" or "live"
```

### **Private (Server-only)**
```
SUPABASE_SERVICE_ROLE_KEY           # Full DB access (admin)
PESAPAL_CONSUMER_KEY                # Payment API key
PESAPAL_CONSUMER_SECRET             # Payment API secret
PESAPAL_API_URL                     # Payment API endpoint
PESAPAL_IPN_URL                     # Webhook URL
R2_ACCOUNT_ID                       # Cloudflare account ID
R2_ACCESS_KEY_ID                    # R2 credentials
R2_SECRET_ACCESS_KEY                # R2 credentials
R2_BUCKET_NAME                      # Storage bucket name
DATABASE_URL                        # PostgreSQL connection string
```

---

## 📈 Performance Metrics (Target)

| Metric | Target | Current |
|--------|--------|---------|
| **Page Load** | <2s | TBD |
| **API Response** | <200ms | TBD |
| **Database Query** | <50ms | TBD |
| **Image Optimization** | <50KB | Via Sharp |
| **Bundle Size** | <100KB | TBD |
| **Uptime** | 99.9% | Via Vercel |

---

## 🔄 Data Flow Examples (Quick)

### **User Creates & Sells Product**
```
1. Creator signs up → POST /api/auth/signup
2. Creator adds product → POST /api/products
3. Uploads file → POST /api/uploads → R2
4. Product goes live
5. Buyer purchases → POST /api/checkout
6. Pesapal processes payment → Webhook
7. Order completed, download link sent
```

### **Buyer Downloads Digital Product**
```
1. GET /api/download/{token}
2. Backend validates token + expiry
3. Generates R2 presigned URL (15 min)
4. Browser downloads from R2
5. Backend logs download
```

### **Creator Requests Payout**
```
1. Creator POST /api/withdrawals (amount, phone, method)
2. Admin reviews in dashboard
3. Admin approves → PUT /api/admin/withdrawals
4. Payment sent to mobile money
5. Withdrawal marked as "paid"
6. Creator sees in history
```

---

## 🛠️ Development Commands

```bash
# Setup
git clone <repo>
npm install
cp .env.example .env.local
npm run db:push

# Development
npm run dev              # Start dev server (port 3000)

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Check code quality

# Database
npm run db:push          # Sync schema to DB
prisma studio           # Visual DB browser

# Testing
npm run test             # Run all tests
npm run test -- --watch # Watch mode

# Quality
npm run format           # Format code (Prettier)
npm run lint             # Lint code (ESLint)
```

---

## 📱 User Roles

| Role | Capabilities |
|------|--------------|
| **Guest** | Browse stores, view products |
| **Creator** | Manage products, view analytics, request payouts |
| **Buyer** | Purchase products, download files, view tickets |
| **Admin** | Approve creators, manage withdrawals, platform settings |

---

## 🎓 Technology Learning Path

1. **Frontend:** React 19 + TypeScript + React Hook Form
2. **Styling:** Tailwind CSS + Shadcn/UI
3. **Backend:** Next.js API Routes + Zod validation
4. **Database:** Prisma + PostgreSQL + RLS
5. **Auth:** Supabase (email + JWT)
6. **Payments:** Pesapal REST API + Webhooks
7. **Storage:** Cloudflare R2 + Presigned URLs
8. **Deployment:** Vercel serverless

---

## ⚠️ Known Limitations & Future Work

| Item | Status | Notes |
|------|--------|-------|
| **TanStack Query** | ❌ Missing | Install for client-side caching |
| **Redis Rate Limit** | 🟡 To-do | Upstash for serverless consistency |
| **Email Notifications** | ❌ Missing | SendGrid/Resend integration needed |
| **Mobile App** | 🔄 Planned | React Native / Expo |
| **Subscriptions** | 🔄 Planned | Recurring payments |
| **Multi-currency** | 🔄 Planned | USD, EUR, GBP |
| **Admin Dashboard** | 🟡 Partial | Payment dashboard exists |
| **Analytics** | 🟡 Basic | Recharts visualization working |
| **SSL/HTTPS** | ✅ Done | Vercel handles automatically |

---

## 📞 Support & Resources

| Topic | Resource |
|-------|----------|
| **Next.js Docs** | https://nextjs.org/docs |
| **Supabase Docs** | https://supabase.com/docs |
| **Prisma Docs** | https://www.prisma.io/docs |
| **Tailwind Docs** | https://tailwindcss.com/docs |
| **Pesapal Docs** | https://developer.pesapal.com |
| **R2 Docs** | https://developers.cloudflare.com/r2 |

---

**Last Updated:** 2026-06-16 | **Version:** 0.2.0  
**Generated by:** Blueprint Compliance Audit | **Maintained by:** Keevan Store Team
